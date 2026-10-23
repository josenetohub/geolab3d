// Estúdio de Arquitetura & Construtor de Edifícios 3D (Building Studio)
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
            windowWidth: 0.8,
            windowHeight: 1.0,
            doorWidth: 1.6,
            doorHeight: 2.2,
            hasRoofGarden: true
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

    buildBuilding(solidParams) {
        this.clear();
        if (!this.active) return;

        this.currentSolidParams = { ...solidParams };
        const a = solidParams.a || 6.0; // Largura frontal
        const b = solidParams.b || 5.0; // Profundidade lateral
        const H = solidParams.c || 8.0; // Altura total do prédio

        const floors = this.params.floors;
        const floorHeight = H / floors;
        const winW = Math.min(a / (this.params.windowsPerFloor + 1), this.params.windowWidth);
        const winH = Math.min(floorHeight * 0.6, this.params.windowHeight);

        // Materiais PBR Arquitetônicos
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.85
        });

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.5,
            roughness: 0.5
        });

        const doorMat = new THREE.MeshStandardMaterial({
            color: 0xd97706,
            metalness: 0.2,
            roughness: 0.6
        });

        const dividerMat = new THREE.LineBasicMaterial({
            color: 0x00f2fe,
            transparent: true,
            opacity: 0.6
        });

        let totalWindowsCount = 0;

        // 1. Linhas de divisão de andares (frisos entre lajes)
        for (let f = 1; f < floors; f++) {
            const y = f * floorHeight;
            const floorLineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(a + 0.04, 0.08, b + 0.04));
            const floorLine = new THREE.LineSegments(floorLineGeo, dividerMat);
            floorLine.position.set(0, y, 0);
            this.buildingGroup.add(floorLine);
        }

        // 2. Janelas na Fachada Frontal (Face Z = +b/2)
        const frontZ = b / 2 + 0.02;
        const numWinFront = this.params.windowsPerFloor;
        const spacingX = a / (numWinFront + 1);

        for (let f = 0; f < floors; f++) {
            const centerY = (f + 0.5) * floorHeight;

            for (let w = 1; w <= numWinFront; w++) {
                const centerX = -a / 2 + w * spacingX;

                // Não coloca janela na posição central do térreo (onde fica a porta de entrada)
                if (f === 0 && Math.abs(centerX) < this.params.doorWidth / 2 + 0.2) {
                    continue;
                }

                // Vidro da janela
                const winGeo = new THREE.PlaneGeometry(winW, winH);
                const winMesh = new THREE.Mesh(winGeo, glassMat);
                winMesh.position.set(centerX, centerY, frontZ);
                this.buildingGroup.add(winMesh);

                // Moldura externa da janela
                const frameEdges = new THREE.EdgesGeometry(winGeo);
                const frameLine = new THREE.LineSegments(frameEdges, frameMat);
                frameLine.position.set(centerX, centerY, frontZ + 0.005);
                this.buildingGroup.add(frameLine);

                totalWindowsCount++;
            }
        }

        // 3. Janelas na Fachada Traseira (Face Z = -b/2)
        const backZ = -b / 2 - 0.02;
        for (let f = 0; f < floors; f++) {
            const centerY = (f + 0.5) * floorHeight;
            for (let w = 1; w <= numWinFront; w++) {
                const centerX = -a / 2 + w * spacingX;
                const winGeo = new THREE.PlaneGeometry(winW, winH);
                const winMesh = new THREE.Mesh(winGeo, glassMat);
                winMesh.position.set(centerX, centerY, backZ);
                winMesh.rotation.y = Math.PI;
                this.buildingGroup.add(winMesh);
                totalWindowsCount++;
            }
        }

        // 4. Porta de Entrada Principal no Térreo (Fachada Frontal)
        const doorW = this.params.doorWidth;
        const doorH = Math.min(floorHeight * 0.85, this.params.doorHeight);
        const doorGeo = new THREE.PlaneGeometry(doorW, doorH);
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        doorMesh.position.set(0, doorH / 2, frontZ);
        this.buildingGroup.add(doorMesh);

        // Moldura da porta
        const doorFrame = new THREE.LineSegments(new THREE.EdgesGeometry(doorGeo), frameMat);
        doorFrame.position.set(0, doorH / 2, frontZ + 0.008);
        this.buildingGroup.add(doorFrame);

        // 5. Cobertura / Platibanda Superior
        const roofBorderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(a + 0.1, 0.4, b + 0.1));
        const roofBorder = new THREE.LineSegments(roofBorderGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
        roofBorder.position.set(0, H + 0.2, 0);
        this.buildingGroup.add(roofBorder);

        this.buildingGroup.visible = true;

        // Cálculos Métricos Oficiais da Missão Arquitetônica
        const singleWindowArea = winW * winH;
        const totalGlassArea = totalWindowsCount * singleWindowArea;
        const doorArea = doorW * doorH;
        const grossLateralArea = 2 * (a * H) + 2 * (b * H);
        const netMasonryArea = Math.max(0, grossLateralArea - totalGlassArea - doorArea);
        const footprintArea = a * b;
        const buildingVolume = a * b * H;

        return {
            floors,
            totalWindowsCount,
            singleWindowArea: singleWindowArea.toFixed(2),
            totalGlassArea: totalGlassArea.toFixed(2),
            doorArea: doorArea.toFixed(2),
            grossLateralArea: grossLateralArea.toFixed(2),
            netMasonryArea: netMasonryArea.toFixed(2),
            footprintArea: footprintArea.toFixed(2),
            buildingVolume: buildingVolume.toFixed(2),
            volumeLiters: (buildingVolume * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
            equivalenceNote: '1 m³ = 1.000 Litros'
        };
    }

    getReport() {
        return this.buildBuilding(this.currentSolidParams);
    }
}

window.BuildingBuilder = BuildingBuilder;
