// Manipulador de Deformação Tridimensional por Vértices (Vertex Deformer)
class VertexDeformer {
    constructor(sceneManager, onDimensionsChanged) {
        this.sm = sceneManager;
        this.onDimensionsChanged = onDimensionsChanged;
        this.active = false;
        this.currentSolidId = 'cube';
        this.currentParams = {};

        this.handlesGroup = new THREE.Group();
        this.handlesGroup.name = 'vertexHandlesGroup';
        this.sm.scene.add(this.handlesGroup);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragPlane = new THREE.Plane();
        this.planeIntersect = new THREE.Vector3();

        this.selectedHandle = null;
        this.isDragging = false;
        this.hoveredHandle = null;

        this.setupEvents();
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
            if (this.sm.controls) this.sm.controls.enabled = true;
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
            if (h.material) h.material.dispose();
            this.handlesGroup.remove(h);
        }
    }

    rebuildHandles() {
        this.clearHandles();
        if (!this.active) return;

        const id = this.currentSolidId;
        const p = this.currentParams;
        const positions = [];

        // Obtém as posições atuais dos vértices do sólido
        switch (id) {
            case 'cube': {
                const a = p.a || 3;
                const half = a / 2;
                [
                    [-half, 0, -half], [half, 0, -half], [half, 0, half], [-half, 0, half],
                    [-half, a, -half], [half, a, -half], [half, a, half], [-half, a, half]
                ].forEach((pt, i) => positions.push({ pos: new THREE.Vector3(...pt), type: 'box_vertex', index: i }));
                break;
            }

            case 'rectangular_prism': {
                const a = p.a || 4, b = p.b || 3, c = p.c || 5;
                const ha = a / 2, hb = b / 2;
                [
                    [-ha, 0, -hb], [ha, 0, -hb], [ha, 0, hb], [-ha, 0, hb],
                    [-ha, c, -hb], [ha, c, -hb], [ha, c, hb], [-ha, c, hb]
                ].forEach((pt, i) => positions.push({ pos: new THREE.Vector3(...pt), type: 'box_vertex', index: i }));
                break;
            }

            case 'cylinder': {
                const r = p.r || 2.5, h = p.h || 5;
                // Alças nos 4 quadrantes da base e do topo
                for (let i = 0; i < 4; i++) {
                    const ang = (i * Math.PI) / 2;
                    positions.push({ pos: new THREE.Vector3(r * Math.cos(ang), h, r * Math.sin(ang)), type: 'cylinder_top', angle: ang });
                    positions.push({ pos: new THREE.Vector3(r * Math.cos(ang), 0, r * Math.sin(ang)), type: 'cylinder_bottom', angle: ang });
                }
                break;
            }

            case 'cone': {
                const r = p.r || 2.5, h = p.h || 5;
                positions.push({ pos: new THREE.Vector3(0, h, 0), type: 'apex' });
                for (let i = 0; i < 4; i++) {
                    const ang = (i * Math.PI) / 2;
                    positions.push({ pos: new THREE.Vector3(r * Math.cos(ang), 0, r * Math.sin(ang)), type: 'cone_base', angle: ang });
                }
                break;
            }

            case 'square_pyramid': {
                const l = p.l || 4, h = p.h || 5;
                const hl = l / 2;
                positions.push({ pos: new THREE.Vector3(0, h, 0), type: 'apex' });
                [
                    [-hl, 0, -hl], [hl, 0, -hl], [hl, 0, hl], [-hl, 0, hl]
                ].forEach((pt, i) => positions.push({ pos: new THREE.Vector3(...pt), type: 'pyramid_base', index: i }));
                break;
            }

            default:
                break;
        }

        // Cria esferas de controle interativas (handles)
        const handleGeo = new THREE.SphereGeometry(0.22, 16, 16);
        positions.forEach(item => {
            const handleMat = new THREE.MeshStandardMaterial({
                color: 0xf59e0b,
                emissive: 0xd97706,
                roughness: 0.2,
                metalness: 0.8
            });
            const handleMesh = new THREE.Mesh(handleGeo, handleMat);
            handleMesh.position.copy(item.pos);
            handleMesh.userData = item;
            this.handlesGroup.add(handleMesh);
        });

        this.handlesGroup.visible = true;
    }

    setupEvents() {
        const dom = this.sm.renderer.domElement;

        const getCoords = (e) => {
            const rect = dom.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
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

            const intersects = this.raycaster.intersectObjects(this.handlesGroup.children);
            if (intersects.length > 0) {
                this.selectedHandle = intersects[0].object;
                this.isDragging = true;
                this.sm.controls.enabled = false;

                // Cria o plano de arraste paralelo à tela passando pelo vértice
                const normal = this.sm.camera.getWorldDirection(new THREE.Vector3()).negate();
                this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.selectedHandle.position);

                this.selectedHandle.material.color.setHex(0x00f2fe);
                this.selectedHandle.material.emissive.setHex(0x0284c7);
                this.selectedHandle.scale.set(1.5, 1.5, 1.5);
                dom.style.cursor = 'grabbing';
            }
        };

        const onPointerMove = (e) => {
            if (!this.active) return;
            const coords = getCoords(e);
            this.mouse.set(coords.x, coords.y);
            this.raycaster.setFromCamera(this.mouse, this.sm.camera);

            if (this.isDragging && this.selectedHandle) {
                if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersect)) {
                    const newPos = this.planeIntersect.clone();
                    this.applyDeformation(this.selectedHandle.userData, newPos);
                }
            } else {
                // Hover highlight
                const intersects = this.raycaster.intersectObjects(this.handlesGroup.children);
                if (intersects.length > 0) {
                    if (this.hoveredHandle !== intersects[0].object) {
                        if (this.hoveredHandle) {
                            this.hoveredHandle.scale.set(1, 1, 1);
                            this.hoveredHandle.material.color.setHex(0xf59e0b);
                        }
                        this.hoveredHandle = intersects[0].object;
                        this.hoveredHandle.scale.set(1.3, 1.3, 1.3);
                        this.hoveredHandle.material.color.setHex(0x38bdf8);
                    }
                    dom.style.cursor = 'grab';
                } else {
                    if (this.hoveredHandle) {
                        this.hoveredHandle.scale.set(1, 1, 1);
                        this.hoveredHandle.material.color.setHex(0xf59e0b);
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
                    this.selectedHandle.material.color.setHex(0xf59e0b);
                    this.selectedHandle.material.emissive.setHex(0xd97706);
                    this.selectedHandle.scale.set(1, 1, 1);
                    this.selectedHandle = null;
                }
                this.sm.controls.enabled = true;
                dom.style.cursor = 'default';
                if (window.sounds) window.sounds.playClick();
                this.rebuildHandles();
            }
        };

        dom.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dom.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);
    }

    applyDeformation(userData, newPos) {
        const id = this.currentSolidId;
        const p = { ...this.currentParams };

        switch (id) {
            case 'cube': {
                // Ao puxar qualquer vértice do cubo, redimensiona simetricamente
                const distFromCenter = Math.max(Math.abs(newPos.x), Math.abs(newPos.z), newPos.y / 2);
                const newA = Math.max(1.0, Math.min(8.0, distFromCenter * 2));
                p.a = parseFloat(newA.toFixed(2));
                break;
            }

            case 'rectangular_prism': {
                // Achatamento ou ampliação independente por eixo
                if (Math.abs(newPos.x) > 0.5) p.a = parseFloat((Math.max(1.0, Math.min(10.0, Math.abs(newPos.x) * 2))).toFixed(2));
                if (Math.abs(newPos.z) > 0.5) p.b = parseFloat((Math.max(1.0, Math.min(10.0, Math.abs(newPos.z) * 2))).toFixed(2));
                if (newPos.y > 0.5) p.c = parseFloat((Math.max(1.0, Math.min(10.0, newPos.y))).toFixed(2));
                break;
            }

            case 'cylinder': {
                if (userData.type === 'cylinder_top') {
                    if (newPos.y > 0.5) p.h = parseFloat(Math.max(1.0, Math.min(10.0, newPos.y)).toFixed(2));
                    const newR = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
                    if (newR > 0.5) p.r = parseFloat(Math.max(0.8, Math.min(5.0, newR)).toFixed(2));
                } else {
                    const newR = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
                    if (newR > 0.5) p.r = parseFloat(Math.max(0.8, Math.min(5.0, newR)).toFixed(2));
                }
                break;
            }

            case 'cone': {
                if (userData.type === 'apex') {
                    if (newPos.y > 0.5) p.h = parseFloat(Math.max(1.0, Math.min(10.0, newPos.y)).toFixed(2));
                } else {
                    const newR = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
                    if (newR > 0.5) p.r = parseFloat(Math.max(0.8, Math.min(5.0, newR)).toFixed(2));
                }
                break;
            }

            case 'square_pyramid': {
                if (userData.type === 'apex') {
                    if (newPos.y > 0.5) p.h = parseFloat(Math.max(1.0, Math.min(10.0, newPos.y)).toFixed(2));
                } else {
                    const maxCoord = Math.max(Math.abs(newPos.x), Math.abs(newPos.z));
                    if (maxCoord > 0.5) p.l = parseFloat((Math.max(1.0, Math.min(8.0, maxCoord * 2))).toFixed(2));
                }
                break;
            }

            default:
                break;
        }

        this.currentParams = p;
        if (typeof this.onDimensionsChanged === 'function') {
            this.onDimensionsChanged(p);
        }
    }
}

window.VertexDeformer = VertexDeformer;
