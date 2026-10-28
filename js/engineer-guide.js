// =============================================================================
// GEO LAB 3D - ASSISTENTE VIRTUAL: O ENGENHEIRO GUIA (LEO)
// Avatar Cartoon/Flat Design, Onboarding Guiado, Dicas Contextuais e Setas Animadas
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
            <div class="engineer-avatar-badge" id="engineerAvatarBadge" title="Clique para falar com o Engenheiro Leo">
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

        // Container global para setas e holofotes guiados
        const spotlightOverlay = document.createElement('div');
        spotlightOverlay.id = 'guidedSpotlightOverlay';
        spotlightOverlay.className = 'guided-spotlight-overlay hidden';
        document.body.appendChild(spotlightOverlay);
    }

    getEngineerSvg() {
        // Avatar vetorial profissional de Engenheiro (Capacete amarelo de segurança, óculos de proteção, colete azul)
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
                <!-- Círculo de fundo / Moldura -->
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
                <!-- Aba do Capacete -->
                <ellipse cx="60" cy="50" rx="30" ry="5.5" fill="#eab308" stroke="#a16207" stroke-width="1" />
                <!-- Crista Central do Capacete -->
                <path d="M56 28 L64 28 L63 48 L57 48 Z" fill="#ca8a04" />
                <!-- Emblema de Lápis/Compasso no capacete -->
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
                if (this.isSpeechBubbleVisible()) {
                    this.hideSpeechBubble();
                } else {
                    this.showRandomTip();
                }
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

    speak(message, options = {}) {
        const bubble = document.getElementById('engineerSpeechBubble');
        const textEl = document.getElementById('engineerSpeechText');
        const beacon = document.getElementById('engineerStatusBeacon');
        const nextBtn = document.getElementById('btnEngineerNextStep');
        const skipBtn = document.getElementById('btnEngineerSkip');

        if (!bubble || !textEl) return;

        // Limpa timers anteriores
        if (this.speechTimeout) clearTimeout(this.speechTimeout);
        if (this.typingInterval) clearInterval(this.typingInterval);

        // Define status beacon (💡 dica, ⚠️ alerta, 🎉 sucesso, 👷 instrução)
        if (beacon) {
            beacon.textContent = options.icon || '💡';
            beacon.classList.add('pulse');
        }

        // Animação de fala do avatar
        const mouth = document.getElementById('engineerMouth');
        if (mouth) mouth.setAttribute('d', 'M50 67 Q 60 79, 70 67');

        // Configuração de botões
        if (nextBtn) {
            nextBtn.textContent = options.btnText || 'Entendi! 👍';
        }
        if (skipBtn) {
            skipBtn.style.display = options.showSkip ? 'block' : 'none';
        }
        this.onNextStepCallback = options.onNext || null;

        // Exibe o balão
        bubble.classList.remove('hidden');
        textEl.innerHTML = '';

        // Efeito de digitação suave
        let i = 0;
        const speed = options.instant ? 0 : 12;

        if (speed === 0) {
            textEl.innerHTML = message;
            if (mouth) mouth.setAttribute('d', 'M52 68 Q 60 76, 68 68');
        } else {
            // Suporta tags HTML mantendo a digitação rápida
            const rawText = message;
            textEl.innerHTML = rawText;
            if (mouth) {
                setTimeout(() => {
                    mouth.setAttribute('d', 'M52 68 Q 60 76, 68 68');
                }, 400);
            }
        }

        if (window.sounds && !options.silent) {
            window.sounds.playClick();
        }

        // Auto-dispensa se configurado
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
    // APONTAMENTO VISUAL E HOLOFOTE GUIADO (SETAS ANIMADAS)
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

        // Cria a seta animada apontando para o elemento
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
        } else { // top
            arrowX = rect.left + rect.width / 2;
            arrowY = rect.top - 20;
        }

        arrow.style.left = `${arrowX}px`;
        arrow.style.top = `${arrowY}px`;
        arrow.innerHTML = `
            <div class="arrow-pulsing-badge">
                <span class="arrow-symbol">👇</span>
                <span class="arrow-label">${options.arrowLabel || 'CLIQUE AQUI'}</span>
            </div>
        `;

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.appendChild(arrow);
            this.currentArrow = arrow;
        }

        // Destaca o elemento alvo
        targetEl.classList.add('guided-target-pulse');
        this.currentTargetEl = targetEl;

        // Fala a mensagem correspondente
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

    // =========================================================================
    // ONBOARDING GUIADO (TUTORIAL EM ETAPAS COM O ENGENHEIRO)
    // =========================================================================
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
                text: 'Aqui em cima temos os botões de <b>Raio-X Didático</b>. Eles mostram a diferença real entre <b>Perímetro (1D)</b>, <b>Área (2D)</b> e <b>Volume (3D)</b>!',
                btnText: 'Muito legal!'
            },
            {
                target: '#interactiveBlackboardContainer',
                position: 'left',
                arrowLabel: 'LOUSA DE CÁLCULO',
                icon: '📐',
                text: 'Esqueça decoreba de fórmulas! Na nossa <b>Lousa Interativa</b>, você vai <b>arrastar as medidas do 3D</b> para dentro das incógnitas e ver potências como <b>3³</b> se expandirem em <b>3 × 3 × 3</b>!',
                btnText: 'Entendi!'
            },
            {
                target: '#btnToggleDeform',
                position: 'bottom',
                arrowLabel: 'DEFORMAR VÉRTICES',
                icon: '✋',
                text: 'Você pode puxar os vértices dourados no 3D para achatar ou ampliar qualquer sólido. A fórmula recalcula na hora!',
                btnText: 'Vamos Começar! 🚀'
            }
        ];

        let currentStep = 0;

        const runStep = () => {
            if (currentStep >= steps.length) {
                this.completeOnboarding();
                this.speak('Pronto! Agora você está pronto para iniciar sua carreira técnica. Arraste a primeira medida na Lousa ao lado!', {
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

    // =========================================================================
    // DICAS PEDAGÓGICAS CONTEXTUAIS SOBRE LETRAMENTO MATEMÁTICO
    // =========================================================================
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
                O <b>perímetro</b> e as arestas são unidimensionais. É o comprimento de uma linha reta, como esticar uma trena ou fita métrica!
            `, { icon: '📏', btnText: 'Entendi!' });
        } else if (dim === '2d') {
            this.speak(`
                🎨 <b>Superfície e Área (2D - Metros Quadrados m²):</b><br>
                A <b>Área Total (At)</b> é a "casca" do sólido. Imagine cobrir todas as faces com papel de presente ou pintura. É bidimensional (largura × altura)!
            `, { icon: '🎨', btnText: 'Ficou claro!' });
        } else if (dim === '3d') {
            this.speak(`
                💧 <b>Volume e Capacidade (3D - Metros Cúbicos m³ e Litros):</b><br>
                O <b>Volume</b> é todo o espaço tridimensional que o sólido ocupa por dentro. 
                <br>💡 <b>Lembre-se sempre:</b> <b>1 m³ = 1.000 Litros de água</b>!
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
