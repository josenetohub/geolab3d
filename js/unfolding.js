// Sistema de Planificação 3D Interativa (Net Unfolding)
class UnfoldingSystem {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.active = false;
        this.t = 0; // 0 = fechado 3D, 1 = totalmente planificado 2D
        this.currentSolidId = 'cube';
        this.currentParams = {};
        this.hinges = [];
    }

    setSolid(solidId, params) {
        this.currentSolidId = solidId;
        this.currentParams = { ...params };
        if (this.active) {
            this.buildNet();
        }
    }

    setActive(active) {
        this.active = active;
        this.sm.solidGroup.visible = !active;
        this.sm.elementsGroup.visible = !active;
        this.sm.unfoldGroup.visible = active;
        if (active) {
            this.buildNet();
            this.setUnfoldProgress(this.t);
        } else {
            this.clear();
        }
    }

    clear() {
        while (this.sm.unfoldGroup.children.length > 0) {
            const child = this.sm.unfoldGroup.children[0];
            this.sm.unfoldGroup.remove(child);
        }
        this.hinges = [];
    }

    buildNet() {
        this.clear();
        const id = this.currentSolidId;
        const p = this.currentParams;

        const faceMat = (color) => new THREE.MeshStandardMaterial({
            color,
            roughness: 0.35,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444, 0x8b5cf6, 0x06b6d4];

        if (id === 'cube' || id === 'rectangular_prism') {
            const a = id === 'cube' ? p.a : p.a;
            const b = id === 'cube' ? p.a : p.b;
            const c = id === 'cube' ? p.a : p.c;

            // Base central deitada no plano y = 0.02
            const baseGeo = new THREE.PlaneGeometry(a, b);
            const baseMesh = new THREE.Mesh(baseGeo, faceMat(colors[0]));
            baseMesh.rotation.x = -Math.PI / 2;
            baseMesh.position.set(0, 0.02, 0);
            this.sm.unfoldGroup.add(baseMesh);

            // Borda na base
            baseMesh.add(new THREE.LineSegments(
                new THREE.EdgesGeometry(baseGeo),
                new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
            ));

            // Face Frente (dobra no eixo Z = b/2)
            const frontHinge = new THREE.Group();
            frontHinge.position.set(0, 0.02, b / 2);
            const frontGeo = new THREE.PlaneGeometry(a, c);
            const frontMesh = new THREE.Mesh(frontGeo, faceMat(colors[1]));
            frontMesh.position.set(0, 0, c / 2);
            frontMesh.rotation.x = -Math.PI / 2;
            frontMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(frontGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            frontHinge.add(frontMesh);
            this.sm.unfoldGroup.add(frontHinge);
            this.hinges.push({ obj: frontHinge, axis: 'x', closedRot: Math.PI / 2, openRot: 0 });

            // Face Trás (dobra no eixo Z = -b/2)
            const backHinge = new THREE.Group();
            backHinge.position.set(0, 0.02, -b / 2);
            const backGeo = new THREE.PlaneGeometry(a, c);
            const backMesh = new THREE.Mesh(backGeo, faceMat(colors[2]));
            backMesh.position.set(0, 0, -c / 2);
            backMesh.rotation.x = -Math.PI / 2;
            backMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(backGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            backHinge.add(backMesh);
            this.sm.unfoldGroup.add(backHinge);
            this.hinges.push({ obj: backHinge, axis: 'x', closedRot: -Math.PI / 2, openRot: 0 });

            // Face Direita (dobra no eixo X = a/2)
            const rightHinge = new THREE.Group();
            rightHinge.position.set(a / 2, 0.02, 0);
            const rightGeo = new THREE.PlaneGeometry(c, b);
            const rightMesh = new THREE.Mesh(rightGeo, faceMat(colors[3]));
            rightMesh.position.set(c / 2, 0, 0);
            rightMesh.rotation.x = -Math.PI / 2;
            rightMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(rightGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            rightHinge.add(rightMesh);

            // Tampa superior anexada na face direita
            const topHinge = new THREE.Group();
            topHinge.position.set(c, 0, 0);
            const topGeo = new THREE.PlaneGeometry(a, b);
            const topMesh = new THREE.Mesh(topGeo, faceMat(colors[4]));
            topMesh.position.set(a / 2, 0, 0);
            topMesh.rotation.x = -Math.PI / 2;
            topMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(topGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            topHinge.add(topMesh);
            rightHinge.add(topHinge);

            this.sm.unfoldGroup.add(rightHinge);
            this.hinges.push({ obj: rightHinge, axis: 'z', closedRot: -Math.PI / 2, openRot: 0 });
            this.hinges.push({ obj: topHinge, axis: 'z', closedRot: -Math.PI / 2, openRot: 0 });

            // Face Esquerda (dobra no eixo X = -a/2)
            const leftHinge = new THREE.Group();
            leftHinge.position.set(-a / 2, 0.02, 0);
            const leftGeo = new THREE.PlaneGeometry(c, b);
            const leftMesh = new THREE.Mesh(leftGeo, faceMat(colors[5]));
            leftMesh.position.set(-c / 2, 0, 0);
            leftMesh.rotation.x = -Math.PI / 2;
            leftMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(leftGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            leftHinge.add(leftMesh);
            this.sm.unfoldGroup.add(leftHinge);
            this.hinges.push({ obj: leftHinge, axis: 'z', closedRot: Math.PI / 2, openRot: 0 });
        } else if (id === 'square_pyramid') {
            const { l, h } = p;
            const ap = Math.sqrt(h * h + (l / 2) * (l / 2));

            // Base quadrada
            const baseGeo = new THREE.PlaneGeometry(l, l);
            const baseMesh = new THREE.Mesh(baseGeo, faceMat(colors[0]));
            baseMesh.rotation.x = -Math.PI / 2;
            baseMesh.position.set(0, 0.02, 0);
            this.sm.unfoldGroup.add(baseMesh);

            // Ângulo fechado do triângulo lateral da pirâmide
            const closedAngle = Math.atan2(h, l / 2);

            // 4 faces triangulares
            const sides = [
                { pos: [0, 0.02, l / 2], axis: 'x', dir: 1 },
                { pos: [0, 0.02, -l / 2], axis: 'x', dir: -1 },
                { pos: [l / 2, 0.02, 0], axis: 'z', dir: -1 },
                { pos: [-l / 2, 0.02, 0], axis: 'z', dir: 1 }
            ];

            sides.forEach((side, idx) => {
                const hinge = new THREE.Group();
                hinge.position.set(...side.pos);

                // Triângulo isósceles usando BufferGeometry
                const triGeo = new THREE.BufferGeometry();
                const verts = new Float32Array([
                    -l / 2, 0, 0,
                    l / 2, 0, 0,
                    0, 0, side.dir * ap
                ]);
                triGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
                triGeo.computeVertexNormals();

                const triMesh = new THREE.Mesh(triGeo, faceMat(colors[(idx + 1) % colors.length]));
                triMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(triGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
                hinge.add(triMesh);
                this.sm.unfoldGroup.add(hinge);

                this.hinges.push({
                    obj: hinge,
                    axis: side.axis,
                    closedRot: side.dir * (Math.PI / 2 - closedAngle),
                    openRot: 0
                });
            });
        } else {
            // Mensagem ou representação para sólidos não-planificáveis de imediato
            const infoGeo = new THREE.PlaneGeometry(6, 6);
            const infoMesh = new THREE.Mesh(infoGeo, faceMat(0x3b82f6));
            infoMesh.rotation.x = -Math.PI / 2;
            infoMesh.position.y = 0.02;
            this.sm.unfoldGroup.add(infoMesh);
        }

        this.setUnfoldProgress(this.t);
    }

    setUnfoldProgress(t) {
        this.t = Math.max(0, Math.min(1, t));
        this.hinges.forEach(h => {
            const rot = THREE.MathUtils.lerp(h.closedRot, h.openRot, this.t);
            if (h.axis === 'x') h.obj.rotation.x = rot;
            if (h.axis === 'z') h.obj.rotation.z = rot;
        });
    }
}

window.UnfoldingSystem = UnfoldingSystem;
