// Sistema Pedagógico: Modo Carreira BNCC (6 Fases com Missões Práticas)
class CareerMode {
    constructor(sceneManager, onApplySolid, onOpenBuildingStudio) {
        this.sm = sceneManager;
        this.onApplySolid = onApplySolid;
        this.onOpenBuildingStudio = onOpenBuildingStudio;
        this.currentStageIndex = 0;
        this.completedStages = new Set();
        this.derivedStages = new Set(); // Rastreia fases onde o aluno passou pela lousa drag & drop
        this.loadProgress();

        this.stages = [
            {
                id: 'stage_cube',
                level: 1,
                icon: '📦',
                shortName: 'Caixa d\'Água',
                title: 'Fase 1: Fundação & Caixa d\'Água Cúbica',
                subtitle: 'Poliedros Regulares, Arestas, Área Total e Volume em Litros',
                solidId: 'cube',
                targetParams: { a: 3.0 },
                story: 'Uma construtora sustentável está instalando reservatórios cúbicos nas casas de uma vila ecológica. Você foi contratado para dimensionar o revestimento impermeável e a capacidade de água.',
                conceptText: 'O cubo possui 6 faces quadradas idênticas, 12 arestas e 8 vértices. A área da base é <b>Ab = a²</b>, a área total das 6 faces é <b>At = 6 · a²</b> e o volume é <b>V = a³</b>. Lembre-se: <b>1 m³ = 1.000 Litros</b>.',
                actionPrompt: '1. Observe ou ajuste a aresta no 3D para <b>a = 3.0 m</b>.<br>2. Calcule a Área Total (At) de revestimento das 6 faces.<br>3. Calcule o Volume útil (V) em m³ e confira a capacidade em Litros.<br>4. Digite as respostas abaixo e clique em Validar.',
                inputs: [
                    { id: 'cube_at', label: 'Área Total (At em m²):', expected: 54.0, tol: 1.0, hint: 'At = 6 · a² = 6 · 3² = 54 m²' },
                    { id: 'cube_v', label: 'Volume (V em m³):', expected: 27.0, tol: 0.8, hint: 'V = a³ = 3³ = 27 m³ (27.000 Litros)' }
                ],
                xpReward: 100,
                trophy: '🥉 Aprendiz de Poliedros'
            },
            {
                id: 'stage_prism',
                level: 2,
                icon: '🚢',
                shortName: 'Contêiner Marítimo',
                title: 'Fase 2: Contêiner Marítimo de Carga',
                subtitle: 'Prisma Retangular (Paralelepípedo): Comprimento, Largura e Altura',
                solidId: 'rectangular_prism',
                targetParams: { a: 6.0, b: 2.5, c: 2.6 },
                story: 'A empresa de logística portuária precisa homologar um novo lote de contêineres de aço. É necessário comprar chapas de aço corrugado para as 6 faces e saber a cubagem máxima de carga.',
                conceptText: 'O paralelepípedo possui 3 pares de faces retangulares opostas congruentes. Sua área total é <b>At = 2·(a·b + a·c + b·c)</b> e seu volume é a multiplicação das três dimensões: <b>V = a · b · c</b>.',
                actionPrompt: '1. Dimensões: Comprimento <b>a = 6.0 m</b>, Largura <b>b = 2.5 m</b>, Altura <b>c = 2.6 m</b>.<br>2. Calcule a Área Total de chapas de aço (At).<br>3. Calcule o Volume interno de carga (V em m³).',
                inputs: [
                    { id: 'prism_at', label: 'Área Total de Chapa (At em m²):', expected: 74.2, tol: 1.5, hint: 'At = 2·(6×2.5 + 6×2.6 + 2.5×2.6) = 2·(15 + 15.6 + 6.5) = 74.2 m²' },
                    { id: 'prism_v', label: 'Volume Útil de Carga (V em m³):', expected: 39.0, tol: 1.0, hint: 'V = 6.0 × 2.5 × 2.6 = 39.0 m³' }
                ],
                xpReward: 120,
                trophy: '🥈 Especialista em Carga'
            },
            {
                id: 'stage_cylinder',
                level: 3,
                icon: '🌾',
                shortName: 'Silo de Grãos',
                title: 'Fase 3: Silo Cilíndrico de Grãos',
                subtitle: 'Corpos Redondos, Comprimento 2πr e Planificação Lateral',
                solidId: 'cylinder',
                targetParams: { r: 2.0, h: 6.0 },
                story: 'Uma cooperativa agroindustrial armazena soja em silos metálicos cilíndricos. O engenheiro precisa encomendar placas de aço galvanizado para o cilindro e calcular a capacidade em toneladas/litros.',
                conceptText: 'A lateral do cilindro desdobra-se em um retângulo de comprimento <b>2·π·r</b> e altura <b>h</b>. A área lateral é <b>Al = 2·π·r·h</b>, as duas bases somam <b>2·π·r²</b>, e o volume é <b>V = π·r²·h</b> (adote π ≈ 3,14).',
                actionPrompt: '1. Parâmetros: Raio <b>r = 2.0 m</b> e Altura <b>h = 6.0 m</b>.<br>2. Calcule a Área Total (At = lateral + 2 tampas circulares).<br>3. Calcule o Volume total (V em m³).',
                inputs: [
                    { id: 'cyl_at', label: 'Área Total de Aço (At em m²):', expected: 100.5, tol: 3.0, hint: 'At = 2·π·r·(h + r) = 2 · 3,14 · 2 · 8 ≈ 100,53 m²' },
                    { id: 'cyl_v', label: 'Volume de Armazenamento (V em m³):', expected: 75.4, tol: 2.0, hint: 'V = π·r²·h = 3,14 · 4 · 6 ≈ 75,40 m³ (75.400 Litros)' }
                ],
                xpReward: 150,
                trophy: '🌾 Mestre da Agroindústria'
            },
            {
                id: 'stage_pyramid',
                level: 4,
                icon: '🏛️',
                shortName: 'Claraboia Envidraçada',
                title: 'Fase 4: Claraboia Piramidal Envidraçada',
                subtitle: 'Teorema de Pitágoras para Apótema da Pirâmide',
                solidId: 'square_pyramid',
                targetParams: { l: 6.0, h: 4.0 },
                story: 'O átrio central de um shopping center receberá uma cobertura envidraçada no formato de pirâmide de base quadrada. A equipe de arquitetura precisa comprar os painéis de vidro das 4 faces inclinadas.',
                conceptText: 'A apótema da pirâmide (ap) é a hipotenusa do triângulo retângulo formado pela altura (h) e pela metade do lado da base (l/2): <b>ap² = h² + (l/2)² = 4² + 3² = 25 ➔ ap = 5 m</b>! Cada face triangular mede <b>(L · ap) / 2</b>.',
                actionPrompt: '1. Dimensões: Lado da base <b>L = 6.0 m</b> e Altura <b>h = 4.0 m</b>.<br>2. Calcule a Área Total (base + 4 triângulos de vidro).<br>3. Calcule o Volume do vão de ar livre (V = Ab · h / 3).',
                inputs: [
                    { id: 'pyr_at', label: 'Área Total (At em m²):', expected: 96.0, tol: 2.0, hint: 'Base = 36 m²; 4 Triângulos = 4 × (6×5/2) = 60 m² ➔ At = 96 m²' },
                    { id: 'pyr_v', label: 'Volume do Vão Livre (V em m³):', expected: 48.0, tol: 1.5, hint: 'V = (6² × 4) / 3 = 144 / 3 = 48.0 m³' }
                ],
                xpReward: 180,
                trophy: '🏛️ Engenheiro de Estruturas'
            },
            {
                id: 'stage_sphere',
                level: 5,
                icon: '🌐',
                shortName: 'Tanque Horton (Gás)',
                title: 'Fase 5: Tanque Esférico de Gás (Tanque Horton)',
                subtitle: 'A Esfera: Máximo Volume com Mínima Área Superficial',
                solidId: 'sphere',
                targetParams: { r: 3.0 },
                story: 'As refinarias utilizam esferas de aço pressurizadas porque a esfera é o sólido geométrico com a menor área externa possível para um dado volume, reduzindo custos de liga metálica.',
                conceptText: 'Para a esfera de raio R, a área da superfície esférica é <b>At = 4 · π · R²</b> e o volume é <b>V = (4/3) · π · R³</b> (adote π ≈ 3,14).',
                actionPrompt: '1. Parâmetro: Raio <b>R = 3.0 m</b>.<br>2. Calcule a Área Total da carcaça esférica (At em m²).<br>3. Calcule o Volume de gás sob pressão (V em m³).',
                inputs: [
                    { id: 'sph_at', label: 'Área da Superfície (At em m²):', expected: 113.1, tol: 3.0, hint: 'At = 4 · 3,14 · 3² ≈ 113.10 m²' },
                    { id: 'sph_v', label: 'Volume de Gás (V em m³):', expected: 113.1, tol: 3.0, hint: 'V = (4/3) · 3,14 · 27 ≈ 113.04 m³' }
                ],
                xpReward: 200,
                trophy: '🌐 Engenheiro de Energia'
            },
            {
                id: 'stage_building',
                level: 6,
                icon: '🏢',
                shortName: 'Edifício Residencial',
                title: 'Fase 6: O Grande Projeto Arquitetônico (Edifício 3D)',
                subtitle: 'Construção Completa: Andares, Janelas, Portas, Alvenaria e Climatização',
                solidId: 'rectangular_prism',
                targetParams: { a: 6.0, b: 5.0, c: 8.0 },
                isBuildingMission: true,
                story: 'Você é o arquiteto-chefe do Edifício Residencial Aurora! O projeto conta com 4 andares, 24 janelas de vidro laminado e porta dupla. Você deve calcular a área líquida de alvenaria para comprar a tinta e o volume de ar para o ar-condicionado.',
                conceptText: 'Área líquida de alvenaria externa: <b>Aalvenaria = Alateral_bruta - Avidro - Aporta</b>. O volume interno de ar climatizado é <b>V = a · b · c</b>.',
                actionPrompt: '1. No painel, ajuste <b>4 andares</b> e <b>3 janelas por andar</b>.<br>2. Meça no relatório a área total de vidro e da porta.<br>3. Calcule a área líquida de alvenaria e o volume de ar climatizado.<br>4. Ao validar, fotografe o prédio para seu <b>Álbum de Projetos</b>!',
                inputs: [
                    { id: 'bld_masonry', label: 'Área Líquida de Alvenaria (em m²):', expected: 154.5, tol: 5.0, hint: 'Área lateral bruta (176 m²) menos vidro (~18 m²) e porta (~3,5 m²) ≈ 154.5 m²' },
                    { id: 'bld_v', label: 'Volume de Ar Climatizado (em m³):', expected: 240.0, tol: 4.0, hint: 'V = 6.0 × 5.0 × 8.0 = 240.0 m³ (240.000 Litros)' }
                ],
                xpReward: 300,
                trophy: '🏆 Grande Arquiteto e Urbanista Espacial'
            }
        ];
    }

