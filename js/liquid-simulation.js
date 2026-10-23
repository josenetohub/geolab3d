// Simulação Hidráulica 3D & Abastecimento de Líquidos
class LiquidSimulation {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.currentSolidId = 'cylinder';
        this.currentParams = {};
        this.currentHeight = 0; // altura do líquido acumulado (cm)
        this.maxHeight = 5;

        this.inflowRate = 0; // cm/s
        this.outflowRate = 0; // cm/s
        this.isFilling = false;
        this.isDraining = false;
        this.liquidMesh = null;
        this.surfaceMesh = null;

        this.liquidColor = 0x38bdf8; // Azul água padrão
        this.liquidOpacity = 0.85;

        this.lastTime = performance.now();
        this.update = this.update.bind(this);
        requestAnimationFrame(this.update);
    }

    setSolid(solidId, params) {
        this.currentSolidId = solidId;
        this.currentParams = { ...params };
        const solidDef = SOLIDS_DATA[solidId];
        this.maxHeight = solidDef ? solidDef.height(params) : 5;
        this.currentHeight = Math.min(this.currentHeight, this.maxHeight);
        this.rebuildLiquidMesh();
    }

    setLiquidColor(hexColor) {
        this.liquidColor = hexColor;
        if (this.liquidMesh) {
            this.liquidMesh.material.color.setHex(hexColor);
        }
        if (this.surfaceMesh) {
            this.surfaceMesh.material.color.setHex(hexColor);
        }
    }

    setHeight(h) {
        this.currentHeight = Math.max(0, Math.min(this.maxHeight, h));
        this.rebuildLiquidMesh();
        this.notifyUI();
    }

    startFilling(rate = 1.2) {
        this.inflowRate = rate;
        this.isFilling = true;
        this.sm.setWaterStream(true);
        if (window.sounds) window.sounds.startWater();
    }

    stopFilling() {
        this.inflowRate = 0;
        this.isFilling = false;
        this.sm.setWaterStream(false);
        if (window.sounds) window.sounds.stopWater();
    }

    startDraining(rate = 1.5) {
        this.outflowRate = rate;
        this.isDraining = true;
    }

    stopDraining() {
        this.outflowRate = 0;
        this.isDraining = false;
    }

    empty() {
        this.setHeight(0);
        this.stopFilling();
        this.stopDraining();
    }

    fillToMax() {
        this.setHeight(this.maxHeight);
        this.stopFilling();
    }

    rebuildLiquidMesh() {
        while (this.sm.liquidGroup.children.length > 0) {
            const obj = this.sm.liquidGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.sm.liquidGroup.remove(obj);
        }

        if (this.currentHeight <= 0.02) return;

        const h = this.currentHeight;
        const p = this.currentParams;
        const id = this.currentSolidId;
        let geo;

        const mat = new THREE.MeshStandardMaterial({
            color: this.liquidColor,
            transparent: true,
            opacity: this.liquidOpacity,
            roughness: 0.1,
            metalness: 0.15,
            side: THREE.DoubleSide
        });

        switch (id) {
            case 'cube': {
                const a = p.a * 0.992; // leve recuo para não ter z-fighting
                geo = new THREE.BoxGeometry(a, h, a);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            case 'rectangular_prism': {
                const a = p.a * 0.992;
                const b = p.b * 0.992;
                geo = new THREE.BoxGeometry(a, h, b);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            case 'cylinder': {
                const r = p.r * 0.992;
                geo = new THREE.CylinderGeometry(r, r, h, 36);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            case 'cone': {
                // Tronco de cone de líquido: raio no fundo = r, raio na altura h = r * (H - h)/H
                const H = p.h;
                const rBottom = p.r * 0.992;
                const rTop = Math.max(0.01, rBottom * ((H - h) / H));
                geo = new THREE.CylinderGeometry(rTop, rBottom, h, 36);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            case 'sphere': {
                // Calota esférica usando Cylinder aproximado ou Sphere fatiada
                const R = p.r * 0.992;
                const rTop = Math.max(0.05, Math.sqrt(Math.max(0, h * (2 * R - h))));
                geo = new THREE.CylinderGeometry(rTop, Math.min(R, rTop * 0.5), h, 36);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            case 'square_pyramid': {
                const H = p.h;
                const L = p.l * 0.992;
                const lTop = Math.max(0.01, L * ((H - h) / H));
                // Pirâmide truncada: usando ConeGeometry de 4 lados
                geo = new THREE.CylinderGeometry(lTop * Math.SQRT1_2, L * Math.SQRT1_2, h, 4);
                geo.rotateY(Math.PI / 4);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            case 'triangular_prism': {
                const L = p.l * 0.992;
                const r = L / Math.sqrt(3);
                geo = new THREE.CylinderGeometry(r, r, h, 3);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            case 'hexagonal_prism': {
                const L = p.l * 0.992;
                geo = new THREE.CylinderGeometry(L, L, h, 6);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
                break;
            }

            default: {
                geo = new THREE.CylinderGeometry(2, 2, h, 24);
                this.liquidMesh = new THREE.Mesh(geo, mat);
                this.liquidMesh.position.set(0, h / 2, 0);
            }
        }

        this.liquidMesh.name = 'liquidMesh';
        this.sm.liquidGroup.add(this.liquidMesh);
    }

    update(time) {
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;

        let changed = false;

        if (this.isFilling && this.inflowRate > 0) {
            this.currentHeight += this.inflowRate * delta;
            if (this.currentHeight >= this.maxHeight) {
                this.currentHeight = this.maxHeight;
                this.stopFilling();
                if (window.sounds) window.sounds.playOverflowWarning();
                if (window.onOverflow) window.onOverflow();
            }
            changed = true;
        }

        if (this.isDraining && this.outflowRate > 0) {
            this.currentHeight -= this.outflowRate * delta;
            if (this.currentHeight <= 0) {
                this.currentHeight = 0;
                this.stopDraining();
            }
            changed = true;
        }

        if (changed) {
            this.rebuildLiquidMesh();
            this.notifyUI();
        }

        // Animação leve da torneira
        if (this.isFilling) {
            this.sm.setWaterStream(true);
        }

        requestAnimationFrame(this.update);
    }

    notifyUI() {
        if (typeof window.onLiquidStateChange === 'function') {
            const solidDef = SOLIDS_DATA[this.currentSolidId];
            if (!solidDef) return;
            const currentVol = solidDef.liquidVolumeAtHeight(this.currentParams, this.currentHeight);
            const totalVol = solidDef.calculate(this.currentParams).volume;
            const percentage = totalVol > 0 ? (currentVol / totalVol) * 100 : 0;

            window.onLiquidStateChange({
                height: this.currentHeight,
                maxHeight: this.maxHeight,
                currentVolumeM3: currentVol,
                currentVolumeLiters: currentVol * 1000,
                totalVolumeM3: totalVol,
                totalVolumeLiters: totalVol * 1000,
                equivalenceNote: '1 m³ = 1.000 Litros (1 dm³ = 1 L)',
                percentage: Math.min(100, percentage),
                isFull: this.currentHeight >= this.maxHeight - 0.01
            });
        }
    }
}

window.LiquidSimulation = LiquidSimulation;
