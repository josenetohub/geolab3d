// =============================================================================
// GEO LAB 3D - MANIPULADOR DE DEFORMAÇÃO TRIDIMENSIONAL POR VÉRTICES
// Deforma o sólido em poliedros arbitrários, com rotação sincronizada 100%
// =============================================================================

class VertexDeformer {
    constructor(sceneManager, onDimensionsChanged) {
        this.sm = sceneManager;
        this.onDimensionsChanged = onDimensionsChanged;
        this.active = true; // Ativo para permitir deformação intuitiva
        this.currentSolidId = 'cube';
        this.currentParams = {};

        this.handlesGroup = new THREE.Group();
        this.handlesGroup.name = 'vertexHandlesGroup';

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragPlane = new THREE.Plane();
        this.planeIntersect = new THREE.Vector3();

        this.selectedHandle = null;
        this.isDragging = false;
        this.hoveredHandle = null;

        this.setupEvents();
    }

    getSolidMesh() {
        let mesh = null;
        if (this.sm && this.sm.solidGroup) {
            this.sm.solidGroup.traverse(c => {
                if (!mesh && c.isMesh && c.name === 'solidBody') mesh = c;
            });
        }
        return mesh || this.sm.solidMesh;
    }

    setSolid(solidId, params) {
        this.currentSolidId = solidId;
        this.currentParams = { ...params };
        if (this.active) {
            this.rebuildHandles();
        }
    }

    setActive(active) {
        this.active = active;
        this.handlesGroup.visible = active;
        if (active) {
            this.rebuildHandles();
        } else {
            this.clearHandles();
            if (this.sm && this.sm.controls) this.sm.controls.enabled = true;
            this.isDragging = false;
            this.selectedHandle = null;
        }
    }

    toggle() {
        this.setActive(!this.active);
        return this.active;
    }

    clearHandles() {
        while (this.handlesGroup.children.length > 0) {
            const h = this.handlesGroup.children[0];
            if (h.geometry) h.geometry.dispose();
            if (h.material) {
                if (Array.isArray(h.material)) h.material.forEach(m => m.dispose());
                else h.material.dispose();
            }
            this.handlesGroup.remove(h);
        }
    }

    rebuildHandles() {
        this.clearHandles();
        if (!this.active) return;

        const solidMesh = this.getSolidMesh();
        if (!solidMesh || !solidMesh.geometry || !solidMesh.geometry.attributes.position) return;

        // Anexa handlesGroup DIRETAMENTE ao solidMesh para que gire em perfeito sincronismo
        if (this.handlesGroup.parent !== solidMesh) {
            if (this.handlesGroup.parent) {
                this.handlesGroup.parent.remove(this.handlesGroup);
            }
            solidMesh.add(this.handlesGroup);
        }
        this.handlesGroup.position.set(0, 0, 0);
        this.handlesGroup.rotation.set(0, 0, 0);
        this.handlesGroup.scale.set(1, 1, 1);

        const posAttr = solidMesh.geometry.attributes.position;
        const uniqueVertices = [];
        const threshold = 0.08;

        // Agrupa vértices compartilhados nas quinas (mesma posição espacial com normais distintas)
        for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
            let existing = null;
            for (let u = 0; u < uniqueVertices.length; u++) {
                if (uniqueVertices[u].pos.distanceTo(v) < threshold) {
                    existing = uniqueVertices[u];
                    break;
                }
            }
            if (existing) {
                existing.indices.push(i);
            } else {
                uniqueVertices.push({
                    pos: v.clone(),
                    indices: [i]
                });
            }
        }

        // Se for uma forma com muitos vértices (ex: cilindro/cone com 36 segmentos), seleciona pontos-chave
        let handlesToCreate = uniqueVertices;
        if (uniqueVertices.length > 16) {
            // Seleciona ápice + 4 pontos da base ou 4 pontos do topo e 4 da base
            handlesToCreate = uniqueVertices.filter((item, idx) => {
                return idx === 0 || idx % Math.floor(uniqueVertices.length / 8) === 0;
            }).slice(0, 9);
        }

        // Esferas douradas/neon de controle dos vértices
        const handleGeo = new THREE.SphereGeometry(0.24, 16, 16);
        handlesToCreate.forEach((item, idx) => {
            const handleMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15,       // Dourado vibrante
                emissive: 0xd97706,    // Brilho quente
                roughness: 0.2,
                metalness: 0.8
            });
            const handleMesh = new THREE.Mesh(handleGeo, handleMat);
            handleMesh.position.copy(item.pos);
            handleMesh.userData = {
                vertexIndex: idx,
                indices: item.indices,
                initialPos: item.pos.clone()
            };

            // Anel neon ciano ao redor da esfera
            const ringGeo = new THREE.RingGeometry(0.28, 0.36, 16);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            handleMesh.add(ring);

