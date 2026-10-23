// Estúdio de Arquitetura & Personalizador Completo de Prédios 3D (Building Customizer)
class BuildingBuilder {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.active = false;
        this.buildingGroup = new THREE.Group();
        this.buildingGroup.name = 'buildingArchitectureGroup';
        this.sm.scene.add(this.buildingGroup);

        this.params = {
            floors: 4,
            windowsPerFloor: 3,
            windowStyle: 'blue_mirror', // 'blue_mirror', 'white_grid', 'black_panoramic'
            doorStyle: 'glass_double',   // 'glass_double', 'wood_classic', 'garage_gate'
            roofStyle: 'flat_garden',    // 'flat_garden', 'pyramid_4waters', 'dome'
            facadeColor: '#4f46e5',
            windowWidth: 0.8,
            windowHeight: 1.0,
            doorWidth: 1.6,
            doorHeight: 2.2
        };

        this.currentSolidParams = { a: 6.0, b: 5.0, c: 8.0 };
    }

    setActive(active) {
        this.active = active;
        this.buildingGroup.visible = active;
        if (active) {
            this.buildBuilding(this.currentSolidParams);
        } else {
            this.clear();
        }
    }

    clear() {
        while (this.buildingGroup.children.length > 0) {
            const child = this.buildingGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
            this.buildingGroup.remove(child);
        }
    }

    setFloors(floors) {
        this.params.floors = Math.max(1, Math.min(10, floors));
        if (this.active) this.buildBuilding(this.currentSolidParams);
    }

    setWindowsPerFloor(num) {
        this.params.windowsPerFloor = Math.max(1, Math.min(6, num));
        if (this.active) this.buildBuilding(this.currentSolidParams);
    }

    setWindowStyle(style) {
        this.params.windowStyle = style;
        if (this.active) this.buildBuilding(this.currentSolidParams);
    }

    setDoorStyle(style) {
        this.params.doorStyle = style;
        if (this.active) this.buildBuilding(this.currentSolidParams);
    }

    setRoofStyle(style) {
        this.params.roofStyle = style;
        if (this.active) this.buildBuilding(this.currentSolidParams);
    }

    buildBuilding(solidParams) {
        this.clear();
        if (!this.active) return;

        this.currentSolidParams = { ...solidParams };
        const a = solidParams.a || 6.0; // Frente
        const b = solidParams.b || 5.0; // Lateral
        const H = solidParams.c || 8.0; // Altura total

        const floors = this.params.floors;
        const floorHeight = H / floors;
        const winW = Math.min(a / (this.params.windowsPerFloor + 1), this.params.windowWidth);
        const winH = Math.min(floorHeight * 0.65, this.params.windowHeight);

        // Estilos de Vidro
        let glassColor = 0x38bdf8;
        let glassRoughness = 0.1;
        let glassMetalness = 0.9;
        let frameColor = 0x0f172a;

        if (this.params.windowStyle === 'white_grid') {
            glassColor = 0x67e8f9;
            frameColor = 0xffffff;
        } else if (this.params.windowStyle === 'black_panoramic') {
            glassColor = 0x0284c7;
            frameColor = 0x000000;
        }

        const glassMat = new THREE.MeshStandardMaterial({
            color: glassColor,
            metalness: glassMetalness,
            roughness: glassRoughness,
            transparent: true,
            opacity: 0.88
        });

        const frameMat = new THREE.MeshStandardMaterial({
            color: frameColor,
            roughness: 0.5,
            metalness: 0.5
        });

        const dividerMat = new THREE.LineBasicMaterial({
            color: 0x00f2fe,
            transparent: true,
            opacity: 0.5
        });

        let totalWindowsCount = 0;

        // 1. Frisos e Lajes entre andares
        for (let f = 1; f < floors; f++) {
            const y = f * floorHeight;
            const floorLineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(a + 0.06, 0.08, b + 0.06));
            const floorLine = new THREE.LineSegments(floorLineGeo, dividerMat);
            floorLine.position.set(0, y, 0);
            this.buildingGroup.add(floorLine);
        }

        // 2. Janelas da Fachada Frontal (Z = +b/2)
        const frontZ = b / 2 + 0.02;
        const numWin = this.params.windowsPerFloor;
        const spacingX = a / (numWin + 1);

        for (let f = 0; f < floors; f++) {
            const centerY = (f + 0.5) * floorHeight;

            for (let w = 1; w <= numWin; w++) {
                const centerX = -a / 2 + w * spacingX;

                // Não coloca janela onde fica a porta no térreo
                if (f === 0 && Math.abs(centerX) < this.params.doorWidth / 2 + 0.3) {
                    continue;
                }

                // Vidro
                const winGeo = new THREE.PlaneGeometry(winW, winH);
                const winMesh = new THREE.Mesh(winGeo, glassMat);
                winMesh.position.set(centerX, centerY, frontZ);
                this.buildingGroup.add(winMesh);

                // Moldura
                const frameLine = new THREE.LineSegments(new THREE.EdgesGeometry(winGeo), frameMat);
                frameLine.position.set(centerX, centerY, frontZ + 0.005);
                this.buildingGroup.add(frameLine);

                // Grade interna (se estilo for white_grid)
                if (this.params.windowStyle === 'white_grid') {
                    const gridGeo = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(centerX, centerY - winH / 2, frontZ + 0.006),
                        new THREE.Vector3(centerX, centerY + winH / 2, frontZ + 0.006),
                        new THREE.Vector3(centerX - winW / 2, centerY, frontZ + 0.006),
                        new THREE.Vector3(centerX + winW / 2, centerY, frontZ + 0.006)
                    ]);
                    this.buildingGroup.add(new THREE.LineSegments(gridGeo, frameMat));
                }

                totalWindowsCount++;
            }
        }

        // 3. Janelas da Fachada Traseira (Z = -b/2)
        const backZ = -b / 2 - 0.02;
        for (let f = 0; f < floors; f++) {
            const centerY = (f + 0.5) * floorHeight;
            for (let w = 1; w <= numWin; w++) {
                const centerX = -a / 2 + w * spacingX;
                const winGeo = new THREE.PlaneGeometry(winW, winH);
                const winMesh = new THREE.Mesh(winGeo, glassMat);
                winMesh.position.set(centerX, centerY, backZ);
                winMesh.rotation.y = Math.PI;
                this.buildingGroup.add(winMesh);

                const frameLine = new THREE.LineSegments(new THREE.EdgesGeometry(winGeo), frameMat);
                frameLine.position.set(centerX, centerY, backZ - 0.005);
                frameLine.rotation.y = Math.PI;
                this.buildingGroup.add(frameLine);

                totalWindowsCount++;
            }
        }

        // 4. Porta de Entrada (Estilos: Vidro Duplo, Madeira Maciça, Portão Garagem)
        const doorW = this.params.doorStyle === 'garage_gate' ? Math.min(a * 0.6, 3.2) : this.params.doorWidth;
        const doorH = Math.min(floorHeight * 0.85, this.params.doorHeight);

        let doorColor = 0x0ea5e9;
        let doorRough = 0.2;
        let doorMetal = 0.8;
        if (this.params.doorStyle === 'wood_classic') {
            doorColor = 0xb45309; // Madeira
            doorRough = 0.7;
            doorMetal = 0.1;
        } else if (this.params.doorStyle === 'garage_gate') {
            doorColor = 0x475569; // Aço cinza
            doorRough = 0.4;
            doorMetal = 0.85;
        }

        const doorMat = new THREE.MeshStandardMaterial({
            color: doorColor,
            roughness: doorRough,
            metalness: doorMetal
        });

        const doorGeo = new THREE.PlaneGeometry(doorW, doorH);
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        doorMesh.position.set(0, doorH / 2, frontZ);
        this.buildingGroup.add(doorMesh);

        const doorFrame = new THREE.LineSegments(new THREE.EdgesGeometry(doorGeo), frameMat);
        doorFrame.position.set(0, doorH / 2, frontZ + 0.008);
        this.buildingGroup.add(doorFrame);

        // 5. Telhado / Cobertura (Estilos: Platibanda Reta, Telhado Colonial 4 Águas, Cúpula)
        if (this.params.roofStyle === 'pyramid_4waters') {
            const roofH = 1.8;
            const roofGeo = new THREE.ConeGeometry(Math.sqrt(a * a + b * b) / 2, roofH, 4);
            roofGeo.rotateY(Math.PI / 4);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 }); // Telha cerâmica
            const roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.position.set(0, H + roofH / 2, 0);
            this.buildingGroup.add(roofMesh);
        } else if (this.params.roofStyle === 'dome') {
            const domeR = Math.min(a, b) / 2.2;
            const domeGeo = new THREE.SphereGeometry(domeR, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const domeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, metalness: 0.9 });
            const domeMesh = new THREE.Mesh(domeGeo, domeMat);
            domeMesh.position.set(0, H, 0);
            this.buildingGroup.add(domeMesh);
        } else {
            // Platibanda Reta com Jardim Suspenso
            const roofBorderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(a + 0.1, 0.4, b + 0.1));
            const roofBorder = new THREE.LineSegments(roofBorderGeo, new THREE.LineBasicMaterial({ color: 0x10b981 }));
            roofBorder.position.set(0, H + 0.2, 0);
            this.buildingGroup.add(roofBorder);
        }

        this.buildingGroup.visible = true;

        // Cálculos Métricos Oficiais
        const singleWinArea = winW * winH;
        const totalGlassArea = totalWindowsCount * singleWinArea;
        const doorArea = doorW * doorH;
        const grossLateralArea = 2 * (a * H) + 2 * (b * H);
        const netMasonryArea = Math.max(0, grossLateralArea - totalGlassArea - doorArea);
        const footprintArea = a * b;
        const buildingVolume = a * b * H;

        this.lastReport = {
            floors,
            totalWindowsCount,
            singleWindowArea: singleWinArea.toFixed(2),
            totalGlassArea: totalGlassArea.toFixed(2),
            doorArea: doorArea.toFixed(2),
            grossLateralArea: grossLateralArea.toFixed(2),
            netMasonryArea: netMasonryArea.toFixed(2),
            footprintArea: footprintArea.toFixed(2),
            buildingVolume: buildingVolume.toFixed(2),
            volumeLiters: (buildingVolume * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
            equivalenceNote: '1 m³ = 1.000 Litros'
        };

        return this.lastReport;
    }

    getReport() {
        return this.lastReport || this.buildBuilding(this.currentSolidParams);
    }
}

window.BuildingBuilder = BuildingBuilder;
