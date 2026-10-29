// Mecânica do Modo Jogo / Desafios do Cotidiano & Gamificação
class GameManager {
    constructor() {
        this.xp = 0;
        this.level = 1;
        this.lives = 3;
        this.streak = 0;
        this.unlockedBadges = [];
        this.currentChallenge = null;
        this.activeCategory = 'euler';

        this.loadProgress();
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('geolab_game_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.xp = data.xp || 0;
                this.level = this.calculateLevel(this.xp);
                this.unlockedBadges = data.badges || [];
            }
        } catch (e) {}

        const xpEl = document.getElementById('xpCount');
        if (xpEl) xpEl.textContent = this.xp;
    }

    saveProgress() {
        try {
            localStorage.setItem('geolab_game_progress', JSON.stringify({
                xp: this.xp,
                badges: this.unlockedBadges
            }));
        } catch (e) {}

        const xpEl = document.getElementById('xpCount');
        if (xpEl) xpEl.textContent = this.xp;
    }

    calculateLevel(xp) {
        if (xp >= 2000) return 5;
        if (xp >= 1000) return 4;
        if (xp >= 500) return 3;
        if (xp >= 200) return 2;
        return 1;
    }

    getLevelTitle(lvl) {
        switch (lvl) {
            case 1: return 'Estudante de Geometria';
            case 2: return 'Técnico em Edificações';
            case 3: return 'Projetista 3D';
            case 4: return 'Engenheiro Calculista';
            case 5: return 'Mestre da Geometria Espacial';
            default: return 'Geômetra';
        }
    }

    addXP(amount) {
        const oldLevel = this.level;
        this.xp += amount;
        this.level = this.calculateLevel(this.xp);

        const xpEl = document.getElementById('xpCount');
        if (xpEl) xpEl.textContent = this.xp;

        if (this.level > oldLevel) {
            if (window.sounds) window.sounds.playLevelUp();
            this.showNotification(`🎉 PARABÉNS! Você subiu para o Nível ${this.level}: ${this.getLevelTitle(this.level)}!`);
            this.checkBadge('level_3');
        }

        this.saveProgress();
    }

    addXp(amount) {
        this.addXP(amount);
    }

    checkBadge(badgeId) {
        if (this.unlockedBadges.includes(badgeId)) return;

        const badgeDefs = {
            first_step: { title: 'Primeiro Cálculo', desc: 'Acertou sua primeira questão prática!' },
            euler_master: { title: 'Mestre de Euler', desc: 'Dominou a relação V - A + F = 2 na engenharia!' },
            hydraulic_pro: { title: 'Técnico Hidráulico', desc: 'Abasteceu o reservatório com precisão máxima!' },
            surgeon_eye: { title: 'Visão Espacial', desc: 'Previu corretamente seções de corte em projetos reais!' },
            level_3: { title: 'Projetista 3D', desc: 'Alcançou o Nível 3 de Geometria!' }
        };

        if (badgeDefs[badgeId]) {
            this.unlockedBadges.push(badgeId);
            this.saveProgress();
            this.showNotification(`🏆 Conquista Desbloqueada: [${badgeDefs[badgeId].title}] - ${badgeDefs[badgeId].desc}`);
        }
    }

    showNotification(msg) {
        const notif = document.getElementById('game-notification');
        if (notif) {
            notif.textContent = msg;
            notif.classList.remove('hidden');
            setTimeout(() => {
                notif.classList.add('hidden');
            }, 4000);
        }
    }

    generateChallenge(category) {
        this.activeCategory = category;
        switch (category) {
            case 'euler': return this.generateEulerChallenge();
            case 'hydraulic': return this.generateHydraulicChallenge();
            case 'cutting': return this.generateCuttingChallenge();
            case 'math': return this.generateMathChallenge();
            default: return this.generateEulerChallenge();
        }
    }

    generateEulerChallenge() {
        const questions = [
            {
                solidId: 'cube',
                text: 'Na alvenaria e estruturas cúbicas (como caixas d\'água), quantos VÉRTICES (pontos de encontro de vigas) a estrutura possui?',
                options: ['6 vértices', '8 vértices', '12 vértices', '4 vértices'],
                correct: 1,
                hint: 'O cubo possui 4 vértices na base inferior e 4 na base superior = 8 vértices.'
            },
            {
                solidId: 'square_pyramid',
                text: 'Um arquiteto projeta uma cobertura piramidal de 4 águas com 5 vértices e 5 faces. Pela relação de Euler (V - A + F = 2), quantas vigas de sustentação (ARESTAS) serão necessárias?',
                options: ['6 vigas', '7 vigas', '8 vigas', '10 vigas'],
                correct: 2,
                hint: '5 - A + 5 = 2  ==>  10 - A = 2  ==>  A = 8 arestas.'
            },
            {
                solidId: 'triangular_prism',
                text: 'Uma tenda de acampamento em forma de prisma triangular possui quantas FACES (panos de lona) no total?',
                options: ['4 faces', '5 faces', '6 faces', '8 faces'],
                correct: 1,
                hint: 'São 2 faces triangulares nas extremidades + 3 faces retangulares = 5 faces.'
            },
            {
                solidId: 'cylinder',
                text: 'Por que a fórmula de Euler (V - A + F = 2) NÃO se aplica ao cálculo de silos cilíndricos de grãos?',
                options: [
                    'Porque o cilindro possui vértices infinitos',
                    'Porque é um corpo redondo com superfície curva, e não um poliedro com faces planas',
                    'Porque silos não têm volume',
                    'Porque o cilindro é um polígono'
                ],
                correct: 1,
                hint: 'A relação de Euler é válida exclusivamente para poliedros convexos fechados.'
            }
        ];

        const q = questions[Math.floor(Math.random() * questions.length)];
        this.currentChallenge = { ...q, type: 'quiz', xpReward: 50 };
        return this.currentChallenge;
    }

    generateHydraulicChallenge() {
        const targets = [
            { solidId: 'cylinder', targetLiters: 1500, params: { r: 2.0, h: 5.0 } },
            { solidId: 'cube', targetLiters: 2000, params: { a: 2.0 } },
            { solidId: 'rectangular_prism', targetLiters: 3000, params: { a: 4.0, b: 2.0, c: 2.5 } }
        ];
        const selected = targets[Math.floor(Math.random() * targets.length)];
        this.currentChallenge = {
            type: 'hydraulic',
            solidId: selected.solidId,
            params: selected.params,
            targetLiters: selected.targetLiters,
            tolerance: 150, // litros de margem
            text: `Operação de Saneamento: Abra a torneira para abastecer o reservatório com exatamente ${(selected.targetLiters).toLocaleString('pt-BR')} Litros de água sem transbordar!`,
            xpReward: 100
        };
        return this.currentChallenge;
    }

    generateCuttingChallenge() {
        const questions = [
            {
                solidId: 'cone',
                text: 'Em um funil industrial cônico, se fizermos um corte oblíquo que atravesse o cone sem interceptar a base, qual forma geométrica tem a abertura?',
                options: ['Círculo', 'Elipse', 'Parábola', 'Quadrado'],
                correct: 1,
                hint: 'Cortes inclinados nas geratrizes de um cone formam uma seção cônica elíptica.'
            },
            {
                solidId: 'cylinder',
                text: 'Em uma coluna cilíndrica de concreto, se o operário cortar horizontalmente perpendicular ao eixo, a seção exposta é um:',
                options: ['Retângulo', 'Círculo perfeito', 'Elipse', 'Triângulo'],
                correct: 1,
                hint: 'Qualquer seção transversal plana perpendicular ao eixo do cilindro é um círculo congruente à base.'
            },
            {
                solidId: 'sphere',
                text: 'Em tanques esféricos de gás ou laranjas esféricas, qualquer corte plano em qualquer ângulo SEMPRE produz uma seção:',
                options: ['Ovalada', 'Elíptica', 'Circular', 'Quadrada'],
                correct: 2,
                hint: 'A esfera possui simetria radial perfeita; toda seção plana é rigorosamente um círculo.'
            }
        ];

        const q = questions[Math.floor(Math.random() * questions.length)];
        this.currentChallenge = { ...q, type: 'quiz', xpReward: 60 };
        return this.currentChallenge;
    }

    generateMathChallenge() {
        const questions = [
            {
                solidId: 'cube',
                text: 'Uma caixa d\'água cúbica tem aresta de 2 metros. Qual é a sua Área Total de paredes (At)?',
                options: ['16 m²', '24 m²', '12 m²', '8 m²'],
                correct: 1,
                hint: 'At = 6 · a² = 6 · (2²) = 6 · 4 = 24 m².'
            },
            {
                solidId: 'cylinder',
                text: 'Um silo cilíndrico tem raio r = 2 m e altura h = 5 m. Qual é o seu Volume aproximado? (Considere π ≈ 3.14)',
                options: ['31.4 m³', '62.8 m³', '40.0 m³', '125.6 m³'],
                correct: 1,
                hint: 'V = π · r² · h = 3.14 · (2²) · 5 = 3.14 · 4 · 5 = 62.8 m³.'
            },
            {
                solidId: 'rectangular_prism',
                text: 'Um contêiner tem 6 m de comprimento, 2 m de largura e 2.5 m de altura. Qual é o seu volume útil de carga?',
                options: ['24 m³', '30 m³', '36 m³', '45 m³'],
                correct: 1,
                hint: 'V = a · b · c = 6 · 2 · 2.5 = 30 m³.'
            }
        ];

        const q = questions[Math.floor(Math.random() * questions.length)];
        this.currentChallenge = { ...q, type: 'quiz', xpReward: 70 };
        return this.currentChallenge;
    }

    submitAnswer(optionIndex) {
        if (!this.currentChallenge || this.currentChallenge.type !== 'quiz') return false;

        const isCorrect = optionIndex === this.currentChallenge.correct;
        if (isCorrect) {
            this.streak++;
            const bonus = this.streak > 1 ? this.streak * 10 : 0;
            const gained = this.currentChallenge.xpReward + bonus;
            this.addXP(gained);
            this.checkBadge('first_step');
            if (this.streak >= 3) this.checkBadge('surgeon_eye');
            if (window.sounds) window.sounds.playSuccess();
            return {
                correct: true,
                message: `Correto! +${gained} XP (Combo ${this.streak}x 🔥)`
            };
        } else {
            this.streak = 0;
            this.lives = Math.max(0, this.lives - 1);
            if (window.sounds) window.sounds.playError();
            return {
                correct: false,
                message: `Incorreto! A resposta correta era: "${this.currentChallenge.options[this.currentChallenge.correct]}". ${this.currentChallenge.hint}`
            };
        }
    }

    verifyHydraulic(currentLiters) {
        if (!this.currentChallenge || this.currentChallenge.type !== 'hydraulic') return false;

        const target = this.currentChallenge.targetLiters;
        const diff = Math.abs(currentLiters - target);
        const percentError = (diff / target) * 100;

        if (diff <= this.currentChallenge.tolerance) {
            this.streak++;
            let earned = this.currentChallenge.xpReward;
            if (percentError < 2) {
                earned += 50;
                this.checkBadge('hydraulic_pro');
            }
            this.addXP(earned);
            if (window.sounds) window.sounds.playSuccess();
            return {
                success: true,
                message: `Excelente! Abastecido com ${currentLiters.toLocaleString('pt-BR', {maximumFractionDigits:0})} L (Meta: ${target.toLocaleString('pt-BR')} L, Erro: ${percentError.toFixed(1)}%). +${earned} XP! 🎯`
            };
        } else {
            this.streak = 0;
            if (window.sounds) window.sounds.playError();
            return {
                success: false,
                message: `Nível incorreto! Você colocou ${currentLiters.toLocaleString('pt-BR', {maximumFractionDigits:0})} L, mas o objetivo era ${target.toLocaleString('pt-BR')} L (Diferença: ${diff.toLocaleString('pt-BR', {maximumFractionDigits:0})} L). Ajuste usando a torneira e o dreno!`
            };
        }
    }
}

window.GameManager = GameManager;
