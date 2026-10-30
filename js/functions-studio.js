/**
 * =============================================================================
 * ESTÚDIO DE FUNÇÕES MATEMÁTICAS & SÓLIDOS 3D (GEOLAB 3D)
 * Módulo 1: Função Exponencial (f(x) = a·b^x + c)
 * Módulo 2: Função Logarítmica (f(x) = a·log_b(x - h) + c)
 * =============================================================================
 */

class FunctionsStudio {
    constructor(sceneMgr, engineerGuide, gameMgr, liquidSim, buildingStudio) {
        this.sceneMgr = sceneMgr;
        this.engineerGuide = engineerGuide;
        this.gameMgr = gameMgr;
        this.liquidSim = liquidSim;
        this.buildingStudio = buildingStudio;

        this.activeType = 'exponential'; // 'exponential' | 'logarithmic'
        this.currentStep = 1; // 1: Gráfico, 2: Exercícios, 3: Realidade 3D, 4: Hipóteses

        // Parâmetros da Função Exponencial: f(x) = a · b^x + c
        this.expParams = {
            b: 2.0,      // Base
            a: 1.0,      // Multiplicador
            c: 0.0,      // Assíntota horizontal y = c
            xPoint: 1.0  // Ponto de exploração
        };

        // Parâmetros da Função Logarítmica: f(x) = a · log_b(x - h) + c
        this.logParams = {
            b: 2.0,      // Base
            a: 1.0,      // Multiplicador
            h: 0.0,      // Assíntota vertical x = h
            c: 0.0,      // Deslocamento vertical
            xPoint: 2.0  // Ponto de exploração (deve ser > h)
        };

        // Estado do Gráfico
        this.showInverse = false;
        this.isGraphMinimized = false;
        this.isDraggingPoint = false;
        this.isSplit3D = false;
        this.seismicAnimationId = null;

        // Progresso e gamificação de exercícios e hipóteses
        this.solvedExercises = new Set();
        this.solvedHypotheses = new Set();
        this.completedMissions = new Set(JSON.parse(localStorage.getItem('geolab_completed_notebook_missions') || '[]'));
        this.currentMissionFilter = 'all';
        this.mindMapZoom = 1.0;

        this.initNotebookMissionsData();

        // Limites dos eixos cartesianos
        this.viewBounds = {
            minX: -5,
            maxX: 5,
            minY: -4,
            maxY: 6
        };

        this.initDOM();
    }

    awardXP(amount, reason = '') {
        if (!this.gameMgr && window.gameMgr) {
            this.gameMgr = window.gameMgr;
        }
        if (this.gameMgr) {
            if (typeof this.gameMgr.addXP === 'function') {
                this.gameMgr.addXP(amount);
            } else if (typeof this.gameMgr.addXp === 'function') {
                this.gameMgr.addXp(amount);
            }
            const xpEl = document.getElementById('xpCount');
            if (xpEl) xpEl.textContent = this.gameMgr.xp;

            if (reason && typeof this.gameMgr.showNotification === 'function') {
                this.gameMgr.showNotification(`🎉 +${amount} XP! ${reason}`);
            }
        }
    }

