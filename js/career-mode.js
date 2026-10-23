// Sistema Pedagógico: Modo Carreira BNCC (Jornada Interativa de Geometria Espacial)
class CareerMode {
    constructor(sceneManager, onApplySolid, onOpenBuildingStudio) {
        this.sm = sceneManager;
        this.onApplySolid = onApplySolid;
        this.onOpenBuildingStudio = onOpenBuildingStudio;
        this.currentStageIndex = 0;

        this.stages = [
            {
                id: 'stage_cube',
                level: 1,
                title: 'Fase 1: O Cubo e a Caixa d\'Água Residencial',
                subtitle: 'Propriedades dos Poliedros Regulares, Áreas e Capacidade em Litros',
                solidId: 'cube',
                targetParams: { a: 3.0 },
                conceptText: 'Um cubo tem 6 faces quadradas idênticas, 12 arestas e 8 vértices. A área da base é <b>Ab = a²</b>, a área total é <b>At = 6 · a²</b> e o volume é <b>V = a³</b>. Lembre-se: <b>1 m³ = 1.000 Litros</b>.',
                actionPrompt: '1. Manipule os vértices no 3D até que a aresta meça <b>a = 3.0 m</b>.<br>2. Calcule a Área Total (At) de revestimento e o Volume (V) em m³ e Litros.<br>3. Digite suas respostas abaixo para validar.',
                inputs: [
                    { id: 'cube_at', label: 'Área Total (At em m²):', expected: 54.0, tol: 1.0, hint: 'At = 6 · (3)² = 54 m²' },
                    { id: 'cube_v', label: 'Volume (V em m³):', expected: 27.0, tol: 0.8, hint: 'V = 3³ = 27 m³ (27.000 Litros)' }
                ],
                xpReward: 100,
                trophy: '🥉 Aprendiz de Poliedros'
            },
            {
                id: 'stage_cylinder',
                level: 2,
                title: 'Fase 2: O Silo Agrícola e o Cilindro Reto',
                subtitle: 'Corpos Redondos, Planificação Retangular e Teorema do Volume',
                solidId: 'cylinder',
                targetParams: { r: 2.0, h: 6.0 },
                conceptText: 'A lateral do cilindro é formada por um retângulo enrolado de comprimento <b>2 · π · r</b> e altura <b>h</b>. Sua área lateral é <b>Al = 2 · π · r · h</b>. O volume é <b>V = π · r² · h</b> (Área da Base × Altura).',
                actionPrompt: '1. Puxe a alça do cilindro no 3D para definir <b>raio r = 2.0 m</b> e <b>altura h = 6.0 m</b>.<br>2. Adote π ≈ 3,14.<br>3. Calcule a Área Total (chapa de metal completa) e o Volume em m³.',
                inputs: [
                    { id: 'cyl_at', label: 'Área Total (At em m²):', expected: 100.5, tol: 3.0, hint: 'At = 2·π·r·(h+r) = 2 · 3,14 · 2 · 8 ≈ 100,53 m²' },
                    { id: 'cyl_v', label: 'Volume (V em m³):', expected: 75.4, tol: 2.0, hint: 'V = π · r² · h = 3,14 · 4 · 6 ≈ 75,40 m³ (75.400 L)' }
                ],
                xpReward: 120,
                trophy: '🥈 Engenheiro de Silos'
            },
            {
                id: 'stage_pyramid',
                level: 3,
                title: 'Fase 3: A Claraboia Piramidal & Teorema de Pitágoras',
                subtitle: 'Apótema da Base vs Apótema da Pirâmide',
                solidId: 'square_pyramid',
                targetParams: { l: 6.0, h: 4.0 },
                conceptText: 'Na pirâmide quadrada, a apótema da face triangular inclinada (ap) é calculada usando Pitágoras no triângulo retângulo interno: <b>ap² = h² + (l/2)²</b>. Com h = 4 e l/2 = 3, temos ap = √(16 + 9) = 5 m! Cada triângulo tem área (base × ap) / 2.',
                actionPrompt: '1. Ajuste a base para <b>L = 6.0 m</b> e a altura para <b>h = 4.0 m</b>.<br>2. Calcule a Área Total (base + 4 triângulos de vidro) e o Volume (V = Ab · h / 3).',
                inputs: [
                    { id: 'pyr_at', label: 'Área Total (At em m²):', expected: 96.0, tol: 2.0, hint: 'At = Base(36) + 4×Triângulos(4 × 15) = 96 m²' },
                    { id: 'pyr_v', label: 'Volume (V em m³):', expected: 48.0, tol: 1.5, hint: 'V = (6² × 4) / 3 = 144 / 3 = 48 m³' }
                ],
                xpReward: 150,
                trophy: '🥇 Mestre dos Vértices'
            },
            {
                id: 'stage_building',
                level: 4,
                title: 'Fase 4: O Grande Projeto do Arquiteto (Edifício 3D)',
                subtitle: 'Construção Completa com Janelas, Portas, Alvenaria e Climatização',
                solidId: 'rectangular_prism',
                targetParams: { a: 6.0, b: 5.0, c: 8.0 },
                isBuildingMission: true,
                conceptText: 'Nesta missão final, você aplicará toda a geometria espacial na arquitetura real! Um edifício de 4 andares precisa ter suas janelas e portas subtraídas da alvenaria externa: <b>Aalvenaria = Alateral - Avidro - Aporta</b>, e o volume útil de ar climatizado calculado: <b>V = Ab · h</b>.',
                actionPrompt: '1. Clique no botão <b>🏢 Configurar Prédio 3D</b> para gerar as janelas e portas no modelo.<br>2. Meça a área das janelas e portas no relatório.<br>3. Digite a área líquida de alvenaria e o volume de ar climatizado.<br>4. Ao validar, tire uma foto para seu <b>Álbum de Conquistas</b>!',
                inputs: [
                    { id: 'bld_masonry', label: 'Área Líquida de Alvenaria (em m²):', expected: 154.5, tol: 5.0, hint: 'Área lateral bruta (176 m²) menos o vidro das janelas (~18 m²) e porta (~3,5 m²)' },
                    { id: 'bld_v', label: 'Volume Total Climatizado (em m³):', expected: 240.0, tol: 4.0, hint: 'V = 6.0 × 5.0 × 8.0 = 240.0 m³ (240.000 Litros)' }
                ],
                xpReward: 250,
                trophy: '🏆 Arquiteto e Urbanista Espacial'
            }
        ];
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
