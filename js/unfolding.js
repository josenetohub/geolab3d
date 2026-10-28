// =============================================================================
// GEO LAB 3D - SISTEMA DE PLANIFICAÇÃO 3D INTERATIVA (NET UNFOLDING BNCC)
// Decomposição de faces com medidas visuais explícitas e áreas calculadas em m²
// =============================================================================

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

        // Oculta cotas de medição dimensional 3D durante planificação para não colidir
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

    // Cria badge visual flutuante em 3D sobre a face com nome, medidas e área
    createFaceBadge(name, dimStr, areaStr) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 110;
        const ctx = canvas.getContext('2d');

        // Card com cantos arredondados e borda neon
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        const r = 16, w = 244, h = 98, x = 6, y = 6;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, 128, 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(dimStr, 128, 60);

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(areaStr, 128, 90);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.5, 0.65, 1);
        return sprite;
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
            const a = id === 'cube' ? (p.a || 3) : (p.a || 4);
            const b = id === 'cube' ? (p.a || 3) : (p.b || 3);
            const c = id === 'cube' ? (p.a || 3) : (p.c || 5);

            // 1. Base central deitada no plano y = 0.02
            const baseGeo = new THREE.PlaneGeometry(a, b);
            const baseMesh = new THREE.Mesh(baseGeo, faceMat(colors[0]));
            baseMesh.rotation.x = -Math.PI / 2;
            baseMesh.position.set(0, 0.02, 0);
            baseMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeBase = this.createFaceBadge('Base', `${a.toFixed(1)}m × ${b.toFixed(1)}m`, `Área = ${(a*b).toFixed(1)} m²`);
            badgeBase.position.set(0, 0, 0.1);
            baseMesh.add(badgeBase);
            this.sm.unfoldGroup.add(baseMesh);

            // 2. Face Frente
            const frontHinge = new THREE.Group();
            frontHinge.position.set(0, 0.02, b / 2);
            const frontGeo = new THREE.PlaneGeometry(a, c);
            const frontMesh = new THREE.Mesh(frontGeo, faceMat(colors[1]));
            frontMesh.position.set(0, 0, c / 2);
            frontMesh.rotation.x = -Math.PI / 2;
            frontMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(frontGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeFront = this.createFaceBadge('Frente', `${a.toFixed(1)}m × ${c.toFixed(1)}m`, `Área = ${(a*c).toFixed(1)} m²`);
            badgeFront.position.set(0, 0, 0.1);
            frontMesh.add(badgeFront);

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
            
            const badgeBack = this.createFaceBadge('Trás', `${a.toFixed(1)}m × ${c.toFixed(1)}m`, `Área = ${(a*c).toFixed(1)} m²`);
            badgeBack.position.set(0, 0, 0.1);
            backMesh.add(badgeBack);

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
            
            const badgeRight = this.createFaceBadge('Lateral Dir.', `${b.toFixed(1)}m × ${c.toFixed(1)}m`, `Área = ${(b*c).toFixed(1)} m²`);
            badgeRight.position.set(0, 0, 0.1);
            rightMesh.add(badgeRight);

            rightHinge.add(rightMesh);

            // Tampa superior anexada na ponta da face direita
            const topHinge = new THREE.Group();
            topHinge.position.set(c, 0, 0);
            const topGeo = new THREE.PlaneGeometry(a, b);
            const topMesh = new THREE.Mesh(topGeo, faceMat(colors[4]));
            topMesh.position.set(a / 2, 0, 0);
            topMesh.rotation.x = -Math.PI / 2;
            topMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(topGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeTop = this.createFaceBadge('Tampa Superior', `${a.toFixed(1)}m × ${b.toFixed(1)}m`, `Área = ${(a*b).toFixed(1)} m²`);
            badgeTop.position.set(0, 0, 0.1);
            topMesh.add(badgeTop);

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
            
            const badgeLeft = this.createFaceBadge('Lateral Esq.', `${b.toFixed(1)}m × ${c.toFixed(1)}m`, `Área = ${(b*c).toFixed(1)} m²`);
            badgeLeft.position.set(0, 0, 0.1);
            leftMesh.add(badgeLeft);

            leftHinge.add(leftMesh);
            this.sm.unfoldGroup.add(leftHinge);
            this.hinges.push({ obj: leftHinge, axis: 'z', closedRot: Math.PI / 2, openRot: 0 });

        } else if (id === 'square_pyramid') {
            const l = p.l || 4;
            const h = p.h || 5;
            const ap = Math.sqrt(h * h + (l / 2) * (l / 2));

            // Base quadrada no chão
            const baseGeo = new THREE.PlaneGeometry(l, l);
            const baseMesh = new THREE.Mesh(baseGeo, faceMat(colors[0]));
            baseMesh.rotation.x = -Math.PI / 2;
            baseMesh.position.set(0, 0.02, 0);
            baseMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeBase = this.createFaceBadge('Base Quadrada', `${l.toFixed(1)}m × ${l.toFixed(1)}m`, `Área = ${(l*l).toFixed(1)} m²`);
            badgeBase.position.set(0, 0, 0.1);
            baseMesh.add(badgeBase);
            this.sm.unfoldGroup.add(baseMesh);

            const closedAngle = Math.atan2(h, l / 2);

            const sides = [
                { pos: [0, 0.02, l / 2], axis: 'x', dir: 1, name: 'Triângulo Frente' },
                { pos: [0, 0.02, -l / 2], axis: 'x', dir: -1, name: 'Triângulo Trás' },
                { pos: [l / 2, 0.02, 0], axis: 'z', dir: -1, name: 'Triângulo Dir.' },
                { pos: [-l / 2, 0.02, 0], axis: 'z', dir: 1, name: 'Triângulo Esq.' }
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
                
                const triArea = ((l * ap) / 2).toFixed(1);
                const badgeTri = this.createFaceBadge(side.name, `Base ${l.toFixed(1)}m · Apót ${ap.toFixed(1)}m`, `Área = ${triArea} m²`);
                if (side.axis === 'x') {
                    badgeTri.position.set(0, 0.1, side.dir * (ap / 3));
                } else {
                    badgeTri.position.set(-side.dir * (ap / 3), 0.1, 0);
                }
                triMesh.add(badgeTri);

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
            const r = p.r || 2.5;
            const h = p.h || 5;
            const circumference = 2 * Math.PI * r;

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

            // Badge central sobre o manto lateral
            const latArea = (2 * Math.PI * r * h).toFixed(1);
            const badgeLat = this.createFaceBadge('Manto Lateral', `Comp 2πr: ${circumference.toFixed(1)}m × Alt ${h.toFixed(1)}m`, `Área Lateral = ${latArea} m²`);
            badgeLat.position.set(0, 0.25, 0);
            lateralRoot.add(badgeLat);

            // Tampa inferior circular articulada na borda
            const bottomHinge = new THREE.Group();
            bottomHinge.position.set(0, 0.02, -h / 2);
            const circleGeo = new THREE.CircleGeometry(r, 32);
            const bottomCircle = new THREE.Mesh(circleGeo, faceMat(colors[1]));
            bottomCircle.rotation.x = -Math.PI / 2;
            bottomCircle.position.set(0, 0, -r);
            bottomCircle.add(new THREE.LineSegments(new THREE.EdgesGeometry(circleGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const circleArea = (Math.PI * r * r).toFixed(1);
            const badgeBot = this.createFaceBadge('Base Circular', `Raio r = ${r.toFixed(1)} m`, `Área = π·r² = ${circleArea} m²`);
            badgeBot.position.set(0, 0, 0.1);
            bottomCircle.add(badgeBot);

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
            
            const badgeTop = this.createFaceBadge('Tampa Circular', `Raio r = ${r.toFixed(1)} m`, `Área = π·r² = ${circleArea} m²`);
            badgeTop.position.set(0, 0, 0.1);
            topCircle.add(badgeTop);

            topHinge.add(topCircle);
            this.sm.unfoldGroup.add(topHinge);
            this.hinges.push({ obj: topHinge, axis: 'x', closedRot: Math.PI / 2, openRot: 0 });

            this.dynamicMeshes.push((progress) => {
                cylinderSegments.forEach((seg, i) => {
                    const closedAngleI = i * segAngle - Math.PI / 2;
                    const closedX = r * Math.cos(closedAngleI);
                    const closedZ = r * Math.sin(closedAngleI);
                    const closedRotY = -closedAngleI - Math.PI / 2;

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
            const r = p.r || 2.0;
            const h = p.h || 4.5;
            const g = Math.sqrt(r * r + h * h);
            const theta = (2 * Math.PI * r) / g;

            const baseHinge = new THREE.Group();
            baseHinge.position.set(0, 0.02, 0);
            const circleGeo = new THREE.CircleGeometry(r, 32);
            const circleMesh = new THREE.Mesh(circleGeo, faceMat(colors[0]));
            circleMesh.rotation.x = -Math.PI / 2;
            circleMesh.position.set(0, 0, -r);
            circleMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(circleGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeBase = this.createFaceBadge('Base Circular', `Raio r = ${r.toFixed(1)} m`, `Área = ${(Math.PI*r*r).toFixed(1)} m²`);
            badgeBase.position.set(0, 0, 0.1);
            circleMesh.add(badgeBase);

            baseHinge.add(circleMesh);
            this.sm.unfoldGroup.add(baseHinge);
            this.hinges.push({ obj: baseHinge, axis: 'x', closedRot: -Math.PI / 2, openRot: 0 });

            const sectorHinge = new THREE.Group();
            sectorHinge.position.set(0, 0.02, 0);
            const sectorGeo = new THREE.RingGeometry(0.01, g, 36, 1, -theta / 2 + Math.PI / 2, theta);
            const sectorMesh = new THREE.Mesh(sectorGeo, faceMat(colors[4]));
            sectorMesh.rotation.x = -Math.PI / 2;
            sectorMesh.position.set(0, 0, g / 2);
            sectorMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(sectorGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeSector = this.createFaceBadge('Setor Circular Lateral', `Geratriz g = ${g.toFixed(1)} m`, `Área = ${(Math.PI*r*g).toFixed(1)} m²`);
            badgeSector.position.set(0, 0, 0.1);
            sectorMesh.add(badgeSector);

            sectorHinge.add(sectorMesh);
            this.sm.unfoldGroup.add(sectorHinge);
            this.hinges.push({ obj: sectorHinge, axis: 'x', closedRot: Math.PI / 2 - Math.atan2(h, r), openRot: 0 });

        } else if (id === 'triangular_prism') {
            const l = p.l || 4;
            const h = p.h || 5;
            const hTri = (l * Math.sqrt(3)) / 2;

            const centralGeo = new THREE.PlaneGeometry(l, h);
            const centralMesh = new THREE.Mesh(centralGeo, faceMat(colors[0]));
            centralMesh.rotation.x = -Math.PI / 2;
            centralMesh.position.set(0, 0.02, 0);
            centralMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(centralGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeC = this.createFaceBadge('Face Central', `${l.toFixed(1)}m × ${h.toFixed(1)}m`, `Área = ${(l*h).toFixed(1)} m²`);
            badgeC.position.set(0, 0, 0.1);
            centralMesh.add(badgeC);
            this.sm.unfoldGroup.add(centralMesh);

            const rightHinge = new THREE.Group();
            rightHinge.position.set(l / 2, 0.02, 0);
            const rGeo = new THREE.PlaneGeometry(l, h);
            const rMesh = new THREE.Mesh(rGeo, faceMat(colors[1]));
            rMesh.rotation.x = -Math.PI / 2;
            rMesh.position.set(l / 2, 0, 0);
            rMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(rGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeR = this.createFaceBadge('Face Direita', `${l.toFixed(1)}m × ${h.toFixed(1)}m`, `Área = ${(l*h).toFixed(1)} m²`);
            badgeR.position.set(0, 0, 0.1);
            rMesh.add(badgeR);

            rightHinge.add(rMesh);
            this.sm.unfoldGroup.add(rightHinge);
            this.hinges.push({ obj: rightHinge, axis: 'z', closedRot: -Math.PI / 3, openRot: 0 });

            const leftHinge = new THREE.Group();
            leftHinge.position.set(-l / 2, 0.02, 0);
            const lGeo = new THREE.PlaneGeometry(l, h);
            const lMesh = new THREE.Mesh(lGeo, faceMat(colors[2]));
            lMesh.rotation.x = -Math.PI / 2;
            lMesh.position.set(-l / 2, 0, 0);
            lMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(lGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
            
            const badgeL = this.createFaceBadge('Face Esquerda', `${l.toFixed(1)}m × ${h.toFixed(1)}m`, `Área = ${(l*h).toFixed(1)} m²`);
            badgeL.position.set(0, 0, 0.1);
            lMesh.add(badgeL);

            leftHinge.add(leftMesh);
            this.sm.unfoldGroup.add(leftHinge);
            this.hinges.push({ obj: leftHinge, axis: 'z', closedRot: Math.PI / 3, openRot: 0 });

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
            
            const badgeBot = this.createFaceBadge('Base Triangular', `Lado ${l.toFixed(1)} m`, `Área = ${((l*hTri)/2).toFixed(1)} m²`);
            badgeBot.position.set(0, 0.1, -hTri / 2);
            triMesh.add(badgeBot);

            botHinge.add(triMesh);
            this.sm.unfoldGroup.add(botHinge);
            this.hinges.push({ obj: botHinge, axis: 'x', closedRot: -Math.PI / 2, openRot: 0 });

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
            
            const badgeTop = this.createFaceBadge('Topo Triangular', `Lado ${l.toFixed(1)} m`, `Área = ${((l*hTri)/2).toFixed(1)} m²`);
            badgeTop.position.set(0, 0.1, hTri / 2);
            triMeshTop.add(badgeTop);

            topHinge.add(triMeshTop);
            this.sm.unfoldGroup.add(topHinge);
            this.hinges.push({ obj: topHinge, axis: 'x', closedRot: Math.PI / 2, openRot: 0 });

        } else {
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
