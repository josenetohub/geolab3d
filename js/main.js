// GeoLab 3D - Orquestrador Principal do Aplicativo & Estúdio de Projetos Reais
document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvas-container');

    // 1. Instanciação dos Subsistemas 3D e Lógica
    const sceneMgr = new SceneManager(canvasContainer);
    const dimensionsHelper = new DimensionsHelper(sceneMgr);
    const liquidSim = new LiquidSimulation(sceneMgr);
    const crossSection = new CrossSectionAnalyzer(sceneMgr, 'radarCanvas');
    const unfoldSys = new UnfoldingSystem(sceneMgr);
    const gameMgr = new GameManager();

    // Estúdio de Projetos para Aulas em Grupo
    const studio = new GameDesignStudio(sceneMgr, (solidId, params) => {
        switchSolid(solidId, params);
    });

    // 2. Estado da Aplicação
    let currentSolidId = 'cube';
    let currentParams = { ...SOLIDS_DATA.cube.defaultParams };
    let currentMode = 'lab';

    // 3. Inicialização
    function init() {
        populateSolidSelect();
        setupEventListeners();
        setupMobileSwitcher();
        setupStudioUI();
        setupSupportGuide();
        switchSolid('cube');
        switchMode('lab');
        updateGameStatsUI();
    }

    // Preenche o seletor de sólidos
    function populateSolidSelect() {
        const select = document.getElementById('solidSelect');
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
        liquidSim.setSolid(solidId, currentParams);
        crossSection.setSolid(solidId, currentParams);
        unfoldSys.setSolid(solidId, currentParams);

        // Atualiza UI
        document.getElementById('solidSelect').value = solidId;
        document.getElementById('solidTitle').textContent = solidDef.name;
        document.getElementById('solidCategoryBadge').textContent = solidDef.category;
        document.getElementById('gameAssetText').textContent = solidDef.realWorldApplication || 'Aplicações no Cotidiano';

        buildParamSliders(solidDef);
        updateMathCards(solidDef);
        updateElementsUI(solidDef);
    }

    // Constrói os sliders com medidas legíveis
    function buildParamSliders(solidDef) {
        const container = document.getElementById('paramSlidersContainer');
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
                document.getElementById(`val-${p.key}`).textContent = `${val} ${p.unit}`;

                SolidsBuilder.build(sceneMgr, currentSolidId, currentParams);
                dimensionsHelper.buildDimensions(currentSolidId, currentParams);
                liquidSim.setSolid(currentSolidId, currentParams);
                crossSection.setSolid(currentSolidId, currentParams);
                unfoldSys.setSolid(currentSolidId, currentParams);

                updateMathCards(solidDef);
            });

            row.appendChild(header);
            row.appendChild(input);
            container.appendChild(row);
        });
    }

    // Atualiza os cartões matemáticos (com formatação limpa e passo a passo)
    function updateMathCards(solidDef) {
        const calc = solidDef.calculate(currentParams);

        // Área Total (At)
        document.getElementById('totalAreaVal').textContent = calc.totalArea.toFixed(2) + ' m²';
        document.getElementById('totalAreaFormula').innerHTML = calc.formulas.totalArea;
        document.getElementById('totalAreaSteps').innerHTML = calc.stepByStep.totalArea;

        // Volume (V)
        document.getElementById('volumeVal').textContent = calc.volume.toFixed(2) + ' m³';
        document.getElementById('volumeFormula').innerHTML = calc.formulas.volume;
        document.getElementById('volumeSteps').innerHTML = calc.stepByStep.volume;

        // Área da Base (Ab)
        document.getElementById('baseAreaVal').textContent = calc.baseArea.toFixed(2) + ' m²';
        document.getElementById('baseAreaFormula').innerHTML = calc.formulas.baseArea;

        // Área Lateral (Al)
        document.getElementById('lateralAreaVal').textContent = calc.lateralArea.toFixed(2) + ' m²';
        document.getElementById('lateralAreaFormula').innerHTML = calc.formulas.lateralArea;

        // Medidas auxiliares (apótema, geratriz, etc.)
        const extraContainer = document.getElementById('extraMeasuresContainer');
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

    // Atualiza a Relação de Euler
    function updateElementsUI(solidDef) {
        const elem = solidDef.elements;
        document.getElementById('vertCount').textContent = elem.verticesCount;
        document.getElementById('edgeCount').textContent = elem.edgesCount;
        document.getElementById('faceCount').textContent = elem.facesCount;
        document.getElementById('faceTypesDesc').textContent = elem.faceTypes;

        const eulerBox = document.getElementById('eulerResultBox');
        if (elem.euler.valid) {
            const V = elem.euler.v;
            const A = elem.euler.a;
            const F = elem.euler.f;
            const res = V - A + F;
            eulerBox.innerHTML = `
                <div class="euler-equation-box">${V} - ${A} + ${F} = ${res}</div>
                <div style="color:var(--accent-emerald); font-weight:600; font-size:0.78rem; text-align:center; margin-top:4px;">
                    ✓ Poliedro Euleriano Válido (V - A + F = 2)
                </div>
            `;
        } else {
            eulerBox.innerHTML = `
                <div style="color:var(--text-secondary); font-size:0.78rem; text-align:center; padding:6px;">
                    ${elem.euler.note || 'Não aplicável a corpos redondos (curvos).'}
                </div>
            `;
        }
    }

    // Configura o Estúdio de Projetos para Aulas em Grupo
    function setupStudioUI() {
        const grid = document.getElementById('teamProjectsSelectorGrid');
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
        btnSubmit.addEventListener('click', () => {
            const valAt = parseFloat(document.getElementById('inputTeamAt').value);
            const valV = parseFloat(document.getElementById('inputTeamV').value);

            const fb = document.getElementById('studioFeedbackBox');
            fb.style.display = 'block';

            if (isNaN(valAt) || isNaN(valV)) {
                fb.style.background = 'rgba(244, 63, 94, 0.15)';
                fb.style.color = 'var(--accent-rose)';
                fb.innerHTML = '⚠️ Por favor, informe a Área Total e o Volume antes de submeter!';
                if (window.sounds) window.sounds.playError();
                return;
            }

            const res = studio.validateSubmission(valAt, valV);
            if (res.success) {
                fb.style.background = 'rgba(16, 185, 129, 0.15)';
                fb.style.color = 'var(--accent-emerald)';
                fb.innerHTML = `
                    🎉 PROJETO APROVADO COM SUCESSO!<br>
                    <span style="font-weight:400; font-size:0.78rem;">
                        Área Total: ${res.correctAt.toFixed(2)} m² | Volume: ${res.correctV.toFixed(2)} m³<br>
                        Os cálculos da equipe estão corretos para a fabricação/construção real! +100 XP
                    </span>
                `;
                gameMgr.addXP(100);
                if (window.sounds) window.sounds.playSuccess();
                updateGameStatsUI();
            } else {
                fb.style.background = 'rgba(245, 158, 11, 0.15)';
                fb.style.color = 'var(--accent-amber)';
                let msg = '⚠️ Ajuste de Cálculo Necessário:<br>';
                if (!res.isAtOk) msg += `• Área Total informada (${valAt} m²) difere do esperado. `;
                if (!res.isVOk) msg += `• Volume informado (${valV} m³) difere do esperado. `;
                msg += '<br><span style="font-weight:400; font-size:0.76rem;">Dica: Revise a fórmula da área lateral ou a multiplicação da base pela altura.</span>';
                fb.innerHTML = msg;
                if (window.sounds) window.sounds.playError();
            }
        });
    }

    function loadStudioProject(index) {
        const proj = studio.selectProject(index);
        document.getElementById('studioTeamBadge').textContent = proj.teamName;
        document.getElementById('studioProjectTitle').textContent = `Projeto: ${proj.title}`;

        // Exibe as medidas de forma limpa e direta
        const solidDef = SOLIDS_DATA[proj.solidId];
        const measureStrs = solidDef.paramDefs.map(p => `${p.label}: ${proj.params[p.key]} ${p.unit}`);
        const liveMeasuresEl = document.getElementById('studioLiveMeasures');
        if (liveMeasuresEl) {
            liveMeasuresEl.textContent = measureStrs.join('  |  ');
        }

        document.getElementById('inputTeamAt').value = '';
        document.getElementById('inputTeamV').value = '';
        document.getElementById('studioFeedbackBox').style.display = 'none';

        // Botão de atalho para abrir a fórmula deste sólido
        const btnGuide = document.getElementById('btnContextualGuide');
        if (btnGuide) {
            btnGuide.onclick = () => {
                openSupportGuideTopic(proj.solidId);
            };
        }
    }

    // Configuração do Modal Didático de Apoio & Fórmulas
    function setupSupportGuide() {
        const modal = document.getElementById('supportGuideModal');
        const btnOpen = document.getElementById('btnOpenSupportGuide');
        const btnClose = document.getElementById('btnCloseSupportGuide');

        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                modal.classList.remove('hidden');
                renderGuideTopic('concepts');
                if (window.sounds) window.sounds.playClick();
            });
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });

        // Abas do Guia
        document.querySelectorAll('.guide-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.guide-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderGuideTopic(btn.dataset.topic);
                if (window.sounds) window.sounds.playClick();
            });
        });
    }

    function openSupportGuideTopic(topicId) {
        const modal = document.getElementById('supportGuideModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        document.querySelectorAll('.guide-tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.topic === topicId);
        });
        renderGuideTopic(topicId);
        if (window.sounds) window.sounds.playClick();
    }

    function renderGuideTopic(topicId) {
        const container = document.getElementById('guideContentBody');
        if (!container || !window.SUPPORT_GUIDE_DATA) return;
        container.innerHTML = '';

        if (topicId === 'concepts') {
            const data = SUPPORT_GUIDE_DATA.concepts;
            const card = document.createElement('div');
            card.className = 'guide-formula-box';
            card.innerHTML = `
                <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-bottom:8px;">${data.title}</div>
                ${data.content.map(c => `
                    <div style="margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.06);">
                        <div style="font-weight:700; color:var(--accent-cyan); font-size:0.95rem;">${c.term} (${c.symbol})</div>
                        <div style="font-size:0.85rem; color:var(--text-primary); margin-top:4px; line-height:1.5;">${c.simpleExplanation}</div>
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;"><b>Na Prática:</b> ${c.whyItMatters}</div>
                        ${c.conversionNote ? `<div style="font-size:0.8rem; color:var(--accent-amber); font-weight:600; margin-top:4px;">💡 ${c.conversionNote}</div>` : ''}
                    </div>
                `).join('')}
            `;
            container.appendChild(card);
        } else if (topicId === 'dictionary') {
            const items = SUPPORT_GUIDE_DATA.dictionary;
            const card = document.createElement('div');
            card.className = 'guide-formula-box';
            card.innerHTML = `
                <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-bottom:8px;">🔤 Dicionário de Letras e Símbolos</div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${items.map(it => `
                        <div style="display:flex; justify-content:space-between; align-items:baseline; padding:6px 0; border-bottom:1px dashed rgba(255,255,255,0.06);">
                            <span style="font-family:'JetBrains Mono'; font-weight:700; color:var(--accent-amber); font-size:1rem; width:80px;">${it.symbol}</span>
                            <span style="flex:1; font-size:0.85rem; color:#fff; font-weight:600;">${it.name}</span>
                            <span style="flex:2; font-size:0.8rem; color:var(--text-secondary); text-align:right;">${it.desc}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(card);
        } else if (SUPPORT_GUIDE_DATA.formulasBySolid[topicId]) {
            const f = SUPPORT_GUIDE_DATA.formulasBySolid[topicId];
            const card = document.createElement('div');
            card.className = 'guide-formula-box';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <span style="font-size:1.5rem;">${f.icon}</span>
                    <span style="font-size:1.15rem; font-weight:700; color:#fff;">${f.title}</span>
                </div>

                <div class="guide-formula-row">
                    <span class="guide-formula-label">Área da Base (Ab):</span>
                    <div>
                        <span class="guide-formula-val">${f.baseArea.formula}</span>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">${f.baseArea.desc}</div>
                    </div>
                </div>

                <div class="guide-formula-row">
                    <span class="guide-formula-label">Área Lateral (Al):</span>
                    <div>
                        <span class="guide-formula-val">${f.lateralArea.formula}</span>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">${f.lateralArea.desc}</div>
                    </div>
                </div>

                <div class="guide-formula-row" style="background:rgba(99,102,241,0.12); padding:8px; border-radius:6px;">
                    <span class="guide-formula-label" style="color:var(--primary-light);">Área Total (At):</span>
                    <div>
                        <span class="guide-formula-val" style="color:#fff; font-size:1.05rem;">${f.totalArea.formula}</span>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">${f.totalArea.desc}</div>
                    </div>
                </div>

                <div class="guide-formula-row" style="background:rgba(16,185,129,0.12); padding:8px; border-radius:6px;">
                    <span class="guide-formula-label" style="color:var(--accent-emerald);">Volume (V):</span>
                    <div>
                        <span class="guide-formula-val" style="color:#fff; font-size:1.05rem;">${f.volume.formula}</span>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">${f.volume.desc}</div>
                    </div>
                </div>

                <!-- EXEMPLO RESOLVIDO PASSO A PASSO -->
                <div class="guide-example-card" style="margin-top:12px;">
                    <div style="font-size:0.85rem; font-weight:700; color:var(--accent-emerald);">📝 Exemplo Real Resolvido Passo a Passo:</div>
                    <div style="font-size:0.8rem; font-weight:600; color:#fff;">${f.example.scenario}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.6; margin-top:4px;">
                        • ${f.example.step1}<br>
                        • ${f.example.step2}<br>
                        • ${f.example.step3}
                        ${f.example.step4 ? `<br>• ${f.example.step4}` : ''}
                        ${f.example.step5 ? `<br>• ${f.example.step5}` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    }

    // Alternador de Abas de Modo
    function switchMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        document.querySelectorAll('.mode-subpanel').forEach(p => p.classList.add('hidden'));

        const activeSubpanel = document.getElementById(`subpanel-${mode}`);
        if (activeSubpanel) activeSubpanel.classList.remove('hidden');

        const activeRightPanel = document.getElementById(`subpanel-${mode}-right`);
        if (activeRightPanel) activeRightPanel.classList.remove('hidden');

        crossSection.setActive(mode === 'cross_section');
        unfoldSys.setActive(mode === 'unfold');

        if (mode === 'elements') {
            sceneMgr.setElementsVisibility(true, true, true);
            const elemRight = document.getElementById('subpanel-elements-right');
            if (elemRight) elemRight.classList.remove('hidden');
        } else {
            sceneMgr.setElementsVisibility(false, false, false);
        }

        if (mode === 'liquid') {
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

    // Renderizador de desafios do modo jogo
    function renderChallenge(ch) {
        const container = document.getElementById('gameChallengeArea');
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
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const res = gameMgr.submitAnswer(idx);
                    const feedback = document.getElementById('quizFeedback');
                    feedback.textContent = res.message;
                    feedback.style.color = res.correct ? 'var(--accent-emerald)' : 'var(--accent-rose)';

                    updateGameStatsUI();

                    setTimeout(() => {
                        const nextCat = ['euler', 'cutting', 'math'][Math.floor(Math.random() * 3)];
                        renderChallenge(gameMgr.generateChallenge(nextCat));
                    }, 2600);
                });
            });

            container.appendChild(card);
        }
    }

    function updateGameStatsUI() {
        document.getElementById('xpCount').textContent = gameMgr.xp;
        document.getElementById('playerLevel').textContent = `Nv. ${gameMgr.level}`;
    }

    // Chaveador de Painéis no Mobile
    function setupMobileSwitcher() {
        const leftPanel = document.querySelector('aside.panel.left-panel');
        const rightPanel = document.querySelector('aside.panel.right-panel');
        const buttons = document.querySelectorAll('.mobile-tab-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const target = btn.dataset.target;
                if (target === 'left') {
                    leftPanel.classList.remove('mobile-inactive');
                    leftPanel.classList.add('mobile-active');
                    rightPanel.classList.remove('mobile-active');
                    rightPanel.classList.add('mobile-inactive');
                } else {
                    rightPanel.classList.remove('mobile-inactive');
                    rightPanel.classList.add('mobile-active');
                    leftPanel.classList.remove('mobile-active');
                    leftPanel.classList.add('mobile-inactive');
                }
                if (window.sounds) window.sounds.playClick();
            });
        });
    }

    // Registra Eventos da Interface
    function setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchMode(btn.dataset.mode);
                if (window.sounds) window.sounds.playClick();
            });
        });

        document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn[data-view]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                sceneMgr.setViewMode(btn.dataset.view);
                if (window.sounds) window.sounds.playClick();
            });
        });

        const chkVertices = document.getElementById('chkVertices');
        const chkEdges = document.getElementById('chkEdges');
        const chkFaces = document.getElementById('chkFaces');

        const updateElements = () => {
            sceneMgr.setElementsVisibility(chkVertices.checked, chkEdges.checked, chkFaces.checked);
        };
        if (chkVertices) chkVertices.addEventListener('change', updateElements);
        if (chkEdges) chkEdges.addEventListener('change', updateElements);
        if (chkFaces) chkFaces.addEventListener('change', updateElements);

        const unfoldSlider = document.getElementById('unfoldSlider');
        if (unfoldSlider) {
            unfoldSlider.addEventListener('input', (e) => {
                const t = parseFloat(e.target.value);
                unfoldSys.setUnfoldProgress(t);
                document.getElementById('unfoldPercent').textContent = `${Math.round(t * 100)}%`;
            });
        }

        const cutHeightSlider = document.getElementById('cutHeightSlider');
        const cutAngleXSlider = document.getElementById('cutAngleXSlider');
        const cutAngleZSlider = document.getElementById('cutAngleZSlider');

        const updateCut = () => {
            const h = parseFloat(cutHeightSlider.value);
            const ax = parseFloat(cutAngleXSlider.value);
            const az = parseFloat(cutAngleZSlider.value);
            crossSection.setCut(h, ax, az);
        };
        if (cutHeightSlider) cutHeightSlider.addEventListener('input', updateCut);
        if (cutAngleXSlider) cutAngleXSlider.addEventListener('input', updateCut);
        if (cutAngleZSlider) cutAngleZSlider.addEventListener('input', updateCut);

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

        const btnToggleDimensions = document.getElementById('btnToggleDimensions');
        if (btnToggleDimensions) {
            btnToggleDimensions.addEventListener('click', () => {
                const isVisible = dimensionsHelper.toggle();
                btnToggleDimensions.classList.toggle('active', isVisible);
                if (window.sounds) window.sounds.playClick();
            });
        }

        document.getElementById('btnResetCamera').addEventListener('click', () => {
            sceneMgr.resetCamera();
            if (window.sounds) window.sounds.playClick();
        });

        const btnAutoRotate = document.getElementById('btnAutoRotate');
        btnAutoRotate.addEventListener('click', () => {
            sceneMgr.isAutoRotating = !sceneMgr.isAutoRotating;
            btnAutoRotate.classList.toggle('active', sceneMgr.isAutoRotating);
            if (window.sounds) window.sounds.playClick();
        });

        const btnAudio = document.getElementById('btnAudioToggle');
        btnAudio.addEventListener('click', () => {
            const isMuted = window.sounds.toggleMute();
            btnAudio.textContent = isMuted ? '🔇' : '🔊';
        });

        document.getElementById('btnFullscreen').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });

        window.onLiquidStateChange = (state) => {
            document.getElementById('liquidLevelText').textContent = `${state.height.toFixed(2)} m / ${state.maxHeight.toFixed(2)} m`;
            document.getElementById('liquidVolText').textContent = `${state.currentVolumeCm3.toFixed(2)} m³ (${(state.currentVolumeLiters).toLocaleString('pt-BR', {maximumFractionDigits:0})} L)`;
            document.getElementById('liquidPercentText').textContent = `${state.percentage.toFixed(0)}%`;
            document.getElementById('liquidBarFill').style.width = `${state.percentage}%`;

            if (liquidSlider) {
                liquidSlider.max = state.maxHeight;
                liquidSlider.value = state.height;
            }
        };

        window.onCrossSectionChange = (info) => {
            document.getElementById('crossSectionShapeName').textContent = info.shapeName;
            document.getElementById('crossSectionArea').textContent = info.estimatedArea;
            document.getElementById('crossSectionDesc').textContent = info.description;
        };
    }

    init();
});