            this.handlesGroup.add(handleMesh);
        });

        this.handlesGroup.visible = true;
    }

    setupEvents() {
        if (!this.sm || !this.sm.renderer) return;
        const dom = this.sm.renderer.domElement;

        const getCoords = (e) => {
            const rect = dom.getBoundingClientRect();
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            return {
                x: ((clientX - rect.left) / rect.width) * 2 - 1,
                y: -((clientY - rect.top) / rect.height) * 2 + 1
            };
        };

        const onPointerDown = (e) => {
            if (!this.active) return;
            const coords = getCoords(e);
            this.mouse.set(coords.x, coords.y);
            this.raycaster.setFromCamera(this.mouse, this.sm.camera);

            const intersects = this.raycaster.intersectObjects(this.handlesGroup.children, true);
            if (intersects.length > 0) {
                let target = intersects[0].object;
                while (target.parent && target.parent !== this.handlesGroup) {
                    target = target.parent;
                }

                if (target && target.userData) {
                    this.selectedHandle = target;
                    this.isDragging = true;
                    if (this.sm.controls) this.sm.controls.enabled = false;

                    if (e.cancelable && e.type.startsWith('touch')) {
                        e.preventDefault();
                    }

                    // Posição mundial da alça para ancorar o plano de arraste
                    const worldPos = new THREE.Vector3();
                    this.selectedHandle.getWorldPosition(worldPos);

                    const cameraDir = this.sm.camera.getWorldDirection(new THREE.Vector3()).negate();
                    this.dragPlane.setFromNormalAndCoplanarPoint(cameraDir, worldPos);

                    this.selectedHandle.material.color.setHex(0x00f2fe);
                    this.selectedHandle.material.emissive.setHex(0x0284c7);
                    this.selectedHandle.scale.set(1.5, 1.5, 1.5);
                    dom.style.cursor = 'grabbing';
                }
            }
        };

        const onPointerMove = (e) => {
            if (!this.active) return;
            const coords = getCoords(e);
            this.mouse.set(coords.x, coords.y);
            this.raycaster.setFromCamera(this.mouse, this.sm.camera);

            if (this.isDragging && this.selectedHandle) {
                if (e.cancelable && e.type.startsWith('touch')) {
                    e.preventDefault();
                }
                if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersect)) {
                    const solidMesh = this.getSolidMesh();
                    if (solidMesh) {
                        // Converte o ponto do plano (mundo) para coordenadas locais do solidMesh
                        const localPos = solidMesh.worldToLocal(this.planeIntersect.clone());

                        // Limita para evitar inversão excessiva
                        localPos.clamp(new THREE.Vector3(-8, -8, -8), new THREE.Vector3(8, 8, 8));

                        // 1. Move a alça visualmente
                        this.selectedHandle.position.copy(localPos);

                        // 2. Atualiza os vértices reais da geometria 3D
                        const posAttr = solidMesh.geometry.attributes.position;
                        const indices = this.selectedHandle.userData.indices || [];
                        indices.forEach(idx => {
                            posAttr.setXYZ(idx, localPos.x, localPos.y, localPos.z);
                        });
                        posAttr.needsUpdate = true;

                        // 3. Recalcula normais e bounding box
                        solidMesh.geometry.computeVertexNormals();
                        solidMesh.geometry.computeBoundingBox();
                        solidMesh.geometry.computeBoundingSphere();

                        // 4. Recalcula as arestas neon em tempo real
                        const edgesMesh = solidMesh.getObjectByName('solidEdgesBase');
                        if (edgesMesh) {
                            if (edgesMesh.geometry) edgesMesh.geometry.dispose();
                            edgesMesh.geometry = new THREE.EdgesGeometry(solidMesh.geometry);
                        }

                        // 5. Notifica recálculo pedagógico
                        this.notifyDeformation(solidMesh);
                    }
                }
            } else {
                // Hover highlight
                const intersects = this.raycaster.intersectObjects(this.handlesGroup.children, true);
                if (intersects.length > 0) {
                    let target = intersects[0].object;
                    while (target.parent && target.parent !== this.handlesGroup) {
                        target = target.parent;
                    }

                    if (this.hoveredHandle !== target) {
                        if (this.hoveredHandle) {
                            this.hoveredHandle.scale.set(1, 1, 1);
                            this.hoveredHandle.material.color.setHex(0xfacc15);
                        }
                        this.hoveredHandle = target;
                        this.hoveredHandle.scale.set(1.4, 1.4, 1.4);
                        this.hoveredHandle.material.color.setHex(0x00f2fe);
                    }
                    dom.style.cursor = 'grab';
                } else {
                    if (this.hoveredHandle) {
                        this.hoveredHandle.scale.set(1, 1, 1);
                        this.hoveredHandle.material.color.setHex(0xfacc15);
                        this.hoveredHandle = null;
                    }
                    dom.style.cursor = 'default';
                }
            }
        };

        const onPointerUp = () => {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.selectedHandle) {
                    this.selectedHandle.material.color.setHex(0xfacc15);
                    this.selectedHandle.material.emissive.setHex(0xd97706);
                    this.selectedHandle.scale.set(1, 1, 1);
                    this.selectedHandle = null;
                }
                if (this.sm.controls) this.sm.controls.enabled = true;
                dom.style.cursor = 'default';
                if (window.sounds) window.sounds.playClick();
            }
        };

        dom.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dom.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);
    }

    notifyDeformation(solidMesh) {
        if (!solidMesh || !solidMesh.geometry.boundingBox) return;
        const bbox = solidMesh.geometry.boundingBox;
        const w = parseFloat((bbox.max.x - bbox.min.x).toFixed(1));
        const h = parseFloat((bbox.max.y - bbox.min.y).toFixed(1));
        const d = parseFloat((bbox.max.z - bbox.min.z).toFixed(1));

        const updatedParams = {
            ...this.currentParams,
            a: Math.max(1, w),
            b: Math.max(1, d),
            c: Math.max(1, h),
            isArbitraryPolyhedron: true
        };
        this.currentParams = updatedParams;

        if (typeof this.onDimensionsChanged === 'function') {
            this.onDimensionsChanged(updatedParams);
        }
    }
}

window.VertexDeformer = VertexDeformer;
