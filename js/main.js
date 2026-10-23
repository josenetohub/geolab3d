// GeoLab 3D - Orquestrador Principal do Aplicativo & Estúdio BNCC
document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvas-container');

    // 1. Instanciação dos Subsistemas 3D e Lógica
    const sceneMgr = new SceneManager(canvasContainer);
    const dimensionsHelper = new DimensionsHelper(sceneMgr);
    window.dimensionsHelper = dimensionsHelper;

    const liquidSim = new LiquidSimulation(sceneMgr);
    const crossSection = new CrossSectionAnalyzer(sceneMgr, 'radarCanvas');
    const unfoldSys = new UnfoldingSystem(sceneMgr);
    const unfoldingCartela = new UnfoldingCartela(unfoldSys, sceneMgr);
    const gameMgr = new GameManager();

    // Novos Módulos Pedagógicos
    const vertexDeformer = new VertexDeformer(sceneMgr, (newParams) => {
        currentParams = { ...newParams };
        updateParamSliderValues(SOLIDS_DATA[currentSolidId]);
        updateMathCards(SOLIDS_DATA[currentSolidId]);
        dimensionsHelper.update(currentSolidId, currentParams);
        if (buildingStudio.active) buildingStudio.buildBuilding(currentParams);
        updateUnfoldingCartela();
    });

    const buildingStudio = new BuildingBuilder(sceneMgr);
    const galleryAlbum = new GalleryAlbum(sceneMgr);

    // Modo Carreira BNCC
    const careerMode = new CareerMode(
        sceneMgr,
        (solidId, params) => switchSolid(solidId, params),
        () => switchMode('building')
    );

    // Estúdio de Projetos para Aulas em Grupo
    const studio = new GameDesignStudio(sceneMgr, (solidId, params) => {
        switchSolid(solidId, params);
    });

    // 2. Estado da Aplicação
    let currentSolidId = 'cube';
    let currentParams = { ...SOLIDS_DATA.cube.defaultParams };
    let currentMode = 'career'; // Inicia no Modo Carreira didático

    // 3. Inicialização
    function init() {
        populateSolidSelect();
        setupEventListeners();
        setupMobileNavigation();
        setupWelcomeMenu();
        setupAuxiliaryDrawer();
        setupGalleryAndSnapshot();
        setupSettingsModal();
        setupStudioUI();
        setupCareerUI();

        switchSolid('cube');
        switchMode('career');
        updateGameStatsUI();
    }

    // Preenche o seletor de sólidos
    function populateSolidSelect() {
        const select = document.getElementById('solidSelect');
        if (!select) return;
        select.innerHTML = '';

        const categories = {};
        Object.values(SOLIDS_DATA).forEach(s => {
            if (!categories[s.category]) categories[s.category] = [];
            categories[s.category].push(s);
        });

        Object.keys(categories).forEach(cat => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = cat;
            categories[cat].forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        });

        select.addEventListener('change', (e) => {
            switchSolid(e.target.value);
            if (window.sounds) window.sounds.playClick();
        });
    }

    // Troca o sólido ativo
    function switchSolid(solidId, customParams = null) {
        currentSolidId = solidId;
        const solidDef = SOLIDS_DATA[solidId];
        currentParams = customParams ? { ...customParams } : { ...solidDef.defaultParams };

        // Atualiza Three.js
        SolidsBuilder.build(sceneMgr, solidId, currentParams);
        dimensionsHelper.buildDimensions(solidId, currentParams);
        vertexDeformer.setSolid(solidId, currentParams);
        liquidSim.setSolid(solidId, currentParams);
        crossSection.setSolid(solidId, currentParams);
        unfoldSys.setSolid(solidId, currentParams);

        if (buildingStudio.active) {
            buildingStudio.buildBuilding(currentParams);
        }

        // Atualiza UI
        const select = document.getElementById('solidSelect');
        if (select) select.value = solidId;

        const solidTitle = document.getElementById('solidTitle');
        if (solidTitle) solidTitle.textContent = solidDef.name;

        const categoryBadge = document.getElementById('solidCategoryBadge');
        if (categoryBadge) categoryBadge.textContent = solidDef.category;

        const gameAssetText = document.getElementById('gameAssetText');
        if (gameAssetText) gameAssetText.textContent = solidDef.realWorldApplication || 'Aplicações no Cotidiano';

        buildParamSliders(solidDef);
        updateMathCards(solidDef);
        updateElementsUI(solidDef);
        renderAuxiliaryDrawerContent();
        updateUnfoldingCartela();
    }

    // Constrói os sliders com medidas legíveis
    function buildParamSliders(solidDef) {
        const container = document.getElementById('paramSlidersContainer');
        if (!container) return;
        container.innerHTML = '';

        solidDef.paramDefs.forEach(p => {
            const row = document.createElement('div');
            row.className = 'slider-unit';

            const header = document.createElement('div');
            header.className = 'slider-label-row';
            header.innerHTML = `<span>${p.label}</span><span class="slider-badge-val" id="val-${p.key}">${currentParams[p.key]} ${p.unit}</span>`;

            const input = document.createElement('input');
            input.type = 'range';
            input.min = p.min;
            input.max = p.max;
            input.step = p.step;
            input.value = currentParams[p.key];

            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                currentParams[p.key] = val;
                const badge = document.getElementById(`val-${p.key}`);
                if (badge) badge.textContent = `${val} ${p.unit}`;

                SolidsBuilder.build(sceneMgr, currentSolidId, currentParams);
                dimensionsHelper.buildDimensions(currentSolidId, currentParams);
                vertexDeformer.setSolid(currentSolidId, currentParams);
                liquidSim.setSolid(currentSolidId, currentParams);
                crossSection.setSolid(currentSolidId, currentParams);
                unfoldSys.setSolid(currentSolidId, currentParams);

                if (buildingStudio.active) {
                    const bldReport = buildingStudio.buildBuilding(currentParams);
                    updateBuildingUI(bldReport);
                }

                updateMathCards(solidDef);
                renderAuxiliaryDrawerContent();
                updateUnfoldingCartela();
            });

            row.appendChild(header);
            row.appendChild(input);
            container.appendChild(row);
        });
    }

    function updateParamSliderValues(solidDef) {
        solidDef.paramDefs.forEach(p => {
            const input = document.querySelector(`#paramSlidersContainer input[value][step="${p.step}"]`);
            const badge = document.getElementById(`val-${p.key}`);
            if (badge) badge.textContent = `${currentParams[p.key]} ${p.unit}`;
        });
    }

    // Atualiza os cartões matemáticos (com formatação limpa e passo a passo)
    function updateMathCards(solidDef) {
        const calc = solidDef.calculate(currentParams);

        // Área Total (At)
        const totalAreaVal = document.getElementById('totalAreaVal');
        if (totalAreaVal) totalAreaVal.textContent = calc.totalArea.toFixed(2) + ' m²';
        const totalAreaFormula = document.getElementById('totalAreaFormula');
        if (totalAreaFormula) totalAreaFormula.innerHTML = calc.formulas.totalArea;
        const totalAreaSteps = document.getElementById('totalAreaSteps');
        if (totalAreaSteps) totalAreaSteps.innerHTML = calc.stepByStep.totalArea;

        // Volume (V)
        const volumeVal = document.getElementById('volumeVal');
        if (volumeVal) volumeVal.textContent = calc.volume.toFixed(2) + ' m³';
        const volumeFormula = document.getElementById('volumeFormula');
        if (volumeFormula) volumeFormula.innerHTML = calc.formulas.volume;
        const volumeSteps = document.getElementById('volumeSteps');
        if (volumeSteps) volumeSteps.innerHTML = calc.stepByStep.volume;

        // Área da Base (Ab)
        const baseAreaVal = document.getElementById('baseAreaVal');
        if (baseAreaVal) baseAreaVal.textContent = calc.baseArea.toFixed(2) + ' m²';
        const baseAreaFormula = document.getElementById('baseAreaFormula');
        if (baseAreaFormula) baseAreaFormula.innerHTML = calc.formulas.baseArea;

        // Área Lateral (Al)
        const lateralAreaVal = document.getElementById('lateralAreaVal');
        if (lateralAreaVal) lateralAreaVal.textContent = calc.lateralArea.toFixed(2) + ' m²';
        const lateralAreaFormula = document.getElementById('lateralAreaFormula');
        if (lateralAreaFormula) lateralAreaFormula.innerHTML = calc.formulas.lateralArea;

        // Medidas auxiliares
        const extraContainer = document.getElementById('extraMeasuresContainer');
        if (extraContainer) {
            extraContainer.innerHTML = '';
            calc.extraMeasures.forEach(m => {
                const item = document.createElement('div');
                item.className = 'math-card';
                item.innerHTML = `
                    <div class="math-card-header">
                        <span class="math-card-title">${m.label}</span>
                    </div>
                    <div class="math-card-value" style="font-size:1.1rem;">${m.value}</div>
                    <div class="math-card-formula">${m.formula}</div>
                `;
                extraContainer.appendChild(item);
            });
        }
    }

    // Atualiza a Relação de Euler
    function updateElementsUI(solidDef) {
        const elem = solidDef.elements;
        const vertCount = document.getElementById('vertCount');
        if (vertCount) vertCount.textContent = elem.verticesCount;
        const edgeCount = document.getElementById('edgeCount');
        if (edgeCount) edgeCount.textContent = elem.edgesCount;
        const faceCount = document.getElementById('faceCount');
        if (faceCount) faceCount.textContent = elem.facesCount;

        const eulerBox = document.getElementById('eulerResultBox');
        if (eulerBox && elem.euler.valid) {
            const V = elem.euler.v;
            const A = elem.euler.a;
            const F = elem.euler.f;
            const res = V - A + F;
            eulerBox.innerHTML = `
                <span style="color:var(--text-secondary);">Relação V - A + F:</span>
                <span style="font-weight:700; color:var(--accent-emerald);">${V} - ${A} + ${F} = ${res} ✓ Poliedro Regular</span>
            `;
        }
    }

    // Atualiza a Cartela de Planificação (Pedaços e Área Total)
    function updateUnfoldingCartela() {
        const container = document.getElementById('unfoldingCartelaContainer');
        if (!container) return;
        if (currentMode === 'unfold') {
            unfoldingCartela.renderCartelaUI(container, currentSolidId, currentParams, (pieceIdx) => {
                if (window.sounds) window.sounds.playClick();
            });
        }
    }

    // ==========================================================================
    // MENU INICIAL (WELCOME HUB COM CARDS DIDÁTICOS)
    // ==========================================================================
    function setupWelcomeMenu() {
        const menu = document.getElementById('mainWelcomeMenu');
        const btnOpen = document.getElementById('btnOpenMainMenu');
        const btnClose = document.getElementById('btnCloseWelcomeMenu');

        if (btnOpen && menu) {
            btnOpen.addEventListener('click', () => {
                menu.classList.remove('hidden');
                if (window.sounds) window.sounds.playClick();
            });
        }

        if (btnClose && menu) {
            btnClose.addEventListener('click', () => {
                menu.classList.add('hidden');
                if (window.sounds) window.sounds.playClick();
            });
        }

        document.querySelectorAll('.menu-action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                if (menu) menu.classList.add('hidden');
                if (window.sounds) window.sounds.playClick();

                switch (action) {
                    case 'career':
                        switchMode('career');
                        break;
                    case 'lab':
                        switchMode('lab');
                        break;
                    case 'building':
                        switchMode('building');
                        break;
                    case 'album':
                        openAlbumModal();
                        break;
                    case 'formulas':
                        openAuxDrawer('formulas');
                        break;
                    case 'settings':
                        openSettingsModal();
                        break;
                    default:
                        switchMode('lab');
                }
            });
        });
    }

    // ==========================================================================
    // PAINEL AUXILIAR RETRÁTIL (OFF-CANVAS DRAWER)
    // ==========================================================================
    let currentDrawerTab = 'formulas';

    function setupAuxiliaryDrawer() {
        const drawer = document.getElementById('auxiliaryDrawer');
        const btnOpen = document.getElementById('btnOpenAuxDrawer');
        const btnClose = document.getElementById('btnCloseAuxDrawer');
        const btnCareerAux = document.getElementById('btnCareerAuxGuide');

        const toggleDrawer = () => {
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
                renderAuxiliaryDrawerContent();
            }
            if (window.sounds) window.sounds.playClick();
        };

        if (btnOpen) btnOpen.addEventListener('click', toggleDrawer);
        if (btnClose) btnClose.addEventListener('click', () => drawer.classList.remove('open'));
        if (btnCareerAux) {
            btnCareerAux.addEventListener('click', () => {
                drawer.classList.add('open');
                switchDrawerTab('formulas');
            });
        }

        document.querySelectorAll('.drawer-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchDrawerTab(btn.dataset.dtab);
            });
        });
    }

    function openAuxDrawer(tabName = 'formulas') {
        const drawer = document.getElementById('auxiliaryDrawer');
        if (drawer) {
            drawer.classList.add('open');
            switchDrawerTab(tabName);
        }
    }

    function switchDrawerTab(tabName) {
        currentDrawerTab = tabName;
        document.querySelectorAll('.drawer-tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.dtab === tabName);
        });
        renderAuxiliaryDrawerContent();
    }

    function renderAuxiliaryDrawerContent() {
        const container = document.getElementById('auxDrawerBody');
        if (!container) return;
        container.innerHTML = '';

        const solidDef = SOLIDS_DATA[currentSolidId];
        const calc = solidDef ? solidDef.calculate(currentParams) : null;

        if (currentDrawerTab === 'formulas') {
            container.innerHTML = `
                <div style="font-size:1rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:6px;">
                    <span>📐</span> Fórmulas Oficiais: ${solidDef.name}
                </div>
                
                <div class="math-card">
                    <span class="math-card-title">Área da Base (Ab)</span>
                    <div class="math-card-formula" style="font-size:1.1rem;">${calc.formulas.baseArea}</div>
                    <div class="math-card-steps">Valor atual: ${calc.baseArea.toFixed(2)} m²</div>
                </div>

                <div class="math-card">
                    <span class="math-card-title">Área Lateral (Al)</span>
                    <div class="math-card-formula" style="font-size:1.1rem;">${calc.formulas.lateralArea}</div>
                    <div class="math-card-steps">Valor atual: ${calc.lateralArea.toFixed(2)} m²</div>
                </div>

                <div class="math-card">
                    <span class="math-card-title">Área Total (At)</span>
                    <div class="math-card-formula" style="font-size:1.1rem; color:var(--accent-amber);">${calc.formulas.totalArea}</div>
                    <div class="math-card-steps">${calc.stepByStep.totalArea}</div>
                </div>

                <div class="math-card">
                    <span class="math-card-title">Volume (V)</span>
                    <div class="math-card-formula" style="font-size:1.1rem; color:#fff;">${calc.formulas.volume}</div>
                    <div class="math-card-steps">${calc.stepByStep.volume}</div>
                    <div style="font-size:0.75rem; color:var(--accent-amber); font-weight:700; margin-top:4px;">
                        💡 Capacidade: ${(calc.volume * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Litros
                    </div>
                </div>
            `;
        } else if (currentDrawerTab === 'concepts') {
            container.innerHTML = `
                <div style="font-size:1rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:6px;">
                    <span>💡</span> Área Total vs Volume (Capacidade)
                </div>

                <div class="career-concept-box">
                    <b style="color:var(--accent-cyan); display:block; margin-bottom:4px;">Área Total (At):</b>
                    É a "casca" externa do sólido. Imagine embrulhar o sólido em papel de presente ou pintar todas as paredes externas. Mede-se em <b>m²</b> ou <b>cm²</b>.
                </div>

                <div class="career-concept-box" style="border-left-color:var(--accent-amber);">
                    <b style="color:var(--accent-amber); display:block; margin-bottom:4px;">Volume (V):</b>
                    É o espaço tridimensional que o sólido ocupa por dentro (capacidade de armazenamento). Mede-se em <b>m³</b> ou <b>Litros</b>.
                </div>

                <div class="math-card" style="border-color:var(--accent-amber); background:rgba(245,158,11,0.08);">
                    <span class="math-card-title" style="color:var(--accent-amber);">Equivalência Fundamental da Física</span>
                    <div style="font-size:1.25rem; font-weight:800; color:#fff; font-family:'JetBrains Mono'; margin:4px 0;">
                        1 m³ = 1.000 Litros
                    </div>
                    <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.5;">
                        • 1 metro cúbico (1 m³) = 1.000 Litros<br>
                        • 1 decímetro cúbico (1 dm³) = 1 Litro<br>
                        • 1 centímetro cúbico (1 cm³) = 1 mL
                    </div>
                </div>
            `;
        } else if (currentDrawerTab === 'steps') {
            container.innerHTML = `
                <div style="font-size:1rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:6px;">
                    <span>🧮</span> Passo a Passo de Resolução (${solidDef.name})
                </div>

                <div class="math-card">
                    <span class="math-card-title">Passo 1: Identificar as Dimensões</span>
                    <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.6;">
                        ${Object.keys(currentParams).map(k => `• <b>${k}</b> = ${currentParams[k]} m`).join('<br>')}
                    </div>
                </div>

                <div class="math-card">
                    <span class="math-card-title">Passo 2: Calcular a Área Total</span>
                    <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.6;">
                        1. Aplique a fórmula: <code>${calc.formulas.totalArea}</code><br>
                        2. Substitua os valores numéricos.<br>
                        3. Resultado: <b style="color:var(--accent-cyan);">${calc.totalArea.toFixed(2)} m²</b>
                    </div>
                </div>

                <div class="math-card">
                    <span class="math-card-title">Passo 3: Calcular o Volume</span>
                    <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.6;">
                        1. Aplique a fórmula: <code>${calc.formulas.volume}</code><br>
                        2. Resultado: <b style="color:#fff;">${calc.volume.toFixed(2)} m³</b><br>
                        3. Em Litros: <code>${calc.volume.toFixed(2)} × 1.000 = ${(calc.volume * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</code>
                    </div>
                </div>
            `;
        } else if (currentDrawerTab === 'dictionary') {
            const dict = (window.SUPPORT_GUIDE_DATA && window.SUPPORT_GUIDE_DATA.dictionary) || [];
            container.innerHTML = `
                <div style="font-size:1rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:6px;">
                    <span>🔤</span> Dicionário de Letras e Símbolos
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${dict.map(item => `
                        <div style="background:rgba(0,0,0,0.25); padding:8px 10px; border-radius:6px; border-left:2px solid var(--primary-light);">
                            <div style="font-family:'JetBrains Mono'; font-weight:700; color:var(--accent-amber);">${item.symbol} - ${item.name}</div>
                            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">${item.desc}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // ==========================================================================
    // CAPTURA DE SNAPSHOT E ÁLBUM
    // ==========================================================================
    let pendingSnapshotRecord = null;

    function setupGalleryAndSnapshot() {
        const btnSnapshot = document.getElementById('btnQuickSnapshot');
        const btnTopAlbum = document.getElementById('btnTopAlbum');
        const modalSnap = document.getElementById('snapshotModal');
        const modalAlbum = document.getElementById('albumModal');
        const btnCloseSnap = document.getElementById('btnCloseSnapshotModal');
        const btnCloseAlbum = document.getElementById('btnCloseAlbumModal');
        const btnConfirmSave = document.getElementById('btnConfirmSaveSnapshot');
        const btnDownloadSnap = document.getElementById('btnDownloadSnapshotPng');

        // Abre modal de snapshot
        const triggerSnapshot = (defaultTitle = '') => {
            const solidDef = SOLIDS_DATA[currentSolidId];
            const calc = solidDef ? solidDef.calculate(currentParams) : { totalArea: 0, volume: 0 };
            
            const metrics = {
                totalArea: calc.totalArea.toFixed(2) + ' m²',
                volume: calc.volume.toFixed(2) + ' m³ (' + (calc.volume * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' L)',
                dimensions: Object.keys(currentParams).map(k => `${k}=${currentParams[k]}`).join(', ')
            };

            const rec = galleryAlbum.captureSnapshot(
                defaultTitle || solidDef.name,
                solidDef.name,
                metrics,
                ''
            );

            pendingSnapshotRecord = rec;

            const previewImg = document.getElementById('snapshotPreviewImg');
            if (previewImg) previewImg.src = rec.image;

            const titleInput = document.getElementById('inputSnapshotTitle');
            if (titleInput) titleInput.value = defaultTitle || solidDef.name;

            const summary = document.getElementById('snapshotMetricsSummary');
            if (summary) {
                summary.innerHTML = `
                    <div><span style="color:var(--text-secondary);">Sólido:</span><br><b>${solidDef.name}</b></div>
                    <div><span style="color:var(--text-secondary);">Área Total:</span><br><b style="color:var(--accent-cyan);">${metrics.totalArea}</b></div>
                    <div><span style="color:var(--text-secondary);">Volume:</span><br><b style="color:var(--accent-amber);">${metrics.volume}</b></div>
                `;
            }

            if (modalSnap) modalSnap.classList.remove('hidden');
            if (window.sounds) window.sounds.playCameraShutter();
        };

        if (btnSnapshot) btnSnapshot.addEventListener('click', () => triggerSnapshot());
        const btnPhotoBuilding = document.getElementById('btnPhotoBuilding');
        if (btnPhotoBuilding) btnPhotoBuilding.addEventListener('click', () => triggerSnapshot('Edifício Residencial Aurora'));
        const btnCareerPhoto = document.getElementById('btnCareerPhoto');
        if (btnCareerPhoto) btnCareerPhoto.addEventListener('click', () => triggerSnapshot(careerMode.getCurrentStage().title));

        if (btnConfirmSave && modalSnap) {
            btnConfirmSave.addEventListener('click', () => {
                const notesInput = document.getElementById('inputSnapshotNotes');
                const titleInput = document.getElementById('inputSnapshotTitle');
                if (pendingSnapshotRecord) {
                    pendingSnapshotRecord.title = titleInput.value || pendingSnapshotRecord.title;
                    pendingSnapshotRecord.notes = notesInput.value || 'Atividade registrada no GeoLab 3D.';
                    const records = galleryAlbum.getRecords();
                    const idx = records.findIndex(r => r.id === pendingSnapshotRecord.id);
                    if (idx >= 0) {
                        records[idx] = pendingSnapshotRecord;
                        galleryAlbum.saveRecords(records);
                    }
                }
                modalSnap.classList.add('hidden');
                if (window.sounds) window.sounds.playSuccess();
                showNotification('📸 Foto e relatório salvos com sucesso no seu Álbum!');
            });
        }

        if (btnDownloadSnap) {
            btnDownloadSnap.addEventListener('click', () => {
                if (pendingSnapshotRecord) {
                    galleryAlbum.downloadImage(pendingSnapshotRecord.image, `geolab3d-${pendingSnapshotRecord.title.toLowerCase().replace(/\s+/g, '-')}.png`);
                }
            });
        }

        if (btnCloseSnap && modalSnap) btnCloseSnap.addEventListener('click', () => modalSnap.classList.add('hidden'));

        if (btnTopAlbum) btnTopAlbum.addEventListener('click', openAlbumModal);
        if (btnCloseAlbum && modalAlbum) btnCloseAlbum.addEventListener('click', () => modalAlbum.classList.add('hidden'));
    }

    function openAlbumModal() {
        const modalAlbum = document.getElementById('albumModal');
        const body = document.getElementById('albumModalBody');
        if (modalAlbum && body) {
            galleryAlbum.renderAlbumUI(body);
            modalAlbum.classList.remove('hidden');
            if (window.sounds) window.sounds.playClick();
        }
    }

    // ==========================================================================
    // MODO CARREIRA BNCC
    // ==========================================================================
    function renderCareerPhaseNav() {
        const nav = document.getElementById('careerPhaseNav');
        if (!nav) return;
        nav.innerHTML = careerMode.stages.map((stg, idx) => `
            <button class="career-nav-pill ${idx === careerMode.currentStageIndex ? 'active' : ''}" data-stage-idx="${idx}">
                Fase ${stg.level}
            </button>
        `).join('');

        nav.querySelectorAll('.career-nav-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.stageIdx);
                careerMode.selectStage(idx);
                renderCareerStage();
                if (window.sounds) window.sounds.playClick();
            });
        });
    }

    function setupCareerUI() {
        renderCareerStage();

        const btnValidate = document.getElementById('btnValidateCareer');
        if (btnValidate) {
            btnValidate.addEventListener('click', () => {
                const stage = careerMode.getCurrentStage();
                const inputValues = {};
                stage.inputs.forEach(inp => {
                    const el = document.getElementById(`career_input_${inp.id}`);
                    inputValues[inp.id] = el ? el.value : '';
                });

                const res = careerMode.validateAnswers(inputValues);
                const feedbackBox = document.getElementById('careerFeedbackBox');
                const btnNext = document.getElementById('btnCareerNext');

                if (res.success) {
                    gameMgr.addXp(res.xpReward);
                    updateGameStatsUI();
                    feedbackBox.className = 'career-feedback-box success';
                    feedbackBox.innerHTML = `
                        🎉 <b>Parabéns! Cálculos Perfeitos!</b><br>
                        Você conquistou <b>+${res.xpReward} XP</b> e o troféu <b>${res.trophy}</b>!<br>
                        💡 Agora, registre esta vitória clicando em <b>Salvar Conquista no Álbum</b>!
                    `;
                    feedbackBox.classList.remove('hidden');
                    if (btnNext) btnNext.style.display = 'block';
                    if (window.sounds) window.sounds.playSuccess();
                } else {
                    feedbackBox.className = 'career-feedback-box error';
                    feedbackBox.innerHTML = `
                        ❌ <b>Quase lá! Revise os cálculos:</b><br>
                        ${res.results.map(r => r.isOk ? `✓ ${r.label} correto!` : `• ${r.label} incorreto. Dica: ${r.hint}`).join('<br>')}
                    `;
                    feedbackBox.classList.remove('hidden');
                    if (window.sounds) window.sounds.playError();
                }
            });
        }

        const btnNext = document.getElementById('btnCareerNext');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                careerMode.nextStage();
                renderCareerStage();
                btnNext.style.display = 'none';
                if (window.sounds) window.sounds.playClick();
            });
        }
    }

    function renderCareerStage() {
        const stage = careerMode.getCurrentStage();
        renderCareerPhaseNav();

        const badge = document.getElementById('careerLevelBadge');
        if (badge) badge.textContent = `Fase ${stage.level} · BNCC`;

        const title = document.getElementById('careerStageTitle');
        if (title) title.textContent = stage.title;

        const subtitle = document.getElementById('careerStageSubtitle');
        if (subtitle) subtitle.textContent = stage.subtitle;

        const conceptBox = document.getElementById('careerConceptBox');
        if (conceptBox) conceptBox.innerHTML = stage.conceptText;

        const actionBox = document.getElementById('careerActionBox');
        if (actionBox) actionBox.innerHTML = stage.actionPrompt;

        const inputsContainer = document.getElementById('careerInputsContainer');
        if (inputsContainer) {
            inputsContainer.innerHTML = '';
            stage.inputs.forEach(inp => {
                const group = document.createElement('div');
                group.className = 'mission-input-group';
                group.innerHTML = `
                    <label>${inp.label}</label>
                    <input type="number" step="0.01" class="mission-input" id="career_input_${inp.id}" placeholder="Digite sua resposta">
                `;
                inputsContainer.appendChild(group);
            });
        }

        const feedbackBox = document.getElementById('careerFeedbackBox');
        if (feedbackBox) feedbackBox.classList.add('hidden');

        // Aplica o sólido no 3D
        switchSolid(stage.solidId, stage.targetParams);

        // Se for missão arquitetônica (Fase 6: Edifício), ativa o estúdio de prédios no 3D
        if (stage.isBuildingMission) {
            buildingStudio.setActive(true);
            const rep = buildingStudio.buildBuilding(stage.targetParams);
            updateBuildingUI(rep);
        } else {
            if (currentMode === 'career') {
                buildingStudio.setActive(false);
            }
        }
    }

    // ==========================================================================
    // ESTÚDIO DE ARQUITETURA (PRÉDIO 3D)
    // ==========================================================================
    function updateBuildingUI(report) {
        if (!report) return;
        const bldGlassArea = document.getElementById('bldGlassArea');
        if (bldGlassArea) bldGlassArea.textContent = report.totalGlassArea + ' m²';

        const bldGlassDesc = document.getElementById('bldGlassDesc');
        if (bldGlassDesc) bldGlassDesc.textContent = `${report.totalWindowsCount} janelas de vidro (${report.singleWindowArea} m² cada)`;

        const bldMasonryArea = document.getElementById('bldMasonryArea');
        if (bldMasonryArea) bldMasonryArea.textContent = report.netMasonryArea + ' m²';

        const bldVolumeArea = document.getElementById('bldVolumeArea');
        if (bldVolumeArea) bldVolumeArea.textContent = report.buildingVolume + ' m³';

        const bldVolumeLiters = document.getElementById('bldVolumeLiters');
        if (bldVolumeLiters) bldVolumeLiters.textContent = `${report.volumeLiters} Litros (1 m³ = 1.000 L)`;
    }

    // ==========================================================================
    // ALTERNADOR DE MODOS
    // ==========================================================================
    function switchMode(mode) {
        currentMode = mode;
        document.body.className = 'mode-' + mode;

        // Atualiza o pill do modo no topo
        const modeTextMap = {
            career: '🚀 Carreira BNCC',
            lab: '🔬 Laboratório Livre',
            building: '🏢 Estúdio de Arquitetura',
            studio: '👥 Projetos em Grupo',
            elements: '🧩 Vértices & Euler',
            unfold: '📦 Planificação',
            cross_section: '✂️ Fatiador / Cortes',
            liquid: '💧 Hidráulica (1m³=1000L)',
            game: '🎮 Quiz & Desafios'
        };
        const modeIndicator = document.getElementById('currentModeText');
        if (modeIndicator) modeIndicator.textContent = modeTextMap[mode] || '🔬 Laboratório 3D';

        document.querySelectorAll('.mobile-mode-chip').forEach(chip => {
            const isActive = chip.dataset.mode === mode;
            chip.classList.toggle('active', isActive);
            if (isActive) {
                chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        });

        // Oculta todos os subpainéis
        document.querySelectorAll('.mode-subpanel').forEach(p => p.classList.add('hidden'));

        // Ativação e limpeza de subsistemas 3D
        crossSection.setActive(mode === 'cross_section');
        unfoldSys.setActive(mode === 'unfold');
        buildingStudio.setActive(mode === 'building');

        // Se planificação estiver ativa, oculta cotas para eliminar silhuetas
        if (mode === 'unfold') {
            dimensionsHelper.setVisible(false);
            const btnDim = document.getElementById('btnToggleDimensions');
            if (btnDim) btnDim.classList.remove('active');
        } else {
            dimensionsHelper.setVisible(true);
            const btnDim = document.getElementById('btnToggleDimensions');
            if (btnDim) btnDim.classList.add('active');
        }

        // Subpainéis por modo
        if (mode === 'career') {
            const careerCard = document.getElementById('subpanel-career');
            if (careerCard) careerCard.classList.remove('hidden');
            renderCareerStage();
        } else if (mode === 'building') {
            const bldLeft = document.getElementById('subpanel-building-left');
            if (bldLeft) bldLeft.classList.remove('hidden');
            const bldRight = document.getElementById('subpanel-building-right');
            if (bldRight) bldRight.classList.remove('hidden');
            switchSolid('rectangular_prism', { a: 6.0, b: 5.0, c: 8.0 });
            const rep = buildingStudio.buildBuilding(currentParams);
            updateBuildingUI(rep);
        } else if (mode === 'elements') {
            const elemSub = document.getElementById('subpanel-elements');
            if (elemSub) elemSub.classList.remove('hidden');
            const elemRight = document.getElementById('subpanel-elements-right');
            if (elemRight) elemRight.classList.remove('hidden');
            sceneMgr.setElementsVisibility(true, true, true);
        } else {
            sceneMgr.setElementsVisibility(false, false, false);
        }

        if (mode === 'unfold') {
            const unfoldSub = document.getElementById('subpanel-unfold');
            if (unfoldSub) unfoldSub.classList.remove('hidden');
            updateUnfoldingCartela();
        }

        if (mode === 'cross_section') {
            const csSub = document.getElementById('subpanel-cross_section');
            if (csSub) csSub.classList.remove('hidden');
            const csRight = document.getElementById('subpanel-cross_section-right');
            if (csRight) csRight.classList.remove('hidden');
        }

        if (mode === 'liquid') {
            const liqSub = document.getElementById('subpanel-liquid');
            if (liqSub) liqSub.classList.remove('hidden');
            const liqRight = document.getElementById('subpanel-liquid-right');
            if (liqRight) liqRight.classList.remove('hidden');
            sceneMgr.faucetGroup.visible = true;
            liquidSim.notifyUI();
        } else {
            sceneMgr.faucetGroup.visible = false;
            liquidSim.stopFilling();
        }

        if (mode === 'studio') {
            const studioCard = document.getElementById('subpanel-studio-card');
            if (studioCard) studioCard.classList.remove('hidden');
            loadStudioProject(studio.currentProjectIndex);
        }

        if (mode === 'game') {
            const gameArea = document.getElementById('gameChallengeArea');
            if (gameArea) gameArea.classList.remove('hidden');
            renderChallenge(gameMgr.generateChallenge('euler'));
        }
    }

    // ==========================================================================
    // EVENTOS GERAIS DA INTERFACE
    // ==========================================================================
    function setupEventListeners() {
        // Toolbar 3D: Cotas
        const btnToggleDimensions = document.getElementById('btnToggleDimensions');
        if (btnToggleDimensions) {
            btnToggleDimensions.addEventListener('click', () => {
                const isVisible = dimensionsHelper.toggle();
                btnToggleDimensions.classList.toggle('active', isVisible);
                if (window.sounds) window.sounds.playClick();
            });
        }

        // Toolbar 3D: Deformador de Vértices
        const btnToggleDeform = document.getElementById('btnToggleDeform');
        if (btnToggleDeform) {
            btnToggleDeform.addEventListener('click', () => {
                const isActive = vertexDeformer.toggle();
                btnToggleDeform.classList.toggle('active', isActive);
                if (window.sounds) window.sounds.playClick();
                showNotification(isActive ? '✋ Modo Deformação Ativo: Clique e arraste qualquer vértice no 3D!' : '✋ Modo Deformação Desativado');
            });
        }

        // Seletor de cores das arestas (toolbar e subpainel)
        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const color = dot.dataset.color;
                document.querySelectorAll('.color-dot').forEach(d => {
                    d.classList.toggle('active', d.dataset.color === color);
                });
                sceneMgr.setEdgeColor(color);
                if (window.sounds) window.sounds.playClick();
            });
        });

        // Controles de câmera
        const btnResetCamera = document.getElementById('btnResetCamera');
        if (btnResetCamera) {
            btnResetCamera.addEventListener('click', () => {
                sceneMgr.resetCamera();
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnAutoRotate = document.getElementById('btnAutoRotate');
        if (btnAutoRotate) {
            btnAutoRotate.addEventListener('click', () => {
                sceneMgr.isAutoRotating = !sceneMgr.isAutoRotating;
                btnAutoRotate.classList.toggle('active', sceneMgr.isAutoRotating);
                if (window.sounds) window.sounds.playClick();
            });
        }

        // Modos visuais (Sólido, Raio-X, Wireframe)
        document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn[data-view]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                sceneMgr.setViewMode(btn.dataset.view);
                if (window.sounds) window.sounds.playClick();
            });
        });

        // Toggles de elementos
        const chkVertices = document.getElementById('chkVertices');
        const chkEdges = document.getElementById('chkEdges');
        const chkFaces = document.getElementById('chkFaces');
        const onElementToggle = () => {
            sceneMgr.setElementsVisibility(
                chkVertices ? chkVertices.checked : false,
                chkEdges ? chkEdges.checked : false,
                chkFaces ? chkFaces.checked : false
            );
        };
        if (chkVertices) chkVertices.addEventListener('change', onElementToggle);
        if (chkEdges) chkEdges.addEventListener('change', onElementToggle);
        if (chkFaces) chkFaces.addEventListener('change', onElementToggle);

        // Planificação slider
        const unfoldSlider = document.getElementById('unfoldSlider');
        if (unfoldSlider) {
            unfoldSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                unfoldSys.setUnfoldProgress(val);
                const percent = document.getElementById('unfoldPercent');
                if (percent) percent.textContent = `${Math.round(val * 100)}%`;
            });
        }

        // Fatiador de corte
        const cutHSlider = document.getElementById('cutHeightSlider');
        const cutAXSlider = document.getElementById('cutAngleXSlider');
        const cutAZSlider = document.getElementById('cutAngleZSlider');
        const onCutChange = () => {
            const h = parseFloat(cutHSlider.value);
            const ax = parseFloat(cutAXSlider.value);
            const az = parseFloat(cutAZSlider.value);
            crossSection.setCut(h, ax, az);

            const hVal = document.getElementById('cutHeightVal');
            if (hVal) hVal.textContent = h.toFixed(2) + ' m';
            const axVal = document.getElementById('cutAngleXVal');
            if (axVal) axVal.textContent = ax + '°';
            const azVal = document.getElementById('cutAngleZVal');
            if (azVal) azVal.textContent = az + '°';
        };
        if (cutHSlider) cutHSlider.addEventListener('input', onCutChange);
        if (cutAXSlider) cutAXSlider.addEventListener('input', onCutChange);
        if (cutAZSlider) cutAZSlider.addEventListener('input', onCutChange);

        // Edifício sliders
        const sliderFloors = document.getElementById('sliderBuildingFloors');
        if (sliderFloors) {
            sliderFloors.addEventListener('input', (e) => {
                const f = parseInt(e.target.value);
                buildingStudio.setFloors(f);
                const val = document.getElementById('buildingFloorsVal');
                if (val) val.textContent = f;
                updateBuildingUI(buildingStudio.getReport());
            });
        }
        const sliderWindows = document.getElementById('sliderBuildingWindows');
        if (sliderWindows) {
            sliderWindows.addEventListener('input', (e) => {
                const w = parseInt(e.target.value);
                buildingStudio.setWindowsPerFloor(w);
                const val = document.getElementById('buildingWindowsVal');
                if (val) val.textContent = w;
                updateBuildingUI(buildingStudio.getReport());
            });
        }

        // Seletores de Janelas, Portas e Telhados do Edifício 3D
        document.querySelectorAll('#groupBldWin [data-bld-win]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#groupBldWin [data-bld-win]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                buildingStudio.setWindowStyle(btn.dataset.bldWin);
                updateBuildingUI(buildingStudio.getReport());
                if (window.sounds) window.sounds.playClick();
            });
        });

        document.querySelectorAll('#groupBldDoor [data-bld-door]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#groupBldDoor [data-bld-door]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                buildingStudio.setDoorStyle(btn.dataset.bldDoor);
                updateBuildingUI(buildingStudio.getReport());
                if (window.sounds) window.sounds.playClick();
            });
        });

        document.querySelectorAll('#groupBldRoof [data-bld-roof]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#groupBldRoof [data-bld-roof]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                buildingStudio.setRoofStyle(btn.dataset.bldRoof);
                updateBuildingUI(buildingStudio.getReport());
                if (window.sounds) window.sounds.playClick();
            });
        });

        // Líquido
        const btnFaucet = document.getElementById('btnFaucet');
        const btnDrain = document.getElementById('btnDrain');
        const btnEmpty = document.getElementById('btnEmpty');
        const liquidSlider = document.getElementById('liquidManualSlider');

        if (btnFaucet) {
            btnFaucet.addEventListener('click', () => {
                if (liquidSim.isFilling) {
                    liquidSim.stopFilling();
                    btnFaucet.textContent = '💧 Abrir Torneira';
                } else {
                    liquidSim.startFilling();
                    btnFaucet.textContent = '⏹ Fechar Torneira';
                }
            });
        }

        if (btnDrain) {
            btnDrain.addEventListener('click', () => {
                if (liquidSim.isDraining) {
                    liquidSim.stopDraining();
                    btnDrain.textContent = '🚰 Drenar';
                } else {
                    liquidSim.startDraining();
                    btnDrain.textContent = '⏹ Parar Dreno';
                }
            });
        }

        if (btnEmpty) {
            btnEmpty.addEventListener('click', () => {
                liquidSim.empty();
                if (btnFaucet) btnFaucet.textContent = '💧 Abrir Torneira';
            });
        }

        if (liquidSlider) {
            liquidSlider.addEventListener('input', (e) => {
                liquidSim.setHeight(parseFloat(e.target.value));
            });
        }

        // Áudio e Fullscreen
        const btnAudio = document.getElementById('btnAudioToggle');
        if (btnAudio) {
            btnAudio.addEventListener('click', () => {
                const isMuted = window.sounds.toggleMute();
                btnAudio.textContent = isMuted ? '🔇' : '🔊';
            });
        }

        const btnFull = document.getElementById('btnFullscreen');
        if (btnFull) {
            btnFull.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        // Callbacks de atualização de simulações
        window.onLiquidStateChange = (state) => {
            const volM3 = state.currentVolumeM3 !== undefined ? state.currentVolumeM3 : (state.currentVolumeCm3 || 0);
            const levelEl = document.getElementById('liquidLevelText');
            if (levelEl) levelEl.textContent = `${state.height.toFixed(2)} m / ${state.maxHeight.toFixed(2)} m`;
            const volEl = document.getElementById('liquidVolText');
            if (volEl) volEl.textContent = `${volM3.toFixed(2)} m³ (${(state.currentVolumeLiters).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L)`;
            const pctEl = document.getElementById('liquidPercentText');
            if (pctEl) pctEl.textContent = `${state.percentage.toFixed(0)}%`;
            const bar = document.getElementById('liquidBarFill');
            if (bar) bar.style.width = `${state.percentage}%`;

            if (liquidSlider) {
                liquidSlider.max = state.maxHeight;
                liquidSlider.value = state.height;
            }
        };

        window.onCrossSectionChange = (info) => {
            const nameEl = document.getElementById('crossSectionShapeName');
            if (nameEl) nameEl.textContent = info.shapeName;
            const sliceEl = document.getElementById('crossSectionSliceDims');
            if (sliceEl) sliceEl.textContent = info.sliceDimensions || '';
            const areaEl = document.getElementById('crossSectionArea');
            if (areaEl) areaEl.textContent = info.estimatedArea;
            const remH = document.getElementById('cutRemainingH');
            if (remH) remH.textContent = info.remainingHeight;
            const remSup = document.getElementById('cutRemovedH');
            if (remSup) remSup.textContent = info.removedHeight;
            const remVol = document.getElementById('cutRemainingVol');
            if (remVol) remVol.textContent = info.remainingVolume;
            const descEl = document.getElementById('crossSectionDesc');
            if (descEl) descEl.textContent = info.description;
        };
    }

    // Navegação Otimizada para Mobile
    function setupMobileNavigation() {
        const chips = document.querySelectorAll('.mobile-mode-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                switchMode(chip.dataset.mode);
                if (window.sounds) window.sounds.playClick();
            });
        });
    }

    // Modal de Configurações
    function setupSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const btnClose = document.getElementById('btnCloseSettingsModal');
        const chkAudio = document.getElementById('chkSettingsAudio');
        const btnReset = document.getElementById('btnResetProgress');

        if (btnClose && modal) btnClose.addEventListener('click', () => modal.classList.add('hidden'));

        if (chkAudio) {
            chkAudio.addEventListener('change', () => {
                const muted = !chkAudio.checked;
                window.sounds.isMuted = muted;
                const btnAudio = document.getElementById('btnAudioToggle');
                if (btnAudio) btnAudio.textContent = muted ? '🔇' : '🔊';
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm('Deseja zerar seu XP e reiniciar sua pontuação?')) {
                    gameMgr.xp = 0;
                    gameMgr.level = 1;
                    updateGameStatsUI();
                    modal.classList.add('hidden');
                    showNotification('Progresso zerado com sucesso.');
                }
            });
        }
    }

    function openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.remove('hidden');
    }

    // ==========================================================================
    // ESTÚDIO DE PROJETOS REAIS (AULAS EM GRUPO)
    // ==========================================================================
    function setupStudioUI() {
        const grid = document.getElementById('teamProjectsSelectorGrid');
        if (!grid) return;
        grid.innerHTML = '';

        studio.projects.forEach((proj, idx) => {
            const btn = document.createElement('button');
            btn.className = `view-btn ${idx === 0 ? 'active' : ''}`;
            btn.textContent = `Equipe ${idx + 1}: ${proj.title.split('(')[0].trim()}`;
            btn.addEventListener('click', () => {
                grid.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadStudioProject(idx);
                if (window.sounds) window.sounds.playClick();
            });
            grid.appendChild(btn);
        });

        const btnSubmit = document.getElementById('btnSubmitTeamProject');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', () => {
                const userAt = parseFloat(document.getElementById('inputTeamAt').value);
                const userV = parseFloat(document.getElementById('inputTeamV').value);

                if (isNaN(userAt) || isNaN(userV)) {
                    showStudioFeedback(false, 'Por favor, digite valores numéricos para Área Total e Volume.');
                    return;
                }

                const result = studio.validateSubmission(userAt, userV);
                const feedbackEl = document.getElementById('studioFeedbackBox');

                if (result.success) {
                    gameMgr.addXp(150);
                    updateGameStatsUI();
                    feedbackEl.style.display = 'block';
                    feedbackEl.style.background = 'rgba(16, 185, 129, 0.15)';
                    feedbackEl.style.border = '1px solid var(--accent-emerald)';
                    feedbackEl.style.color = '#34d399';
                    feedbackEl.innerHTML = `
                        🎉 <b>Excelente trabalho da equipe!</b> Cálculos corretos!<br>
                        • Área Total: ${result.correctAt.toFixed(2)} m² (Sua resposta: ${userAt} m²)<br>
                        • Volume: ${result.correctV.toFixed(2)} m³ (${(result.correctV * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Litros)<br>
                        +150 XP adicionados ao placar da turma!
                    `;
                    if (window.sounds) window.sounds.playSuccess();
                } else {
                    feedbackEl.style.display = 'block';
                    feedbackEl.style.background = 'rgba(244, 63, 94, 0.15)';
                    feedbackEl.style.border = '1px solid var(--accent-rose)';
                    feedbackEl.style.color = '#fb7185';
                    feedbackEl.innerHTML = `
                        ❌ <b>Quase lá! Revise os cálculos da equipe:</b><br>
                        ${!result.isAtOk ? `• Área Total calculada difere do valor esperado.<br>` : '• Área Total correta! ✓<br>'}
                        ${!result.isVOk ? `• Volume calculado difere do valor esperado.<br>` : '• Volume correto! ✓<br>'}
                        💡 Use o botão <b>"Ver Como Calcular"</b> para consultar as fórmulas da equipe.
                    `;
                    if (window.sounds) window.sounds.playError();
                }
            });
        }
    }

    function loadStudioProject(index) {
        const proj = studio.selectProject(index);
        document.getElementById('studioTeamBadge').textContent = proj.teamName.split('-')[0].trim();
        document.getElementById('studioProjectTitle').textContent = `Projeto: ${proj.title}`;
        document.getElementById('inputTeamAt').value = '';
        document.getElementById('inputTeamV').value = '';
        const feedback = document.getElementById('studioFeedbackBox');
        if (feedback) feedback.style.display = 'none';

        const measuresEl = document.getElementById('studioLiveMeasures');
        if (measuresEl) {
            measuresEl.innerHTML = Object.keys(proj.params)
                .map(k => `${k} = ${proj.params[k]} m`)
                .join(' &nbsp;·&nbsp; ');
        }
    }

    function showStudioFeedback(isSuccess, msg) {
        const el = document.getElementById('studioFeedbackBox');
        if (!el) return;
        el.style.display = 'block';
        el.style.background = isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
        el.style.color = isSuccess ? '#34d399' : '#fb7185';
        el.innerHTML = msg;
    }

    function updateGameStatsUI() {
        const xp = document.getElementById('xpCount');
        if (xp) xp.textContent = gameMgr.xp;
    }

    function showNotification(msg) {
        const notif = document.getElementById('game-notification');
        if (!notif) return;
        notif.textContent = msg;
        notif.classList.remove('hidden');
        setTimeout(() => notif.classList.add('hidden'), 3500);
    }

    // Desafios e Quiz
    function renderChallenge(ch) {
        const container = document.getElementById('gameChallengeArea');
        if (!container) return;
        container.innerHTML = '';

        if (ch.type === 'quiz') {
            switchSolid(ch.solidId);
            const card = document.createElement('div');
            card.className = 'math-card';
            card.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            card.innerHTML = `
                <div style="font-size:0.75rem; color:var(--accent-amber); font-weight:700;">DESAFIO TÉCNICO (+${ch.xpReward} XP)</div>
                <div style="font-size:0.9rem; font-weight:600; color:#fff; line-height:1.4;">${ch.text}</div>
                <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
                    ${ch.options.map((opt, idx) => `
                        <button class="view-btn" style="text-align:left; padding:9px 12px;" data-idx="${idx}">${opt}</button>
                    `).join('')}
                </div>
                <div id="quizFeedback" style="font-size:0.82rem; font-weight:600; min-height:20px; margin-top:4px;"></div>
            `;

            card.querySelectorAll('button[data-idx]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const chosen = parseInt(btn.dataset.idx);
                    const feedback = card.querySelector('#quizFeedback');
                    if (chosen === ch.correctIdx) {
                        btn.style.background = 'rgba(16, 185, 129, 0.3)';
                        btn.style.borderColor = 'var(--accent-emerald)';
                        feedback.style.color = '#34d399';
                        feedback.textContent = `✓ Correto! (+${ch.xpReward} XP) · ${ch.explanation}`;
                        gameMgr.addXp(ch.xpReward);
                        updateGameStatsUI();
                        if (window.sounds) window.sounds.playSuccess();
                    } else {
                        btn.style.background = 'rgba(244, 63, 94, 0.3)';
                        btn.style.borderColor = 'var(--accent-rose)';
                        feedback.style.color = '#fb7185';
                        feedback.textContent = `✕ Incorreto. Tente novamente!`;
                        if (window.sounds) window.sounds.playError();
                    }
                });
            });

            container.appendChild(card);
        }
    }

    init();
});
