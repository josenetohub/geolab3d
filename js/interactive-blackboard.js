// =============================================================================
// GEO LAB 3D - LOUSA INTERATIVA DE CÁLCULO (DRAG & DROP DE EQUAÇÕES)
// Resolução de Letramento Matemático: Expansão de Potências e Multiplicação Passo a Passo
// =============================================================================

class InteractiveBlackboard {
    constructor(sceneManager, engineerGuide, onEquationCompleted) {
        this.sm = sceneManager;
        this.engineer = engineerGuide;
        this.onEquationCompleted = onEquationCompleted;

        this.currentSolidId = 'cube';
        this.currentParams = { a: 3.0 };
        this.currentFormulaType = 'volume'; // 'volume', 'area_total', 'perimeter'

        // Estado do passo a passo interativo
        this.state = {
            step: 'awaiting_dimension', // 'awaiting_dimension', 'power_expanded', 'first_multiplied', 'completed'
            droppedValues: {},
            expandedFactors: [],
            intermediateResult: null,
            finalResult: null,
            hasCompletedDerivation: false
        };

        this.container = null;
    }

    mount(containerElement) {
        this.container = containerElement;
        this.render();
    }

    setSolid(solidId, params) {
        this.currentSolidId = solidId;
        this.currentParams = { ...params };
        this.resetState();
        this.render();
    }

    setFormulaType(type) {
        this.currentFormulaType = type;
        this.resetState();
        this.render();
    }

    resetState() {
        this.state = {
            step: 'awaiting_dimension',
            droppedValues: {},
            expandedFactors: [],
            intermediateResult: null,
            finalResult: null,
            hasCompletedDerivation: false
        };
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="blackboard-card">
                <!-- CABEÇALHO DA LOUSA ESCOLAR -->
                <div class="blackboard-header">
                    <div class="blackboard-title-group">
                        <span class="chalk-icon">📐</span>
                        <div>
                            <div class="blackboard-title">Lousa de Dedução Matemática</div>
                            <div class="blackboard-subtitle">Arraste as medidas e descomplique as equações</div>
                        </div>
                    </div>

                    <!-- ABAS DE FÓRMULAS INTERATIVAS -->
                    <div class="blackboard-tabs">
                        <button class="b-tab ${this.currentFormulaType === 'volume' ? 'active' : ''}" data-ftype="volume">
                            🧪 Volume (V)
                        </button>
                        <button class="b-tab ${this.currentFormulaType === 'area_total' ? 'active' : ''}" data-ftype="area_total">
                            🎨 Área Total (At)
                        </button>
                        <button class="b-tab ${this.currentFormulaType === 'perimeter' ? 'active' : ''}" data-ftype="perimeter">
                            📏 Perímetro (1D)
                        </button>
                    </div>
                </div>

                <!-- BANDEJA DE MEDIDAS 3D (CHIPS ARRASTÁVEIS) -->
                <div class="blackboard-tray">
                    <span class="tray-label">👇 Medidas do Sólido 3D (Clique ou arraste para a fórmula):</span>
                    <div class="dimension-chips-list" id="blackboardChipsList">
                        ${this.renderDimensionChips()}
                    </div>
                </div>

                <!-- ÁREA PRINCIPAL DA EQUAÇÃO COM SLOTS INTERATIVOS -->
                <div class="blackboard-equation-stage" id="blackboardEquationStage">
                    ${this.renderEquationStage()}
                </div>

                <!-- ALERTA DE EQUÍVOCO CONCEITUAL PEDAGÓGICO -->
                <div class="blackboard-misconception-row">
                    <button class="btn-misconception-tip" id="btnExplainMisconception">
                        ⚠️ Atenção: Tem dúvida sobre expoentes e potências? Peça ajuda ao Leo!
                    </button>
                </div>

                <!-- RODAPÉ PEDAGÓGICO DE ORIENTAÇÃO -->
                <div class="blackboard-footer">
                    <div class="chalk-helper-hint" id="blackboardHint">
                        ${this.getPedagogicalHint()}
                    </div>
                    <button class="btn-chalk-reset" id="btnResetBlackboard" title="Recomeçar dedução">
                        ↺ Reiniciar
                    </button>
                </div>
            </div>
        `;

        this.attachEvents();
        this.updateDirectCommandHUD();
    }

    renderDimensionChips() {
        const id = this.currentSolidId;
        const p = this.currentParams;
        const chips = [];

        if (id === 'cube') {
            const a = p.a || 3.0;
            chips.push({ key: 'a', name: 'Aresta a', val: a, unit: 'm', color: '#0ea5e9' });
        } else if (id === 'rectangular_prism') {
            chips.push({ key: 'a', name: 'Comprimento a', val: p.a || 6.0, unit: 'm', color: '#0ea5e9' });
            chips.push({ key: 'b', name: 'Largura b', val: p.b || 2.5, unit: 'm', color: '#10b981' });
            chips.push({ key: 'c', name: 'Altura c', val: p.c || 2.6, unit: 'm', color: '#f59e0b' });
        } else if (id === 'cylinder') {
            chips.push({ key: 'r', name: 'Raio r', val: p.r || 2.0, unit: 'm', color: '#0ea5e9' });
            chips.push({ key: 'h', name: 'Altura h', val: p.h || 6.0, unit: 'm', color: '#f59e0b' });
        } else if (id === 'cone') {
            chips.push({ key: 'r', name: 'Raio r', val: p.r || 2.0, unit: 'm', color: '#0ea5e9' });
            chips.push({ key: 'h', name: 'Altura h', val: p.h || 4.0, unit: 'm', color: '#f59e0b' });
        } else if (id === 'square_pyramid') {
            chips.push({ key: 'l', name: 'Lado da Base L', val: p.l || 6.0, unit: 'm', color: '#0ea5e9' });
            chips.push({ key: 'h', name: 'Altura h', val: p.h || 4.0, unit: 'm', color: '#f59e0b' });
            const ap = Math.sqrt(Math.pow((p.l || 6) / 2, 2) + Math.pow(p.h || 4, 2));
            chips.push({ key: 'ap', name: 'Apótema ap', val: parseFloat(ap.toFixed(2)), unit: 'm', color: '#10b981' });
        } else if (id === 'sphere') {
            chips.push({ key: 'r', name: 'Raio R', val: p.r || 3.0, unit: 'm', color: '#0ea5e9' });
        } else {
            chips.push({ key: 'a', name: 'Medida a', val: p.a || 3.0, unit: 'm', color: '#0ea5e9' });
        }

        return chips.map(c => `
            <div class="draggable-measure-chip ${this.state.step === 'awaiting_dimension' ? 'beacon-pulse-glow' : ''}" 
                 draggable="true" 
                 data-key="${c.key}" 
                 data-val="${c.val}" 
                 style="border-color:${c.color};"
                 title="Arraste para a incógnita na Lousa ou dê um clique">
                <span class="chip-drag-handle">⠿</span>
                <span class="chip-name">${c.name}:</span>
                <span class="chip-val">${c.val.toFixed(1)} ${c.unit}</span>
                ${this.state.step === 'awaiting_dimension' ? '<span class="chip-beacon-badge">👉 CLIQUE OU ARRASTE</span>' : ''}
            </div>
        `).join('');
    }

    renderEquationStage() {
        const type = this.currentFormulaType;
        const id = this.currentSolidId;

        // CUBO
        if (id === 'cube') {
            if (type === 'volume') return this.renderCubeVolumeFlow();
            if (type === 'area_total') return this.renderCubeAreaFlow();
            if (type === 'perimeter') return this.renderCubePerimeterFlow();
        }

        // PARALELEPÍPEDO / PRISMA RETANGULAR
        if (id === 'rectangular_prism') {
            if (type === 'volume') return this.renderPrismVolumeFlow();
            if (type === 'area_total') return this.renderPrismAreaFlow();
            if (type === 'perimeter') return this.renderPrismPerimeterFlow();
        }

        // CILINDRO
        if (id === 'cylinder') {
            if (type === 'volume') return this.renderCylinderVolumeFlow();
            if (type === 'area_total') return this.renderCylinderAreaFlow();
            if (type === 'perimeter') return this.renderCylinderPerimeterFlow();
        }

        // PIRÂMIDE QUADRANGULAR
        if (id === 'square_pyramid') {
            if (type === 'volume') return this.renderPyramidVolumeFlow();
            if (type === 'area_total') return this.renderPyramidAreaFlow();
            if (type === 'perimeter') return this.renderPyramidPerimeterFlow();
        }

        // ESFERA
        if (id === 'sphere') {
            if (type === 'volume') return this.renderSphereVolumeFlow();
            if (type === 'area_total') return this.renderSphereAreaFlow();
            if (type === 'perimeter') return this.renderSpherePerimeterFlow();
        }

        // Caso Genérico Dinâmico
        return this.renderGenericFlow();
    }

    // =========================================================================
    // 1. CUBO: VOLUME (V = a³ ➔ 3³ ➔ 3 × 3 × 3 ➔ 9 × 3 ➔ 27 m³)
    // =========================================================================
    renderCubeVolumeFlow() {
        const a = this.currentParams.a || 3.0;
        const step = this.state.step;

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V =</span>
                    <div class="formula-drop-zone drop-pulse target-beacon-zone" data-target-key="a" id="dropZoneA">
                        <span class="beacon-drop-icon">📥</span>
                        <span class="drop-hint-text">SOLTE AQUI (a = ${a.toFixed(1)}m)</span>
                        <span class="zone-beacon-badge">👇 SOLTE OU CLIQUE AQUI</span>
                    </div>
                    <span class="eq-exponent">³</span>
                </div>
                <div class="equation-subcaption">
                    👉 <b>O que fazer agora:</b> Clique ou arraste o bloco <b>[ Aresta a: ${a.toFixed(1)} m ]</b> acima para dentro da caixa <b>[ ? ]³</b>!
                </div>
            `;
        }

