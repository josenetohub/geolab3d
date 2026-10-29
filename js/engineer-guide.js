// =============================================================================
// GEO LAB 3D - ASSISTENTE VIRTUAL: O ENGENHEIRO GUIA (LEO)
// Avatar Cartoon/Flat Design, Apresentação Grande no Centro, Dicas e Setas
// =============================================================================

class EngineerGuide {
    constructor() {
        this.visible = true;
        this.minimized = false;
        this.speechTimeout = null;
        this.typingInterval = null;
        this.currentArrow = null;
        this.hasSeenOnboarding = localStorage.getItem('geolab_onboarding_completed') === 'true';

        this.initDOM();
        this.setupEvents();
    }

    initDOM() {
        // Container principal do Engenheiro flutuando no canto inferior esquerdo
        const container = document.createElement('div');
        container.id = 'engineerGuideContainer';
        container.className = 'engineer-guide-container';
        container.innerHTML = `
            <!-- BALÃO DE FALA INTERATIVO -->
            <div class="engineer-speech-bubble hidden" id="engineerSpeechBubble">
                <div class="speech-bubble-header">
                    <div class="engineer-identity">
                        <span class="engineer-role-tag">👷 ENGENHEIRO LEO · GUIA 3D</span>
                    </div>
                    <div class="speech-bubble-actions">
                        <button class="speech-btn-icon" id="btnEngineerAudio" title="Ouvir / Efeitos">🔊</button>
                        <button class="speech-btn-icon" id="btnEngineerDismiss" title="Fechar dica">✕</button>
                    </div>
                </div>

                <div class="speech-bubble-body" id="engineerSpeechText">
                    Olá! Eu sou o Engenheiro Leo. Vou te ajudar a dominar a geometria espacial e descomplicar as fórmulas!
                </div>

                <div class="speech-bubble-footer" id="engineerSpeechFooter">
                    <button class="btn-speech-action primary" id="btnEngineerNextStep">Entendi! 👍</button>
                    <button class="btn-speech-action secondary" id="btnEngineerSkip" style="display:none;">Pular Tutorial ⏩</button>
                </div>
                
                <div class="speech-bubble-tail"></div>
            </div>

            <!-- AVATAR DO ENGENHEIRO (FLAT DESIGN / CARTOON SVG) -->
            <div class="engineer-avatar-badge" id="engineerAvatarBadge" title="Clique para abrir as instruções do Engenheiro Leo">
                <div class="engineer-avatar-glow"></div>
                <div class="engineer-status-beacon" id="engineerStatusBeacon">💡</div>
                <div class="engineer-svg-wrapper" id="engineerSvgWrapper">
                    ${this.getEngineerSvg()}
                </div>
            </div>

            <!-- INDICADOR FLUTUANTE DE DICA PENDENTE -->
            <div class="engineer-notification-dot hidden" id="engineerNotifDot">1</div>
        `;

        document.body.appendChild(container);

        // MODAL DO ENGENHEIRO GRANDE NO CENTRO DA TELA
        const centerModal = document.createElement('div');
        centerModal.id = 'engineerCenterModal';
        centerModal.className = 'modal-backdrop hidden';
        centerModal.innerHTML = `
            <div class="modal-dialog engineer-center-dialog">
                <div class="engineer-center-header">
                    <div class="engineer-large-avatar-box">
                        ${this.getEngineerSvg()}
                    </div>
                    <div class="engineer-center-titles">
                        <span class="engineer-center-role">👷 SEU GUIA TÉCNICO · ENGENHEIRO LEO</span>
                        <h2 id="centerModalTitle" class="engineer-center-title">Instruções da Missão</h2>
                    </div>
                    <button class="btn-close-modal" id="btnCloseCenterModal" title="Fechar e ir para a prática">✕</button>
                </div>

                <div class="engineer-center-body" id="centerModalBody">
                    <!-- Conteúdo pedagógico dinâmico -->
                </div>

                <div class="engineer-center-footer">
                    <button class="btn-action-primary" id="btnCenterModalAction">
                        Iniciar Desafio Agora 🚀
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(centerModal);

        // Container global para setas e holofotes guiados
        const spotlightOverlay = document.createElement('div');
        spotlightOverlay.id = 'guidedSpotlightOverlay';
        spotlightOverlay.className = 'guided-spotlight-overlay hidden';
        document.body.appendChild(spotlightOverlay);
    }

    getEngineerSvg() {
        return `
        <svg viewBox="0 0 120 120" width="100%" height="100%" class="engineer-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fde047" />
                    <stop offset="70%" stop-color="#eab308" />
                    <stop offset="100%" stop-color="#ca8a04" />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fed7aa" />
                    <stop offset="100%" stop-color="#fbcfe8" />
                </linearGradient>
                <linearGradient id="vestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#1d4ed8" />
                </linearGradient>
                <filter id="avatarShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/>
                </filter>
            </defs>
            
            <g filter="url(#avatarShadow)">
                <!-- Círculo de moldura -->
                <circle cx="60" cy="60" r="54" fill="#0f172a" stroke="#38bdf8" stroke-width="3" />
                
                <!-- Camisa / Colete do Engenheiro -->
                <path d="M28 106 C 28 84, 92 84, 92 106 Z" fill="url(#vestGrad)" />
                <!-- Faixas refletivas do colete -->
                <path d="M38 106 L45 88 M82 106 L75 88" stroke="#facc15" stroke-width="4" stroke-linecap="round" />
                <rect x="52" y="86" width="16" height="20" rx="3" fill="#ffffff" />
                <line x1="60" y1="90" x2="60" y2="102" stroke="#dc2626" stroke-width="2" />

                <!-- Pescoço -->
                <rect x="52" y="70" width="16" height="14" rx="2" fill="#fdba74" />

                <!-- Rosto -->
                <circle cx="60" cy="60" r="22" fill="url(#skinGrad)" />

                <!-- Orelhas -->
                <circle cx="38" cy="60" r="4.5" fill="#fca5a5" />
                <circle cx="82" cy="60" r="4.5" fill="#fca5a5" />

                <!-- Olhos amigáveis -->
                <ellipse cx="51" cy="58" rx="3.5" ry="4" fill="#0f172a" />
                <circle cx="52" cy="56.5" r="1.2" fill="#ffffff" />
                <ellipse cx="69" cy="58" rx="3.5" ry="4" fill="#0f172a" />
                <circle cx="70" cy="56.5" r="1.2" fill="#ffffff" />

                <!-- Sobrancelhas confiantes -->
                <path d="M47 50 Q 52 48, 56 50" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none" />
                <path d="M64 50 Q 68 48, 73 50" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none" />

                <!-- Sorriso motivador -->
                <path id="engineerMouth" d="M52 68 Q 60 76, 68 68" stroke="#991b1b" stroke-width="2.5" stroke-linecap="round" fill="none" />

                <!-- Óculos de Proteção Tech -->
                <rect x="44" y="52" width="14" height="12" rx="4" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="1.8" />
                <rect x="62" y="52" width="14" height="12" rx="4" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="1.8" />
                <line x1="58" y1="58" x2="62" y2="58" stroke="#38bdf8" stroke-width="2" />

                <!-- Capacete Amarelo de Engenheiro -->
                <path d="M34 50 C 34 26, 86 26, 86 50 Z" fill="url(#helmetGrad)" />
                <ellipse cx="60" cy="50" rx="30" ry="5.5" fill="#eab308" stroke="#a16207" stroke-width="1" />
                <path d="M56 28 L64 28 L63 48 L57 48 Z" fill="#ca8a04" />
                <circle cx="60" cy="38" r="5" fill="#ffffff" />
                <path d="M58 35 L62 35 L60 41 Z" fill="#0284c7" />

                <!-- Lápis atrás da orelha -->
                <rect x="80" y="50" width="14" height="3" rx="1.5" transform="rotate(-30 80 50)" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.8" />
            </g>
        </svg>
        `;
    }

    setupEvents() {
        const badge = document.getElementById('engineerAvatarBadge');
        if (badge) {
            badge.addEventListener('click', () => {
                if (document.body.classList.contains('mode-exp_func')) {
                    this.showFunctionBriefing('exponential');
                } else if (document.body.classList.contains('mode-log_func')) {
                    this.showFunctionBriefing('logarithmic');
                } else if (document.body.classList.contains('mode-career') && window.careerMode) {
                    const stage = window.careerMode.getCurrentStage();
                    this.showCenterBriefing({
                        title: `${stage.icon} ${stage.title}`,
                        story: stage.story,
                        directCommand: `Arraste a medida da aresta [a = ${stage.targetParams.a || 3}m] para a Lousa!`,
                        step1: `Observe a aresta no modelo 3D (a = ${stage.targetParams.a || 3} m).`,
                        step2: `Arraste o bloco [ a = ${stage.targetParams.a || 3}m ] para a fórmula na Lousa.`,
                        step3: `Acompanhe a expansão de potências e faça a multiplicação passo a passo.`,
                        ctaText: 'Entendi! Ir para a Lousa 🚀'
                    });
                } else if (this.isSpeechBubbleVisible()) {
                    this.hideSpeechBubble();
                } else {
                    this.showRandomTip();
                }
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnCloseCenter = document.getElementById('btnCloseCenterModal');
        if (btnCloseCenter) {
            btnCloseCenter.addEventListener('click', () => {
                this.hideCenterBriefing();
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnDismiss = document.getElementById('btnEngineerDismiss');
        if (btnDismiss) {
            btnDismiss.addEventListener('click', () => {
                this.hideSpeechBubble();
                this.removeGuideSpotlight();
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnNext = document.getElementById('btnEngineerNextStep');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (this.onNextStepCallback) {
                    this.onNextStepCallback();
                } else {
                    this.hideSpeechBubble();
                    this.removeGuideSpotlight();
                }
                if (window.sounds) window.sounds.playClick();
            });
        }

        const btnSkip = document.getElementById('btnEngineerSkip');
        if (btnSkip) {
            btnSkip.addEventListener('click', () => {
                this.completeOnboarding();
                this.hideSpeechBubble();
                this.removeGuideSpotlight();
                if (window.sounds) window.sounds.playClick();
            });
        }
    }

    // =========================================================================
    // MODAL DE APRESENTAÇÃO GRANDE DO ENGENHEIRO NO CENTRO DA TELA
    // =========================================================================
    showCenterBriefing(options = {}) {
        const modal = document.getElementById('engineerCenterModal');
        const titleEl = document.getElementById('centerModalTitle');
        const bodyEl = document.getElementById('centerModalBody');
        const btnAction = document.getElementById('btnCenterModalAction');
        if (!modal || !titleEl || !bodyEl) return;

        titleEl.innerHTML = options.title || 'Missão com o Engenheiro Leo';
        bodyEl.innerHTML = `
            <div class="center-briefing-story">
                ${options.story || 'Bem-vindo ao desafio prático de geometria espacial!'}
            </div>

            <div class="center-briefing-command-card">
                <div class="cmd-card-badge">🎯 SEU OBJETIVO PRINCIPAL:</div>
                <div class="cmd-card-text">${options.directCommand || 'Arraste a medida para a fórmula correspondente na Lousa de Dedução.'}</div>
            </div>

            <div class="center-briefing-steps-grid">
                <div class="briefing-step-box">
                    <div class="step-badge-circle">1</div>
                    <div class="step-box-content">
                        <b>Localize a Medida:</b>
                        <span>${options.step1 || 'Observe a aresta indicada no sólido 3D ou na bandeja de chips.'}</span>
                    </div>
                </div>

                <div class="briefing-step-box">
                    <div class="step-badge-circle">2</div>
                    <div class="step-box-content">
                        <b>Solte na Fórmula:</b>
                        <span>${options.step2 || 'Arraste ou clique no bloco de medida para preencher a incógnita.'}</span>
                    </div>
                </div>

                <div class="briefing-step-box">
                    <div class="step-badge-circle">3</div>
                    <div class="step-box-content">
                        <b>Multiplique Passo a Passo:</b>
                        <span>${options.step3 || 'Veja a potência se expandir e clique em [ × ] para deduzir o resultado!'}</span>
                    </div>
                </div>
            </div>
        `;

        if (btnAction) {
            btnAction.textContent = options.ctaText || 'Iniciar Desafio Agora 🚀';
            btnAction.onclick = () => {
                this.hideCenterBriefing();
                if (typeof options.onStart === 'function') {
                    options.onStart();
                }
            };
        }

        modal.classList.remove('hidden');
        if (window.sounds) window.sounds.playClick();
    }

    // =========================================================================
    // APRESENTAÇÃO DIDÁTICA DO ENGENHEIRO PARA AS FUNÇÕES MATEMÁTICAS
    // Explica com calma: Conceitos, Como se Calcula, Para que Serve e Roteiro
    // =========================================================================
    showFunctionBriefing(type = 'exponential', onStart = null) {
        const modal = document.getElementById('engineerCenterModal');
        const titleEl = document.getElementById('centerModalTitle');
        const bodyEl = document.getElementById('centerModalBody');
        const btnAction = document.getElementById('btnCenterModalAction');
        if (!modal || !titleEl || !bodyEl) return;

        const isExp = type === 'exponential';
        const dialog = modal.querySelector('.engineer-center-dialog');
        if (dialog) {
            dialog.classList.add('functions-briefing');
        }

        titleEl.innerHTML = isExp 
            ? '📈 Função Exponencial: O Poder da Multiplicação' 
            : '📉 Função Logarítmica: A Inversa & Domando Grandezas';

        const storyText = isExp
            ? `Olá! Eu sou o <b>Engenheiro Leo</b>. Respire fundo e venha comigo com calma! Vamos descomplicar a <b>Função Exponencial</b> passo a passo: o que ela é, como se calcula e como ela é usada para transformar o mundo real e os nossos sólidos 3D.`
            : `Olá! Eu sou o <b>Engenheiro Leo</b>. O <b>Logaritmo</b> não é nenhum bicho de sete cabeças! Ele é simplesmente a operação inversa da exponencial. Venha com calma entender o que ele faz, como se calcula e como medimos desde sons até terremotos em edifícios 3D!`;

        const conceptContent = isExp
            ? `
                <div class="briefing-card briefing-card-concept" data-category="concept">
                    <div class="briefing-card-badge cyan">💡 CONCEITO INTUITIVO & ESSENCIAL</div>
                    <div class="briefing-card-title">Crescimento por Multiplicações Sucessivas</div>
                    <div class="briefing-card-text">
                        <p>Imagine uma única célula de bactéria em um tanque de biocombustível. A cada 1 hora, ela se divide em duas: no instante zero temos <b>1</b>; após 1 hora temos <b>2</b>; após 2 horas temos <b>4</b>; após 3 horas temos <b>8</b>; e após 10 horas já são <b>1.024</b> células!</p>
                        <p>No crescimento linear comum, nós <b>somamos</b> um valor fixo a cada passo (+2, +2, +2...). Já no crescimento exponencial, nós <b>multiplicamos</b> pela mesma base a cada passo (×2, ×2, ×2...). Por isso, no início a curva parece calma e quase plana, mas de repente ela <b>decola como um foguete</b> para o alto!</p>
                        <div class="concept-comparison-pill">
                            <span class="pill-item"><b>Crescimento Linear:</b> f(10) = 2 × 10 = <b>20</b></span>
                            <span class="pill-vs">vs</span>
                            <span class="pill-item highlight"><b>Crescimento Exponencial:</b> f(10) = 2¹⁰ = <b>1.024</b>! 🚀</span>
                        </div>
                    </div>
                </div>
            `
            : `
                <div class="briefing-card briefing-card-concept" data-category="concept">
                    <div class="briefing-card-badge cyan">💡 CONCEITO INTUITIVO & ESSENCIAL</div>
                    <div class="briefing-card-title">A Operação Inversa da Exponencial: Desfazendo Potências</div>
                    <div class="briefing-card-text">
                        <p>O logaritmo responde a uma pergunta direta: <b>"A que expoente devo elevar a base para obter este número?"</b></p>
                        <p>Por exemplo: Se <b>2³ = 8</b>, então <b>log₂(8) = 3</b>! O logaritmo é a operação matemática que "desfaz" o expoente e descobre quantos passos multiplicativos foram dados.</p>
                        <p>Enquanto a função exponencial explode com velocidade vertiginosa para cima, a função logarítmica faz o inverso: ela <b>cresce com muita serenidade e calma</b>. Ela funciona como um poderoso amortecedor que compacta números astronômicos em uma régua simples de 1 a 10!</p>
                        <div class="concept-comparison-pill">
                            <span class="pill-item"><b>Variação Astronômica:</b> 1.000.000.000 (1 bilhão)</span>
                            <span class="pill-vs">➡</span>
                            <span class="pill-item highlight"><b>Logaritmo (Base 10):</b> log₁₀(1 bilhão) = <b>9</b>! 📏</span>
                        </div>
                    </div>
                </div>
            `;

        const calcContent = isExp
            ? `
                <div class="briefing-card briefing-card-calc" data-category="calc">
                    <div class="briefing-card-badge emerald">🧮 COMO SE CALCULA PASSO A PASSO</div>
                    <div class="briefing-card-title">A Lei de Formação Geral e o Papel de Cada Termo</div>
                    <div class="formula-hero-box">f(x) = a · bˣ + c</div>
                    
                    <div class="formula-terms-grid">
                        <div class="formula-term-item">
                            <b>b (Base da Potência):</b> O fator multiplicador a cada passo (deve ser <b>b &gt; 0</b> e <b>b ≠ 1</b>). Se <b>b &gt; 1</b>, a função é <b>Crescente</b>. Se <b>0 &lt; b &lt; 1</b>, ela é <b>Decrescente</b> (decaimento).
                        </div>
                        <div class="formula-term-item">
                            <b>x (Expoente):</b> A variável independente no expoente (tempo, gerações de bactérias, etapas de duplicação).
                        </div>
                        <div class="formula-term-item">
                            <b>a (Multiplicador):</b> O valor inicial quando x = 0 (se c = 0). Estica ou inverte a curva verticalmente.
                        </div>
                        <div class="formula-term-item">
                            <b>c (Assíntota Horizontal):</b> A reta horizontal <b>y = c</b>. A curva chega infinitamente perto dela, mas <b>nunca toca nem ultrapassa</b>!
                        </div>
                    </div>

                    <div style="font-size:0.85rem; font-weight:700; color:#38bdf8; margin-top:6px;">
                        📝 Exemplo Prático Guiado: Calculando f(x) = 2ˣ passo a passo
                    </div>

                    <div class="briefing-calc-table-box">
                        <table class="briefing-calc-table">
                            <thead>
                                <tr>
                                    <th>Valor de x</th>
                                    <th>Como Calcular a Potência</th>
                                    <th>Resultado f(x)</th>
                                    <th>Ponto no Gráfico (x, y)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><b>x = -1</b></td>
                                    <td>2⁻¹ = 1 / 2¹ = 0.50</td>
                                    <td><span class="coord-tag">0.50</span></td>
                                    <td>P(-1.0, 0.5) <small style="color:#94a3b8;">(aproxima da assíntota)</small></td>
                                </tr>
                                <tr>
                                    <td><b>x = 0</b></td>
                                    <td>2⁰ = 1 (todo nº elevado a 0 vale 1)</td>
                                    <td><span class="coord-tag">1.00</span></td>
                                    <td>P(0.0, 1.0) <small style="color:#38bdf8;">(corta o eixo Y)</small></td>
                                </tr>
                                <tr>
                                    <td><b>x = 1</b></td>
                                    <td>2¹ = 2</td>
                                    <td><span class="coord-tag">2.00</span></td>
                                    <td>P(1.0, 2.0)</td>
                                </tr>
                                <tr>
                                    <td><b>x = 2</b></td>
                                    <td>2² = 2 × 2 = 4</td>
                                    <td><span class="coord-tag">4.00</span></td>
                                    <td>P(2.0, 4.0)</td>
                                </tr>
                                <tr>
                                    <td><b>x = 3</b></td>
                                    <td>2³ = 2 × 2 × 2 = 8</td>
                                    <td><span class="coord-tag">8.00</span></td>
                                    <td>P(3.0, 8.0) <small style="color:#fde047;">(dispara rápido!)</small></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `
            : `
                <div class="briefing-card briefing-card-calc" data-category="calc">
                    <div class="briefing-card-badge emerald">🧮 COMO SE CALCULA PASSO A PASSO</div>
                    <div class="briefing-card-title">A Lei de Formação Geral e a Condição de Existência</div>
                    <div class="formula-hero-box">f(x) = a · log_b(x - h) + c</div>
                    
                    <div class="formula-terms-grid">
                        <div class="formula-term-item">
                            <b>b (Base do Logaritmo):</b> A base da potência correspondente (<b>b &gt; 0</b> e <b>b ≠ 1</b>). As mais usadas no mundo são a base <b>10</b> (sismologia/som) e a base de Euler <b>e ≈ 2.718</b> (logaritmo natural ln).
                        </div>
                        <div class="formula-term-item">
                            <b>h (Assíntota Vertical):</b> A reta vertical <b>x = h</b> que serve como barreira intransponível na esquerda.
                        </div>
                        <div class="formula-term-item">
                            <b>⚠️ Condição de Existência Obrigatória:</b> O interior <b>(x - h)</b> DEVE ser estritamente maior que zero: <b>x &gt; h</b>. <b>Não existe logaritmo de zero nem de números negativos nos números reais!</b>
                        </div>
                        <div class="formula-term-item">
                            <b>c (Deslocamento Vertical):</b> Desloca o gráfico inteiro verticalmente para cima ou para baixo.
                        </div>
                    </div>

                    <div style="font-size:0.85rem; font-weight:700; color:#38bdf8; margin-top:6px;">
                        📝 Exemplo Prático Guiado: Calculando f(x) = log₂(x) (com h = 0)
                    </div>

                    <div class="briefing-calc-table-box">
                        <table class="briefing-calc-table">
                            <thead>
                                <tr>
                                    <th>Valor de x</th>
                                    <th>A Pergunta do Logaritmo</th>
                                    <th>Resultado f(x)</th>
                                    <th>Ponto no Gráfico (x, y)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><b>x = 0.5</b></td>
                                    <td>"Qual expoente faz 2 virar 0.5?" ➡ 2⁻¹ = 0.5</td>
                                    <td><span class="coord-tag">-1.00</span></td>
                                    <td>P(0.5, -1.0) <small style="color:#94a3b8;">(mergulha para -∞)</small></td>
                                </tr>
                                <tr>
                                    <td><b>x = 1</b></td>
                                    <td>"Qual expoente faz 2 virar 1?" ➡ 2⁰ = 1</td>
                                    <td><span class="coord-tag">0.00</span></td>
                                    <td>P(1.0, 0.0) <small style="color:#38bdf8;">(corta o eixo X em 1)</small></td>
                                </tr>
                                <tr>
                                    <td><b>x = 2</b></td>
                                    <td>"Qual expoente faz 2 virar 2?" ➡ 2¹ = 2</td>
                                    <td><span class="coord-tag">1.00</span></td>
                                    <td>P(2.0, 1.0)</td>
                                </tr>
                                <tr>
                                    <td><b>x = 4</b></td>
                                    <td>"Qual expoente faz 2 virar 4?" ➡ 2² = 4</td>
                                    <td><span class="coord-tag">2.00</span></td>
                                    <td>P(4.0, 2.0)</td>
                                </tr>
                                <tr>
                                    <td><b>x = 8</b></td>
                                    <td>"Qual expoente faz 2 virar 8?" ➡ 2³ = 8</td>
                                    <td><span class="coord-tag">3.00</span></td>
                                    <td>P(8.0, 3.0) <small style="color:#34d399;">(cresce com serenidade)</small></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

        const utilityContent = isExp
            ? `
                <div class="briefing-card briefing-card-utility" data-category="utility">
                    <div class="briefing-card-badge amber">🌍 PARA QUE SERVE NO MUNDO REAL & SÓLIDOS 3D</div>
                    <div class="briefing-card-title">Aplicações Práticas na Engenharia e na Vida Real</div>
                    
                    <div class="real-world-grid">
                        <div class="real-world-item">
                            <div class="real-world-item-title">💧 Reservatórios Cilíndricos & Biomassa</div>
                            <div class="real-world-item-desc">
                                Em biorreatores industriais, culturas de leveduras e bactérias dobram de volume a cada hora: <b>V(t) = 125 · 2ᵗ Litros</b>. Em apenas 3 horas, o volume salta de 125 L para <b>1.000 Litros (1 m³)</b>, enchendo por completo o tanque cilíndrico do laboratório!
                            </div>
                        </div>
                        <div class="real-world-item">
                            <div class="real-world-item-title">💰 Economia & Juros Compostos</div>
                            <div class="real-world-item-desc">
                                O crescimento de investimentos financeiros segue a regra <b>M = C · (1 + i)ᵗ</b>, onde cada rendimento gera novos rendimentos nas etapas seguintes.
                            </div>
                        </div>
                        <div class="real-world-item">
                            <div class="real-world-item-title">🧪 Farmacologia & Decaimento</div>
                            <div class="real-world-item-desc">
                                A eliminação de antibióticos pelo organismo segue um <b>decaimento exponencial</b> (base b &lt; 1), assim como a meia-vida do Carbono-14 usada por cientistas para datar fósseis.
                            </div>
                        </div>
                    </div>
                </div>
            `
            : `
                <div class="briefing-card briefing-card-utility" data-category="utility">
                    <div class="briefing-card-badge amber">🌍 PARA QUE SERVE NO MUNDO REAL & SÓLIDOS 3D</div>
                    <div class="briefing-card-title">Aplicações Práticas na Engenharia e na Vida Real</div>
                    
                    <div class="real-world-grid">
                        <div class="real-world-item">
                            <div class="real-world-item-title">🏢 Terremotos & Edifício 3D</div>
                            <div class="real-world-item-desc">
                                A <b>Escala Richter</b> mede a energia sísmica através de <b>M = ⅔ · log₁₀(E / 10³)</b>. Como a energia varia na casa dos bilhões de Joules, cada 1 grau a mais significa <b>31,6 vezes mais energia destrutiva</b>! No laboratório 3D, você poderá simular a vibração no Edifício.
                            </div>
                        </div>
                        <div class="real-world-item">
                            <div class="real-world-item-title">🔊 Acústica & Som (Decibéis)</div>
                            <div class="real-world-item-desc">
                                O ouvido humano escuta desde o cair de uma folha até uma turbina de avião (uma variação de mais de 1 trilhão de vezes!). A fórmula de decibéis usa logaritmo decimal para comprimir isso de <b>0 a 120 dB</b>.
                            </div>
                        </div>
                        <div class="real-world-item">
                            <div class="real-world-item-title">💧 Química da Água (Escala de pH)</div>
                            <div class="real-world-item-desc">
                                A acidez da água é calculada por <b>pH = -log₁₀[H⁺]</b>. Um pH 3 tem 10 vezes mais acidez que pH 4 e 100 vezes mais que pH 5.
                            </div>
                        </div>
                    </div>
                </div>
            `;

        const todoContent = isExp
            ? `
                <div class="briefing-card briefing-card-todo" data-category="todo">
                    <div class="briefing-card-badge purple">🎯 ROTEIRO PRÁTICO: O QUE VOCÊ DEVE FAZER AGORA</div>
                    <div class="briefing-card-title">4 Passos Simples para Construir Seu Conhecimento</div>
                    
                    <div class="center-briefing-steps-grid">
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">1</div>
                            <div class="step-box-content">
                                <b>Mova o Slider da Base (b):</b>
                                <span>No painel esquerdo, arraste a base de 0.2 até 4.0. Veja como a curva empina quando b &gt; 1 ou vira decaimento quando b &lt; 1.</span>
                            </div>
                        </div>
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">2</div>
                            <div class="step-box-content">
                                <b>Arraste o Ponto P no Gráfico:</b>
                                <span>Clique e arraste diretamente sobre a linha da curva para inspecionar os pares (x, y) calculados em tempo real na barra inferior.</span>
                            </div>
                        </div>
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">3</div>
                            <div class="step-box-content">
                                <b>Resolva os Exercícios na Aba 2:</b>
                                <span>Clique na aba "2. Exercícios" para fixar o cálculo de potências e ganhar XP de carreira!</span>
                            </div>
                        </div>
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">4</div>
                            <div class="step-box-content">
                                <b>Explore a Realidade 3D & Hipóteses:</b>
                                <span>Nas abas 3 e 4, simule a biomassa enchendo o cilindro 3D e teste hipóteses sobre a assíntota horizontal.</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
            : `
                <div class="briefing-card briefing-card-todo" data-category="todo">
                    <div class="briefing-card-badge purple">🎯 ROTEIRO PRÁTICO: O QUE VOCÊ DEVE FAZER AGORA</div>
                    <div class="briefing-card-title">4 Passos Simples para Construir Seu Conhecimento</div>
                    
                    <div class="center-briefing-steps-grid">
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">1</div>
                            <div class="step-box-content">
                                <b>Altere a Base (b) e a Assíntota (h):</b>
                                <span>No painel esquerdo, altere a base e observe a barreira vertical x = h se deslocando pelo gráfico.</span>
                            </div>
                        </div>
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">2</div>
                            <div class="step-box-content">
                                <b>Ative o Botão "🪞 Inversa (y = x)":</b>
                                <span>No cabeçalho do gráfico, clique em Inversa para ver o espelho perfeito entre o logaritmo e a exponencial refletidos na diagonal!</span>
                            </div>
                        </div>
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">3</div>
                            <div class="step-box-content">
                                <b>Resolva os Exercícios na Aba 2:</b>
                                <span>Responda às questões numéricas e conceituais de logaritmo para acumular XP no GeoLab!</span>
                            </div>
                        </div>
                        <div class="briefing-step-box">
                            <div class="step-badge-circle">4</div>
                            <div class="step-box-content">
                                <b>Dispare o Tremor Sísmico no Prédio 3D:</b>
                                <span>Na aba "3. Realidade 3D", ajuste a energia sísmica e veja os amortecedores do Edifício 3D reagindo à magnitude Richter!</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        bodyEl.innerHTML = `
            <div class="center-briefing-story">
                ${storyText}
            </div>

            <div class="briefing-tab-bar">
                <button class="briefing-tab-btn active" data-tab="all">📖 Visão Completa</button>
                <button class="briefing-tab-btn" data-tab="concept">💡 O que é?</button>
                <button class="briefing-tab-btn" data-tab="calc">🧮 Como se Calcula?</button>
                <button class="briefing-tab-btn" data-tab="utility">🌍 Para que Serve?</button>
                <button class="briefing-tab-btn" data-tab="todo">🎯 O que Fazer?</button>
            </div>

            <div class="briefing-cards-container" style="display:flex; flex-direction:column; gap:14px; margin-top:10px;">
                ${conceptContent}
                ${calcContent}
                ${utilityContent}
                ${todoContent}
            </div>
        `;

        // Interação com as abas internas do modal
        const tabBtns = bodyEl.querySelectorAll('.briefing-tab-btn');
        const cards = bodyEl.querySelectorAll('.briefing-card');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetTab = btn.dataset.tab;

                cards.forEach(card => {
                    if (targetTab === 'all' || card.dataset.category === targetTab) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });

                bodyEl.scrollTop = 0;
                if (window.sounds) window.sounds.playClick();
            });
        });

        if (btnAction) {
            btnAction.textContent = 'Entendi Perfeitamente! Vamos Praticar no Gráfico 🚀';
            btnAction.onclick = () => {
                this.hideCenterBriefing();
                if (typeof onStart === 'function') {
                    onStart();
                }
                this.speak(
                    isExp 
                        ? 'Excelente! Agora ajuste o slider da <b>Base (b)</b> à esquerda ou arraste o <b>Ponto P</b> no gráfico!' 
                        : 'Muito bem! Experimente ligar a <b>🪞 Inversa (y=x)</b> no topo do gráfico ou simular o tremor no Edifício 3D!',
                    { icon: '👷', duration: 6000 }
                );
                if (window.sounds) window.sounds.playSuccess();
            };
        }

        modal.classList.remove('hidden');
        if (window.sounds) window.sounds.playClick();
    }

    hideCenterBriefing() {
        const modal = document.getElementById('engineerCenterModal');
        if (modal) {
            modal.classList.add('hidden');
            const dialog = modal.querySelector('.engineer-center-dialog');
            if (dialog) dialog.classList.remove('functions-briefing');
        }
    }

    speak(message, options = {}) {
        const bubble = document.getElementById('engineerSpeechBubble');
        const textEl = document.getElementById('engineerSpeechText');
        const beacon = document.getElementById('engineerStatusBeacon');
        const nextBtn = document.getElementById('btnEngineerNextStep');
        const skipBtn = document.getElementById('btnEngineerSkip');

        if (!bubble || !textEl) return;

        if (this.speechTimeout) clearTimeout(this.speechTimeout);
        if (this.typingInterval) clearInterval(this.typingInterval);

        if (beacon) {
            beacon.textContent = options.icon || '💡';
            beacon.classList.add('pulse');
        }

        const mouth = document.getElementById('engineerMouth');
        if (mouth) mouth.setAttribute('d', 'M50 67 Q 60 79, 70 67');

        if (nextBtn) {
            nextBtn.textContent = options.btnText || 'Entendi! 👍';
        }
        if (skipBtn) {
            skipBtn.style.display = options.showSkip ? 'block' : 'none';
        }
        this.onNextStepCallback = options.onNext || null;

        bubble.classList.remove('hidden');
        textEl.innerHTML = message;

        if (mouth) {
            setTimeout(() => {
                mouth.setAttribute('d', 'M52 68 Q 60 76, 68 68');
            }, 400);
        }

        if (window.sounds && !options.silent) {
            window.sounds.playClick();
        }

        if (options.duration) {
            this.speechTimeout = setTimeout(() => {
                this.hideSpeechBubble();
            }, options.duration);
        }
    }

    isSpeechBubbleVisible() {
        const bubble = document.getElementById('engineerSpeechBubble');
        return bubble && !bubble.classList.contains('hidden');
    }

    hideSpeechBubble() {
        const bubble = document.getElementById('engineerSpeechBubble');
        if (bubble) bubble.classList.add('hidden');
        const beacon = document.getElementById('engineerStatusBeacon');
        if (beacon) beacon.classList.remove('pulse');
    }

    // =========================================================================
    // APONTAMENTO VISUAL E SETAS ANIMADAS
    // =========================================================================
    guideUserTo(targetSelector, message, options = {}) {
        const targetEl = document.querySelector(targetSelector);
        if (!targetEl) {
            this.speak(message, options);
            return;
        }

        this.removeGuideSpotlight();

        const overlay = document.getElementById('guidedSpotlightOverlay');
        const rect = targetEl.getBoundingClientRect();

        const arrow = document.createElement('div');
        arrow.className = `guided-floating-arrow arrow-${options.position || 'top'}`;
        
        let arrowX = rect.left + rect.width / 2;
        let arrowY = rect.top;

        if (options.position === 'left') {
            arrowX = rect.left - 20;
            arrowY = rect.top + rect.height / 2;
        } else if (options.position === 'right') {
            arrowX = rect.right + 20;
            arrowY = rect.top + rect.height / 2;
        } else if (options.position === 'bottom') {
            arrowX = rect.left + rect.width / 2;
            arrowY = rect.bottom + 20;
        } else {
            arrowX = rect.left + rect.width / 2;
            arrowY = rect.top - 20;
        }

        arrow.style.left = `${arrowX}px`;
        arrow.style.top = `${arrowY}px`;
        arrow.innerHTML = `
            <div class="arrow-pulsing-badge">
                <span class="arrow-symbol">👇</span>
                <span class="arrow-label">${options.arrowLabel || 'CLIQUE OU ARRASTE AQUI'}</span>
            </div>
        `;

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.appendChild(arrow);
            this.currentArrow = arrow;
        }

        targetEl.classList.add('guided-target-pulse');
        this.currentTargetEl = targetEl;

        this.speak(message, {
            ...options,
            onNext: () => {
                this.removeGuideSpotlight();
                if (options.onNext) options.onNext();
                else this.hideSpeechBubble();
            }
        });
    }

    removeGuideSpotlight() {
        const overlay = document.getElementById('guidedSpotlightOverlay');
        if (overlay) {
            overlay.innerHTML = '';
            overlay.classList.add('hidden');
        }
        if (this.currentTargetEl) {
            this.currentTargetEl.classList.remove('guided-target-pulse');
            this.currentTargetEl = null;
        }
        this.currentArrow = null;
    }

    startOnboarding() {
        const steps = [
            {
                target: '#canvas-container',
                position: 'top',
                arrowLabel: 'ESPAÇO 3D',
                icon: '👷',
                text: '<b>Bem-vindo ao GeoLab 3D!</b> Sou o <b>Engenheiro Leo</b> e vou te ensinar como arquitetos e engenheiros dominam a geometria espacial!',
                btnText: 'Avançar ▶'
            },
            {
                target: '.didactic-xray-toolbar',
                position: 'bottom',
                arrowLabel: 'RAIO-X 1D · 2D · 3D',
                icon: '🔬',
                text: 'Aqui em cima temos os botões de <b>Raio-X Didático</b>: <b>Perímetro (1D)</b>, <b>Área (2D)</b> e <b>Volume (3D)</b> com líquido real!',
                btnText: 'Muito legal!'
            },
            {
                target: '#interactiveBlackboardContainer',
                position: 'left',
                arrowLabel: 'LOUSA DE CÁLCULO',
                icon: '📐',
                text: 'Esqueça decoreba de fórmulas! Na nossa <b>Lousa Interativa</b>, você vai <b>arrastar as medidas</b> para dentro das incógnitas e ver potências como <b>3³</b> se expandirem em <b>3 × 3 × 3</b>!',
                btnText: 'Entendi!'
            }
        ];

        let currentStep = 0;
        const runStep = () => {
            if (currentStep >= steps.length) {
                this.completeOnboarding();
                this.speak('Pronto! Agora arraste a primeira medida na Lousa ao lado para calcular o Volume!', {
                    icon: '🎉',
                    btnText: 'Bora lá!',
                    duration: 5000
                });
                return;
            }

            const s = steps[currentStep];
            this.guideUserTo(s.target, s.text, {
                position: s.position,
                arrowLabel: s.arrowLabel,
                icon: s.icon,
                btnText: s.btnText,
                showSkip: true,
                onNext: () => {
                    currentStep++;
                    runStep();
                }
            });
        };

        runStep();
    }

    completeOnboarding() {
        this.hasSeenOnboarding = true;
        localStorage.setItem('geolab_onboarding_completed', 'true');
        this.removeGuideSpotlight();
    }

    explainPowerMisconception(base, exp) {
        this.speak(`
            ⚠️ <b>Atenção com a Potência!</b><br>
            Elevar <b>${base}</b> ao expoente <b>${exp}</b> (<b>${base}<sup>${exp}</sup></b>) 
            <b>NÃO É</b> fazer ${base} × ${exp} = ${base * exp}!<br>
            💡 Significa multiplicar a base por ela mesma <b>${exp} vezes</b>:<br>
            <span style="font-family:'JetBrains Mono'; font-weight:700; color:var(--accent-amber);">
                ${Array(exp).fill(base).join(' × ')} = ${Math.pow(base, exp)}
            </span>!
        `, { icon: '⚠️', btnText: 'Compreendi! 💡' });
    }

    explainDimensionConcept(dim) {
        if (dim === '1d') {
            this.speak(`
                📏 <b>Medida Linear (1D - Metros):</b><br>
                O <b>perímetro</b> e as arestas são unidimensionais. É o comprimento de uma linha reta, como esticar uma fita métrica!
            `, { icon: '📏', btnText: 'Entendi!' });
        } else if (dim === '2d') {
            this.speak(`
                🎨 <b>Superfície e Área (2D - Metros Quadrados m²):</b><br>
                A <b>Área Total (At)</b> é a "casca" do sólido. Imagine cobrir todas as faces com papel de presente ou pintura. É bidimensional (largura × altura)!
            `, { icon: '🎨', btnText: 'Ficou claro!' });
        } else if (dim === '3d') {
            this.speak(`
                💧 <b>Volume e Capacidade (3D - Metros Cúbicos m³ e Litros):</b><br>
                O <b>Volume</b> é todo o espaço tridimensional interno que o sólido comporta. 
                <br>💡 <b>Lembre-se sempre:</b> <b>1 m³ = exatamente 1.000 Litros de água</b>!
            `, { icon: '💧', btnText: 'Show de bola!' });
        }
    }

    reactToBuildingDeformation(volume, liters) {
        this.speak(`
            🏢 <b>Você alterou as dimensões do Edifício!</b><br>
            Puxando os vértices, o novo volume interno de ar climatizado é de 
            <b>${volume.toFixed(2)} m³</b> (${liters} Litros de ar). 
            Veja como a fórmula na Lousa mudou em tempo real!
        `, { icon: '🏗️', btnText: 'Ver na Lousa', duration: 6000 });
    }

    showRandomTip() {
        const tips = [
            { icon: '💡', text: '<b>Dica do Engenheiro:</b> Para calcular a Área Total, pense em desdobrar as caixas no chão. Cada face vira uma figura plana simples (quadrados e retângulos)!' },
            { icon: '💧', text: '<b>Regra de Ouro da Hidráulica:</b> Cada 1 m³ de reservatório comporta exatamente 1.000 Litros de água potável (1 dm³ = 1 L)!' },
            { icon: '📐', text: '<b>Potência sem medo:</b> O expoente indica quantos fatores iguais multiplicam entre si. Ex: a³ = a × a × a.' },
            { icon: '✋', text: '<b>Experimente:</b> Clique em "Deformar Vértices" no topo do 3D e arraste as esferas douradas para ver a geometria mudar!' }
        ];
        const tip = tips[Math.floor(Math.random() * tips.length)];
        this.speak(tip.text, { icon: tip.icon, duration: 6000 });
    }
}

window.EngineerGuide = EngineerGuide;
