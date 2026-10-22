// Material Didático de Apoio: Fórmulas, Conceitos e Resoluções Passo a Passo
const SUPPORT_GUIDE_DATA = {
    concepts: {
        title: 'Conceitos Fundamentais de Geometria Espacial',
        content: [
            {
                term: 'O que é Área Total (At)?',
                symbol: 'At (em m² ou cm²)',
                simpleExplanation: 'Pense na área total como a "casca" ou o papel de presente necessário para cobrir exatamente todas as faces externas do sólido. Na prática, é a soma da área de todas as paredes, teto e chão do objeto.',
                whyItMatters: 'Na engenharia e na indústria, você calcula a área total para saber quanta chapa de aço, vidro, manta de impermeabilização ou tinta será necessária comprar.'
            },
            {
                term: 'O que é Volume (V)?',
                symbol: 'V (em m³ ou litros)',
                simpleExplanation: 'Volume é a quantidade de espaço tridimensional que o sólido ocupa por dentro. É a capacidade interna do reservatório ou embalagem.',
                whyItMatters: 'Você calcula o volume para saber quanto líquido cabe na caixa d\'água, quantas toneladas de grãos cabem no silo ou a capacidade de carga de um caminhão.',
                conversionNote: 'Importante: 1 metro cúbico (1 m³) equivale a exatamente 1.000 Litros de água!'
            }
        ]
    },

    dictionary: [
        { symbol: 'a, b, c', name: 'Arestas / Comprimento, Largura e Altura', desc: 'Medidas das retas que delimitam os lados dos prismas.' },
        { symbol: 'r', name: 'Raio da Base', desc: 'Distância do centro da circunferência até qualquer ponto da borda.' },
        { symbol: 'D', name: 'Diâmetro', desc: 'O dobro do raio (D = 2 · r). Mede a largura total de ponta a ponta.' },
        { symbol: 'h', name: 'Altura Perpendicular', desc: 'Distância vertical reta entre o chão (base) e o topo do sólido.' },
        { symbol: 'g', name: 'Geratriz', desc: 'Comprimento inclinado da lateral de um cone (g = √(r² + h²)).' },
        { symbol: 'ap', name: 'Apótema da Pirâmide', desc: 'Altura da face triangular inclinada de uma pirâmide.' },
        { symbol: 'π (Pi)', name: 'Número Pi', desc: 'Constante matemática fundamental (π ≈ 3,14).' }
    ],

    formulasBySolid: {
        cube: {
            title: 'Cubo (Hexaedro Regular)',
            icon: '📦',
            baseArea: { formula: 'Ab = a²', desc: 'Área de 1 face quadrada da base.' },
            lateralArea: { formula: 'Al = 4 · a²', desc: 'Área das 4 paredes verticais.' },
            totalArea: { formula: 'At = 6 · a²', desc: 'Soma de todas as 6 faces quadradas.' },
            volume: { formula: 'V = a³', desc: 'Multiplicação das três dimensões: a · a · a.' },
            example: {
                scenario: 'Caixa d\'Água Cúbica com aresta a = 2 metros:',
                step1: 'Área de 1 parede: Ab = 2² = 4 m²',
                step2: 'Área Total (6 paredes): At = 6 · 4 = 24 m²',
                step3: 'Volume interno: V = 2³ = 2 · 2 · 2 = 8 m³ (8.000 Litros)'
            }
        },
        rectangular_prism: {
            title: 'Paralelepípedo Retângulo',
            icon: '🏢',
            baseArea: { formula: 'Ab = a · b', desc: 'Área do retângulo da base (comprimento · largura).' },
            lateralArea: { formula: 'Al = 2 · (a·c + b·c)', desc: 'Área das 4 paredes laterais.' },
            totalArea: { formula: 'At = 2 · (a·b + a·c + b·c)', desc: 'Soma dos 3 pares de faces retangulares opostas.' },
            volume: { formula: 'V = a · b · c', desc: 'Comprimento · Largura · Altura.' },
            example: {
                scenario: 'Contêiner de Carga com a = 6 m, b = 2.5 m, c = 2 m:',
                step1: 'Área do piso: Ab = 6 · 2.5 = 15 m²',
                step2: 'Área Total de chapas: At = 2 · (6·2.5 + 6·2 + 2.5·2) = 2 · (15 + 12 + 5) = 2 · 32 = 64 m²',
                step3: 'Volume de carga: V = 6 · 2.5 · 2 = 30 m³'
            }
        },
        cylinder: {
            title: 'Cilindro Circular Reto',
            icon: '🛢️',
            baseArea: { formula: 'Ab = π · r²', desc: 'Área de 1 círculo da base.' },
            lateralArea: { formula: 'Al = 2 · π · r · h', desc: 'A lateral aberta é um retângulo de largura 2πr e altura h.' },
            totalArea: { formula: 'At = 2 · Ab + Al = 2 · π · r · (h + r)', desc: 'Soma das 2 bases circulares + lateral curva.' },
            volume: { formula: 'V = Ab · h = π · r² · h', desc: 'Área da base circular multiplicada pela altura.' },
            example: {
                scenario: 'Silo de Grãos com raio r = 3 m e altura h = 8 m (adotando π ≈ 3.14):',
                step1: 'Área da base: Ab = 3.14 · 3² = 3.14 · 9 = 28.26 m²',
                step2: 'Área lateral: Al = 2 · 3.14 · 3 · 8 = 150.72 m²',
                step3: 'Área Total: At = 2 · (28.26) + 150.72 = 56.52 + 150.72 = 207.24 m²',
                step4: 'Volume: V = 28.26 · 8 = 226.08 m³'
            }
        },
        cone: {
            title: 'Cone Circular Reto',
            icon: '⚠️',
            baseArea: { formula: 'Ab = π · r²', desc: 'Área da base circular inferior.' },
            lateralArea: { formula: 'Al = π · r · g', desc: 'Onde g é a geratriz inclinada: g = √(r² + h²).' },
            totalArea: { formula: 'At = Ab + Al = π · r · (g + r)', desc: 'Base circular + lateral em leque.' },
            volume: { formula: 'V = (1/3) · π · r² · h', desc: 'O cone tem exatamente 1/3 do volume do cilindro com mesma base e altura!' },
            example: {
                scenario: 'Funil Industrial com raio r = 3 m e altura h = 4 m:',
                step1: 'Geratriz: g = √(3² + 4²) = √(9 + 16) = √25 = 5 m',
                step2: 'Área da base: Ab = 3.14 · 3² = 28.26 m²',
                step3: 'Área lateral: Al = 3.14 · 3 · 5 = 47.10 m²',
                step4: 'Área Total: At = 28.26 + 47.10 = 75.36 m²',
                step5: 'Volume: V = (1/3) · 28.26 · 4 = 37.68 m³'
            }
        },
        sphere: {
            title: 'Esfera',
            icon: '🌐',
            baseArea: { formula: 'Círculo Máximo = π · R²', desc: 'Área do corte central na linha do equador.' },
            lateralArea: { formula: 'Superfície Total = 4 · π · R²', desc: 'A superfície da esfera tem 4 vezes a área do seu círculo máximo!' },
            totalArea: { formula: 'At = 4 · π · R²', desc: 'Área de toda a casca esférica externa.' },
            volume: { formula: 'V = (4/3) · π · R³', desc: 'Fórmula clássica de Arquimedes.' },
            example: {
                scenario: 'Tanque Esférico de Gás com raio R = 3 metros:',
                step1: 'Área da casca: At = 4 · 3.14 · 3² = 4 · 3.14 · 9 = 113.04 m²',
                step2: 'Volume de gás: V = (4/3) · 3.14 · 3³ = (4/3) · 3.14 · 27 = 4 · 3.14 · 9 = 113.04 m³'
            }
        },
        square_pyramid: {
            title: 'Pirâmide Regular de Base Quadrada',
            icon: '🏛️',
            baseArea: { formula: 'Ab = L²', desc: 'Área do quadrado do chão.' },
            lateralArea: { formula: 'Al = 2 · L · ap', desc: 'Soma dos 4 triângulos (4 · (L · ap / 2)).' },
            totalArea: { formula: 'At = Ab + Al = L² + 2 · L · ap', desc: 'Base quadrada + 4 faces triangulares.' },
            volume: { formula: 'V = (1/3) · Ab · h = (1/3) · L² · h', desc: 'A pirâmide tem 1/3 do volume do prisma com mesma base e altura!' },
            example: {
                scenario: 'Telhado Piramidal com base L = 6 m e altura h = 4 m:',
                step1: 'Apótema da pirâmide: ap = √(4² + (6/2)²) = √(16 + 9) = √25 = 5 m',
                step2: 'Área da base: Ab = 6² = 36 m²',
                step3: 'Área lateral (4 telhados): Al = 2 · 6 · 5 = 60 m²',
                step4: 'Área Total: At = 36 + 60 = 96 m²',
                step5: 'Volume de ar: V = (1/3) · 36 · 4 = 48 m³'
            }
        }
    }
};

window.SUPPORT_GUIDE_DATA = SUPPORT_GUIDE_DATA;
