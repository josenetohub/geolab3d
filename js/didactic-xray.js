// =============================================================================
// GEO LAB 3D - RAIO-X DIDÁTICO: PERÍMETRO (1D) vs ÁREA (2D) vs VOLUME (3D)
// Letramento Matemático Visual com Rolo de Pintura, Neon e Água Hidráulica
// =============================================================================

class DidacticXRay {
    constructor(sceneManager, unfoldSys, liquidSim, engineerGuide) {
        this.sm = sceneManager;
        this.unfoldSys = unfoldSys;
        this.liquidSim = liquidSim;
        this.engineer = engineerGuide;

        this.currentMode = 'normal'; // 'normal', 'perimeter', 'area', 'volume'
        this.originalSolidOpacity = 0.95;
        this.neonEdgeColor = '#00f2fe';
        this.rollerAnimationRunning = false;

        this.initDOM();
    }

    initDOM() {
        // Toolbar de Raio-X Didático no topo do Canvas 3D
        let toolbar = document.getElementById('didacticXRayToolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'didacticXRayToolbar';
            toolbar.className = 'didactic-xray-toolbar';
            toolbar.innerHTML = `
                <div class="xray-toolbar-label">
                    <span>🔬 RAIO-X DIDÁTICO:</span>
                </div>
                <div class="xray-btn-group">
                    <button class="btn-xray" id="btnXRayPerimeter" data-xray="perimeter" title="Ver Perímetro (Arestas e Linhas em 1D)">
                        <span class="xray-icon">📏</span> 1D: Ver Perímetro
                    </button>
                    <button class="btn-xray" id="btnXRayArea" data-xray="area" title="Ver Área (Planificação 2D com Rolo de Pintura)">
                        <span class="xray-icon">🎨</span> 2D: Ver Área
                    </button>
                    <button class="btn-xray" id="btnXRayVolume" data-xray="volume" title="Ver Volume (Espaço Interno 3D com Água)">
                        <span class="xray-icon">💧</span> 3D: Ver Volume
                    </button>
                    <button class="btn-xray btn-xray-reset" id="btnXRayReset" title="Modo Normal">
                        Normal
                    </button>
                </div>
            `;

            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.prepend(toolbar);
            }
        }