        if (step === 'power_expanded') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V = (${a.toFixed(0)})³ =</span>
                    
                    <div class="expansion-container">
                        <div class="number-block draggable-factor" draggable="true" data-factor-idx="0">${a.toFixed(0)}</div>
                        <span class="op-multiply-btn" data-multiply-idx="0" title="Clique para multiplicar">×</span>
                        <div class="number-block draggable-factor" draggable="true" data-factor-idx="1">${a.toFixed(0)}</div>
                        <span class="op-multiply-btn" data-multiply-idx="1" title="Clique para multiplicar">×</span>
                        <div class="number-block draggable-factor" draggable="true" data-factor-idx="2">${a.toFixed(0)}</div>
                    </div>
                </div>
                <div class="equation-action-prompt">
                    👆 <b>A potência foi expandida!</b> Junte o primeiro <b>[ ${a.toFixed(0)} ]</b> com o segundo <b>[ ${a.toFixed(0)} ]</b> (ou clique no <b>×</b>) para multiplicar:
                </div>
            `;
        }

        if (step === 'first_multiplied') {
            const intermediate = a * a; // 9
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V =</span>
                    <div class="expansion-container">
                        <div class="number-block merged-highlight draggable-factor" draggable="true" data-factor-idx="merged">
                            ${intermediate.toFixed(0)}
                            <span class="factor-origin">(${a} × ${a})</span>
                        </div>
                        <span class="op-multiply-btn" data-multiply-idx="final" title="Multiplicar pelo último fator">×</span>
                        <div class="number-block draggable-factor" draggable="true" data-factor-idx="2">${a.toFixed(0)}</div>
                    </div>
                </div>
                <div class="equation-action-prompt">
                    🎉 <b>${a} × ${a} = ${intermediate.toFixed(0)}!</b> Agora multiplique <b>[ ${intermediate.toFixed(0)} ]</b> pelo último <b>[ ${a.toFixed(0)} ]</b> para obter o volume total:
                </div>
            `;
        }

        if (step === 'completed') {
            const finalVol = a * a * a;
            const liters = finalVol * 1000;
            return `
                <div class="equation-result-card success-burst">
                    <div class="res-title">🏆 Equação Totalmente Deduzida!</div>
                    <div class="equation-row" style="font-size:1.3rem;">
                        <span>V = a³ = ${a} × ${a} × ${a} =</span>
                        <span class="final-val-glow">${finalVol.toFixed(2)} m³</span>
                    </div>

                    <div class="liters-equivalence-box">
                        <span class="water-icon">💧</span>
                        <div>
                            <b>Equivalência em Litros:</b> ${liters.toLocaleString('pt-BR')} Litros de água!
                            <div style="font-size:0.75rem; color:var(--text-secondary);">(1 m³ equivale a 1.000 Litros)</div>
                        </div>
                    </div>

                    <div class="equation-badge-unlocked">
                        ✓ Validação da Fase Concluída com Sucesso!
                    </div>

                    <div class="next-stage-cta-row" style="margin-top:10px;">
                        <button class="btn-action-primary glow-pulse" id="btnBlackboardNextStage" style="width:100%; padding:10px; font-weight:800; font-size:0.95rem; cursor:pointer;">
                            Avançar para a Próxima Fase ▶
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // =========================================================================
    // 2. CUBO: ÁREA TOTAL (At = 6 · a² ➔ 6 · (3 × 3) ➔ 6 · 9 ➔ 54 m²)
    // =========================================================================
    renderCubeAreaFlow() {
        const a = this.currentParams.a || 3.0;
        const step = this.state.step;

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">At = 6 ·</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="a" id="dropZoneA">
                        <span class="drop-hint-text">Arraste a aresta (a = ${a.toFixed(1)}m) aqui</span>
                    </div>
                    <span class="eq-exponent">²</span>
                </div>
                <div class="equation-subcaption">
                    💡 O número <b>6</b> representa as 6 faces quadradas idênticas do cubo!
                </div>
            `;
        }

        if (step === 'power_expanded') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">At = 6 ·</span>
                    <div class="expansion-container">
                        <div class="number-block draggable-factor" draggable="true" data-factor-idx="0">${a.toFixed(0)}</div>
                        <span class="op-multiply-btn" data-multiply-idx="0" title="Clique para multiplicar as duas arestas da face">×</span>
                        <div class="number-block draggable-factor" draggable="true" data-factor-idx="1">${a.toFixed(0)}</div>
                    </div>
                </div>
                <div class="equation-action-prompt">
                    👆 <b>Primeiro calculamos a área de 1 face (a²):</b> Junte os dois blocos <b>[ ${a.toFixed(0)} ] × [ ${a.toFixed(0)} ]</b>:
                </div>
            `;
        }

        if (step === 'first_multiplied') {
            const faceArea = a * a; // 9
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">At = 6 ·</span>
                    <div class="number-block merged-highlight" id="blockFaceArea">${faceArea.toFixed(0)} m²</div>
                </div>
                <div class="equation-action-prompt">
                    🎉 Cada face quadrada mede <b>${faceArea.toFixed(0)} m²</b>! Como o cubo tem 6 faces iguais, multiplique 6 × ${faceArea.toFixed(0)}:
                    <div style="margin-top:8px;">
                        <button class="btn-action-primary" id="btnMultiplySixFace" style="width:100%; padding:8px;">
                            Multiplicar 6 × ${faceArea.toFixed(0)} ➔
                        </button>
                    </div>
                </div>
            `;
        }

        if (step === 'completed') {
            const totalArea = 6 * a * a;
            return `
                <div class="equation-result-card success-burst">
                    <div class="res-title">🎨 Área Total da Casca Concluída!</div>
                    <div class="equation-row" style="font-size:1.3rem;">
                        <span>At = 6 · a² = 6 · ${a * a} =</span>
                        <span class="final-val-glow" style="color:var(--accent-amber);">${totalArea.toFixed(2)} m²</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:6px;">
                        É necessária uma área de <b>${totalArea.toFixed(2)} m²</b> de papel ou tinta para revestir todas as faces!
                    </div>
                    <div class="next-stage-cta-row" style="margin-top:10px;">
                        <button class="btn-action-primary glow-pulse" id="btnBlackboardNextStage" style="width:100%; padding:10px; font-weight:800; font-size:0.95rem; cursor:pointer;">
                            Avançar para a Próxima Fase ▶
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // =========================================================================
    // 3. CUBO: PERÍMETRO (1D: Base = 4·a, Total = 12·a)
    // =========================================================================
    renderCubePerimeterFlow() {
        const a = this.currentParams.a || 3.0;
        const step = this.state.step;

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">Pbase = 4 ·</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="a">
                        <span class="drop-hint-text">Arraste a aresta (a = ${a.toFixed(1)}m)</span>
                    </div>
                </div>
                <div class="equation-subcaption">
                    📏 O quadrado da base possui 4 lados de comprimento <b>a</b>. Perímetro é medida 1D (metros lineares).
                </div>
            `;
        }

        const baseP = 4 * a;
        const totalP = 12 * a;
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">📏 Perímetro Linear (1D) Concluído!</div>
                <div class="equation-row" style="font-size:1.2rem;">
                    <span>Perímetro da Base: 4 × ${a} =</span>
                    <span class="final-val-glow" style="color:var(--accent-cyan);">${baseP.toFixed(1)} m</span>
                </div>
                <div class="equation-row" style="font-size:1.1rem; margin-top:6px;">
                    <span>Soma de Todas as 12 Arestas: 12 × ${a} =</span>
                    <b style="color:#fff;">${totalP.toFixed(1)} m</b>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 4. PARALELEPÍPEDO: VOLUME (V = a · b · c)
    // =========================================================================
    renderPrismVolumeFlow() {
        const a = this.currentParams.a || 6.0;
        const b = this.currentParams.b || 2.5;
        const c = this.currentParams.c || 2.6;
        const step = this.state.step;

        if (step === 'awaiting_dimension') {
            const hasA = this.state.droppedValues.a !== undefined;
            const hasB = this.state.droppedValues.b !== undefined;
            const hasC = this.state.droppedValues.c !== undefined;

            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V =</span>
                    <div class="formula-drop-zone ${hasA ? 'filled' : 'drop-pulse target-beacon-zone'}" data-target-key="a">
                        ${hasA ? this.state.droppedValues.a : '📥 a (' + a + 'm)'}
                        ${!hasA ? '<span class="zone-beacon-badge">👇 SOLTE OU CLIQUE</span>' : ''}
                    </div>
                    <span class="eq-symbol">·</span>
                    <div class="formula-drop-zone ${hasB ? 'filled' : 'drop-pulse target-beacon-zone'}" data-target-key="b">
                        ${hasB ? this.state.droppedValues.b : '📥 b (' + b + 'm)'}
                        ${!hasB && hasA ? '<span class="zone-beacon-badge">👇 SOLTE OU CLIQUE</span>' : ''}
                    </div>
                    <span class="eq-symbol">·</span>
                    <div class="formula-drop-zone ${hasC ? 'filled' : 'drop-pulse target-beacon-zone'}" data-target-key="c">
                        ${hasC ? this.state.droppedValues.c : '📥 c (' + c + 'm)'}
                        ${!hasC && hasA && hasB ? '<span class="zone-beacon-badge">👇 SOLTE OU CLIQUE</span>' : ''}
                    </div>
                </div>
                <div class="equation-subcaption">
                    👉 <b>O que fazer:</b> Arraste ou clique nos blocos de <b>Comprimento (a)</b>, <b>Largura (b)</b> e <b>Altura (c)</b> na bandeja acima!
                </div>
            `;
        }

        if (step === 'power_expanded' || step === 'first_multiplied') {
            const baseArea = a * b;
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V =</span>
                    <div class="number-block merged-highlight">${baseArea.toFixed(1)} m² <span class="factor-origin">(Abase = a × b)</span></div>
                    <span class="eq-symbol">×</span>
                    <div class="number-block">${c.toFixed(1)} m <span class="factor-origin">(Altura c)</span></div>
                </div>
                <div class="equation-action-prompt">
                    Área da Base (chão) = <b>${baseArea.toFixed(1)} m²</b>. Multiplique pela altura <b>${c.toFixed(1)} m</b>:
                    <div style="margin-top:8px;">
                        <button class="btn-action-primary" id="btnMultiplyBaseHeight" style="width:100%; padding:8px;">
                            Multiplicar Abase × Altura ➔
                        </button>
                    </div>
                </div>
            `;
        }

        if (step === 'completed') {
            const finalVol = a * b * c;
            return `
                <div class="equation-result-card success-burst">
                    <div class="res-title">🚢 Cubagem de Carga Homologada!</div>
                    <div class="equation-row" style="font-size:1.3rem;">
                        <span>V = a · b · c =</span>
                        <span class="final-val-glow">${finalVol.toFixed(2)} m³</span>
                    </div>
                    <div class="liters-equivalence-box">
                        <span class="water-icon">📦</span>
                        <div>Capacidade Útil: <b>${(finalVol * 1000).toLocaleString('pt-BR')} Litros</b> de carga!</div>
                    </div>
                    <div class="next-stage-cta-row" style="margin-top:10px;">
                        <button class="btn-action-primary glow-pulse" id="btnBlackboardNextStage" style="width:100%; padding:10px; font-weight:800; font-size:0.95rem; cursor:pointer;">
                            Avançar para a Próxima Fase ▶
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // =========================================================================
    // 5. PARALELEPÍPEDO: ÁREA TOTAL (At = 2·(ab + ac + bc))
    // =========================================================================
    renderPrismAreaFlow() {
        const a = this.currentParams.a || 6.0;
        const b = this.currentParams.b || 2.5;
        const c = this.currentParams.c || 2.6;
        const step = this.state.step;

        const ab = a * b; // 15
        const ac = a * c; // 15.6
        const bc = b * c; // 6.5
        const halfSum = ab + ac + bc; // 37.1
        const total = 2 * halfSum; // 74.2

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row" style="font-size:1.05rem;">
                    <span class="eq-symbol highlight-symbol">At = 2 · (</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="a">a (${a}m)</div>
                    <span>· b + a · c + b · c )</span>
                </div>
                <div class="equation-subcaption">
                    O paralelepípedo possui 3 pares de faces retangulares opostas congruentes.
                </div>
            `;
        }

        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🎨 Área Total de Chapas Concluída!</div>
                <div class="equation-row" style="font-size:1.15rem;">
                    <span>At = 2 · (${ab.toFixed(1)} + ${ac.toFixed(1)} + ${bc.toFixed(1)}) =</span>
                    <span class="final-val-glow" style="color:var(--accent-amber);">${total.toFixed(2)} m²</span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:6px;">
                    Base e topo (${2 * ab} m²) + Frente e fundo (${2 * ac} m²) + Laterais (${2 * bc} m²).
                </div>
            </div>
        `;
    }

    renderPrismPerimeterFlow() {
        const a = this.currentParams.a || 6.0;
        const b = this.currentParams.b || 2.5;
        const pBase = 2 * (a + b);
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">📏 Perímetro da Base do Prisma</div>
                <div class="equation-row" style="font-size:1.2rem;">
                    <span>Pbase = 2 · (a + b) = 2 · (${a} + ${b}) =</span>
                    <span class="final-val-glow" style="color:var(--accent-cyan);">${pBase.toFixed(1)} m</span>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 6. CILINDRO: VOLUME (V = π · r² · h)
    // =========================================================================
    renderCylinderVolumeFlow() {
        const r = this.currentParams.r || 2.0;
        const h = this.currentParams.h || 6.0;
        const step = this.state.step;

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V = π ·</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="r">
                        <span class="drop-hint-text">Raio (r = ${r}m)</span>
                    </div>
                    <span class="eq-exponent">²</span>
                    <span class="eq-symbol">·</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="h">
                        <span class="drop-hint-text">Altura (h = ${h}m)</span>
                    </div>
                </div>
                <div class="equation-subcaption">
                    💡 A base é um círculo (<b>Ab = π · r²</b>). Arraste o raio e a altura!
                </div>
            `;
        }

        if (step === 'power_expanded') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V = 3,14 ·</span>
                    <div class="expansion-container">
                        <div class="number-block">${r}</div>
                        <span class="op-multiply-btn" data-multiply-idx="cyl_r">×</span>
                        <div class="number-block">${r}</div>
                    </div>
                    <span class="eq-symbol">·</span>
                    <div class="number-block">${h}</div>
                </div>
                <div class="equation-action-prompt">
                    Junte <b>[ ${r} ] × [ ${r} ]</b> para expandir a área do círculo (r² = ${r * r}):
                    <div style="margin-top:8px;">
                        <button class="btn-action-primary" id="btnMultiplyCylBase" style="width:100%; padding:8px;">
                            Calcular Raio ao Quadrado ➔
                        </button>
                    </div>
                </div>
            `;
        }

        const finalVol = Math.PI * r * r * h;
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🌾 Volume do Silo Concluído!</div>
                <div class="equation-row" style="font-size:1.3rem;">
                    <span>V = π · r² · h ≈ 3,14 · ${r * r} · ${h} =</span>
                    <span class="final-val-glow">${finalVol.toFixed(2)} m³</span>
                </div>
                <div class="liters-equivalence-box">
                    <span class="water-icon">🌽</span>
                    <div>Capacidade de Armazenamento: <b>${(finalVol * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Litros</b></div>
                </div>
                <div class="next-stage-cta-row" style="margin-top:10px;">
                    <button class="btn-action-primary glow-pulse" id="btnBlackboardNextStage" style="width:100%; padding:10px; font-weight:800; font-size:0.95rem; cursor:pointer;">
                        Avançar para a Próxima Fase ▶
                    </button>
                </div>
            </div>
        `;
    }

    renderCylinderAreaFlow() {
        const r = this.currentParams.r || 2.0;
        const h = this.currentParams.h || 6.0;
        const lateralArea = 2 * Math.PI * r * h;
        const basesArea = 2 * Math.PI * r * r;
        const totalArea = lateralArea + basesArea;
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🎨 Área Total do Silo Cilíndrico</div>
                <div class="equation-row" style="font-size:1.2rem;">
                    <span>At = 2·π·r·h + 2·π·r² ≈</span>
                    <span class="final-val-glow" style="color:var(--accent-amber);">${totalArea.toFixed(2)} m²</span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:6px;">
                    Manta lateral retangular (${lateralArea.toFixed(1)} m²) + 2 tampas circulares (${basesArea.toFixed(1)} m²).
                </div>
            </div>
        `;
    }

    renderCylinderPerimeterFlow() {
        const r = this.currentParams.r || 2.0;
        const circ = 2 * Math.PI * r;
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">📏 Circunferência da Base (1D)</div>
                <div class="equation-row" style="font-size:1.2rem;">
                    <span>C = 2 · π · r ≈ 2 · 3,14 · ${r} =</span>
                    <span class="final-val-glow" style="color:var(--accent-cyan);">${circ.toFixed(2)} m</span>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 7. PIRÂMIDE: VOLUME E ÁREA TOTAL
    // =========================================================================
    renderPyramidVolumeFlow() {
        const l = this.currentParams.l || 6.0;
        const h = this.currentParams.h || 4.0;
        const step = this.state.step;

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V = (</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="l">
                        <span class="drop-hint-text">Lado L (${l}m)</span>
                    </div>
                    <span class="eq-exponent">²</span>
                    <span class="eq-symbol">·</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="h">
                        <span class="drop-hint-text">Altura h (${h}m)</span>
                    </div>
                    <span class="eq-symbol">) / 3</span>
                </div>
                <div class="equation-subcaption">
                    💡 Toda pirâmide tem <b>1/3 do volume</b> do prisma de mesma base e altura!
                </div>
            `;
        }

        const baseArea = l * l; // 36
        const totalVol = (baseArea * h) / 3; // 48
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🏛️ Volume da Pirâmide Deduzido!</div>
                <div class="equation-row" style="font-size:1.3rem;">
                    <span>V = (Abase · h) / 3 = (${baseArea} · ${h}) / 3 =</span>
                    <span class="final-val-glow">${totalVol.toFixed(2)} m³</span>
                </div>
                <div class="liters-equivalence-box">
                    <span class="water-icon">💨</span>
                    <div>Capacidade de Vão Livre: <b>${(totalVol * 1000).toLocaleString('pt-BR')} Litros</b> de ar!</div>
                </div>
                <div class="next-stage-cta-row" style="margin-top:10px;">
                    <button class="btn-action-primary glow-pulse" id="btnBlackboardNextStage" style="width:100%; padding:10px; font-weight:800; font-size:0.95rem; cursor:pointer;">
                        Avançar para a Próxima Fase ▶
                    </button>
                </div>
            </div>
        `;
    }

    renderPyramidAreaFlow() {
        const l = this.currentParams.l || 6.0;
        const h = this.currentParams.h || 4.0;
        const apBase = l / 2;
        const ap = Math.sqrt(h * h + apBase * apBase); // 5.0
        const baseArea = l * l; // 36
        const facesArea = 4 * ((l * ap) / 2); // 60
        const totalArea = baseArea + facesArea; // 96
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🎨 Área Total da Pirâmide (Vidro)</div>
                <div class="equation-row" style="font-size:1.25rem;">
                    <span>At = Base (${baseArea} m²) + 4 Faces (${facesArea} m²) =</span>
                    <span class="final-val-glow" style="color:var(--accent-amber);">${totalArea.toFixed(2)} m²</span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:6px;">
                    Apótema ap = 5,0 m (calculado via Pitágoras: ap² = 4² + 3² = 25).
                </div>
            </div>
        `;
    }

    renderPyramidPerimeterFlow() {
        const l = this.currentParams.l || 6.0;
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">📏 Perímetro da Base Quadrada</div>
                <div class="equation-row" style="font-size:1.2rem;">
                    <span>Pbase = 4 · L = 4 · ${l} =</span>
                    <span class="final-val-glow" style="color:var(--accent-cyan);">${(4 * l).toFixed(1)} m</span>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 8. ESFERA: VOLUME E ÁREA DA SUPERFÍCIE
    // =========================================================================
    renderSphereVolumeFlow() {
        const r = this.currentParams.r || 3.0;
        const step = this.state.step;

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">V = (4/3) · π ·</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="r">
                        <span class="drop-hint-text">Raio R (${r}m)</span>
                    </div>
                    <span class="eq-exponent">³</span>
                </div>
                <div class="equation-subcaption">
                    💡 O raio é elevado ao cubo (<b>R³ = R × R × R</b>) em 3 Dimensões!
                </div>
            `;
        }

        if (step === 'power_expanded') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">R³ =</span>
                    <div class="expansion-container">
                        <div class="number-block">${r}</div>
                        <span class="op-multiply-btn" data-multiply-idx="sph_r">×</span>
                        <div class="number-block">${r}</div>
                        <span class="op-multiply-btn" data-multiply-idx="sph_r">×</span>
                        <div class="number-block">${r}</div>
                    </div>
                </div>
                <div class="equation-action-prompt">
                    Multiplique os 3 fatores <b>${r} × ${r} × ${r} = ${r * r * r}</b>:
                    <div style="margin-top:8px;">
                        <button class="btn-action-primary" id="btnMultiplySphereCube" style="width:100%; padding:8px;">
                            Calcular R³ (${r * r * r}) ➔
                        </button>
                    </div>
                </div>
            `;
        }

        const finalVol = (4 / 3) * Math.PI * Math.pow(r, 3);
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🌐 Volume da Esfera Deduzido!</div>
                <div class="equation-row" style="font-size:1.3rem;">
                    <span>V = (4/3) · π · R³ ≈ (4/3) · 3,14 · ${r * r * r} =</span>
                    <span class="final-val-glow">${finalVol.toFixed(2)} m³</span>
                </div>
                <div class="liters-equivalence-box">
                    <span class="water-icon">⚡</span>
                    <div>Gás sob Pressão: <b>${(finalVol * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Litros</b></div>
                </div>
                <div class="next-stage-cta-row" style="margin-top:10px;">
                    <button class="btn-action-primary glow-pulse" id="btnBlackboardNextStage" style="width:100%; padding:10px; font-weight:800; font-size:0.95rem; cursor:pointer;">
                        Avançar para a Próxima Fase ▶
                    </button>
                </div>
            </div>
        `;
    }

    renderSphereAreaFlow() {
        const r = this.currentParams.r || 3.0;
        const totalArea = 4 * Math.PI * r * r;
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🎨 Área da Superfície Esférica</div>
                <div class="equation-row" style="font-size:1.25rem;">
                    <span>At = 4 · π · R² ≈ 4 · 3,14 · ${r * r} =</span>
                    <span class="final-val-glow" style="color:var(--accent-amber);">${totalArea.toFixed(2)} m²</span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:6px;">
                    A casca da esfera equivale exatamente à área de 4 círculos de mesmo raio!
                </div>
            </div>
        `;
    }

    renderSpherePerimeterFlow() {
        const r = this.currentParams.r || 3.0;
        const eq = 2 * Math.PI * r;
        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">📏 Perímetro do Equador da Esfera</div>
                <div class="equation-row" style="font-size:1.2rem;">
                    <span>C = 2 · π · R ≈ 2 · 3,14 · ${r} =</span>
                    <span class="final-val-glow" style="color:var(--accent-cyan);">${eq.toFixed(2)} m</span>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // FLUXO GENÉRICO INTERATIVO (CONE, PRISMAS DIVERSOS, ETC.)
    // =========================================================================
    renderGenericFlow() {
        const step = this.state.step;
        const id = this.currentSolidId;
        const p = this.currentParams;

        if (step === 'awaiting_dimension') {
            return `
                <div class="equation-row">
                    <span class="eq-symbol highlight-symbol">Cálculo:</span>
                    <div class="formula-drop-zone drop-pulse" data-target-key="any">
                        <span class="drop-hint-text">Arraste uma medida aqui para calcular</span>
                    </div>
                </div>
                <div class="equation-subcaption">
                    Dedução interativa de parâmetros para ${id}.
                </div>
            `;
        }

        return `
            <div class="equation-result-card success-burst">
                <div class="res-title">🏆 Dedução Homologada!</div>
                <div style="padding:10px 0;">Todos os parâmetros foram processados com sucesso pelo GeoLab 3D.</div>
            </div>
        `;
    }

    getPedagogicalHint() {
        const type = this.currentFormulaType;
        if (type === 'volume') {
            return '💡 <b>Volume é o que cabe dentro (3D).</b> Arraste as arestas para compor a equação tridimensional!';
        } else if (type === 'area_total') {
            return '💡 <b>Área Total é a casca (2D).</b> Medida em metros quadrados (m²)!';
        } else {
            return '💡 <b>Perímetro é o contorno linear (1D).</b> Medido em metros simples (m).';
        }
    }

    // =========================================================================
    // EVENTOS INTERATIVOS DE ARRASTAR, SOLTAR E MULTIPLICAR
    // =========================================================================
    attachEvents() {
        if (!this.container) return;

        // Abas de tipo de fórmula
        this.container.querySelectorAll('.b-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const ftype = tab.dataset.ftype;
                this.setFormulaType(ftype);
                if (window.sounds) window.sounds.playClick();
            });
        });

        // Botão de dúvida conceitual com o Engenheiro
        const btnMisconception = this.container.querySelector('#btnExplainMisconception');
        if (btnMisconception) {
            btnMisconception.addEventListener('click', () => {
                if (this.engineer) {
                    const a = this.currentParams.a || this.currentParams.r || this.currentParams.l || 3;
                    this.engineer.explainPowerMisconception(a, 3);
                }
            });
        }

        // Botão de reiniciar dedução
        const btnReset = this.container.querySelector('#btnResetBlackboard');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.resetState();
                this.render();
                if (window.sounds) window.sounds.playClick();
            });
        }

        // Configuração de Drag & Drop para os chips de medidas
        const chips = this.container.querySelectorAll('.draggable-measure-chip');
        const dropZones = this.container.querySelectorAll('.formula-drop-zone');

        chips.forEach(chip => {
            chip.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    key: chip.dataset.key,
                    val: parseFloat(chip.dataset.val)
                }));
                chip.classList.add('dragging');
            });

            chip.addEventListener('dragend', () => {
                chip.classList.remove('dragging');
            });

            // Suporte a clique / toque para mobile
            chip.addEventListener('click', () => {
                const key = chip.dataset.key;
                const val = parseFloat(chip.dataset.val);
                this.handleValueInserted(key, val);
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drop-hover');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drop-hover');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drop-hover');
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    this.handleValueInserted(data.key, data.val);
                } catch (err) {}
            });

            // Clique na caixa vazia busca o valor correspondente para preenchimento imediato
            zone.addEventListener('click', () => {
                const targetKey = zone.dataset.targetKey;
                if (!targetKey) return;
                const p = this.currentParams;
                let val = p[targetKey];
                if (val === undefined && targetKey === 'a') val = p.a || 3;
                if (val === undefined && targetKey === 'b') val = p.b || 2.5;
                if (val === undefined && targetKey === 'c') val = p.c || 2.6;
                if (val === undefined && targetKey === 'r') val = p.r || 2;
                if (val === undefined && targetKey === 'h') val = p.h || 6;
                if (val === undefined && targetKey === 'l') val = p.l || 4;
                if (val !== undefined) {
                    this.handleValueInserted(targetKey, parseFloat(val));
                }
            });
        });

        // Multiplicação passo a passo (Juntar blocos ou clicar no '×')
        this.container.querySelectorAll('.op-multiply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.executeNextMultiplication();
            });
        });

        this.container.querySelectorAll('.draggable-factor').forEach(block => {
            block.addEventListener('click', () => {
                this.executeNextMultiplication();
            });
        });

        // Botões de conclusão por etapa
        const btnMultFace = this.container.querySelector('#btnMultiplySixFace');
        if (btnMultFace) {
            btnMultFace.addEventListener('click', () => {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
            });
        }

        const btnMultPrism = this.container.querySelector('#btnMultiplyBaseHeight');
        if (btnMultPrism) {
            btnMultPrism.addEventListener('click', () => {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
            });
        }

        const btnMultCyl = this.container.querySelector('#btnMultiplyCylBase');
        if (btnMultCyl) {
            btnMultCyl.addEventListener('click', () => {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
            });
        }

        const btnMultSph = this.container.querySelector('#btnMultiplySphereCube');
        if (btnMultSph) {
            btnMultSph.addEventListener('click', () => {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
            });
        }

        // Botão de Avançar Fase direto na Lousa (Fluxo Progressivo Didático)
        const btnNextBB = this.container.querySelector('#btnBlackboardNextStage');
        if (btnNextBB) {
            btnNextBB.addEventListener('click', () => {
                if (typeof this.onNextStageRequested === 'function') {
                    this.onNextStageRequested();
                } else {
                    const btnNext = document.getElementById('btnCareerNext');
                    if (btnNext) btnNext.click();
                }
            });
        }
    }

    // =========================================================================
    // BARRA DE COMANDO DIRETO: "O QUE FAZER AGORA" (DIDÁTICA PROGRESSIVA)
    // =========================================================================
    updateDirectCommandHUD() {
        const badge = document.getElementById('cmdStepBadge');
        const text = document.getElementById('cmdStepText');
        const icon = document.querySelector('.cmd-icon-box');
        if (!badge || !text) return;

        const id = this.currentSolidId;
        const type = this.currentFormulaType;
        const step = this.state.step;
        const p = this.currentParams;

        if (id === 'cube' && type === 'volume') {
            const a = (p.a || 3).toFixed(1);
            if (step === 'awaiting_dimension') {
                badge.textContent = 'PASSO 1 DE 3';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '👉';
                text.innerHTML = `Arraste a aresta <b>a = ${a}m</b> (ou clique nela no 3D) para a fórmula <b>V = a³</b>.`;
            } else if (step === 'power_expanded') {
                badge.textContent = 'PASSO 2 DE 3';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '⚡';
                text.innerHTML = `A potência expandiu para <b>${a} × ${a} × ${a}</b>! Clique em <b>×</b> para calcular a base.`;
            } else if (step === 'first_multiplied') {
                const base = Math.round((p.a || 3) * (p.a || 3));
                badge.textContent = 'PASSO 3 DE 3';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '🚀';
                text.innerHTML = `Base = <b>${base} m²</b>! Agora multiplique por <b>${a}</b> para obter o Volume total.`;
            } else if (step === 'completed') {
                const vol = Math.pow(p.a || 3, 3);
                badge.textContent = '🏆 CONCLUÍDO!';
                badge.className = 'cmd-badge step-completed';
                if (icon) icon.textContent = '🎉';
                text.innerHTML = `Volume = <b>${vol.toFixed(2)} m³ (${(vol * 1000).toLocaleString('pt-BR')} L)</b>! Clique em <b>Avançar para a Fase 2 ▶</b>.`;
            }
        } else if (id === 'rectangular_prism') {
            if (step === 'awaiting_dimension') {
                badge.textContent = 'PASSO 1 DE 2';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '👉';
                text.innerHTML = `Arraste o Comprimento (<b>${p.a || 6}m</b>), Largura (<b>${p.b || 2.5}m</b>) e Altura (<b>${p.c || 2.6}m</b>) para a Lousa.`;
            } else if (step === 'first_multiplied' || step === 'power_expanded') {
                badge.textContent = 'PASSO 2 DE 2';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '⚡';
                text.innerHTML = `Base do piso calculada! Multiplique pela altura para obter o volume útil de carga.`;
            } else {
                badge.textContent = '🏆 CONCLUÍDO!';
                badge.className = 'cmd-badge step-completed';
                if (icon) icon.textContent = '🎉';
                const vol = (p.a || 6) * (p.b || 2.5) * (p.c || 2.6);
                text.innerHTML = `Cubagem = <b>${vol.toFixed(2)} m³ (${(vol * 1000).toLocaleString('pt-BR')} L)</b>! Avance para a próxima fase.`;
            }
        } else if (id === 'cylinder') {
            if (step === 'awaiting_dimension') {
                badge.textContent = 'PASSO 1 DE 2';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '👉';
                text.innerHTML = `Arraste o Raio (<b>${p.r || 2}m</b>) e Altura (<b>${p.h || 6}m</b>) para a fórmula do Silo.`;
            } else if (step === 'power_expanded') {
                badge.textContent = 'PASSO 2 DE 2';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '⚡';
                text.innerHTML = `Calcule o raio ao quadrado (r² = ${p.r} × ${p.r}) para a base circular.`;
            } else {
                badge.textContent = '🏆 CONCLUÍDO!';
                badge.className = 'cmd-badge step-completed';
                if (icon) icon.textContent = '🎉';
                const vol = Math.PI * Math.pow(p.r || 2, 2) * (p.h || 6);
                text.innerHTML = `Capacidade = <b>${vol.toFixed(2)} m³ (${(vol * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L)</b>! Avance para a próxima fase.`;
            }
        } else if (id === 'square_pyramid') {
            if (step === 'awaiting_dimension') {
                badge.textContent = 'PASSO 1 DE 2';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '👉';
                text.innerHTML = `Arraste o Lado da Base (<b>${p.l || 6}m</b>) e Altura (<b>${p.h || 4}m</b>) para calcular o volume.`;
            } else {
                badge.textContent = '🏆 CONCLUÍDO!';
                badge.className = 'cmd-badge step-completed';
                if (icon) icon.textContent = '🎉';
                const vol = (Math.pow(p.l || 6, 2) * (p.h || 4)) / 3;
                text.innerHTML = `Vão livre = <b>${vol.toFixed(2)} m³</b>! Avance para a próxima fase.`;
            }
        } else if (id === 'sphere') {
            if (step === 'awaiting_dimension') {
                badge.textContent = 'PASSO 1 DE 2';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '👉';
                text.innerHTML = `Arraste o Raio da Esfera (<b>${p.r || 3}m</b>) para calcular o volume de gás.`;
            } else if (step === 'power_expanded') {
                badge.textContent = 'PASSO 2 DE 2';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '⚡';
                text.innerHTML = `Multiplique os 3 fatores cúbicos para calcular R³ (${p.r} × ${p.r} × ${p.r}).`;
            } else {
                badge.textContent = '🏆 CONCLUÍDO!';
                badge.className = 'cmd-badge step-completed';
                if (icon) icon.textContent = '🎉';
                const vol = (4 / 3) * Math.PI * Math.pow(p.r || 3, 3);
                text.innerHTML = `Volume de Gás = <b>${vol.toFixed(2)} m³</b>! Avance para a próxima fase.`;
            }
        } else {
            if (step === 'awaiting_dimension') {
                badge.textContent = 'PASSO 1';
                badge.className = 'cmd-badge';
                if (icon) icon.textContent = '👉';
                text.innerHTML = `Arraste as medidas para a Lousa ao lado para calcular.`;
            } else {
                badge.textContent = '🏆 CONCLUÍDO!';
                badge.className = 'cmd-badge step-completed';
                if (icon) icon.textContent = '🎉';
                text.innerHTML = `Cálculos concluídos com sucesso!`;
            }
        }
    }

    handleValueInserted(key, val) {
        this.state.droppedValues[key] = val;

        if (window.sounds) window.sounds.playSuccess();

        const id = this.currentSolidId;
        const type = this.currentFormulaType;

        // Se for cubo
        if (id === 'cube') {
            if (type === 'perimeter') {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
                return;
            }

            this.state.step = 'power_expanded';
            this.render();

            if (this.engineer) {
                if (type === 'volume') {
                    this.engineer.speak(`
                        ✨ <b>A aresta ${val}m foi inserida na fórmula do Volume!</b><br>
                        Veja como <b>${val}³</b> se expandiu em <b>${val} × ${val} × ${val}</b>.<br>
                        Agora junte os blocos numéricos para multiplicar passo a passo!
                    `, { icon: '✨', btnText: 'Multiplicar! 🚀' });
                } else if (type === 'area_total') {
                    this.engineer.speak(`
                        🎨 <b>A aresta ${val}m foi inserida na Área Total!</b><br>
                        Primeiro calculamos a área de 1 face quadrada (<b>${val}² = ${val} × ${val}</b>). Multiplique os blocos!
                    `, { icon: '🎨', btnText: 'Multiplicar!' });
                }
            }
            return;
        }

        // Se for prisma
        if (id === 'rectangular_prism') {
            if (type === 'area_total' || type === 'perimeter') {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
                return;
            }

            const hasA = this.state.droppedValues.a !== undefined;
            const hasB = this.state.droppedValues.b !== undefined;
            const hasC = this.state.droppedValues.c !== undefined;

            if (hasA && hasB && hasC) {
                this.state.step = 'first_multiplied';
                this.render();
                if (this.engineer) {
                    this.engineer.speak('Excelente! Você preencheu Comprimento, Largura e Altura. Agora multiplique a base pela altura!', { icon: '🚢' });
                }
            } else {
                this.render();
            }
            return;
        }

        // Cilindro
        if (id === 'cylinder') {
            if (type === 'area_total' || type === 'perimeter') {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
                return;
            }

            const hasR = this.state.droppedValues.r !== undefined;
            const hasH = this.state.droppedValues.h !== undefined;
            if (hasR && hasH) {
                this.state.step = 'power_expanded';
                this.render();
            } else {
                this.render();
            }
            return;
        }

        // Pirâmide
        if (id === 'square_pyramid') {
            if (type === 'area_total' || type === 'perimeter') {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
                return;
            }

            const hasL = this.state.droppedValues.l !== undefined;
            const hasH = this.state.droppedValues.h !== undefined;
            if (hasL && hasH) {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
            } else {
                this.render();
            }
            return;
        }

        // Esfera
        if (id === 'sphere') {
            if (type === 'area_total' || type === 'perimeter') {
                this.state.step = 'completed';
                this.state.hasCompletedDerivation = true;
                this.render();
                this.triggerCompletion();
                return;
            }

            this.state.step = 'power_expanded';
            this.render();
            return;
        }

        // Fallback genérico
        this.state.step = 'completed';
        this.state.hasCompletedDerivation = true;
        this.render();
        this.triggerCompletion();
    }

    executeNextMultiplication() {
        if (this.state.step === 'power_expanded') {
            this.state.step = 'first_multiplied';
            if (window.sounds) window.sounds.playSuccess();
            this.render();

            if (this.engineer) {
                const a = this.currentParams.a || 3;
                this.engineer.speak(`
                    🎉 <b>Muito bem! ${a} × ${a} = ${a * a}!</b><br>
                    Isso representa a área da base quadrada. Agora multiplique por <b>${a}</b> novamente para estender a base pela terceira dimensão (altura)!
                `, { icon: '🎉', btnText: 'Continuar!' });
            }
        } else if (this.state.step === 'first_multiplied') {
            this.state.step = 'completed';
            this.state.hasCompletedDerivation = true;
            if (window.sounds) window.sounds.playSuccess();
            this.render();
            this.triggerCompletion();
        }
    }

    triggerCompletion() {
        const id = this.currentSolidId;
        const type = this.currentFormulaType;
        const p = this.currentParams;
        let finalVal = 0;

        if (type === 'volume') {
            if (id === 'cube') finalVal = Math.pow(p.a || 3, 3);
            else if (id === 'rectangular_prism') finalVal = (p.a || 6) * (p.b || 2.5) * (p.c || 2.6);
            else if (id === 'cylinder') finalVal = Math.PI * Math.pow(p.r || 2, 2) * (p.h || 6);
            else if (id === 'square_pyramid') finalVal = (Math.pow(p.l || 6, 2) * (p.h || 4)) / 3;
            else if (id === 'sphere') finalVal = (4 / 3) * Math.PI * Math.pow(p.r || 3, 3);
            else finalVal = 27;
        } else if (type === 'area_total') {
            if (id === 'cube') finalVal = 6 * Math.pow(p.a || 3, 2);
            else if (id === 'rectangular_prism') {
                const a = p.a || 6, b = p.b || 2.5, c = p.c || 2.6;
                finalVal = 2 * (a * b + a * c + b * c);
            } else if (id === 'cylinder') {
                const r = p.r || 2, h = p.h || 6;
                finalVal = 2 * Math.PI * r * (h + r);
            } else if (id === 'square_pyramid') {
                const l = p.l || 6, h = p.h || 4;
                const ap = Math.sqrt(h * h + Math.pow(l / 2, 2));
                finalVal = l * l + 4 * ((l * ap) / 2);
            } else if (id === 'sphere') {
                finalVal = 4 * Math.PI * Math.pow(p.r || 3, 2);
            } else finalVal = 54;
        } else if (type === 'perimeter') {
            if (id === 'cube') finalVal = 4 * (p.a || 3);
            else if (id === 'rectangular_prism') finalVal = 2 * ((p.a || 6) + (p.b || 2.5));
            else if (id === 'cylinder') finalVal = 2 * Math.PI * (p.r || 2);
            else if (id === 'square_pyramid') finalVal = 4 * (p.l || 6);
            else if (id === 'sphere') finalVal = 2 * Math.PI * (p.r || 3);
            else finalVal = 12;
        }

        if (this.engineer) {
            this.engineer.speak(`
                🏆 <b>PARABÉNS! Equação 100% deduzida!</b><br>
                Você compreendeu o processo real da fórmula passo a passo! Agora a <b>validação oficial da missão</b> está liberada no painel!
            `, { icon: '🏆', btnText: 'Concluir Fase! 🚀' });
        }

        if (typeof this.onEquationCompleted === 'function') {
            this.onEquationCompleted(this.currentSolidId, this.currentFormulaType, finalVal);
        }
    }
}

window.InteractiveBlackboard = InteractiveBlackboard;
