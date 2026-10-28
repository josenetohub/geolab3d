// =============================================================================
// GEO LAB 3D - ESTÚDIO DE ARQUITETURA FLUTUANTE (PRÉDIO 3D PRO)
// Customização Completa: Cores de Fachada, Deformação de Vértices e Reação Matemática
// =============================================================================

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
        this.lastReport = null;
        this.lastSpeechVolume = null;
        this.speechDebounceTimer = null;

        this.vertexDeformer = null;
        this.engineer = null;
        this.onReportChanged = null;

        this.initFloatingPanelDOM();
    }

    initFloatingPanelDOM() {
        let panel = document.getElementById('floatingBuildingStudioPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'floatingBuildingStudioPanel';
            panel.className = 'floating-building-studio-panel hidden';
            panel.innerHTML = `
                <div class="fbld-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.15rem;">🏢</span>
                        <div>
                            <div class="fbld-title">Estúdio de Arquitetura 3D</div>
                            <div class="fbld-subtitle">Personalize fachadas, alvenaria e deforme no 3D</div>
                        </div>
                    </div>
                    <button class="fbld-btn-close" id="btnCloseFloatingBld" title="Fechar painel">✕</button>
                </div>

                <div class="fbld-body">
                    <!-- 1. SELETOR DE CORES DA FACHADA (COLOR PICKER) -->
                    <div class="fbld-section">
                        <span class="fbld-label">🎨 Cor da Fachada & Alvenaria:</span>
                        <div class="fbld-color-palette" id="fbldColorPalette">
                            <span class="bld-color-chip active" data-color="#4f46e5" style="background:#4f46e5;" title="Índigo Moderno"></span>
                            <span class="bld-color-chip" data-color="#334155" style="background:#334155;" title="Grafite Industrial"></span>
                            <span class="bld-color-chip" data-color="#64748b" style="background:#64748b;" title="Concreto Aparente"></span>
                            <span class="bld-color-chip" data-color="#b45309" style="background:#b45309;" title="Tijolo Terracota"></span>
                            <span class="bld-color-chip" data-color="#f8fafc" style="background:#f8fafc;" title="Branco Nórdico"></span>
                            <label class="bld-color-custom-wrapper" title="Escolher cor personalizada">
                                <input type="color" id="fbldCustomColorInput" value="#4f46e5">
                                <span class="custom-color-icon">🌈</span>
                            </label>
                        </div>
                    </div>

                    <!-- 2. FERRAMENTA DE DEFORMAR VÉRTICES (PONTOS AMARELOS) -->
                    <div class="fbld-section">
                        <button class="btn-action-secondary fbld-deform-btn active" id="btnFbldToggleDeform">
                            ✋ Deformar Vértices do Prédio (Ativo)
                        </button>
                        <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:4px;">
                            Puxe as esferas amarelas no 3D para alargar as paredes ou alterar o gabarito de altura!
                        </div>
                    </div>

                    <!-- 3. SLIDERS DE ANDARES E JANELAS -->
                    <div class="fbld-section">
                        <div class="slider-unit">
                            <div class="slider-label-row">
                                <span>Número de Pavimentos</span>
                                <span class="slider-badge-val" id="fbldFloorsVal">4</span>
                            </div>
                            <input type="range" id="fbldSliderFloors" min="1" max="8" step="1" value="4">
                        </div>

                        <div class="slider-unit" style="margin-top:6px;">
                            <div class="slider-label-row">
                                <span>Janelas por Pavimento</span>
                                <span class="slider-badge-val" id="fbldWindowsVal">3</span>
                            </div>
                            <input type="range" id="fbldSliderWindows" min="1" max="5" step="1" value="3">
                        </div>
                    </div>

                    <!-- 4. ESTILOS DE ESQUADRIAS E COBERTURAS -->
                    <div class="fbld-section">
                        <span class="fbld-label">Tipo de Janela:</span>
                        <div class="view-modes-group" id="fbldGroupWin" style="margin-bottom:8px;">
                            <button class="view-btn active" data-win="blue_mirror">Espelhada</button>
                            <button class="view-btn" data-win="white_grid">Gradeada</button>
                            <button class="view-btn" data-win="black_panoramic">Panorâmica</button>
                        </div>

                        <span class="fbld-label">Porta de Entrada:</span>
                        <div class="view-modes-group" id="fbldGroupDoor" style="margin-bottom:8px;">
                            <button class="view-btn active" data-door="glass_double">Dupla Vidro</button>
                            <button class="view-btn" data-door="wood_classic">Madeira</button>
                            <button class="view-btn" data-door="garage_gate">Portão</button>
                        </div>

                        <span class="fbld-label">Cobertura / Telhado:</span>
                        <div class="view-modes-group" id="fbldGroupRoof">
                            <button class="view-btn active" data-roof="flat_garden">Platibanda</button>
                            <button class="view-btn" data-roof="pyramid_4waters">4 Águas</button>
                            <button class="view-btn" data-roof="dome">Cúpula</button>
                        </div>
                    </div>

                    <!-- 5. RELATÓRIO MÉTRICO EM TEMPO REAL -->
                    <div class="fbld-metrics-card">
                        <div class="fbld-metric-row">
                            <span>Área de Vidro:</span>
                            <b id="fbldMetricGlass" style="color:var(--accent-cyan);">18.00 m²</b>
                        </div>
                        <div class="fbld-metric-row">
                            <span>Alvenaria Líquida (Tinta):</span>
                            <b id="fbldMetricMasonry" style="color:var(--accent-amber);">154.50 m²</b>
                        </div>
                        <div class="fbld-metric-row">
                            <span>Volume de Ar:</span>
                            <b id="fbldMetricVolume" style="color:#fff;">240.00 m³</b>
                        </div>
                        <div class="fbld-metric-row" style="font-size:0.75rem; color:var(--text-secondary);">
                            <span>Capacidade Térmica:</span>
                            <span id="fbldMetricLiters">240.000 Litros</span>
                        </div>
                    </div>
                </div>
            `;

            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.appendChild(panel);
            }
        }

        this.setupFloatingPanelEvents();
    }

    setupFloatingPanelEvents() {
        const panel = document.getElementById('floatingBuildingStudioPanel');
        if (!panel) return;

        // Fechar painel
        const btnClose = panel.querySelector('#btnCloseFloatingBld');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                panel.classList.add('hidden');
            });
        }

        // Paleta de cores
        panel.querySelectorAll('.bld-color-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                panel.querySelectorAll('.bld-color-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.setFacadeColor(chip.dataset.color);
                if (window.sounds) window.sounds.playClick();
            });
        });

        const customColor = panel.querySelector('#fbldCustomColorInput');
        if (customColor) {
            customColor.addEventListener('input', (e) => {
                panel.querySelectorAll('.bld-color-chip').forEach(c => c.classList.remove('active'));
                this.setFacadeColor(e.target.value);
            });
        }

        // Deformar vértices toggle
        const btnDeform = panel.querySelector('#btnFbldToggleDeform');
        if (btnDeform) {
            btnDeform.addEventListener('click', () => {
                if (this.vertexDeformer) {
                    const isActive = this.vertexDeformer.toggle();
                    btnDeform.classList.toggle('active', isActive);
                    btnDeform.textContent = isActive ? '✋ Deformar Vértices do Prédio (Ativo)' : '✋ Deformar Vértices (Desativado)';
                    if (window.sounds) window.sounds.playClick();
                }
            });
        }

        // Sliders
        const sliderF = panel.querySelector('#fbldSliderFloors');
        if (sliderF) {
            sliderF.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                const badge = panel.querySelector('#fbldFloorsVal');
                if (badge) badge.textContent = val;
                this.setFloors(val);
            });
        }

        const sliderW = panel.querySelector('#fbldSliderWindows');
        if (sliderW) {
            sliderW.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                const badge = panel.querySelector('#fbldWindowsVal');
                if (badge) badge.textContent = val;
                this.setWindowsPerFloor(val);
            });
        }

        // Botões de estilo
        panel.querySelectorAll('#fbldGroupWin button').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('#fbldGroupWin button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setWindowStyle(btn.dataset.win);
            });
        });

        panel.querySelectorAll('#fbldGroupDoor button').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('#fbldGroupDoor button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setDoorStyle(btn.dataset.door);
            });
        });

        panel.querySelectorAll('#fbldGroupRoof button').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('#fbldGroupRoof button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setRoofStyle(btn.dataset.roof);
            });
        });
    }

    setExternalHelpers(vertexDeformer, engineerGuide, onReportChanged) {
        this.vertexDeformer = vertexDeformer;
        this.engineer = engineerGuide;
        this.onReportChanged = onReportChanged;
    }

    setActive(active) {
        this.active = active;
        this.buildingGroup.visible = active;

        const panel = document.getElementById('floatingBuildingStudioPanel');
        if (panel) {
            panel.classList.toggle('hidden', !active);
        }

        if (active) {
            if (this.sm.solidMesh && this.sm.solidMesh.material) {
                this.sm.solidMesh.material.color.set(this.params.facadeColor);
            }
            if (this.vertexDeformer) {
                this.vertexDeformer.setActive(true);
            }
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

    setFacadeColor(hex) {
        this.params.facadeColor = hex;
        if (this.sm.solidMesh && this.sm.solidMesh.material) {
            this.sm.solidMesh.material.color.set(hex);
            this.sm.solidMesh.material.needsUpdate = true;
        }
        if (this.active) {
            const rep = this.buildBuilding(this.currentSolidParams);
            this.updateFloatingMetrics(rep);
        }
    }

    setFloors(floors) {
        this.params.floors = Math.max(1, Math.min(10, floors));
        if (this.active) {
            const rep = this.buildBuilding(this.currentSolidParams);
            this.updateFloatingMetrics(rep);
        }
    }

    setWindowsPerFloor(num) {
        this.params.windowsPerFloor = Math.max(1, Math.min(6, num));
        if (this.active) {
            const rep = this.buildBuilding(this.currentSolidParams);
            this.updateFloatingMetrics(rep);
        }
    }

    setWindowStyle(style) {
        this.params.windowStyle = style;
        if (this.active) {
            const rep = this.buildBuilding(this.currentSolidParams);
            this.updateFloatingMetrics(rep);
        }
    }

    setDoorStyle(style) {
        this.params.doorStyle = style;
        if (this.active) {
            const rep = this.buildBuilding(this.currentSolidParams);
            this.updateFloatingMetrics(rep);
        }
    }

    setRoofStyle(style) {
        this.params.roofStyle = style;
        if (this.active) {
            const rep = this.buildBuilding(this.currentSolidParams);
            this.updateFloatingMetrics(rep);
        }
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

                if (f === 0 && Math.abs(centerX) < this.params.doorWidth / 2 + 0.3) {
                    continue;
                }

                const winGeo = new THREE.PlaneGeometry(winW, winH);
                const winMesh = new THREE.Mesh(winGeo, glassMat);
                winMesh.position.set(centerX, centerY, frontZ);
                this.buildingGroup.add(winMesh);

                const frameLine = new THREE.LineSegments(new THREE.EdgesGeometry(winGeo), frameMat);
                frameLine.position.set(centerX, centerY, frontZ + 0.005);
                this.buildingGroup.add(frameLine);

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

        // 4. Porta de Entrada
        const doorW = this.params.doorStyle === 'garage_gate' ? Math.min(a * 0.6, 3.2) : this.params.doorWidth;
        const doorH = Math.min(floorHeight * 0.85, this.params.doorHeight);

        let doorColor = 0x0ea5e9;
        if (this.params.doorStyle === 'wood_classic') doorColor = 0xb45309;
        else if (this.params.doorStyle === 'garage_gate') doorColor = 0x334155;

        const doorMat = new THREE.MeshStandardMaterial({
            color: doorColor,
            roughness: 0.3,
            metalness: 0.6
        });

        const doorGeo = new THREE.PlaneGeometry(doorW, doorH);
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        doorMesh.position.set(0, doorH / 2, frontZ + 0.01);
        this.buildingGroup.add(doorMesh);

        // 5. Cobertura / Telhado
        if (this.params.roofStyle === 'pyramid_4waters') {
            const roofH = 1.8;
            const pyrGeo = new THREE.ConeGeometry(Math.max(a, b) * 0.68, roofH, 4);
            const pyrMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
            const pyrMesh = new THREE.Mesh(pyrGeo, pyrMat);
            pyrMesh.position.set(0, H + roofH / 2, 0);
            pyrMesh.rotation.y = Math.PI / 4;
            this.buildingGroup.add(pyrMesh);
        } else if (this.params.roofStyle === 'dome') {
            const domeR = Math.min(a, b) * 0.42;
            const domeGeo = new THREE.SphereGeometry(domeR, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const domeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.9 });
            const domeMesh = new THREE.Mesh(domeGeo, domeMat);
            domeMesh.position.set(0, H, 0);
            this.buildingGroup.add(domeMesh);
        } else {
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

        this.updateFloatingMetrics(this.lastReport);

        // Dispara fala do Engenheiro se houve alteração significativa
        if (this.engineer && this.lastSpeechVolume !== null && Math.abs(buildingVolume - this.lastSpeechVolume) > 4.0) {
            clearTimeout(this.speechDebounceTimer);
            this.speechDebounceTimer = setTimeout(() => {
                this.engineer.reactToBuildingDeformation(buildingVolume, (buildingVolume * 1000).toLocaleString('pt-BR'));
                this.lastSpeechVolume = buildingVolume;
            }, 800);
        } else if (this.lastSpeechVolume === null) {
            this.lastSpeechVolume = buildingVolume;
        }

        if (typeof this.onReportChanged === 'function') {
            this.onReportChanged(this.lastReport);
        }

        return this.lastReport;
    }

    updateFloatingMetrics(report) {
        if (!report) return;
        const p = document.getElementById('floatingBuildingStudioPanel');
        if (!p) return;

        const mGlass = p.querySelector('#fbldMetricGlass');
        if (mGlass) mGlass.textContent = `${report.totalGlassArea} m²`;

        const mMasonry = p.querySelector('#fbldMetricMasonry');
        if (mMasonry) mMasonry.textContent = `${report.netMasonryArea} m²`;

        const mVol = p.querySelector('#fbldMetricVolume');
        if (mVol) mVol.textContent = `${report.buildingVolume} m³`;

        const mLiters = p.querySelector('#fbldMetricLiters');
        if (mLiters) mLiters.textContent = `${report.volumeLiters} Litros`;
    }

    getReport() {
        return this.lastReport || this.buildBuilding(this.currentSolidParams);
    }
}

window.BuildingBuilder = BuildingBuilder;
