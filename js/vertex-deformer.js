// Manipulador de Deformação Tridimensional por Vértices (Vertex Deformer Robusto & Intuitivo)
class VertexDeformer {
    constructor(sceneManager, onDimensionsChanged) {
        this.sm = sceneManager;
        this.onDimensionsChanged = onDimensionsChanged;
        this.active = true; // ATIVO POR PADRÃO para que o estudante possa empurrar os vértices imediatamente
        this.currentSolidId = 'cube';
        this.currentParams = {};

        this.handlesGroup = new THREE.Group();
        this.handlesGroup.name = 'vertexHandlesGroup';
        this.sm.scene.add(this.handlesGroup);

        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line = { threshold: 0.3 };
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

        // Esferas de controle maiores e visíveis com brilho neon
        const handleGeo = new THREE.SphereGeometry(0.3, 16, 16);
        positions.forEach(item => {
            const handleMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15, // Amarelo vibrante de alta visibilidade
                emissive: 0xd97706,
                roughness: 0.1,
                metalness: 0.8
            });
            const handleMesh = new THREE.Mesh(handleGeo, handleMat);
            handleMesh.position.copy(item.pos);
            handleMesh.userData = item;

            // Anel visual de destaque em torno do vértice
            const ringGeo = new THREE.RingGeometry(0.35, 0.45, 16);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            handleMesh.add(ring);

            this.handlesGroup.add(handleMesh);
        });

        this.handlesGroup.visible = true;
    }

    setupEvents() {
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
                    this.sm.controls.enabled = false;

                    if (e.cancelable && e.type.startsWith('touch')) {
                        e.preventDefault();
                    }

                    // Cria o plano de arraste paralelo à tela passando pelo vértice
                    const normal = this.sm.camera.getWorldDirection(new THREE.Vector3()).negate();
                    this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.selectedHandle.position);

                    this.selectedHandle.material.color.setHex(0x00f2fe);
                    this.selectedHandle.material.emissive.setHex(0x0284c7);
                    this.selectedHandle.scale.set(1.6, 1.6, 1.6);
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
                    const newPos = this.planeIntersect.clone();
                    this.applyDeformation(this.selectedHandle.userData, newPos);
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
                this.sm.controls.enabled = true;
                dom.style.cursor = 'default';
                if (window.sounds) window.sounds.playClick();
                this.rebuildHandles();
            }
        };

        dom.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dom.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
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
                if (Math.abs(newPos.x) > 0.4) p.a = parseFloat((Math.max(1.0, Math.min(10.0, Math.abs(newPos.x) * 2))).toFixed(2));
                if (Math.abs(newPos.z) > 0.4) p.b = parseFloat((Math.max(1.0, Math.min(10.0, Math.abs(newPos.z) * 2))).toFixed(2));
                if (newPos.y > 0.4) p.c = parseFloat((Math.max(1.0, Math.min(10.0, newPos.y))).toFixed(2));
                break;
            }

            case 'cylinder': {
                if (userData.type === 'cylinder_top') {
                    if (newPos.y > 0.4) p.h = parseFloat(Math.max(1.0, Math.min(10.0, newPos.y)).toFixed(2));
                    const newR = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
                    if (newR > 0.4) p.r = parseFloat(Math.max(0.8, Math.min(5.0, newR)).toFixed(2));
                } else {
                    const newR = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
                    if (newR > 0.4) p.r = parseFloat(Math.max(0.8, Math.min(5.0, newR)).toFixed(2));
                }
                break;
            }

            case 'cone': {
                if (userData.type === 'apex') {
                    if (newPos.y > 0.4) p.h = parseFloat(Math.max(1.0, Math.min(10.0, newPos.y)).toFixed(2));
                } else {
                    const newR = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
                    if (newR > 0.4) p.r = parseFloat(Math.max(0.8, Math.min(5.0, newR)).toFixed(2));
                }
                break;
            }

            case 'square_pyramid': {
                if (userData.type === 'apex') {
                    if (newPos.y > 0.4) p.h = parseFloat(Math.max(1.0, Math.min(10.0, newPos.y)).toFixed(2));
                } else {
                    const maxCoord = Math.max(Math.abs(newPos.x), Math.abs(newPos.z));
                    if (maxCoord > 0.4) p.l = parseFloat((Math.max(1.0, Math.min(8.0, maxCoord * 2))).toFixed(2));
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