    initDOM() {
        this.canvas = document.getElementById('functionPlotCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvasEvents();
        }

        // Redimensionamento responsivo do Canvas cartesiano
        window.addEventListener('resize', () => {
            if (this.canvas && (document.body.classList.contains('mode-exp_func') || document.body.classList.contains('mode-log_func'))) {
                this.resizeCanvas();
                this.renderGraph();
            }
        });

        // Alternar visualização dividida com o sólido 3D
        const btnSplit3D = document.getElementById('btnToggleSplit3D');
        if (btnSplit3D) {
            btnSplit3D.addEventListener('click', () => {
                this.toggleSplit3D();
                if (window.sounds) window.sounds.playClick();
            });
        }

        // Navegador de etapas (1 a 4)
        document.querySelectorAll('.func-step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = parseInt(btn.dataset.step);
                this.setStep(step);
                if (window.sounds) window.sounds.playClick();
            });
        });

        // Controles de sliders da etapa 1
        const sliderBase = document.getElementById('funcSliderBase');
        if (sliderBase) {
            sliderBase.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (this.activeType === 'exponential') {
                    this.expParams.b = Math.max(0.1, val);
                } else {
                    this.logParams.b = Math.max(0.2, val);
                }
                this.updateUI();
            });
        }

        const sliderA = document.getElementById('funcSliderA');
        if (sliderA) {
            sliderA.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (this.activeType === 'exponential') {
                    this.expParams.a = val === 0 ? 0.1 : val;
                } else {
                    this.logParams.a = val === 0 ? 0.1 : val;
                }
                this.updateUI();
            });
        }

        const sliderShift = document.getElementById('funcSliderShift');
        if (sliderShift) {
            sliderShift.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (this.activeType === 'exponential') {
                    this.expParams.c = val;
                } else {
                    this.logParams.h = val;
                    // Garante que xPoint > h
                    if (this.logParams.xPoint <= this.logParams.h) {
                        this.logParams.xPoint = this.logParams.h + 0.5;
                        const ptSlider = document.getElementById('funcSliderPointX');
                        if (ptSlider) ptSlider.value = this.logParams.xPoint;
                    }
                }
                this.updateUI();
            });
        }

        const sliderPointX = document.getElementById('funcSliderPointX');
        if (sliderPointX) {
            sliderPointX.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (this.activeType === 'exponential') {
                    this.expParams.xPoint = val;
                } else {
                    this.logParams.xPoint = Math.max(this.logParams.h + 0.1, val);
                }
                this.updateUI();
            });
        }

        // Botões de ferramentas do gráfico
        const btnResetZoom = document.getElementById('btnToggleGraphZoomReset');
        if (btnResetZoom) {
            btnResetZoom.addEventListener('click', () => {
                this.viewBounds = { minX: -5, maxX: 5, minY: -4, maxY: 6 };
                this.renderGraph();
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnInverse = document.getElementById('btnToggleInverseCurve');
        if (btnInverse) {
            btnInverse.addEventListener('click', () => {
                this.showInverse = !this.showInverse;
                btnInverse.classList.toggle('active', this.showInverse);
                this.renderGraph();
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnMinimize = document.getElementById('btnMinimizeGraph');
        if (btnMinimize) {
            btnMinimize.addEventListener('click', () => {
                this.isGraphMinimized = !this.isGraphMinimized;
                const overlay = document.getElementById('functionGraphOverlay');
                if (overlay) overlay.classList.toggle('minimized', this.isGraphMinimized);
                btnMinimize.textContent = this.isGraphMinimized ? '🗖' : '🗕';
                if (!this.isGraphMinimized) this.renderGraph();
            });
        }

        // Botões para reabrir a explicação didática do Engenheiro Leo no centro da tela
        const btnBriefing = document.getElementById('btnFuncEngineerBriefing');
        if (btnBriefing) {
            btnBriefing.addEventListener('click', () => {
                if (this.engineerGuide && typeof this.engineerGuide.showFunctionBriefing === 'function') {
                    this.engineerGuide.showFunctionBriefing(this.activeType);
                }
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnGraphHelp = document.getElementById('btnGraphEngineerHelp');
        if (btnGraphHelp) {
            btnGraphHelp.addEventListener('click', () => {
                if (this.engineerGuide && typeof this.engineerGuide.showFunctionBriefing === 'function') {
                    this.engineerGuide.showFunctionBriefing(this.activeType);
                }
                if (window.sounds) window.sounds.playClick();
            });
        }

        // Botões para abrir as Missões do Caderno
        const btnMissionsLeft = document.getElementById('btnFuncOpenMissions');
        if (btnMissionsLeft) {
            btnMissionsLeft.addEventListener('click', () => {
                this.openMissionsModal();
                if (window.sounds) window.sounds.playClick();
            });
        }
        const btnGraphMissions = document.getElementById('btnGraphMissions');
        if (btnGraphMissions) {
            btnGraphMissions.addEventListener('click', () => {
                this.openMissionsModal();
                if (window.sounds) window.sounds.playClick();
            });
        }

        // Botões para abrir o Mapa Mental
        const btnMindMapLeft = document.getElementById('btnFuncOpenMindMap');
        if (btnMindMapLeft) {
            btnMindMapLeft.addEventListener('click', () => {
                this.openMindMapModal();
                if (window.sounds) window.sounds.playClick();
            });
        }
        const btnGraphMindMap = document.getElementById('btnGraphMindMap');
        if (btnGraphMindMap) {
            btnGraphMindMap.addEventListener('click', () => {
                this.openMindMapModal();
                if (window.sounds) window.sounds.playClick();
            });
        }

        // Inicializa Janela Draggable, Modal de Missões e Modal de Mapa Mental
        this.setupDraggableOverlay();
        this.setupMissionsModal();
        this.setupMindMapModal();
    }

    setupCanvasEvents() {
        if (!this.canvas) return;

        const handlePointer = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width <= 0) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const xPercent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            let mathX = this.viewBounds.minX + xPercent * (this.viewBounds.maxX - this.viewBounds.minX);

            if (this.activeType === 'exponential') {
                this.expParams.xPoint = parseFloat(mathX.toFixed(2));
            } else {
                mathX = Math.max(this.logParams.h + 0.1, mathX);
                this.logParams.xPoint = parseFloat(mathX.toFixed(2));
            }

            const sliderPt = document.getElementById('funcSliderPointX');
            if (sliderPt) sliderPt.value = this.activeType === 'exponential' ? this.expParams.xPoint : this.logParams.xPoint;

            this.updateUI();
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDraggingPoint = true;
            handlePointer(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDraggingPoint) handlePointer(e);
        });

        window.addEventListener('mouseup', () => {
            this.isDraggingPoint = false;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            this.isDraggingPoint = true;
            handlePointer(e);
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDraggingPoint) handlePointer(e);
        }, { passive: true });

        this.canvas.addEventListener('touchend', () => {
            this.isDraggingPoint = false;
        });
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            const dpr = window.devicePixelRatio || 1;
            const targetW = Math.round(rect.width * dpr);
            const targetH = Math.round(rect.height * dpr);
            if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
                this.canvas.width = targetW;
                this.canvas.height = targetH;
            }
        }
    }

    toggleSplit3D() {
        this.isSplit3D = !this.isSplit3D;
        if (this.isSplit3D) {
            this.setupRealitySolid();
        }
        this.updateSplit3DMode();
    }

    setupRealitySolid() {
        if (this.activeType === 'exponential') {
            if (window.switchSolidGlobal) {
                window.switchSolidGlobal('cylinder', { r: 2.0, h: 6.0 });
            }
            if (this.liquidSim) {
                this.liquidSim.setSolid('cylinder', { r: 2.0, h: 6.0 });
            }
            if (this.sceneMgr && this.sceneMgr.faucetGroup) {
                this.sceneMgr.faucetGroup.visible = true;
            }
            // Deixa o cilindro translúcido (Raio-X Didático) para enxergar perfeitamente o líquido subindo
            if (this.sceneMgr && this.sceneMgr.solidGroup) {
                this.sceneMgr.solidGroup.visible = true;
                this.sceneMgr.solidGroup.scale.set(1, 1, 1);
                this.sceneMgr.solidGroup.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = 0.25;
                        child.material.depthWrite = false;
                        child.material.needsUpdate = true;
                    }
                });
            }
        } else {
            if (window.switchSolidGlobal) {
                window.switchSolidGlobal('rectangular_prism', { a: 6.0, b: 5.0, c: 8.0 });
                if (this.buildingStudio) {
                    this.buildingStudio.setActive(true);
                    this.buildingStudio.buildBuilding({ a: 6.0, b: 5.0, c: 8.0 });
                }
            }
            if (this.sceneMgr && this.sceneMgr.solidGroup) {
                this.sceneMgr.solidGroup.visible = true;
            }
        }
    }

    updateSplit3DMode() {
        const overlay = document.getElementById('functionGraphOverlay');
        const btnSplit = document.getElementById('btnToggleSplit3D');

        if (overlay) {
            overlay.classList.toggle('split-3d', !!this.isSplit3D);
        }
        if (btnSplit) {
            btnSplit.classList.toggle('active', !!this.isSplit3D);
            btnSplit.innerHTML = this.isSplit3D ? '📊 Gráfico Cheio' : '👁️ Sólido 3D';
        }

        if (this.sceneMgr && this.sceneMgr.solidGroup) {
            this.sceneMgr.solidGroup.visible = !!this.isSplit3D;
        }

        setTimeout(() => {
            this.resizeCanvas();
            this.renderGraph();
        }, 50);
    }

    /**
     * Ativa o módulo específico (exponencial ou logarítmica)
     * Foco 100% no gráfico cartesiano sem abrir os sólidos tridimensionais
     */
    activate(type = 'exponential') {
        this.activeType = type;
        this.showInverse = false;
        this.currentStep = 1;
        this.isSplit3D = false;

        const overlay = document.getElementById('functionGraphOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.remove('split-3d');
        }

        const leftSub = document.getElementById('subpanel-functions-left');
        if (leftSub) leftSub.classList.remove('hidden');

        const rightSub = document.getElementById('subpanel-functions-right');
        if (rightSub) rightSub.classList.remove('hidden');

        // Garante que o sólido 3D não apareça em segundo plano durante o estudo do gráfico
        if (this.sceneMgr && this.sceneMgr.solidGroup) {
            this.sceneMgr.solidGroup.visible = false;
        }

        // Configura visuais do módulo
        const iconEl = document.getElementById('funcModuleIcon');
        const titleEl = document.getElementById('funcModuleTitle');
        const subEl = document.getElementById('funcModuleSubtitle');
        const shiftLabel = document.getElementById('funcShiftLabel');
        const btnInverse = document.getElementById('btnToggleInverseCurve');
        if (btnInverse) btnInverse.classList.remove('active');

        const btnSplit = document.getElementById('btnToggleSplit3D');
        if (btnSplit) {
            btnSplit.classList.remove('active');
            btnSplit.innerHTML = '👁️ Sólido 3D';
        }

        if (type === 'exponential') {
            if (iconEl) iconEl.textContent = '📈';
            if (titleEl) titleEl.textContent = 'Função Exponencial';
            if (subEl) subEl.textContent = 'Crescimento Rápido, Potências & Volume 3D';
            if (shiftLabel) shiftLabel.innerHTML = 'Assíntota Horizontal <b>(c)</b>:';
            this.viewBounds = { minX: -4, maxX: 4, minY: -2, maxY: 8 };
        } else {
            if (iconEl) iconEl.textContent = '📉';
            if (titleEl) titleEl.textContent = 'Função Logarítmica';
            if (subEl) subEl.textContent = 'A Inversa, Escala Richter & Abalo Sísmico 3D';
            if (shiftLabel) shiftLabel.innerHTML = 'Assíntota Vertical <b>(h)</b>:';
            this.viewBounds = { minX: -2, maxX: 8, minY: -4, maxY: 5 };
        }

        this.renderPresets();
        this.setStep(1);
        this.updateUI();

        setTimeout(() => {
            this.resizeCanvas();
            this.renderGraph();
        }, 60);

        // Apresentação didática do Engenheiro Leo no centro da tela com calma
        if (this.engineerGuide && typeof this.engineerGuide.showFunctionBriefing === 'function') {
            setTimeout(() => {
                this.engineerGuide.showFunctionBriefing(type);
            }, 120);
        }
    }

    deactivate() {
        const overlay = document.getElementById('functionGraphOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('split-3d');
        }

        const leftSub = document.getElementById('subpanel-functions-left');
        if (leftSub) leftSub.classList.add('hidden');

        const rightSub = document.getElementById('subpanel-functions-right');
        if (rightSub) rightSub.classList.add('hidden');

        if (this.engineerGuide && typeof this.engineerGuide.hideCenterBriefing === 'function') {
            this.engineerGuide.hideCenterBriefing();
        }

        if (this.seismicAnimationId) {
            cancelAnimationFrame(this.seismicAnimationId);
            this.seismicAnimationId = null;
        }

        // Restaura o sólido 3D para os outros modos normais do laboratório e carreira
        if (this.sceneMgr && this.sceneMgr.solidGroup) {
            this.sceneMgr.solidGroup.visible = true;
            this.sceneMgr.solidGroup.position.set(0, 0, 0);
            this.sceneMgr.solidGroup.rotation.set(0, 0, 0);
            this.sceneMgr.solidGroup.scale.set(1, 1, 1);
        }
    }

    setStep(stepNum) {
        this.currentStep = stepNum;

        // Atualiza botões
        document.querySelectorAll('.func-step-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.step) === stepNum);
        });

        // Alterna blocos de conteúdo
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`funcStepContent${i}`);
            if (el) el.classList.toggle('hidden', i !== stepNum);
        }

        // Se for a etapa 3 (Aplicação à Realidade / Sólido 3D), ativa o sólido 3D em modo dividido
        if (stepNum === 3) {
            this.isSplit3D = true;
            this.setupRealitySolid();
            this.updateSplit3DMode();
            this.renderRealityCase();
        } else {
            // Nas etapas 1 (Gráfico), 2 (Exercícios) e 4 (Hipóteses), foco 100% no gráfico cartesiano
            this.isSplit3D = false;
            this.updateSplit3DMode();
            if (this.seismicAnimationId) {
                cancelAnimationFrame(this.seismicAnimationId);
                this.seismicAnimationId = null;
            }
        }

        if (stepNum === 2) this.renderExercises();
        if (stepNum === 4) this.renderHypothesisLab();

        this.updateUI();
    }

    renderPresets() {
        const row = document.getElementById('funcPresetsRow');
        if (!row) return;

        let presets = [];
        if (this.activeType === 'exponential') {
            presets = [
                { label: 'f(x) = 2ˣ', b: 2.0, a: 1.0, c: 0.0 },
                { label: 'f(x) = 3ˣ', b: 3.0, a: 1.0, c: 0.0 },
                { label: 'f(x) = (0.5)ˣ', b: 0.5, a: 1.0, c: 0.0 },
                { label: 'f(x) = 2ˣ - 2', b: 2.0, a: 1.0, c: -2.0 }
            ];
        } else {
            presets = [
                { label: 'f(x) = log₂(x)', b: 2.0, a: 1.0, h: 0.0, c: 0.0 },
                { label: 'f(x) = log₁₀(x)', b: 10.0, a: 1.0, h: 0.0, c: 0.0 },
                { label: 'f(x) = ln(x)', b: 2.72, a: 1.0, h: 0.0, c: 0.0 },
                { label: 'f(x) = log₂(x - 1)', b: 2.0, a: 1.0, h: 1.0, c: 0.0 }
            ];
        }

        row.innerHTML = presets.map((p, idx) => `
            <button class="preset-pill-btn" data-preset-idx="${idx}">${p.label}</button>
        `).join('');

        row.querySelectorAll('.preset-pill-btn').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                const p = presets[idx];
                if (this.activeType === 'exponential') {
                    this.expParams.b = p.b;
                    this.expParams.a = p.a;
                    this.expParams.c = p.c;
                } else {
                    this.logParams.b = p.b;
                    this.logParams.a = p.a;
                    this.logParams.h = p.h;
                    this.logParams.c = p.c;
                    this.logParams.xPoint = Math.max(p.h + 1, 2.0);
                }
                this.syncSlidersFromParams();
                this.updateUI();
                if (window.sounds) window.sounds.playClick();
            });
        });
    }

    syncSlidersFromParams() {
        const isExp = this.activeType === 'exponential';
        const p = isExp ? this.expParams : this.logParams;

        const sliderBase = document.getElementById('funcSliderBase');
        if (sliderBase) sliderBase.value = p.b;

        const sliderA = document.getElementById('funcSliderA');
        if (sliderA) sliderA.value = p.a;

        const sliderShift = document.getElementById('funcSliderShift');
        if (sliderShift) sliderShift.value = isExp ? p.c : p.h;

        const sliderPt = document.getElementById('funcSliderPointX');
        if (sliderPt) sliderPt.value = p.xPoint;
    }

    // Avaliação matemática da função f(x)
    evaluate(x) {
        if (this.activeType === 'exponential') {
            const { b, a, c } = this.expParams;
            return a * Math.pow(b, x) + c;
        } else {
            const { b, a, h, c } = this.logParams;
            const diff = x - h;
            if (diff <= 0) return NaN;
            return a * (Math.log(diff) / Math.log(b)) + c;
        }
    }

    // Avaliação da função inversa
    evaluateInverse(x) {
        if (this.activeType === 'exponential') {
            // Inversa de a·b^x + c: y = log_b((x - c)/a)
            const { b, a, c } = this.expParams;
            const inner = (x - c) / a;
            if (inner <= 0) return NaN;
            return Math.log(inner) / Math.log(b);
        } else {
            // Inversa de a·log_b(x - h) + c: y = b^((x - c)/a) + h
            const { b, a, h, c } = this.logParams;
            const exponent = (x - c) / a;
            return Math.pow(b, exponent) + h;
        }
    }

    updateUI() {
        const isExp = this.activeType === 'exponential';
        const p = isExp ? this.expParams : this.logParams;

        // Atualiza badges numéricos dos sliders
        const valBase = document.getElementById('funcValBase');
        if (valBase) valBase.textContent = `b = ${p.b.toFixed(1)}`;

        const valA = document.getElementById('funcValA');
        if (valA) valA.textContent = `a = ${p.a.toFixed(1)}`;

        const valShift = document.getElementById('funcValShift');
        if (valShift) valShift.textContent = isExp ? `c = ${p.c.toFixed(1)}` : `h = ${p.h.toFixed(1)}`;

        const valPt = document.getElementById('funcValPointX');
        if (valPt) valPt.textContent = `x = ${p.xPoint.toFixed(1)}`;

        // Tag de comportamento crescente / decrescente
        const behaviorTag = document.getElementById('funcBehaviorTag');
        const isIncreasing = isExp ? (p.b > 1 && p.a > 0) : (p.b > 1 && p.a > 0);
        if (behaviorTag) {
            behaviorTag.className = isIncreasing ? 'param-behavior-tag text-cyan' : 'param-behavior-tag text-amber';
            behaviorTag.textContent = isIncreasing ? '📈 Função Crescente' : '📉 Função Decrescente';
        }

        // Atualiza fórmulas e propriedades analíticas
        this.updateFormulasAndProperties();

        // Renderiza o gráfico cartesiano
        this.renderGraph();

        // Sincroniza o sólido 3D
        this.syncSolidWithFunction();
    }

    updateFormulasAndProperties() {
        const isExp = this.activeType === 'exponential';
        const p = isExp ? this.expParams : this.logParams;

        // Construção da string da fórmula
        let formulaStr = '';
        if (isExp) {
            const aStr = p.a === 1 ? '' : p.a === -1 ? '-' : `${p.a} · `;
            const cStr = p.c === 0 ? '' : p.c > 0 ? ` + ${p.c}` : ` - ${Math.abs(p.c)}`;
            formulaStr = `f(x) = ${aStr}${p.b}ˣ${cStr}`;
        } else {
            const aStr = p.a === 1 ? '' : p.a === -1 ? '-' : `${p.a} · `;
            const hStr = p.h === 0 ? 'x' : p.h > 0 ? `(x - ${p.h})` : `(x + ${Math.abs(p.h)})`;
            const cStr = p.c === 0 ? '' : p.c > 0 ? ` + ${p.c}` : ` - ${Math.abs(p.c)}`;
            const baseStr = p.b === 10 ? '' : p.b === 2.72 ? 'ln' : `log_${p.b}`;
            const logName = p.b === 2.72 ? `ln${hStr}` : p.b === 10 ? `log${hStr}` : `log_${p.b}${hStr}`;
            formulaStr = `f(x) = ${aStr}${logName}${cStr}`;
        }

        // Títulos e fórmulas no DOM
        const headerPreview = document.getElementById('graphFunctionFormulaPreview');
        if (headerPreview) headerPreview.textContent = formulaStr;

        const activeFormulaDisplay = document.getElementById('funcActiveFormulaDisplay');
        if (activeFormulaDisplay) activeFormulaDisplay.textContent = formulaStr;

        const formulaName = document.getElementById('funcActiveFormulaName');
        if (formulaName) {
            if (isExp) {
                formulaName.textContent = p.b > 1 ? 'Crescimento Exponencial Rápido' : 'Decaimento Exponencial Suave';
            } else {
                formulaName.textContent = p.b === 10 ? 'Escala Decimal (Richter / Decibéis)' : 'Função Logarítmica Canônica';
            }
        }

        // Propriedades
        const propDom = document.getElementById('propDomainVal');
        const propIm = document.getElementById('propImageVal');
        const propAsymptote = document.getElementById('propAsymptoteVal');
        const propIntercept = document.getElementById('propInterceptYVal');
        const propRoot = document.getElementById('propRootVal');

        if (isExp) {
            if (propDom) propDom.textContent = 'ℝ (todos os reais)';
            if (propIm) propIm.textContent = p.a > 0 ? `]${p.c}, +∞[` : `]-∞, ${p.c}[`;
            if (propAsymptote) propAsymptote.textContent = `Horizontal em y = ${p.c}`;
            
            const y0 = this.evaluate(0);
            if (propIntercept) propIntercept.textContent = `(0, ${y0.toFixed(2)})`;
            
            // Raiz: a·b^x + c = 0 => b^x = -c/a
            const rootTarget = -p.c / p.a;
            if (rootTarget > 0) {
                const rx = Math.log(rootTarget) / Math.log(p.b);
                if (propRoot) propRoot.textContent = `x = ${rx.toFixed(2)}`;
            } else {
                if (propRoot) propRoot.textContent = 'Não toca o eixo X';
            }
        } else {
            if (propDom) propDom.textContent = `]${p.h}, +∞[ (x > ${p.h})`;
            if (propIm) propIm.textContent = 'ℝ (todos os reais)';
            if (propAsymptote) propAsymptote.textContent = `Vertical em x = ${p.h}`;
            
            const interceptVal = this.evaluate(0);
            if (propIntercept) propIntercept.textContent = isNaN(interceptVal) ? 'Não existe (x > h)' : `(0, ${interceptVal.toFixed(2)})`;

            // Raiz: log_b(x - h) = -c/a => x = b^(-c/a) + h
            const rx = Math.pow(p.b, -p.c / p.a) + p.h;
            if (propRoot) propRoot.textContent = `x = ${rx.toFixed(2)}`;
        }

        // Tabela de Valores
        this.renderValuesTable();

        // Conexão com sólidos no painel direito
        this.renderSolidLinkExplanation();
    }

    renderValuesTable() {
        const tbody = document.getElementById('funcValuesTableBody');
        if (!tbody) return;

        let testXs = [];
        if (this.activeType === 'exponential') {
            testXs = [-2, -1, 0, 1, 2, 3];
        } else {
            const h = this.logParams.h;
            testXs = [h + 0.5, h + 1, h + 2, h + 4, h + 8];
        }

        tbody.innerHTML = testXs.map(x => {
            const y = this.evaluate(x);
            const yStr = isNaN(y) ? 'Indefinido' : y.toFixed(2);
            const isHighlighted = Math.abs(x - (this.activeType === 'exponential' ? this.expParams.xPoint : this.logParams.xPoint)) < 0.2;
            return `
                <tr class="${isHighlighted ? 'active-row' : ''}">
                    <td><b>${x.toFixed(1)}</b></td>
                    <td>${yStr}</td>
                    <td><span class="coord-tag">(${x.toFixed(1)}, ${yStr})</span></td>
                </tr>
            `;
        }).join('');
    }

    renderSolidLinkExplanation() {
        const body = document.getElementById('funcSolidLinkBody');
        if (!body) return;

        if (this.activeType === 'exponential') {
            body.innerHTML = `
                <div style="font-size:0.8rem; line-height:1.45; color:#e2e8f0;">
                    <b>💡 O Crescimento Cúbico e a Exponencial:</b><br>
                    Na geometria espacial, se você dobra as dimensões de um sólido (fator $2$), o volume cresce com $2^3 = 8$!<br>
                    No tanque 3D ao lado, a vazão de líquido segue uma injeção exponencial de biomassa: 
                    <span style="color:var(--accent-cyan); font-weight:700;">V(t) = 125 · 2ᵗ Litros</span>.
                    Em apenas 3 passos, o volume salta de 125 L para <b>1.000 Litros (1 m³)</b>!
                </div>
            `;
        } else {
            body.innerHTML = `
                <div style="font-size:0.8rem; line-height:1.45; color:#e2e8f0;">
                    <b>💡 A Desaceleração Logarítmica & Estruturas 3D:</b><br>
                    A função logarítmica é a <b>inversa</b> da exponencial: enquanto a energia sísmica liberada por uma falha tectônica cresce por potências de 10, a magnitude na Escala Richter cresce linearmente:
                    <span style="color:var(--accent-cyan); font-weight:700;">M = ⅔ · log₁₀(E / 10³)</span>.<br>
                    Observe o Edifício 3D: cada grau a mais de magnitude exige <b>31,6 vezes mais energia</b>!
                </div>
            `;
        }
    }

    /**
     * Renderização do Gráfico Cartesiano no Canvas HTML5
     */
    renderGraph() {
        if (!this.canvas || !this.ctx || this.isGraphMinimized) return;
        this.resizeCanvas();
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const { minX, maxX, minY, maxY } = this.viewBounds;

        // Limpa fundo
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        const toPixelX = (x) => ((x - minX) / (maxX - minX)) * w;
        const toPixelY = (y) => h - ((y - minY) / (maxY - minY)) * h;

        // 1. Grid Cartesiano Suave
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
            const px = toPixelX(x);
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.stroke();
        }
        for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
            const py = toPixelY(y);
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();
        }

        // 2. Eixos Principais (X e Y)
        const originX = toPixelX(0);
        const originY = toPixelY(0);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.6;

        // Eixo X
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(w, originY);
        ctx.stroke();

        // Eixo Y
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, h);
        ctx.stroke();

        // Números nas graduações
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
            if (x === 0) continue;
            const px = toPixelX(x);
            ctx.fillText(x.toString(), px, Math.min(h - 14, Math.max(2, originY + 4)));
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
            if (y === 0) continue;
            const py = toPixelY(y);
            ctx.fillText(y.toString(), Math.max(16, Math.min(w - 4, originX - 4)), py);
        }

        // 3. Assíntota (Horizontal na Exp, Vertical no Log)
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;

        if (this.activeType === 'exponential') {
            const asyY = toPixelY(this.expParams.c);
            ctx.beginPath();
            ctx.moveTo(0, asyY);
            ctx.lineTo(w, asyY);
            ctx.stroke();

            ctx.fillStyle = '#facc15';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Assíntota: y = ${this.expParams.c}`, 8, asyY - 8);
        } else {
            const asyX = toPixelX(this.logParams.h);
            ctx.beginPath();
            ctx.moveTo(asyX, 0);
            ctx.lineTo(asyX, h);
            ctx.stroke();

            ctx.fillStyle = '#facc15';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Assíntota: x = ${this.logParams.h}`, asyX + 6, 18);
        }
        ctx.restore();

        // 4. Se ativa, plota a diagonal y = x e a curva inversa!
        if (this.showInverse) {
            // Reta y = x
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(toPixelX(minX), toPixelY(minX));
            ctx.lineTo(toPixelX(maxX), toPixelY(maxX));
            ctx.stroke();
            ctx.fillStyle = 'rgba(192, 132, 252, 0.8)';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText('y = x (Espelho)', toPixelX(2.5), toPixelY(2.8));
            ctx.restore();

            // Curva inversa (Roxa)
            ctx.save();
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            let firstInv = true;
            for (let px = 0; px <= w; px += 2) {
                const mathX = minX + (px / w) * (maxX - minX);
                const invY = this.evaluateInverse(mathX);
                if (!isNaN(invY) && invY >= minY - 5 && invY <= maxY + 5) {
                    const py = toPixelY(invY);
                    if (firstInv) {
                        ctx.moveTo(px, py);
                        firstInv = false;
                    } else {
                        ctx.lineTo(px, py);
                    }
                } else {
                    firstInv = true;
                }
            }
            ctx.stroke();
            ctx.restore();
        }

        // 5. Curva Principal da Função (Azul Neon Brilhante)
        ctx.save();
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;

        ctx.beginPath();
        let first = true;
        for (let px = 0; px <= w; px += 2) {
            const mathX = minX + (px / w) * (maxX - minX);
            const mathY = this.evaluate(mathX);
            if (!isNaN(mathY) && mathY >= minY - 4 && mathY <= maxY + 4) {
                const py = toPixelY(mathY);
                if (first) {
                    ctx.moveTo(px, py);
                    first = false;
                } else {
                    ctx.lineTo(px, py);
                }
            } else {
                first = true;
            }
        }
        ctx.stroke();
        ctx.restore();

        // 6. Ponto Móvel P(x, y) de Exploração
        const curX = this.activeType === 'exponential' ? this.expParams.xPoint : this.logParams.xPoint;
        const curY = this.evaluate(curX);

        if (!isNaN(curY)) {
            const pX = toPixelX(curX);
            const pY = toPixelY(curY);

            // Linhas de projeção pontilhadas aos eixos
            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.beginPath();
            ctx.moveTo(pX, originY);
            ctx.lineTo(pX, pY);
            ctx.lineTo(originX, pY);
            ctx.stroke();
            ctx.restore();

            // Ponto com auréola pulsante
            ctx.save();
            ctx.fillStyle = '#00f2fe';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(pX, pY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pX, pY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Badge flutuante sobre o ponto
            const ptCoords = document.getElementById('graphPointCoords');
            if (ptCoords) ptCoords.textContent = `P(${curX.toFixed(1)}, ${curY.toFixed(2)})`;

            const asyVal = document.getElementById('graphAsymptoteVal');
            if (asyVal) {
                asyVal.textContent = this.activeType === 'exponential' ? `y = ${this.expParams.c}` : `x = ${this.logParams.h}`;
            }

            const behVal = document.getElementById('graphBehaviorVal');
            if (behVal) {
                const isInc = this.activeType === 'exponential' ? this.expParams.b > 1 : this.logParams.b > 1;
                behVal.textContent = isInc ? 'Crescente ↗' : 'Decrescente ↘';
            }
        }
    }

    /**
     * Sincronização 3D da função matemática com o modelo Three.js
     */
    syncSolidWithFunction() {
        if (!this.sceneMgr || !this.sceneMgr.solidGroup || !this.isSplit3D) return;

        const curX = this.activeType === 'exponential' ? this.expParams.xPoint : this.logParams.xPoint;
        const curY = this.evaluate(curX);
        const syncBadge = document.getElementById('graphSolidSyncText');

        if (this.activeType === 'exponential') {
            // Na exponencial: o cilindro enche proporcionalmente a f(x)
            // Normaliza y entre 0 e 1000 Litros
            const clampedY = Math.max(0.05, Math.min(10, isNaN(curY) ? 1 : curY));
            const volumeLitros = (clampedY * 125).toFixed(0);

            if (syncBadge) syncBadge.textContent = `Volume = ${volumeLitros} Litros`;

            // Escala suave do cilindro ou líquido
            const targetScaleY = Math.min(2.0, Math.max(0.2, clampedY / 4));
            this.sceneMgr.solidGroup.scale.set(1, targetScaleY, 1);
        } else {
            // No logaritmo: magnitude sísmica calculada
            const magnitude = Math.max(0, Math.min(6, isNaN(curY) ? 1 : curY));
            if (syncBadge) syncBadge.textContent = `Abalo Sísmico: M = ${magnitude.toFixed(1)}`;
        }
    }

    /**
     * Etapa 2: Exercícios Elementares de Fixação
     */
    renderExercises() {
        const container = document.getElementById('funcExercisesContainer');
        if (!container) return;

        this.solvedExercises = this.solvedExercises || new Set();

        const isExp = this.activeType === 'exponential';
        const exercises = isExp ? [
            {
                id: 'exp_ex1',
                question: '1. Dada a função <b>f(x) = 2ˣ</b>, qual é o valor de <b>f(3)</b>? <i>(ou seja: 2 × 2 × 2)</i>',
                expected: 8
            },
            {
                id: 'exp_ex2',
                question: '2. Para a função <b>f(x) = 2ˣ</b>, qual é o valor de <b>f(0)</b>? <i>(Lembre-se: todo número não nulo elevado a 0 vale...)</i>',
                expected: 1
            },
            {
                id: 'exp_ex3',
                question: '3. Para a função <b>f(x) = 2ˣ</b>, calcule o valor de <b>f(2)</b>: <i>(ou seja: 2² = 2 × 2)</i>',
                expected: 4
            }
        ] : [
            {
                id: 'log_ex1',
                question: '1. Calcule o valor de <b>log₂(16)</b> (a potência à qual 2 deve ser elevado para resultar em 16):',
                expected: 4
            },
            {
                id: 'log_ex2',
                question: '2. Qual é a raiz da função canônica <b>f(x) = log₁₀(x)</b> (ou seja, quando f(x) = 0)?',
                expected: 1
            },
            {
                id: 'log_ex3',
                question: '3. Na função <b>f(x) = log₂(x - 3)</b>, qual é o valor de <b>x</b> da assíntota vertical?',
                expected: 3
            }
        ];

        const solvedCount = exercises.filter(ex => this.solvedExercises.has(ex.id)).length;

        let html = `
            <div class="exercise-progress-banner">
                <span>🏆 Progresso dos Exercícios: <b>${solvedCount} de ${exercises.length} Concluídos</b></span>
                <span class="text-cyan font-mono" style="font-weight:700;">+${solvedCount * 50} XP</span>
            </div>
        `;

        html += exercises.map(ex => {
            const isSolved = this.solvedExercises.has(ex.id);
            return `
                <div class="exercise-item-card" id="card_${ex.id}">
                    <div class="exercise-question">${ex.question}</div>
                    <div class="exercise-input-row">
                        <input type="number" step="0.01" class="exercise-input" id="inp_${ex.id}" 
                            placeholder="Digite sua resposta" ${isSolved ? `disabled value="${ex.expected}"` : ''}>
                        <button class="btn-check-exercise ${isSolved ? 'btn-solved' : ''}" data-ex-id="${ex.id}" ${isSolved ? 'disabled' : ''}>
                            ${isSolved ? '✓ Resolvido' : 'Conferir'}
                        </button>
                    </div>
                    <div class="exercise-feedback ${isSolved ? 'success' : 'hidden'}" id="fb_${ex.id}">
                        ${isSolved ? '🎉 <b>Resposta correta! Parabéns!</b> (+50 XP)' : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        container.querySelectorAll('.btn-check-exercise').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                const ex = exercises[idx];
                if (this.solvedExercises.has(ex.id)) return;

                const input = document.getElementById(`inp_${ex.id}`);
                const fb = document.getElementById(`fb_${ex.id}`);
                const val = parseFloat(input ? input.value : '');

                if (isNaN(val)) {
                    fb.className = 'exercise-feedback error';
                    fb.innerHTML = '⚠️ Digite um valor numérico antes de conferir.';
                    fb.classList.remove('hidden');
                    return;
                }

                if (Math.abs(val - ex.expected) < 0.05) {
                    fb.className = 'exercise-feedback success';
                    fb.innerHTML = '🎉 <b>Resposta correta! Parabéns!</b> (+50 XP)';
                    fb.classList.remove('hidden');

                    this.solvedExercises.add(ex.id);
                    if (input) input.disabled = true;
                    btn.disabled = true;
                    btn.classList.add('btn-solved');
                    btn.textContent = '✓ Resolvido';

                    // Contabiliza pontuação XP sem falhas
                    this.awardXP(50, 'Exercício de fixação concluído!');
                    if (window.sounds) window.sounds.playSuccess();

                    // Atualiza banner de progresso
                    const progressBanner = container.querySelector('.exercise-progress-banner');
                    if (progressBanner) {
                        const newSolved = exercises.filter(e => this.solvedExercises.has(e.id)).length;
                        progressBanner.innerHTML = `
                            <span>🏆 Progresso dos Exercícios: <b>${newSolved} de ${exercises.length} Concluídos</b></span>
                            <span class="text-cyan font-mono" style="font-weight:700;">+${newSolved * 50} XP</span>
                        `;
                    }
                } else {
                    // Exibe estritamente a indicação de erro, SEM revelar a explicação ou resposta
                    fb.className = 'exercise-feedback error';
                    fb.innerHTML = '❌ <b>Resposta incorreta.</b> Tente novamente!';
                    fb.classList.remove('hidden');
                    if (window.sounds) window.sounds.playError();
                }
            });
        });
    }

    /**
     * Etapa 3: Casos da Realidade Vinculados aos Sólidos 3D
     */
    renderRealityCase() {
        const container = document.getElementById('funcRealityCaseContainer');
        if (!container) return;

        if (this.activeType === 'exponential') {
            container.innerHTML = `
                <div class="reality-case-header">
                    <span style="font-size:1.3rem;">💧</span>
                    <div>
                        <div class="reality-case-title">Usina de Biomassa: Reservatório Cilíndrico de 1.000 L</div>
                        <div class="reality-case-sub">Proliferação microbiana exponencial com V(t) = 125 · 2ᵗ Litros</div>
                    </div>
                </div>

                <div class="reality-case-body">
                    <p>Uma cultura de micro-organismos que produz biocombustível dobra de volume a cada 1 hora dentro do tanque cilíndrico de 1m³ (1.000 Litros).</p>
                    
                    <div class="reality-sim-box">
                        <div class="slider-label-row">
                            <span class="slider-name">Tempo decorrido <b>(t em horas)</b>:</span>
                            <span class="slider-badge-val" id="realityExpTimeVal">t = 1.0 h</span>
                        </div>
                        <input type="range" id="realityExpTimeSlider" min="0" max="3" step="0.2" value="1.0">

                        <div class="reality-metric-readout">
                            <div class="metric-block">
                                <span class="metric-label">Volume de Líquido:</span>
                                <span class="metric-val text-cyan" id="realityExpVolVal">250 Litros</span>
                            </div>
                            <div class="metric-block">
                                <span class="metric-label">Capacidade do Tanque:</span>
                                <span class="metric-val text-amber" id="realityExpCapVal">25% (0.25 m³)</span>
                            </div>
                        </div>

                        <button class="btn-action-primary" id="btnSimulateFilling" style="width:100%; margin-top:8px;">
                            ▶ Simular Abastecimento Exponencial no 3D
                        </button>
                    </div>
                </div>
            `;

            const slider = document.getElementById('realityExpTimeSlider');
            const timeVal = document.getElementById('realityExpTimeVal');
            const volVal = document.getElementById('realityExpVolVal');
            const capVal = document.getElementById('realityExpCapVal');

            const ensureCylinderReady = () => {
                if (!this.isSplit3D) {
                    this.toggleSplit3D();
                } else {
                    this.setupRealitySolid();
                }
            };

            const updateBiomass = (t) => {
                const vol = 125 * Math.pow(2, t);
                const percent = (vol / 1000) * 100;
                if (timeVal) timeVal.textContent = `t = ${t.toFixed(1)} h`;
                if (volVal) volVal.textContent = `${vol.toFixed(0)} Litros`;
                if (capVal) capVal.textContent = `${percent.toFixed(0)}% (${(vol / 1000).toFixed(2)} m³)`;

                // Sincroniza o nível de água no cilindro tridimensional
                if (this.liquidSim) {
                    const maxH = (this.liquidSim && this.liquidSim.maxHeight) ? this.liquidSim.maxHeight : 6.0;
                    const hLevel = Math.max(0.05, (vol / 1000) * maxH);
                    this.liquidSim.setHeight(hLevel);
                }

                // Sincroniza visibilidade do modelo 3D
                if (this.sceneMgr && this.sceneMgr.solidGroup) {
                    this.sceneMgr.solidGroup.visible = true;
                }

                // Sincroniza com o gráfico cartesiano
                this.expParams.xPoint = t;
                this.renderGraph();
            };

            if (slider) {
                slider.addEventListener('input', (e) => {
                    ensureCylinderReady();
                    updateBiomass(parseFloat(e.target.value));
                });
            }

            const btnSim = document.getElementById('btnSimulateFilling');
            if (btnSim) {
                btnSim.addEventListener('click', () => {
                    ensureCylinderReady();
                    btnSim.disabled = true;
                    btnSim.textContent = '⏳ Enchendo Reservatório...';

                    let curT = 0;
                    if (this.liquidSim) this.liquidSim.empty();
                    if (this.sceneMgr) {
                        this.sceneMgr.faucetGroup.visible = true;
                        this.sceneMgr.setWaterStream(true);
                    }
                    if (window.sounds) window.sounds.startWater();

                    const interval = setInterval(() => {
                        curT += 0.05;
                        if (slider) slider.value = curT.toFixed(2);
                        updateBiomass(curT);

                        if (curT >= 3.0) {
                            clearInterval(interval);
                            btnSim.disabled = false;
                            btnSim.textContent = '▶ Simular Novamente no 3D';

                            if (this.sceneMgr) this.sceneMgr.setWaterStream(false);
                            if (window.sounds) {
                                window.sounds.stopWater();
                                window.sounds.playSuccess();
                            }
                            if (this.engineerGuide && typeof this.engineerGuide.speak === 'function') {
                                this.engineerGuide.speak(
                                    '💧 <b>Tanque 100% Cheio!</b><br>Em <b>t = 3 horas</b>, a produção microbiana atingiu exatamente <b>125 × 2³ = 1.000 Litros (1 m³)</b>!<br>O volume exponencial preencheu perfeitamente a capacidade do reservatório cilíndrico!',
                                    { icon: '💧', duration: 8000 }
                                );
                            }
                        }
                    }, 50);
                });
            }
        } else {
            // Módulo Logarítmico: Escala Richter & Abalo Sísmico no Edifício 3D
            container.innerHTML = `
                <div class="reality-case-header">
                    <span style="font-size:1.3rem;">🏢</span>
                    <div>
                        <div class="reality-case-title">Engenharia Sísmica: Edifício Residencial Aurora</div>
                        <div class="reality-case-sub">Magnitude na Escala Richter: M = ⅔ · log₁₀(E / 10³)</div>
                    </div>
                </div>

                <div class="reality-case-body">
                    <p>O edifício de 4 andares foi projetado com amortecedores sísmicos. A magnitude M cresce logaritmicamente com a energia liberada E em Megajoules (MJ).</p>
                    
                    <div class="reality-sim-box">
                        <div class="slider-label-row">
                            <span class="slider-name">Energia Sísmica <b>(E em MJ)</b>:</span>
                            <span class="slider-badge-val" id="realityRichterEVal">E = 10.000 MJ</span>
                        </div>
                        <input type="range" id="realityRichterESlider" min="1000" max="1000000" step="5000" value="10000">

                        <div class="reality-metric-readout">
                            <div class="metric-block">
                                <span class="metric-label">Magnitude Richter:</span>
                                <span class="metric-val text-amber" id="realityRichterMVal">M = 2.0</span>
                            </div>
                            <div class="metric-block">
                                <span class="metric-label">Status Estrutural:</span>
                                <span class="metric-val text-cyan" id="realityRichterStatus">Abalo Leve (Seguro)</span>
                            </div>
                        </div>

                        <button class="btn-action-primary" id="btnSimulateEarthquake" style="width:100%; margin-top:8px;">
                            ⚡ Disparar Tremor Sísmico no Prédio 3D
                        </button>
                    </div>
                </div>
            `;

            const slider = document.getElementById('realityRichterESlider');
            const eVal = document.getElementById('realityRichterEVal');
            const mVal = document.getElementById('realityRichterMVal');
            const statusVal = document.getElementById('realityRichterStatus');

            const updateSeismic = (energy) => {
                const M = (2 / 3) * (Math.log10(energy / 1000) + 1);
                if (eVal) eVal.textContent = `E = ${energy.toLocaleString('pt-BR')} MJ`;
                if (mVal) mVal.textContent = `M = ${M.toFixed(1)}`;

                if (statusVal) {
                    if (M < 2.5) {
                        statusVal.textContent = 'Microabalo (Seguro)';
                        statusVal.className = 'metric-val text-cyan';
                    } else if (M < 4.0) {
                        statusVal.textContent = 'Abalo Moderado (Janelas vibram)';
                        statusVal.className = 'metric-val text-amber';
                    } else {
                        statusVal.textContent = 'Abalo Severo (Alerta Estrutural)';
                        statusVal.className = 'metric-val text-rose';
                    }
                }

                // Sincroniza com o gráfico
                this.logParams.xPoint = Math.min(8, Math.max(0.5, M * 1.5));
                this.renderGraph();
            };

            if (slider) {
                slider.addEventListener('input', (e) => updateSeismic(parseFloat(e.target.value)));
            }

            const btnQuake = document.getElementById('btnSimulateEarthquake');
            if (btnQuake) {
                btnQuake.addEventListener('click', () => {
                    const energy = parseFloat(slider ? slider.value : 10000);
                    const M = (2 / 3) * (Math.log10(energy / 1000) + 1);
                    this.triggerSeismicVibration(M);
                    if (window.sounds) window.sounds.playClick();
                });
            }
        }
    }

    /**
     * Efeito de vibração sísmica no Three.js
     */
    triggerSeismicVibration(magnitude) {
        if (!this.sceneMgr || !this.sceneMgr.solidGroup) return;

        if (this.seismicAnimationId) {
            cancelAnimationFrame(this.seismicAnimationId);
            this.seismicAnimationId = null;
        }

        const solidGroup = this.sceneMgr.solidGroup;
        const startTime = performance.now();
        const duration = 2400; // ms
        const intensity = Math.min(0.35, magnitude * 0.06);

        const animate = (time) => {
            const elapsed = time - startTime;
            if (elapsed < duration) {
                const decay = 1 - (elapsed / duration);
                const angle = Math.sin(elapsed * 0.04) * intensity * decay;
                const posX = Math.cos(elapsed * 0.05) * (intensity * 2) * decay;

                solidGroup.rotation.z = angle;
                solidGroup.position.x = posX;

                this.seismicAnimationId = requestAnimationFrame(animate);
            } else {
                solidGroup.rotation.set(0, 0, 0);
                solidGroup.position.set(0, 0, 0);
                this.seismicAnimationId = null;
                if (window.sounds) window.sounds.playSuccess();
            }
        };

        this.seismicAnimationId = requestAnimationFrame(animate);
    }

    /**
     * Etapa 4: Laboratório de Teste de Hipóteses & Investigação Científica
     */
    renderHypothesisLab() {
        const container = document.getElementById('funcHypothesisContainer');
        if (!container) return;

        this.solvedHypotheses = this.solvedHypotheses || new Set();
        const isExp = this.activeType === 'exponential';

        if (isExp) {
            const hyp1Done = this.solvedHypotheses.has('exp_hyp1');
            const hyp2Done = this.solvedHypotheses.has('exp_hyp2');

            container.innerHTML = `
                <div class="hypothesis-card-item">
                    <div class="hypothesis-title">🔬 Hipótese 1: A Inversão da Base (b = 2 vs b = 0.5)</div>
                    <div class="hypothesis-desc">
                        "Se substituirmos a base b = 2 por sua inversa b = 0.5 (1/2), o gráfico sofre uma reflexão em relação ao eixo Y, transformando crescimento em decaimento."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHyp1A">Testar b = 2</button>
                        <button class="btn-hypothesis-action" id="btnTestHyp1B">Testar b = 0.5</button>
                        <button class="btn-hypothesis-validate ${hyp1Done ? 'btn-solved' : ''}" id="btnValidateHyp1" ${hyp1Done ? 'disabled' : ''}>
                            ${hyp1Done ? '✓ Validada (+100 XP)' : '✓ Validar Hipótese'}
                        </button>
                    </div>
                    <div class="hypothesis-result-box ${hyp1Done ? 'success' : 'hidden'}" id="resHyp1">
                        ${hyp1Done ? '🎉 <b>Hipótese 1 Confirmada com Rigor Científico!</b><br>Como (1/2)ˣ = 2⁻ˣ, a curva de decaimento é a reflexão exata de 2ˣ sobre o eixo vertical Y (+100 XP)!' : ''}
                    </div>
                </div>

                <div class="hypothesis-card-item" style="margin-top:10px;">
                    <div class="hypothesis-title">🔬 Hipótese 2: A Barreira Intransponível da Assíntota</div>
                    <div class="hypothesis-desc">
                        "Para qualquer base positiva b > 0, é matematicamente impossível bˣ ser menor ou igual a zero (a curva nunca cruza a assíntota y = 0)."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHyp2Ext">Testar x = -4 (Extremo)</button>
                        <button class="btn-hypothesis-validate ${hyp2Done ? 'btn-solved' : ''}" id="btnValidateHyp2" ${hyp2Done ? 'disabled' : ''}>
                            ${hyp2Done ? '✓ Validada (+100 XP)' : '✓ Validar Hipótese'}
                        </button>
                    </div>
                    <div class="hypothesis-result-box ${hyp2Done ? 'success' : 'hidden'}" id="resHyp2">
                        ${hyp2Done ? '🎉 <b>Hipótese 2 Confirmada!</b><br>Mesmo para x = -10, 2⁻¹⁰ = 1/1024 ≈ 0,000976 > 0. O valor aproxima-se infinitamente de zero mas jamais o atinge (+100 XP)!' : ''}
                    </div>
                </div>
            `;

            // Listeners da Hipótese 1
            const btn1A = document.getElementById('btnTestHyp1A');
            const btn1B = document.getElementById('btnTestHyp1B');
            const btnVal1 = document.getElementById('btnValidateHyp1');
            const res1 = document.getElementById('resHyp1');

            if (btn1A) btn1A.addEventListener('click', () => { this.expParams.b = 2.0; this.updateUI(); });
            if (btn1B) btn1B.addEventListener('click', () => { this.expParams.b = 0.5; this.updateUI(); });
            if (btnVal1) {
                btnVal1.addEventListener('click', () => {
                    if (res1) {
                        res1.className = 'hypothesis-result-box success';
                        res1.innerHTML = '🎉 <b>Hipótese 1 Confirmada com Rigor Científico!</b><br>Como (1/2)ˣ = 2⁻ˣ, a curva de decaimento é a reflexão exata de 2ˣ sobre o eixo vertical Y (+100 XP)!';
                        res1.classList.remove('hidden');

                        if (!this.solvedHypotheses.has('exp_hyp1')) {
                            this.solvedHypotheses.add('exp_hyp1');
                            btnVal1.disabled = true;
                            btnVal1.classList.add('btn-solved');
                            btnVal1.textContent = '✓ Validada (+100 XP)';
                            this.awardXP(100, 'Hipótese de decaimento validada!');
                        }
                        if (window.sounds) window.sounds.playSuccess();
                    }
                });
            }

            // Listeners da Hipótese 2
            const btn2Ext = document.getElementById('btnTestHyp2Ext');
            const btnVal2 = document.getElementById('btnValidateHyp2');
            const res2 = document.getElementById('resHyp2');

            if (btn2Ext) btn2Ext.addEventListener('click', () => { this.expParams.xPoint = -4.0; this.updateUI(); });
            if (btnVal2) {
                btnVal2.addEventListener('click', () => {
                    if (res2) {
                        res2.className = 'hypothesis-result-box success';
                        res2.innerHTML = '🎉 <b>Hipótese 2 Confirmada!</b><br>Mesmo para x = -10, 2⁻¹⁰ = 1/1024 ≈ 0,000976 > 0. O valor aproxima-se infinitamente de zero mas jamais o atinge (+100 XP)!';
                        res2.classList.remove('hidden');

                        if (!this.solvedHypotheses.has('exp_hyp2')) {
                            this.solvedHypotheses.add('exp_hyp2');
                            btnVal2.disabled = true;
                            btnVal2.classList.add('btn-solved');
                            btnVal2.textContent = '✓ Validada (+100 XP)';
                            this.awardXP(100, 'Hipótese de assíntota validada!');
                        }
                        if (window.sounds) window.sounds.playSuccess();
                    }
                });
            }
        } else {
            // Hipóteses do Módulo Logarítmico
            const hypLog1Done = this.solvedHypotheses.has('log_hyp1');
            const hypLog2Done = this.solvedHypotheses.has('log_hyp2');

            container.innerHTML = `
                <div class="hypothesis-card-item">
                    <div class="hypothesis-title">🔬 Hipótese 1: A Simetria Especular Inversa (y = x)</div>
                    <div class="hypothesis-desc">
                        "A função logarítmica f(x) = log₂(x) e a função exponencial g(x) = 2ˣ são funções inversas mútuas e suas curvas são simétricas em relação à bissetriz y = x."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHypLogMirror">Exibir Espelho y = x</button>
                        <button class="btn-hypothesis-validate ${hypLog1Done ? 'btn-solved' : ''}" id="btnValidateHypLog" ${hypLog1Done ? 'disabled' : ''}>
                            ${hypLog1Done ? '✓ Validada (+100 XP)' : '✓ Validar Hipótese'}
                        </button>
                    </div>
                    <div class="hypothesis-result-box ${hypLog1Done ? 'success' : 'hidden'}" id="resHypLog1">
                        ${hypLog1Done ? '🎉 <b>Hipótese Confirmada com Maestria!</b><br>Ao trocar as coordenadas (x, y) por (y, x), todo ponto (a, b) da exponencial corresponde exatamente a (b, a) no logaritmo (+100 XP)!' : ''}
                    </div>
                </div>

                <div class="hypothesis-card-item" style="margin-top:10px;">
                    <div class="hypothesis-title">🔬 Hipótese 2: Condição de Existência e Assíntota Vertical</div>
                    <div class="hypothesis-desc">
                        "Não existe logaritmo de número negativo ou zero nos números reais. Por isso, a assíntota vertical impede o gráfico de ultrapassar o limiar x = h."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHypLogLimit">Aproximar de x = 0</button>
                        <button class="btn-hypothesis-validate ${hypLog2Done ? 'btn-solved' : ''}" id="btnValidateHypLog2" ${hypLog2Done ? 'disabled' : ''}>
                            ${hypLog2Done ? '✓ Validada (+100 XP)' : '✓ Validar Hipótese'}
                        </button>
                    </div>
                    <div class="hypothesis-result-box ${hypLog2Done ? 'success' : 'hidden'}" id="resHypLog2">
                        ${hypLog2Done ? '🎉 <b>Hipótese Confirmada!</b><br>Conforme x se aproxima de zero pela direita, log₂(x) despenca para -∞, sem nunca poder avaliar x ≤ 0 (+100 XP)!' : ''}
                    </div>
                </div>
            `;

            const btnMirror = document.getElementById('btnTestHypLogMirror');
            const btnValLog1 = document.getElementById('btnValidateHypLog');
            const resLog1 = document.getElementById('resHypLog1');

            if (btnMirror) {
                btnMirror.addEventListener('click', () => {
                    this.showInverse = true;
                    this.renderGraph();
                });
            }

            if (btnValLog1) {
                btnValLog1.addEventListener('click', () => {
                    if (resLog1) {
                        resLog1.className = 'hypothesis-result-box success';
                        resLog1.innerHTML = '🎉 <b>Hipótese Confirmada com Maestria!</b><br>Ao trocar as coordenadas (x, y) por (y, x), todo ponto (a, b) da exponencial corresponde exatamente a (b, a) no logaritmo (+100 XP)!';
                        resLog1.classList.remove('hidden');

                        if (!this.solvedHypotheses.has('log_hyp1')) {
                            this.solvedHypotheses.add('log_hyp1');
                            btnValLog1.disabled = true;
                            btnValLog1.classList.add('btn-solved');
                            btnValLog1.textContent = '✓ Validada (+100 XP)';
                            this.awardXP(100, 'Hipótese de simetria inversa validada!');
                        }
                        if (window.sounds) window.sounds.playSuccess();
                    }
                });
            }

            const btnLimit = document.getElementById('btnTestHypLogLimit');
            const btnValLog2 = document.getElementById('btnValidateHypLog2');
            const resLog2 = document.getElementById('resHypLog2');

            if (btnLimit) {
                btnLimit.addEventListener('click', () => {
                    this.logParams.xPoint = 0.1;
                    this.updateUI();
                });
            }

            if (btnValLog2) {
                btnValLog2.addEventListener('click', () => {
                    if (resLog2) {
                        resLog2.className = 'hypothesis-result-box success';
                        resLog2.innerHTML = '🎉 <b>Hipótese Confirmada!</b><br>Conforme x se aproxima de zero pela direita, log₂(x) despenca para -∞, sem nunca poder avaliar x ≤ 0 (+100 XP)!';
                        resLog2.classList.remove('hidden');

                        if (!this.solvedHypotheses.has('log_hyp2')) {
                            this.solvedHypotheses.add('log_hyp2');
                            btnValLog2.disabled = true;
                            btnValLog2.classList.add('btn-solved');
                            btnValLog2.textContent = '✓ Validada (+100 XP)';
                            this.awardXP(100, 'Hipótese de existência validada!');
                        }
                        if (window.sounds) window.sounds.playSuccess();
                    }
                });
            }
        }
    }

    // =========================================================================
    // JANELA DO GRÁFICO CARTESIANO ARRASTÁVEL E MÓVEL
    // =========================================================================
    setupDraggableOverlay() {
        const overlay = document.getElementById('functionGraphOverlay');
        const header = overlay ? overlay.querySelector('.graph-overlay-header') : null;
        if (!overlay || !header) return;

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        const onPointerDown = (e) => {
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const rect = overlay.getBoundingClientRect();
            const parent = overlay.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

            isDragging = true;
            startX = clientX;
            startY = clientY;

            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;

            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            overlay.style.inset = 'auto';
            overlay.style.left = `${initialLeft}px`;
            overlay.style.top = `${initialTop}px`;
            overlay.style.right = 'auto';
            overlay.style.bottom = 'auto';
            overlay.classList.add('is-dragging');

            if (e.type === 'mousedown') {
                e.preventDefault();
            }
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            const parent = overlay.parentElement;
            const parentWidth = parent ? parent.clientWidth : window.innerWidth;
            const parentHeight = parent ? parent.clientHeight : window.innerHeight;
            const overlayWidth = overlay.offsetWidth;
            const overlayHeight = overlay.offsetHeight;

            let newLeft = Math.max(0, Math.min(parentWidth - overlayWidth, initialLeft + deltaX));
            let newTop = Math.max(0, Math.min(parentHeight - overlayHeight, initialTop + deltaY));

            overlay.style.left = `${newLeft}px`;
            overlay.style.top = `${newTop}px`;
        };

        const onPointerUp = () => {
            if (isDragging) {
                isDragging = false;
                overlay.classList.remove('is-dragging');
            }
        };

        header.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        header.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);

        header.addEventListener('dblclick', (e) => {
            if (e.target.closest('button')) return;
            this.resetOverlayPosition();
        });
    }

    resetOverlayPosition() {
        const overlay = document.getElementById('functionGraphOverlay');
        if (!overlay) return;
        overlay.style.inset = '';
        overlay.style.left = '';
        overlay.style.top = '';
        overlay.style.width = '';
        overlay.style.height = '';
        overlay.style.right = '';
        overlay.style.bottom = '';
        setTimeout(() => {
            this.resizeCanvas();
            this.renderGraph();
        }, 50);
    }

    // =========================================================================
    // BANCO DE DADOS DIDÁTICO: MISSÕES DE CADERNO
    // =========================================================================
    initNotebookMissionsData() {
        this.notebookMissions = [
            {
                id: 'mission_exp_table',
                category: 'exp',
                icon: '📈',
                badge: 'Missão 1 · Função Exponencial',
                title: 'Tabela de Potências e Esboço do Gráfico no Caderno',
                targetSystem: 'No GeoLab 3D, defina a base para b = 2.0 e a = 1.0. Arraste o ponto P pela curva observando os valores de x e y na barra inferior.',
                notebookInstructions: [
                    'Desenhe no caderno uma tabela com duas colunas: "x" e "y = f(x)".',
                    'Calcule no caderno as potências para os 6 valores: x = -2, -1, 0, 1, 2 e 3.',
                    'Mostre as contas completas: 2⁻² = 1/4 = 0,25 | 2⁻¹ = 1/2 = 0,5 | 2⁰ = 1 | 2¹ = 2 | 2² = 4 | 2³ = 8.',
                    'Com uma régua, desenhe os eixos cartesianos X e Y no caderno, marque os 6 pontos e trace a curva suave.',
                    'Responda no caderno: Por que a curva nunca toca o eixo horizontal (assíntota y = 0)?'
                ],
                engineerTip: 'Lembre-se da regra de ouro: todo número não nulo elevado a 0 é igual a 1! Por isso a curva corta o eixo Y em (0, 1).'
            },
            {
                id: 'mission_exp_decay',
                category: 'exp',
                icon: '📉',
                badge: 'Missão 2 · Função Exponencial',
                title: 'O Mistério da Meia-Vida & Base Menor que 1 (Decaimento)',
                targetSystem: 'No painel esquerdo, altere o slider da base para b = 0.5 (ou clique no preset "Decaimento"). Observe a nova inclinação da curva.',
                notebookInstructions: [
                    'Anote no caderno a lei de formação do decaimento: f(x) = (0,5)ˣ ou f(x) = (1/2)ˣ.',
                    'Calcule no caderno: f(1) = 0,5 | f(2) = 0,25 | f(3) = 0,125.',
                    'No mesmo plano cartesiano da Missão 1, desenhe com outra cor essa nova curva decrescente.',
                    'Responda no caderno: Qual a diferença fundamental no comportamento gráfico entre b > 1 e 0 < b < 1? Onde essa curva corta o eixo Y?'
                ],
                engineerTip: 'Aplicações no mundo real: essa fórmula calcula como medicamentos perdem concentração no sangue e como fósseis perdem Carbono-14 ao longo de milhares de anos!'
            },
            {
                id: 'mission_exp_biomass_3d',
                category: 'solid3d',
                icon: '💧',
                badge: 'Missão 3 · Conexão com Sólido 3D',
                title: 'Usina de Biomassa: Enchimento Exponencial do Tanque Cilíndrico de 1.000 L',
                targetSystem: 'Acesse a aba "3. Realidade 3D" no painel esquerdo. Clique em "▶ Simular Abastecimento Exponencial no 3D" e observe a água encher o cilindro transparente.',
                notebookInstructions: [
                    'Copie no caderno a fórmula da usina: V(t) = 125 · 2ᵗ Litros (onde t é o tempo em horas).',
                    'Calcule no caderno o volume de biocombustível em cada etapa:',
                    '• Instante inicial (t = 0): V(0) = 125 · 2⁰ = 125 Litros.',
                    '• Após 1 hora (t = 1): V(1) = 125 · 2¹ = 250 Litros.',
                    '• Após 2 horas (t = 2): V(2) = 125 · 2² = 500 Litros.',
                    '• Após 3 horas (t = 3): V(3) = 125 · 2³ = 1.000 Litros (exatamente 1 m³ de líquido!).',
                    'Responda no caderno: Quantas horas foram necessárias para o tanque passar de metade da capacidade (500 L) para totalmente cheio (1.000 L)? Compare isso com uma torneira linear comum.'
                ],
                engineerTip: 'No crescimento exponencial, o último passo dobra TODO o acumulado anterior! Isso é vital para engenheiros controlarem reatores industriais.'
            },
            {
                id: 'mission_log_inverse',
                category: 'log',
                icon: '🪞',
                badge: 'Missão 4 · Função Logarítmica',
                title: 'A Inversa Perfeita e a Reflexão na Reta y = x',
                targetSystem: 'Mude para a Função Logarítmica e clique no botão "🪞 Inversa (y=x)" na barra do gráfico. Veja o espelhamento das duas curvas.',
                notebookInstructions: [
                    'Desenhe no caderno a reta diagonal y = x (a bissetriz dos quadrantes ímpares).',
                    'Esboce a curva exponencial y = 2ˣ e a curva logarítmica y = log₂(x).',
                    'Construa no caderno uma tabela comparando os pares ordenados invertidos:',
                    '• Na exponencial temos (0, 1), (1, 2) e (2, 4).',
                    '• No logaritmo temos (1, 0), (2, 1) e (4, 2).',
                    'Responda no caderno: Por que o logaritmo tem assíntota vertical x = 0 enquanto a exponencial tem assíntota horizontal y = 0?'
                ],
                engineerTip: 'A função logarítmica "desfaz" o que a exponencial faz! Ela descobre o expoente a partir da resposta.'
            },
            {
                id: 'mission_log_richter_3d',
                category: 'solid3d',
                icon: '🏢',
                badge: 'Missão 5 · Conexão com Sólido 3D',
                title: 'Engenharia Sísmica & Escala Richter no Edifício 3D',
                targetSystem: 'Na aba "3. Realidade 3D" do Logaritmo, teste as energias de 10.000 MJ e 100.000 MJ e clique em "⚡ Disparar Tremor Sísmico no Prédio 3D".',
                notebookInstructions: [
                    'Anote no caderno a fórmula de Gutenberg-Richter: M = ⅔ · [log₁₀(E / 1000) + 1].',
                    'Calcule no caderno: se a energia E for multiplicada por 10 (de 10.000 para 100.000 MJ), qual é o aumento na magnitude M?',
                    'Mostre que log₁₀(10) = 1, logo o aumento é de exatamente ⅔ ≈ 0,67 graus na Escala Richter!',
                    'Explique no caderno por que cientistas e engenheiros civis usam logaritmo em vez de uma escala comum para medir terremotos.'
                ],
                engineerTip: 'Sem logaritmos, um gráfico de terremotos precisaria de uma folha de papel com quilômetros de comprimento para desenhar abalos fortes!'
            },
            {
                id: 'mission_synthesis_coefficients',
                category: 'all',
                icon: '🧠',
                badge: 'Missão 6 · Síntese Teórica',
                title: 'Quadro Geral dos Coeficientes e Domínios',
                targetSystem: 'Consulte o Mapa Mental e o briefing do Engenheiro Leo para revisar todos os parâmetros.',
                notebookInstructions: [
                    'Copie no seu caderno um quadro comparativo com 4 linhas:',
                    '1. Base (b): O que acontece quando b > 1? E quando 0 < b < 1? Por que b não pode ser 1 nem negativo?',
                    '2. Multiplicador (a): O que acontece quando a é positivo? E quando a é negativo?',
                    '3. Assíntotas: Compare a horizontal (y = c) da exponencial com a vertical (x = h) do logaritmo.',
                    '4. Condição de Existência: Por que não existe logaritmo de zero nem de números negativos nos reais (x > h)?'
                ],
                engineerTip: 'Com este quadro no caderno, você terá um guia completo de consulta rápida para provas escolares e o ENEM!'
            }
        ];
    }

    // =========================================================================
    // MODAL DE MISSÕES DO CADERNO
    // =========================================================================
    setupMissionsModal() {
        const btnClose = document.getElementById('btnCloseMissionsModal');
        const btnCloseFooter = document.getElementById('btnCloseMissionsModalFooter');
        if (btnClose) btnClose.addEventListener('click', () => this.closeMissionsModal());
        if (btnCloseFooter) btnCloseFooter.addEventListener('click', () => this.closeMissionsModal());

        const btnCopyAll = document.getElementById('btnCopyAllMissions');
        if (btnCopyAll) {
            btnCopyAll.addEventListener('click', () => {
                this.copyMissionsText();
                btnCopyAll.textContent = '✓ Roteiro Copiado!';
                setTimeout(() => { btnCopyAll.textContent = '📋 Copiar Todas as Missões'; }, 2500);
            });
        }

        document.querySelectorAll('.missions-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.missions-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMissionFilter = btn.dataset.category;
                this.renderMissions(this.currentMissionFilter);
                if (window.sounds) window.sounds.playClick();
            });
        });
    }

    openMissionsModal() {
        const modal = document.getElementById('notebookMissionsModal');
        if (!modal) return;
        this.renderMissions(this.currentMissionFilter || 'all');
        modal.classList.remove('hidden');
    }

    closeMissionsModal() {
        const modal = document.getElementById('notebookMissionsModal');
        if (modal) modal.classList.add('hidden');
        if (window.sounds) window.sounds.playClick();
    }

    renderMissions(category = 'all') {
        const container = document.getElementById('notebookMissionsBody');
        const progressText = document.getElementById('missionsProgressText');
        const progressXP = document.getElementById('missionsProgressXP');
        if (!container) return;

        const filtered = category === 'all' 
            ? this.notebookMissions 
            : this.notebookMissions.filter(m => m.category === category || (category === 'solid3d' && m.category === 'solid3d'));

        const totalCompleted = this.notebookMissions.filter(m => this.completedMissions.has(m.id)).length;
        if (progressText) {
            progressText.textContent = `🏆 ${totalCompleted} de ${this.notebookMissions.length} Missões Concluídas no Caderno`;
        }
        if (progressXP) {
            progressXP.textContent = `+${totalCompleted * 50} XP`;
        }

        container.innerHTML = filtered.map(m => {
            const isDone = this.completedMissions.has(m.id);
            return `
                <div class="mission-notebook-card ${isDone ? 'mission-completed' : ''}" data-mission-id="${m.id}">
                    <div class="mission-card-header">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="mission-icon">${m.icon}</span>
                            <div>
                                <span class="mission-badge">${m.badge}</span>
                                <h3 class="mission-card-title">${m.title}</h3>
                            </div>
                        </div>
                        <button class="btn-copy-single-mission" data-id="${m.id}" title="Copiar roteiro desta atividade">
                            📋 Copiar
                        </button>
                    </div>

                    <div class="mission-section-box target-system">
                        <div class="mission-section-label">🎯 O QUE FAZER NO GEOLAB 3D:</div>
                        <div class="mission-section-text">${m.targetSystem}</div>
                    </div>

                    <div class="mission-section-box notebook-target">
                        <div class="mission-section-label">✍️ O QUE ANOTAR E RESOLVER NO CADERNO:</div>
                        <ol class="mission-steps-list">
                            ${m.notebookInstructions.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>

                    <div class="mission-engineer-tip">
                        <b>💡 Dica do Engenheiro Leo:</b> ${m.engineerTip}
                    </div>

                    <div class="mission-card-footer">
                        <label class="mission-check-label">
                            <input type="checkbox" class="chk-mission-complete" data-id="${m.id}" ${isDone ? 'checked' : ''}>
                            <span class="chk-custom-box"></span>
                            <span class="chk-label-text">
                                ${isDone ? '✓ Missão Concluída no Caderno (+50 XP)' : 'Marcar como Feito no Caderno (+50 XP)'}
                            </span>
                        </label>
                    </div>
                </div>
            `;
        }).join('');

        // Listeners nos checkboxes
        container.querySelectorAll('.chk-mission-complete').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                this.toggleMissionComplete(id, e.target.checked);
            });
        });

        // Listeners no botão copiar missão individual
        container.querySelectorAll('.btn-copy-single-mission').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.copySingleMissionText(id);
                btn.textContent = '✓ Copiado!';
                setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
            });
        });
    }

    toggleMissionComplete(missionId, isChecked) {
        if (isChecked) {
            this.completedMissions.add(missionId);
            this.awardXP(50, 'Missão registrada no caderno escolar!');
            if (window.sounds) window.sounds.playSuccess();
        } else {
            this.completedMissions.delete(missionId);
        }
        localStorage.setItem('geolab_completed_notebook_missions', JSON.stringify([...this.completedMissions]));
        this.renderMissions(this.currentMissionFilter);
    }

    copySingleMissionText(missionId) {
        const m = this.notebookMissions.find(item => item.id === missionId);
        if (!m) return;
        const text = `
=============================================================
GEOLAB 3D · ATIVIDADE PARA O CADERNO
${m.badge} - ${m.title}
=============================================================

1. O QUE FAZER NO SISTEMA GEOLAB:
${m.targetSystem}

2. O QUE FAZER NO SEU CADERNO:
${m.notebookInstructions.map((inst, i) => `[ ] ${i + 1}. ${inst}`).join('\n')}

3. DICA DO ENGENHEIRO LEO:
${m.engineerTip}
=============================================================
        `.trim();
        navigator.clipboard.writeText(text).catch(() => {});
    }

    copyMissionsText() {
        const text = this.notebookMissions.map((m, idx) => `
ATIVIDADE ${idx + 1}: ${m.title}
• No GeoLab 3D: ${m.targetSystem}
• No Caderno:
${m.notebookInstructions.map(inst => `  - ${inst}`).join('\n')}
• Dica do Engenheiro: ${m.engineerTip}
        `).join('\n-------------------------------------------------------------\n');

        const fullDocument = `
=============================================================================
GEOLAB 3D · GUIA DE ATIVIDADES E INVESTIGAÇÃO PARA O CADERNO
Funções Matemáticas (Exponencial e Logarítmica) & Sólidos 3D
=============================================================================

${text}
=============================================================================
        `.trim();
        navigator.clipboard.writeText(fullDocument).catch(() => {});
    }

    // =========================================================================
    // MODAL DE MAPA MENTAL
    // =========================================================================
    setupMindMapModal() {
        const btnClose = document.getElementById('btnCloseMindMapModal');
        if (btnClose) btnClose.addEventListener('click', () => this.closeMindMapModal());

        const imgEl = document.getElementById('mindMapImage');

        const btnZoomIn = document.getElementById('btnZoomInMindMap');
        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => {
                this.mindMapZoom = Math.min(2.5, this.mindMapZoom + 0.25);
                if (imgEl) imgEl.style.transform = `scale(${this.mindMapZoom})`;
            });
        }

        const btnZoomOut = document.getElementById('btnZoomOutMindMap');
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => {
                this.mindMapZoom = Math.max(0.7, this.mindMapZoom - 0.25);
                if (imgEl) imgEl.style.transform = `scale(${this.mindMapZoom})`;
            });
        }

        const btnZoomReset = document.getElementById('btnZoomResetMindMap');
        if (btnZoomReset) {
            btnZoomReset.addEventListener('click', () => {
                this.mindMapZoom = 1.0;
                if (imgEl) imgEl.style.transform = `scale(1.0)`;
            });
        }

        // Alternador de visualização (Imagem vs Resumo Interativo em Cards)
        document.querySelectorAll('.mindmap-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mindmap-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const view = btn.dataset.view;

                const imgView = document.getElementById('mindMapImageViewer');
                const interView = document.getElementById('mindMapInteractiveViewer');

                if (view === 'image') {
                    if (imgView) imgView.classList.remove('hidden');
                    if (interView) interView.classList.add('hidden');
                } else {
                    if (imgView) imgView.classList.add('hidden');
                    if (interView) {
                        interView.classList.remove('hidden');
                        this.renderInteractiveMindMap();
                    }
                }
                if (window.sounds) window.sounds.playClick();
            });
        });
    }

    openMindMapModal() {
        const modal = document.getElementById('mindMapModal');
        if (!modal) return;
        this.mindMapZoom = 1.0;
        const imgEl = document.getElementById('mindMapImage');
        if (imgEl) imgEl.style.transform = 'scale(1.0)';
        modal.classList.remove('hidden');
    }

    closeMindMapModal() {
        const modal = document.getElementById('mindMapModal');
        if (modal) modal.classList.add('hidden');
        if (window.sounds) window.sounds.playClick();
    }

    renderInteractiveMindMap() {
        const container = document.getElementById('mindMapInteractiveViewer');
        if (!container) return;

        container.innerHTML = `
            <div class="interactive-mindmap-grid">
                <!-- RAMO 1: FUNÇÃO EXPONENCIAL -->
                <div class="mindmap-branch-card exp">
                    <div class="branch-card-header">
                        <span style="font-size:1.4rem;">📈</span>
                        <div>
                            <div class="branch-card-title">Função Exponencial</div>
                            <div class="branch-card-formula">f(x) = a · bˣ + c</div>
                        </div>
                    </div>
                    
                    <div class="branch-section-box">
                        <div class="branch-section-title">⚙️ Efeito dos Coeficientes:</div>
                        <ul class="branch-items-list">
                            <li><b>Base b &gt; 1:</b> Crescimento acelerado (curva decola para cima).</li>
                            <li><b>Base 0 &lt; b &lt; 1:</b> Decaimento exponencial suave (curva desce para o limiar).</li>
                            <li><b>Multiplicador a:</b> Se c = 0, define o ponto onde corta o eixo Y em (0, a). Se a &lt; 0, inverte o gráfico para baixo.</li>
                            <li><b>Assíntota y = c:</b> Linha horizontal limite. A curva se aproxima infinitamente mas nunca toca!</li>
                        </ul>
                    </div>

                    <div class="branch-section-box real-world">
                        <div class="branch-section-title">🌍 Casos Reais & Sólidos 3D:</div>
                        <ul class="branch-items-list">
                            <li><b>💧 Tanques Cilíndricos 3D:</b> Proliferação microbiana de biocombustível V(t) = 125 · 2ᵗ L preenchendo o reservatório de 1.000 L (1 m³).</li>
                            <li><b>💰 Finanças:</b> Juros compostos M = C · (1 + i)ᵗ.</li>
                            <li><b>🧪 Farmacologia:</b> Meia-vida de antibióticos e datação de fósseis por Carbono-14.</li>
                        </ul>
                    </div>
                </div>

                <!-- RAMO 2: FUNÇÃO LOGARÍTMICA -->
                <div class="mindmap-branch-card log">
                    <div class="branch-card-header">
                        <span style="font-size:1.4rem;">📉</span>
                        <div>
                            <div class="branch-card-title">Função Logarítmica</div>
                            <div class="branch-card-formula">f(x) = a · log_b(x - h) + c</div>
                        </div>
                    </div>
                    
                    <div class="branch-section-box">
                        <div class="branch-section-title">⚙️ Efeito dos Coeficientes & Regras:</div>
                        <ul class="branch-items-list">
                            <li><b>Inversa da Potência:</b> Simetria e espelhamento perfeito em torno da bissetriz diagonal y = x.</li>
                            <li><b>Base b:</b> Bases mais usadas: decimal (10) e natural (e ≈ 2,718). Quanto maior a base, mais lenta a subida.</li>
                            <li><b>Assíntota x = h:</b> Linha vertical limite intransponível na esquerda.</li>
                            <li><b>Condição Obrigatória:</b> x &gt; h. Não existe logaritmo de zero nem de números negativos nos reais!</li>
                        </ul>
                    </div>

                    <div class="branch-section-box real-world">
                        <div class="branch-section-title">🌍 Casos Reais & Sólidos 3D:</div>
                        <ul class="branch-items-list">
                            <li><b>🏢 Edifício 3D & Sismologia:</b> Escala Richter M = ⅔ · log₁₀(E / 10³). Cada 1 grau a mais libera 31,6x mais energia de tremor!</li>
                            <li><b>🔊 Acústica:</b> Decibéis de intensidade sonora comprimindo trilhões de vibrações em 0 a 120 dB.</li>
                            <li><b>💧 Química:</b> Escala de acidez da água (pH = -log₁₀[H⁺]).</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}
