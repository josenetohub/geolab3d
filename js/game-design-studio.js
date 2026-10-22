// Módulo Educacional: Estúdio de Projetos 3D de Engenharia, Arquitetura e Cotidiano
class GameDesignStudio {
    constructor(sceneManager, onApplySolid) {
        this.sm = sceneManager;
        this.onApplySolid = onApplySolid;

        this.projects = [
            {
                id: 'shipping_container',
                teamName: 'Equipe 1 - Logística e Transporte',
                title: 'Contêiner Marítimo de Carga (Paralelepípedo)',
                solidId: 'rectangular_prism',
                params: { a: 6.0, b: 2.5, c: 2.6 },
                story: 'Uma transportadora logística está projetando contêineres marítimos padronizados. A fábrica precisa da Área Total para comprar as chapas de aço corrugado das 6 faces, e a equipe de frete precisa do Volume em m³ para planejar a capacidade de carga.',
                objective: 'Calcule a Área Total (At) de chapa de aço e o Volume útil (V) do contêiner com dimensões: Comprimento a = 6.0 m, Largura b = 2.5 m e Altura c = 2.6 m.'
            },
            {
                id: 'grain_silo',
                teamName: 'Equipe 2 - Agroindústria e Armazenamento',
                title: 'Silo Cilíndrico de Grãos de Soja (Cilindro)',
                solidId: 'cylinder',
                params: { r: 3.0, h: 8.0 },
                story: 'Uma cooperativa agrícola vai construir um silo de grãos. O engenheiro precisa da Área Total de chapas metálicas galvanizadas (base inferior, tampa superior e parede curva) e do Volume em m³ para estimar quantas toneladas de soja o silo comportará.',
                objective: 'Calcule a Área Total (At) de placas metálicas e o Volume (V) do silo com raio da base r = 3.0 m e altura h = 8.0 m.'
            },
            {
                id: 'water_tank',
                teamName: 'Equipe 3 - Construção Civil e Saneamento',
                title: 'Caixa d\'Água Residencial Cúbica (Cubo)',
                solidId: 'cube',
                params: { a: 2.0 },
                story: 'Em um condomínio residencial sustentável, a construtora está instalando caixas d\'água cúbicas. É necessário calcular a Área Total para aplicar manta impermeabilizante nas paredes externas e internas, e o Volume para garantir o abastecimento de água aos moradores.',
                objective: 'Calcule a Área Total (At das 6 faces) e o Volume (V) da caixa cúbica com aresta a = 2.0 m.'
            },
            {
                id: 'gas_sphere',
                teamName: 'Equipe 4 - Indústria Química e Energia',
                title: 'Tanque Esférico de Gás GLP (Esfera / Tanque Horton)',
                solidId: 'sphere',
                params: { r: 4.0 },
                story: 'As refinarias utilizam esferas de aço para armazenar gás sob pressão, pois a esfera oferece a menor área superficial por volume útil e distribui as forças uniformemente. Calcule a Área de pintura térmica e o Volume de gás pressurizado.',
                objective: 'Calcule a Área Total da superfície esférica (At) e o Volume (V) do tanque com raio R = 4.0 m.'
            },
            {
                id: 'pyramid_roof',
                teamName: 'Equipe 5 - Arquitetura e Estruturas',
                title: 'Cobertura Envidraçada Piramidal (Pirâmide Quadrada)',
                solidId: 'square_pyramid',
                params: { l: 6.0, h: 4.0 },
                story: 'Um escritório de arquitetura está projetando a claraboia piramidal de um shopping center. Os engenheiros precisam da Área Total das 4 faces laterais de vidro laminado e do Volume do vão livre para dimensionar a climatização do ambiente.',
                objective: 'Calcule a Área Total (At = base + 4 triângulos) e o Volume (V) da pirâmide com lado da base L = 6.0 m e altura h = 4.0 m.'
            },
            {
                id: 'traffic_cone',
                teamName: 'Equipe 6 - Engenharia de Tráfego',
                title: 'Funil Industrial / Cone Rodoviário (Cone Reto)',
                solidId: 'cone',
                params: { r: 1.5, h: 3.0 },
                story: 'Uma fábrica de peças viárias e industriais fabrica cones de sinalização e funis de alimentação de moegas. A equipe precisa calcular a Área Total de plástico injetado com faixas reflexivas e o Volume interno da peça.',
                objective: 'Calcule a Área Total (At = base + lateral) e o Volume (V) do cone com raio da base r = 1.5 m e altura h = 3.0 m.'
            }
        ];

        this.currentProjectIndex = 0;
    }

    getCurrentProject() {
        return this.projects[this.currentProjectIndex];
    }

    selectProject(index) {
        this.currentProjectIndex = index;
        const proj = this.getCurrentProject();
        if (this.onApplySolid) {
            this.onApplySolid(proj.solidId, proj.params);
        }
        return proj;
    }

    validateSubmission(userAt, userV) {
        const proj = this.getCurrentProject();
        const solidDef = SOLIDS_DATA[proj.solidId];
        const correct = solidDef.calculate(proj.params);

        const tolAt = correct.totalArea * 0.03; // margem de 3% para aproximações de pi ou decimais
        const tolV = correct.volume * 0.03;

        const isAtOk = Math.abs(userAt - correct.totalArea) <= Math.max(0.2, tolAt);
        const isVOk = Math.abs(userV - correct.volume) <= Math.max(0.2, tolV);

        return {
            success: isAtOk && isVOk,
            isAtOk,
            isVOk,
            correctAt: correct.totalArea,
            correctV: correct.volume,
            userAt,
            userV,
            stepByStep: correct.stepByStep,
            formulas: correct.formulas
        };
    }
}

window.GameDesignStudio = GameDesignStudio;