    loadProgress() {
        try {
            const raw = localStorage.getItem('geolab_career_completed');
            if (raw) {
                const arr = JSON.parse(raw);
                this.completedStages = new Set(arr);
            }
        } catch (e) {}
    }

    saveProgress() {
        try {
            localStorage.setItem('geolab_career_completed', JSON.stringify([...this.completedStages]));
        } catch (e) {}
    }

    markCompleted(stageIndex) {
        this.completedStages.add(stageIndex);
        this.saveProgress();
    }

    markStageDerived(stageIndex) {
        this.derivedStages.add(stageIndex);
    }

    hasStageBeenDerived(stageIndex) {
        // Se a fase já foi concluída anteriormente ou deduzida nesta sessão
        return this.isStageCompleted(stageIndex) || this.derivedStages.has(stageIndex);
    }

    isStageCompleted(stageIndex) {
        return this.completedStages.has(stageIndex);
    }

    getProgressPercent() {
        const completedCount = this.completedStages.size;
        return Math.min(100, Math.round((completedCount / this.stages.length) * 100));
    }

    getCurrentStage() {
        return this.stages[this.currentStageIndex];
    }

    selectStage(index) {
        this.currentStageIndex = Math.max(0, Math.min(this.stages.length - 1, index));
        const stage = this.getCurrentStage();
        if (typeof this.onApplySolid === 'function') {
            this.onApplySolid(stage.solidId, stage.targetParams);
        }
        return stage;
    }

    nextStage() {
        if (this.currentStageIndex < this.stages.length - 1) {
            return this.selectStage(this.currentStageIndex + 1);
        }
        return this.getCurrentStage();
    }

    validateAnswers(inputValues) {
        const stage = this.getCurrentStage();

        let allCorrect = true;
        const results = [];

        stage.inputs.forEach(inp => {
            const userVal = parseFloat(inputValues[inp.id]);
            const isOk = !isNaN(userVal) && Math.abs(userVal - inp.expected) <= inp.tol;
            if (!isOk) allCorrect = false;
            results.push({
                id: inp.id,
                label: inp.label,
                userVal,
                expected: inp.expected,
                isOk,
                hint: inp.hint
            });
        });

        if (allCorrect) {
            this.markCompleted(this.currentStageIndex);
        }

        return {
            success: allCorrect,
            results,
            stage,
            xpReward: stage.xpReward,
            trophy: stage.trophy
        };
    }
}

window.CareerMode = CareerMode;
