// Sistema de Planificação 3D Interativa Completa (Net Unfolding BNCC)
class UnfoldingSystem {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.active = false;
        this.t = 0; // 0 = fechado 3D, 1 = totalmente planificado 2D
        this.currentSolidId = 'cube';
        this.currentParams = {};
        this.hinges = [];
        this.dynamicMeshes = [];
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

        // Oculta completamente o sólido original e todos os elementos de silhueta
        this.sm.solidGroup.visible = !active;
        this.sm.elementsGroup.visible = !active;
        this.sm.liquidGroup.visible = false;
        if (this.sm.clippingPlaneMesh) this.sm.clippingPlaneMesh.visible = false;
        if (this.sm.faucetGroup) this.sm.faucetGroup.visible = false;

        // Oculta cotas de medição dimensional no modo de planificação para evitar silhuetas
        if (window.dimensionsHelper) {
            window.dimensionsHelper.setVisible(!active);
        }

        this.sm.unfoldGroup.visible = active;

        if (active) {
            this.buildNet();
            this.setUnfoldProgress(this.t);
        } else {
            this.clear();
            this.sm.solidGroup.visible = true;
        }
    }

    clear() {
        while (this.sm.unfoldGroup.children.length > 0) {
            const child = this.sm.unfoldGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
            this.sm.unfoldGroup.remove(child);
        }
        this.hinges = [];
        this.dynamicMeshes = [];
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

        const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444, 0x8b5cf6, 0x06b6d4, 0xec4899, 0x14b8a6];

        if (id === 'cube' || id === 'rectangular_prism') {
            const a = id === 'cube' ? (p.a || 4) : (p.a || 4);
            const b = id === 'cube' ? (p.a || 4) : (p.b || 3);
            const c = id === 'cube' ? (p.a || 4) : (p.c || 5);

            // 1. Base central deitada no plano y = 0.02
            const baseGeo = new THREE.PlaneGeometry(a, b);
            const baseMesh = new THREE.Mesh(baseGeo, faceMat(colors[0]));
            baseMesh.rotation.x = -Math.PI / 2;
            baseMesh.position.set(0, 0.02, 0);
            baseMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            this.sm.unfoldGroup.add(baseMesh);

            // 2. Face Frente
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

            // 3. Face Trás
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

            // 4. Face Direita + Tampa Superior anexada
            const rightHinge = new THREE.Group();
            rightHinge.position.set(a / 2, 0.02, 0);
            const rightGeo = new THREE.PlaneGeometry(c, b);
            const rightMesh = new THREE.Mesh(rightGeo, faceMat(colors[3]));
            rightMesh.position.set(c / 2, 0, 0);
            rightMesh.rotation.x = -Math.PI / 2;
            rightMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(rightGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            rightHinge.add(rightMesh);

            // Tampa superior anexada na ponta da face direita
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

            // 5. Face Esquerda
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
            // Planificação da Pirâmide Quadrada (Base quadrada + 4 triângulos isósceles com apótema ap)
            const l = p.l || 4;
            const h = p.h || 5;
            const ap = Math.sqrt(h * h + (l / 2) * (l / 2));

            // Base quadrada no chão
            const baseGeo = new THREE.PlaneGeometry(l, l);
            const baseMesh = new THREE.Mesh(baseGeo, faceMat(colors[0]));
            baseMesh.rotation.x = -Math.PI / 2;
            baseMesh.position.set(0, 0.02, 0);
            baseMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            this.sm.unfoldGroup.add(baseMesh);

            const closedAngle = Math.atan2(h, l / 2);

            const sides = [
                { pos: [0, 0.02, l / 2], axis: 'x', dir: 1 },
                { pos: [0, 0.02, -l / 2], axis: 'x', dir: -1 },
                { pos: [l / 2, 0.02, 0], axis: 'z', dir: -1 },
                { pos: [-l / 2, 0.02, 0], axis: 'z', dir: 1 }
            ];

            sides.forEach((side, idx) => {
                const hinge = new THREE.Group();
                hinge.position.set(...side.pos);

                const triGeo = new THREE.BufferGeometry();
                const verts = (side.axis === 'x')
                    ? new Float32Array([
                        -l / 2, 0, 0,
                        l / 2, 0, 0,
                        0, 0, side.dir * ap
                    ])
                    : new Float32Array([
                        0, 0, -l / 2,
                        0, 0, l / 2,
                        -side.dir * ap, 0, 0
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

        } else if (id === 'cylinder') {
            // Planificação Completa do Cilindro:
            // Lateral retangular desenrolável de dimensões (2*pi*r) x h + 2 tampas circulares de raio r
            const r = p.r || 2.5;
            const h = p.h || 5;
            const circumference = 2 * Math.PI * r;

            // Retângulo lateral dividido em tiras articuladas para desenrolamento suave
            const numSegments = 24;
            const segWidth = circumference / numSegments;
            const segAngle = (2 * Math.PI) / numSegments;

            const lateralRoot = new THREE.Group();
            lateralRoot.position.set(0, 0.02, 0);
            this.sm.unfoldGroup.add(lateralRoot);

            const cylinderSegments = [];
            for (let i = 0; i < numSegments; i++) {
                const segGeo = new THREE.PlaneGeometry(segWidth, h);
                const segMesh = new THREE.Mesh(segGeo, faceMat(colors[i % 2 === 0 ? 0 : 5]));
                segMesh.rotation.x = -Math.PI / 2;
                segMesh.position.y = 0;
                segMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(segGeo), new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 })));
                lateralRoot.add(segMesh);
                cylinderSegments.push(segMesh);
            }

            // Tampa inferior circular articulada na borda
            const bottomHinge = new THREE.Group();
            bottomHinge.position.set(0, 0.02, -h / 2);
            const circleGeo = new THREE.CircleGeometry(r, 32);
            const bottomCircle = new THREE.Mesh(circleGeo, faceMat(colors[1]));
            bottomCircle.rotation.x = -Math.PI / 2;
            bottomCircle.position.set(0, 0, -r);
            bottomCircle.add(new THREE.LineSegments(new THREE.EdgesGeometry(circleGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            bottomHinge.add(bottomCircle);
            this.sm.unfoldGroup.add(bottomHinge);
            this.hinges.push({ obj: bottomHinge, axis: 'x', closedRot: -Math.PI / 2, openRot: 0 });

            // Tampa superior circular articulada na borda oposta
            const topHinge = new THREE.Group();
            topHinge.position.set(0, 0.02, h / 2);
            const topCircle = new THREE.Mesh(circleGeo, faceMat(colors[2]));
            topCircle.rotation.x = -Math.PI / 2;
            topCircle.position.set(0, 0, r);
            topCircle.add(new THREE.LineSegments(new THREE.EdgesGeometry(circleGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            topHinge.add(topCircle);
            this.sm.unfoldGroup.add(topHinge);
            this.hinges.push({ obj: topHinge, axis: 'x', closedRot: Math.PI / 2, openRot: 0 });

            // Função dinâmica para desenrolar os segmentos do cilindro de curvo (fechado) para plano (aberto)
            this.dynamicMeshes.push((progress) => {
                cylinderSegments.forEach((seg, i) => {
                    // closed: i-th segment on cylinder of radius r
                    const closedAngleI = i * segAngle - Math.PI / 2;
                    const closedX = r * Math.cos(closedAngleI);
                    const closedZ = r * Math.sin(closedAngleI);
                    const closedRotY = -closedAngleI - Math.PI / 2;

                    // open: flat on X-axis from -circumference/2 to +circumference/2
                    const openX = (i - numSegments / 2 + 0.5) * segWidth;
                    const openZ = 0;
                    const openRotY = 0;

                    seg.position.x = THREE.MathUtils.lerp(closedX, openX, progress);
                    seg.position.z = THREE.MathUtils.lerp(closedZ, openZ, progress);
                    seg.position.y = THREE.MathUtils.lerp(h / 2, 0.02, progress);
                    seg.rotation.y = THREE.MathUtils.lerp(closedRotY, openRotY, progress);
                    seg.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, progress);
                });
            });

        } else if (id === 'cone') {
            // Planificação Completa do Cone:
            // 1 Círculo da Base + 1 Setor Circular de raio g (geratriz) e ângulo central theta = 360° * r / g
            const r = p.r || 2.0;
            const h = p.h || 4.5;
            const g = Math.sqrt(r * r + h * h);
            const theta = (2 * Math.PI * r) / g; // em radianos

            // Círculo da Base
            const baseHinge = new THREE.Group();
            baseHinge.position.set(0, 0.02, 0);
            const circleGeo = new THREE.CircleGeometry(r, 32);
            const circleMesh = new THREE.Mesh(circleGeo, faceMat(colors[0]));
            circleMesh.rotation.x = -Math.PI / 2;
            circleMesh.position.set(0, 0, -r);
            circleMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(circleGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            baseHinge.add(circleMesh);
            this.sm.unfoldGroup.add(baseHinge);
            this.hinges.push({ obj: baseHinge, axis: 'x', closedRot: -Math.PI / 2, openRot: 0 });

            // Setor Circular Planificado da Lateral
            const sectorHinge = new THREE.Group();
            sectorHinge.position.set(0, 0.02, 0);
            const sectorGeo = new THREE.RingGeometry(0.01, g, 36, 1, -theta / 2 + Math.PI / 2, theta);
            const sectorMesh = new THREE.Mesh(sectorGeo, faceMat(colors[4]));
            sectorMesh.rotation.x = -Math.PI / 2;
            sectorMesh.position.set(0, 0, g / 2);
            sectorMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(sectorGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            sectorHinge.add(sectorMesh);
            this.sm.unfoldGroup.add(sectorHinge);
            this.hinges.push({ obj: sectorHinge, axis: 'x', closedRot: Math.PI / 2 - Math.atan2(h, r), openRot: 0 });

        } else if (id === 'triangular_prism') {
            // Prisma Triangular: 3 retângulos laterais em fita + 2 triângulos nas pontas
            const l = p.l || 4;
            const h = p.h || 5;
            const hTri = (l * Math.sqrt(3)) / 2;

            // Retângulo central
            const centralGeo = new THREE.PlaneGeometry(l, h);
            const centralMesh = new THREE.Mesh(centralGeo, faceMat(colors[0]));
            centralMesh.rotation.x = -Math.PI / 2;
            centralMesh.position.set(0, 0.02, 0);
            centralMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(centralGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            this.sm.unfoldGroup.add(centralMesh);

            // Retângulo direito
            const rightHinge = new THREE.Group();
            rightHinge.position.set(l / 2, 0.02, 0);
            const rGeo = new THREE.PlaneGeometry(l, h);
            const rMesh = new THREE.Mesh(rGeo, faceMat(colors[1]));
            rMesh.rotation.x = -Math.PI / 2;
            rMesh.position.set(l / 2, 0, 0);
            rMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(rGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            rightHinge.add(rMesh);
            this.sm.unfoldGroup.add(rightHinge);
            this.hinges.push({ obj: rightHinge, axis: 'z', closedRot: -Math.PI / 3, openRot: 0 });

            // Retângulo esquerdo
            const leftHinge = new THREE.Group();
            leftHinge.position.set(-l / 2, 0.02, 0);
            const lGeo = new THREE.PlaneGeometry(l, h);
            const lMesh = new THREE.Mesh(lGeo, faceMat(colors[2]));
            lMesh.rotation.x = -Math.PI / 2;
            lMesh.position.set(-l / 2, 0, 0);
            lMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(lGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            leftHinge.add(lMesh);
            this.sm.unfoldGroup.add(leftHinge);
            this.hinges.push({ obj: leftHinge, axis: 'z', closedRot: Math.PI / 3, openRot: 0 });

            // Triângulo inferior
            const botHinge = new THREE.Group();
            botHinge.position.set(0, 0.02, -h / 2);
            const triGeo = new THREE.BufferGeometry();
            const verts = new Float32Array([
                -l / 2, 0, 0,
                l / 2, 0, 0,
                0, 0, -hTri
            ]);
            triGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
            triGeo.computeVertexNormals();
            const triMesh = new THREE.Mesh(triGeo, faceMat(colors[3]));
            triMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(triGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            botHinge.add(triMesh);
            this.sm.unfoldGroup.add(botHinge);
            this.hinges.push({ obj: botHinge, axis: 'x', closedRot: -Math.PI / 2, openRot: 0 });

            // Triângulo superior
            const topHinge = new THREE.Group();
            topHinge.position.set(0, 0.02, h / 2);
            const triGeoTop = new THREE.BufferGeometry();
            const vertsTop = new Float32Array([
                -l / 2, 0, 0,
                l / 2, 0, 0,
                0, 0, hTri
            ]);
            triGeoTop.setAttribute('position', new THREE.BufferAttribute(vertsTop, 3));
            triGeoTop.computeVertexNormals();
            const triMeshTop = new THREE.Mesh(triGeoTop, faceMat(colors[4]));
            triMeshTop.add(new THREE.LineSegments(new THREE.EdgesGeometry(triGeoTop), new THREE.LineBasicMaterial({ color: 0xffffff })));
            topHinge.add(triMeshTop);
            this.sm.unfoldGroup.add(topHinge);
            this.hinges.push({ obj: topHinge, axis: 'x', closedRot: Math.PI / 2, openRot: 0 });

        } else {
            // Outros sólidos: demonstração planificada proporcional
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
            if (h.axis === 'y') h.obj.rotation.y = rot;
        });

        this.dynamicMeshes.forEach(fn => fn(this.t));
    }
}

window.UnfoldingSystem = UnfoldingSystem;