        // Overlay do Rolo de Pintura (Paint Roller FX)
        let rollerOverlay = document.getElementById('paintRollerOverlay');
        if (!rollerOverlay) {
            rollerOverlay = document.createElement('div');
            rollerOverlay.id = 'paintRollerOverlay';
            rollerOverlay.className = 'paint-roller-overlay hidden';
            rollerOverlay.innerHTML = `
                <div class="paint-roller-tool" id="paintRollerTool">
                    <div class="roller-cylinder"></div>
                    <div class="roller-arm"></div>
                    <div class="roller-handle"></div>
                </div>
                <div class="paint-sweep-fill" id="paintSweepFill"></div>
                <div class="paint-roller-badge">
                    🎨 PINTANDO A CASCA EXTERNA (SUPERFÍCIE 2D = m²)
                </div>
            `;
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.appendChild(rollerOverlay);
            }
        }

        // HUD informativo de Dimensões (1D x 2D x 3D)
        let dimHUD = document.getElementById('didacticDimHUD');
        if (!dimHUD) {
            dimHUD = document.createElement('div');
            dimHUD.id = 'didacticDimHUD';
            dimHUD.className = 'didactic-dim-hud hidden';
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.appendChild(dimHUD);
            }
        }

        this.setupEvents();
    }

    setupEvents() {
        const btnPerimeter = document.getElementById('btnXRayPerimeter');
        const btnArea = document.getElementById('btnXRayArea');
        const btnVolume = document.getElementById('btnXRayVolume');
        const btnReset = document.getElementById('btnXRayReset');

        if (btnPerimeter) btnPerimeter.addEventListener('click', () => this.setMode('perimeter'));
        if (btnArea) btnArea.addEventListener('click', () => this.setMode('area'));
        if (btnVolume) btnVolume.addEventListener('click', () => this.setMode('volume'));
        if (btnReset) btnReset.addEventListener('click', () => this.setMode('normal'));
    }

    setMode(mode) {
        this.currentMode = mode;

        // Atualiza estado visual dos botões
        document.querySelectorAll('.btn-xray').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.xray === mode);
        });

        if (window.sounds) window.sounds.playClick();

        switch (mode) {
            case 'perimeter':
                this.activatePerimeterMode();
                break;
            case 'area':
                this.activateAreaMode();
                break;
            case 'volume':
                this.activateVolumeMode();
                break;
            case 'normal':
            default:
                this.activateNormalMode();
                break;
        }
    }

    // =========================================================================
    // 1. PERÍMETRO (1D): LINHAS E ARESTAS EM NEON / TRANSLUCIDEZ TOTAL
    // =========================================================================
    activatePerimeterMode() {
        this.hidePaintRoller();

        // 1. Torna o sólido 3D quase transparente (fantasma)
        if (this.sm.solidMesh && this.sm.solidMesh.material) {
            this.sm.solidMesh.material.transparent = true;
            this.sm.solidMesh.material.opacity = 0.08;
            this.sm.solidMesh.material.needsUpdate = true;
        }

        // 2. Acende as arestas em neon elétrico ciano brilhante
        if (this.sm.edgeLine && this.sm.edgeLine.material) {
            this.sm.edgeLine.visible = true;
            this.sm.edgeLine.material.color.set(0x00f2fe);
            this.sm.edgeLine.material.linewidth = 4;
            this.sm.edgeLine.material.opacity = 1.0;
        }

        // 3. Garante que as cotas lineares fiquem visíveis
        if (window.dimensionsHelper) {
            window.dimensionsHelper.setVisible(true);
        }

        // 4. Se a planificação estava aberta, fecha
        this.unfoldSys.setActive(false);
        this.sm.solidGroup.visible = true;
        this.sm.faucetGroup.visible = false;
        this.liquidSim.empty();

        // 5. Exibe HUD 1D
        this.showDimHUD('1D · PERÍMETRO & ARESTAS', 'Medida linear (metros). Imagine contornar o sólido com uma linha ou fita métrica!', '#00f2fe');

        // 6. Explicação do Engenheiro
        if (this.engineer) {
            this.engineer.explainDimensionConcept('1d');
        }
    }

    // =========================================================================
    // 2. ÁREA (2D): PLANIFICAÇÃO COM ANIMAÇÃO DE ROLO DE PINTURA
    // =========================================================================
    activateAreaMode() {
        // Restaura opacidade do sólido para quando voltar
        if (this.sm.solidMesh && this.sm.solidMesh.material) {
            this.sm.solidMesh.material.opacity = 0.95;
            this.sm.solidMesh.material.transparent = false;
        }

        this.sm.faucetGroup.visible = false;
        this.liquidSim.empty();

        // 1. Abre a planificação desdobrando no chão
        this.unfoldSys.setActive(true);

        // Animação de desdobramento fluida de 0 a 100%
        let progress = 0;
        const animateUnfold = () => {
            progress += 0.04;
            if (progress > 1) progress = 1;
            this.unfoldSys.setUnfoldProgress(progress);

            if (progress < 1) {
                requestAnimationFrame(animateUnfold);
            } else {
                // Quando terminar de planificar, dispara o rolo de pintura!
                this.triggerPaintRollerAnimation();
            }
        };
        animateUnfold();

        // 2. Exibe HUD 2D
        this.showDimHUD('2D · ÁREA TOTAL (CASCA)', 'Superfície plana (metros quadrados m²). É a quantidade de tinta ou papel para pintar todas as faces!', '#f59e0b');

        // 3. Explicação do Engenheiro
        if (this.engineer) {
            this.engineer.explainDimensionConcept('2d');
        }
    }

    triggerPaintRollerAnimation() {
        const overlay = document.getElementById('paintRollerOverlay');
        const sweep = document.getElementById('paintSweepFill');
        const tool = document.getElementById('paintRollerTool');

        if (!overlay || !sweep || !tool) return;

        overlay.classList.remove('hidden');
        sweep.style.width = '0%';
        tool.style.left = '5%';

        let currentWidth = 0;
        if (window.sounds) window.sounds.playClick();

        const stepRoll = () => {
            currentWidth += 2.5;
            sweep.style.width = `${currentWidth}%`;
            tool.style.left = `${currentWidth}%`;

            if (currentWidth < 95) {
                requestAnimationFrame(stepRoll);
            } else {
                setTimeout(() => {
                    this.hidePaintRoller();
                }, 1800);
            }
        };

        requestAnimationFrame(stepRoll);
    }

    hidePaintRoller() {
        const overlay = document.getElementById('paintRollerOverlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // =========================================================================
    // 3. VOLUME (3D): ESPAÇO INTERNO PREENCHIDO COM ÁGUA (LITROS)
    // =========================================================================
    activateVolumeMode() {
        this.hidePaintRoller();

        // 1. Volta para o sólido fechado em 3D
        this.unfoldSys.setActive(false);
        this.sm.solidGroup.visible = true;

        if (this.sm.solidMesh && this.sm.solidMesh.material) {
            this.sm.solidMesh.material.opacity = 0.85;
            this.sm.solidMesh.material.transparent = true;
        }

        // 2. Ativa torneira/tubulação e enche com água
        this.sm.faucetGroup.visible = true;
        this.liquidSim.empty();
        
        setTimeout(() => {
            this.liquidSim.startFilling();
        }, 300);

        // 3. Exibe HUD 3D com litragem
        this.showDimHUD('3D · VOLUME & CAPACIDADE', 'Espaço interno (metros cúbicos m³ e Litros). 1 m³ = 1.000 Litros de água potável!', '#38bdf8');

        // 4. Explicação do Engenheiro
        if (this.engineer) {
            this.engineer.explainDimensionConcept('3d');
        }
    }

    // =========================================================================
    // MODO NORMAL (RESTAURAÇÃO)
    // =========================================================================
    activateNormalMode() {
        this.hidePaintRoller();
        this.hideDimHUD();

        this.unfoldSys.setActive(false);
        this.sm.solidGroup.visible = true;
        this.sm.faucetGroup.visible = false;
        this.liquidSim.stopFilling();
        this.liquidSim.empty();

        if (this.sm.solidMesh && this.sm.solidMesh.material) {
            this.sm.solidMesh.material.opacity = 0.95;
            this.sm.solidMesh.material.transparent = false;
            this.sm.solidMesh.material.needsUpdate = true;
        }

        if (this.sm.edgeLine && this.sm.edgeLine.material) {
            this.sm.edgeLine.material.color.set(0x00f2fe);
        }

        if (window.dimensionsHelper) {
            window.dimensionsHelper.setVisible(true);
        }
    }

    showDimHUD(title, desc, color) {
        const hud = document.getElementById('didacticDimHUD');
        if (!hud) return;

        hud.innerHTML = `
            <div class="dim-hud-title" style="color:${color};">${title}</div>
            <div class="dim-hud-desc">${desc}</div>
        `;
        hud.classList.remove('hidden');
    }

    hideDimHUD() {
        const hud = document.getElementById('didacticDimHUD');
        if (hud) hud.classList.add('hidden');
    }
}

window.DidacticXRay = DidacticXRay;
