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
        this.seismicAnimationId = null;

        // Limites dos eixos cartesianos
        this.viewBounds = {
            minX: -5,
            maxX: 5,
            minY: -4,
            maxY: 6
        };

        this.initDOM();
    }

    initDOM() {
        this.canvas = document.getElementById('functionPlotCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvasEvents();
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
    }

    setupCanvasEvents() {
        if (!this.canvas) return;

        const handlePointer = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const xPixel = clientX - rect.left;
            const scaleX = (this.viewBounds.maxX - this.viewBounds.minX) / this.canvas.width;
            let mathX = this.viewBounds.minX + xPixel * scaleX;

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

    /**
     * Ativa o módulo específico (exponencial ou logarítmica)
     */
    activate(type = 'exponential') {
        this.activeType = type;
        this.showInverse = false;
        this.currentStep = 1;

        const overlay = document.getElementById('functionGraphOverlay');
        if (overlay) overlay.classList.remove('hidden');

        const leftSub = document.getElementById('subpanel-functions-left');
        if (leftSub) leftSub.classList.remove('hidden');

        const rightSub = document.getElementById('subpanel-functions-right');
        if (rightSub) rightSub.classList.remove('hidden');

        // Configura visuais do módulo
        const iconEl = document.getElementById('funcModuleIcon');
        const titleEl = document.getElementById('funcModuleTitle');
        const subEl = document.getElementById('funcModuleSubtitle');
        const shiftLabel = document.getElementById('funcShiftLabel');
        const btnInverse = document.getElementById('btnToggleInverseCurve');
        if (btnInverse) btnInverse.classList.remove('active');

        if (type === 'exponential') {
            if (iconEl) iconEl.textContent = '📈';
            if (titleEl) titleEl.textContent = 'Função Exponencial';
            if (subEl) subEl.textContent = 'Crescimento Rápido, Potências & Volume 3D';
            if (shiftLabel) shiftLabel.innerHTML = 'Assíntota Horizontal <b>(c)</b>:';
            this.viewBounds = { minX: -4, maxX: 4, minY: -2, maxY: 8 };
            
            // Sólido 3D padrão para exponencial: Cilindro Hidráulico com água
            if (window.switchSolidGlobal) {
                window.switchSolidGlobal('cylinder', { r: 2.0, h: 6.0 });
            }
        } else {
            if (iconEl) iconEl.textContent = '📉';
            if (titleEl) titleEl.textContent = 'Função Logarítmica';
            if (subEl) subEl.textContent = 'A Inversa, Escala Richter & Abalo Sísmico 3D';
            if (shiftLabel) shiftLabel.innerHTML = 'Assíntota Vertical <b>(h)</b>:';
            this.viewBounds = { minX: -2, maxX: 8, minY: -4, maxY: 5 };

            // Sólido 3D padrão para logarítmica: Edifício Arquitetônico 3D
            if (window.switchSolidGlobal) {
                window.switchSolidGlobal('rectangular_prism', { a: 6.0, b: 5.0, c: 8.0 });
                if (this.buildingStudio) {
                    this.buildingStudio.setActive(true);
                    this.buildingStudio.buildBuilding({ a: 6.0, b: 5.0, c: 8.0 });
                }
            }
        }

        this.renderPresets();
        this.setStep(1);
        this.updateUI();
    }

    deactivate() {
        const overlay = document.getElementById('functionGraphOverlay');
        if (overlay) overlay.classList.add('hidden');

        const leftSub = document.getElementById('subpanel-functions-left');
        if (leftSub) leftSub.classList.add('hidden');

        const rightSub = document.getElementById('subpanel-functions-right');
        if (rightSub) rightSub.classList.add('hidden');

        if (this.seismicAnimationId) {
            cancelAnimationFrame(this.seismicAnimationId);
            this.seismicAnimationId = null;
        }

        if (this.sceneMgr && this.sceneMgr.solidGroup) {
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

        if (stepNum === 2) this.renderExercises();
        if (stepNum === 3) this.renderRealityCase();
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
        if (!this.sceneMgr || !this.sceneMgr.solidGroup) return;

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

        const isExp = this.activeType === 'exponential';
        const exercises = isExp ? [
            {
                id: 'exp_ex1',
                question: '1. Dada a função <b>f(x) = 2ˣ</b>, qual é o valor da imagem para <b>x = 3</b>?',
                expected: 8,
                hint: '2³ = 2 × 2 × 2 = 8'
            },
            {
                id: 'exp_ex2',
                question: '2. Para <b>f(x) = 3ˣ - 4</b>, qual é a equação da assíntota horizontal quando x tende a -∞?',
                expected: -4,
                hint: 'Quando x tende a -∞, 3ˣ se aproxima de 0, sobrando y = -4'
            },
            {
                id: 'exp_ex3',
                question: '3. Se a base for <b>b = 0.5</b> (meia-vida), f(2) vale quanto em relação a f(0) = 1?',
                expected: 0.25,
                hint: '(0.5)² = 0.25 (um quarto do valor inicial)'
            }
        ] : [
            {
                id: 'log_ex1',
                question: '1. Calcule o valor de <b>log₂(16)</b> (a potência à qual 2 deve ser elevado para resultar em 16):',
                expected: 4,
                hint: '2⁴ = 16, logo log₂(16) = 4'
            },
            {
                id: 'log_ex2',
                question: '2. Qual é a raiz da função canônica <b>f(x) = log₁₀(x)</b> (ou seja, quando f(x) = 0)?',
                expected: 1,
                hint: 'Qualquer base elevada a 0 resulta em 1, portanto log(1) = 0'
            },
            {
                id: 'log_ex3',
                question: '3. Na função <b>f(x) = log₂(x - 3)</b>, qual é a coordenada x da assíntota vertical?',
                expected: 3,
                hint: 'A condição de existência é x - 3 > 0, logo a assíntota fica exatamente em x = 3'
            }
        ];

        container.innerHTML = exercises.map(ex => `
            <div class="exercise-item-card" id="card_${ex.id}">
                <div class="exercise-question">${ex.question}</div>
                <div class="exercise-input-row">
                    <input type="number" step="0.01" class="exercise-input" id="inp_${ex.id}" placeholder="Digite sua resposta">
                    <button class="btn-check-exercise" data-ex-id="${ex.id}">Conferir</button>
                </div>
                <div class="exercise-feedback hidden" id="fb_${ex.id}"></div>
            </div>
        `).join('');

        container.querySelectorAll('.btn-check-exercise').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                const ex = exercises[idx];
                const input = document.getElementById(`inp_${ex.id}`);
                const fb = document.getElementById(`fb_${ex.id}`);
                const val = parseFloat(input ? input.value : '');

                if (isNaN(val)) return;

                if (Math.abs(val - ex.expected) < 0.05) {
                    fb.className = 'exercise-feedback success';
                    fb.innerHTML = `✓ <b>Correto! (+50 XP)</b> ${ex.hint}`;
                    fb.classList.remove('hidden');
                    if (this.gameMgr) {
                        this.gameMgr.addXp(50);
                        const xpEl = document.getElementById('xpCount');
                        if (xpEl) xpEl.textContent = this.gameMgr.xp;
                    }
                    if (window.sounds) window.sounds.playSuccess();
                } else {
                    fb.className = 'exercise-feedback error';
                    fb.innerHTML = `❌ <b>Tente novamente!</b> Dica: ${ex.hint}`;
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

            const updateBiomass = (t) => {
                const vol = 125 * Math.pow(2, t);
                const percent = (vol / 1000) * 100;
                if (timeVal) timeVal.textContent = `t = ${t.toFixed(1)} h`;
                if (volVal) volVal.textContent = `${vol.toFixed(0)} Litros`;
                if (capVal) capVal.textContent = `${percent.toFixed(0)}% (${(vol / 1000).toFixed(2)} m³)`;

                // Sincroniza Three.js cilindro
                const scaleY = Math.min(1.8, Math.max(0.15, vol / 600));
                if (this.sceneMgr && this.sceneMgr.solidGroup) {
                    this.sceneMgr.solidGroup.scale.set(1, scaleY, 1);
                }

                // Sincroniza com o gráfico cartesiano
                this.expParams.xPoint = t;
                this.renderGraph();
            };

            if (slider) {
                slider.addEventListener('input', (e) => updateBiomass(parseFloat(e.target.value)));
            }

            const btnSim = document.getElementById('btnSimulateFilling');
            if (btnSim) {
                btnSim.addEventListener('click', () => {
                    let curT = 0;
                    if (window.sounds) window.sounds.playWater();
                    const interval = setInterval(() => {
                        curT += 0.1;
                        if (slider) slider.value = curT;
                        updateBiomass(curT);
                        if (curT >= 3.0) {
                            clearInterval(interval);
                            if (window.sounds) window.sounds.stopWater();
                            if (window.sounds) window.sounds.playSuccess();
                            if (this.engineerGuide) {
                                this.engineerGuide.showMessage({
                                    title: 'Tanque 100% Cheio!',
                                    text: 'Com t = 3 horas, 125 × 2³ = 1.000 Litros! O crescimento exponencial preencheu todo o volume de 1m³.'
                                });
                            }
                        }
                    }, 80);
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

        const isExp = this.activeType === 'exponential';

        if (isExp) {
            container.innerHTML = `
                <div class="hypothesis-card-item">
                    <div class="hypothesis-title">🔬 Hipótese 1: A Inversão da Base (b = 2 vs b = 0.5)</div>
                    <div class="hypothesis-desc">
                        "Se substituirmos a base b = 2 por sua inversa b = 0.5 (1/2), o gráfico sofre uma reflexão em relação ao eixo Y, transformando crescimento em decaimento."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHyp1A">Testar b = 2</button>
                        <button class="btn-hypothesis-action" id="btnTestHyp1B">Testar b = 0.5</button>
                        <button class="btn-hypothesis-validate" id="btnValidateHyp1">✓ Validar Hipótese</button>
                    </div>
                    <div class="hypothesis-result-box hidden" id="resHyp1"></div>
                </div>

                <div class="hypothesis-card-item" style="margin-top:10px;">
                    <div class="hypothesis-title">🔬 Hipótese 2: A Barreira Intransponível da Assíntota</div>
                    <div class="hypothesis-desc">
                        "Para qualquer base positiva b > 0, é matematicamente impossível bˣ ser menor ou igual a zero (a curva nunca cruza a assíntota y = 0)."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHyp2Ext">Testar x = -10 (Extremo)</button>
                        <button class="btn-hypothesis-validate" id="btnValidateHyp2">✓ Validar Hipótese</button>
                    </div>
                    <div class="hypothesis-result-box hidden" id="resHyp2"></div>
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
                        if (this.gameMgr) this.gameMgr.addXp(100);
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
                        if (this.gameMgr) this.gameMgr.addXp(100);
                        if (window.sounds) window.sounds.playSuccess();
                    }
                });
            }
        } else {
            // Hipóteses do Módulo Logarítmico
            container.innerHTML = `
                <div class="hypothesis-card-item">
                    <div class="hypothesis-title">🔬 Hipótese 1: A Simetria Especular Inversa (y = x)</div>
                    <div class="hypothesis-desc">
                        "A função logarítmica f(x) = log₂(x) e a função exponencial g(x) = 2ˣ são funções inversas mútuas e suas curvas são simétricas em relação à bissetriz y = x."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHypLogMirror">Exibir Espelho y = x</button>
                        <button class="btn-hypothesis-validate" id="btnValidateHypLog">✓ Validar Hipótese</button>
                    </div>
                    <div class="hypothesis-result-box hidden" id="resHypLog1"></div>
                </div>

                <div class="hypothesis-card-item" style="margin-top:10px;">
                    <div class="hypothesis-title">🔬 Hipótese 2: Condição de Existência e Assíntota Vertical</div>
                    <div class="hypothesis-desc">
                        "Não existe logaritmo de número negativo ou zero nos números reais. Por isso, a assíntota vertical impede o gráfico de ultrapassar o limiar x = h."
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <button class="btn-hypothesis-action" id="btnTestHypLogLimit">Aproximar de x = 0</button>
                        <button class="btn-hypothesis-validate" id="btnValidateHypLog2">✓ Validar Hipótese</button>
                    </div>
                    <div class="hypothesis-result-box hidden" id="resHypLog2"></div>
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
                        if (this.gameMgr) this.gameMgr.addXp(100);
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
                        if (this.gameMgr) this.gameMgr.addXp(100);
                        if (window.sounds) window.sounds.playSuccess();
                    }
                });
            }
        }
    }
}
