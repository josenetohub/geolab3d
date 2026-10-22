// Catálogo de Geometria Espacial: Aplicações no Cotidiano, Engenharia e Arquitetura
const SOLIDS_DATA = {
    cube: {
        id: 'cube',
        name: 'Cubo (Hexaedro Regular)',
        category: 'Prisma Reto',
        realWorldApplication: 'Caixa d\'Água Residencial / Módulo de Armazenamento Cúbico',
        description: 'Usado na construção civil em caixas d\'água de polietileno, blocos de concreto e caixas de embalagens padronizadas.',
        defaultParams: { a: 2 },
        paramDefs: [
            { key: 'a', label: 'Aresta da Caixa (a)', min: 1, max: 6, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: true,
            verticesCount: 8,
            edgesCount: 12,
            facesCount: 6,
            faceTypes: '6 quadrados congruentes',
            vertexTypes: 'Triédricos (3 arestas por vértice)',
            euler: { v: 8, a: 12, f: 6, valid: true }
        },
        calculate: (p) => {
            const a = p.a;
            const ab = a * a;
            const al = 4 * a * a;
            const at = 6 * a * a;
            const v = Math.pow(a, 3);
            const dFace = a * Math.SQRT2;
            const dSolido = a * Math.sqrt(3);
            return {
                baseArea: ab,
                lateralArea: al,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000, // 1 m³ = 1000 L
                extraMeasures: [
                    { label: 'Diagonal da Parede', value: dFace.toFixed(2) + ' m', formula: 'd = a · √2' },
                    { label: 'Diagonal Interna Maior', value: dSolido.toFixed(2) + ' m', formula: 'D = a · √3' }
                ],
                formulas: {
                    baseArea: 'A<sub>b</sub> = a²',
                    lateralArea: 'A<sub>l</sub> = 4 · a²',
                    totalArea: 'A<sub>t</sub> = 6 · a²',
                    volume: 'V = a³'
                },
                stepByStep: {
                    baseArea: `A<sub>b</sub> = ${a}² = ${ab.toFixed(2)} m²`,
                    lateralArea: `A<sub>l</sub> = 4 · (${a}²) = 4 · ${(a*a).toFixed(2)} = ${al.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = 6 · (${a}²) = 6 · ${(a*a).toFixed(2)} = ${at.toFixed(2)} m²`,
                    volume: `V = ${a}³ = ${v.toFixed(2)} m³ (${(v * 1000).toLocaleString('pt-BR')} Litros de capacidade)`
                }
            };
        },
        liquidVolumeAtHeight: (p, h) => {
            const a = p.a;
            const clampedH = Math.max(0, Math.min(a, h));
            return clampedH * a * a;
        },
        height: (p) => p.a
    },

    rectangular_prism: {
        id: 'rectangular_prism',
        name: 'Paralelepípedo Retângulo',
        category: 'Prisma Reto',
        realWorldApplication: 'Contêiner Marítimo ISO / Galpão Logístico / Edifício Residencial',
        description: 'Padrão da logística global em contêineres de transporte, tijolos de alvenaria e edifícios habitacionais.',
        defaultParams: { a: 6, b: 2.5, c: 2.6 },
        paramDefs: [
            { key: 'a', label: 'Comprimento (a)', min: 2, max: 12, step: 0.5, unit: 'm' },
            { key: 'b', label: 'Largura (b)', min: 1, max: 6, step: 0.5, unit: 'm' },
            { key: 'c', label: 'Altura (c)', min: 1, max: 6, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: true,
            verticesCount: 8,
            edgesCount: 12,
            facesCount: 6,
            faceTypes: '6 retângulos congruentes 2 a 2',
            vertexTypes: 'Triédricos (3 arestas por vértice)',
            euler: { v: 8, a: 12, f: 6, valid: true }
        },
        calculate: (p) => {
            const { a, b, c } = p;
            const ab = a * b;
            const al = 2 * (a * c + b * c);
            const at = 2 * (a * b + a * c + b * c);
            const v = a * b * c;
            const dSolido = Math.sqrt(a * a + b * b + c * c);
            return {
                baseArea: ab,
                lateralArea: al,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000,
                extraMeasures: [
                    { label: 'Diagonal do Contêiner', value: dSolido.toFixed(2) + ' m', formula: 'D = √(a² + b² + c²)' }
                ],
                formulas: {
                    baseArea: 'A<sub>b</sub> = a · b',
                    lateralArea: 'A<sub>l</sub> = 2 · (a·c + b·c)',
                    totalArea: 'A<sub>t</sub> = 2 · (a·b + a·c + b·c)',
                    volume: 'V = a · b · c'
                },
                stepByStep: {
                    baseArea: `A<sub>b</sub> = ${a} · ${b} = ${ab.toFixed(2)} m²`,
                    lateralArea: `A<sub>l</sub> = 2 · (${a}·${c} + ${b}·${c}) = ${al.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = 2 · (${(a*b).toFixed(1)} + ${(a*c).toFixed(1)} + ${(b*c).toFixed(1)}) = ${at.toFixed(2)} m²`,
                    volume: `V = ${a} · ${b} · ${c} = ${v.toFixed(2)} m³`
                }
            };
        },
        liquidVolumeAtHeight: (p, h) => {
            const clampedH = Math.max(0, Math.min(p.c, h));
            return p.a * p.b * clampedH;
        },
        height: (p) => p.c
    },

    cylinder: {
        id: 'cylinder',
        name: 'Cilindro Circular Reto',
        category: 'Corpo Redondo',
        realWorldApplication: 'Silo de Grãos Agrícola / Tanque de Combustível / Pilares de Pontes',
        description: 'Usado para estocar grãos no agronegócio, tambores industriais de derivados de petróleo e colunas estruturais.',
        defaultParams: { r: 3, h: 7 },
        paramDefs: [
            { key: 'r', label: 'Raio do Silo (r)', min: 1, max: 6, step: 0.5, unit: 'm' },
            { key: 'h', label: 'Altura (h)', min: 2, max: 12, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: false,
            verticesCount: 0,
            edgesCount: 2,
            facesCount: 3,
            faceTypes: '2 bases circulares planas e 1 lateral curva',
            vertexTypes: 'Não possui vértices pontuais',
            euler: { v: 0, a: 2, f: 3, valid: false, note: 'Não se aplica a corpos redondos' }
        },
        calculate: (p) => {
            const { r, h } = p;
            const ab = Math.PI * r * r;
            const al = 2 * Math.PI * r * h;
            const at = 2 * ab + al;
            const v = ab * h;
            const perim = 2 * Math.PI * r;
            return {
                baseArea: ab,
                lateralArea: al,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000,
                extraMeasures: [
                    { label: 'Circunferência do Silo', value: perim.toFixed(2) + ' m', formula: 'C = 2 · π · r' },
                    { label: 'Diâmetro da Base', value: (2 * r).toFixed(2) + ' m', formula: 'D = 2 · r' }
                ],
                formulas: {
                    baseArea: 'A<sub>b</sub> = π · r²',
                    lateralArea: 'A<sub>l</sub> = 2 · π · r · h',
                    totalArea: 'A<sub>t</sub> = 2 · A<sub>b</sub> + A<sub>l</sub> = 2 · π · r · (h + r)',
                    volume: 'V = π · r² · h'
                },
                stepByStep: {
                    baseArea: `A<sub>b</sub> = π · ${r}² = ${ab.toFixed(2)} m²`,
                    lateralArea: `A<sub>l</sub> = 2 · π · ${r} · ${h} = ${al.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = 2 · (${ab.toFixed(2)}) + ${al.toFixed(2)} = ${at.toFixed(2)} m²`,
                    volume: `V = (${ab.toFixed(2)}) · ${h} = ${v.toFixed(2)} m³`
                }
            };
        },
        liquidVolumeAtHeight: (p, h) => {
            const clampedH = Math.max(0, Math.min(p.h, h));
            return Math.PI * p.r * p.r * clampedH;
        },
        height: (p) => p.h
    },

    cone: {
        id: 'cone',
        name: 'Cone Circular Reto',
        category: 'Corpo Redondo',
        realWorldApplication: 'Funil Industrial / Cone de Trânsito Rodoviário / Casquinha de Sorvete',
        description: 'Presente na sinalização viária, em tremonhas de alimentação de grãos em indústrias e em casquinhas alimentícias.',
        defaultParams: { r: 2, h: 4 },
        paramDefs: [
            { key: 'r', label: 'Raio da Base (r)', min: 0.5, max: 5, step: 0.25, unit: 'm' },
            { key: 'h', label: 'Altura (h)', min: 1, max: 8, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: false,
            verticesCount: 1,
            edgesCount: 1,
            facesCount: 2,
            faceTypes: '1 círculo plano e 1 superfície lateral cônica',
            vertexTypes: '1 Ápice superior',
            euler: { v: 1, a: 1, f: 2, valid: false, note: 'Não é poliedro' }
        },
        calculate: (p) => {
            const { r, h } = p;
            const g = Math.sqrt(r * r + h * h);
            const ab = Math.PI * r * r;
            const al = Math.PI * r * g;
            const at = ab + al;
            const v = (1 / 3) * ab * h;
            return {
                baseArea: ab,
                lateralArea: al,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000,
                extraMeasures: [
                    { label: 'Geratriz Lateral (g)', value: g.toFixed(2) + ' m', formula: 'g = √(r² + h²)' },
                    { label: 'Setor de Planificação', value: ((360 * r) / g).toFixed(1) + '°', formula: 'θ = (r / g) · 360°' }
                ],
                formulas: {
                    baseArea: 'A<sub>b</sub> = π · r²',
                    lateralArea: 'A<sub>l</sub> = π · r · g',
                    totalArea: 'A<sub>t</sub> = π · r · (g + r)',
                    volume: 'V = (1/3) · π · r² · h'
                },
                stepByStep: {
                    baseArea: `A<sub>b</sub> = π · ${r}² = ${ab.toFixed(2)} m²`,
                    lateralArea: `A<sub>l</sub> = π · ${r} · ${g.toFixed(2)} = ${al.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = ${ab.toFixed(2)} + ${al.toFixed(2)} = ${at.toFixed(2)} m²`,
                    volume: `V = (1/3) · (${ab.toFixed(2)}) · ${h} = ${v.toFixed(2)} m³`
                }
            };
        },
        liquidVolumeAtHeight: (p, y) => {
            const { r, h } = p;
            const clampedY = Math.max(0, Math.min(h, y));
            const totalVol = (1 / 3) * Math.PI * r * r * h;
            const ratio = (h - clampedY) / h;
            return totalVol * (1 - Math.pow(ratio, 3));
        },
        height: (p) => p.h
    },

    sphere: {
        id: 'sphere',
        name: 'Esfera',
        category: 'Corpo Redondo',
        realWorldApplication: 'Tanque Esférico de Gás (Tanque Horton da Petrobras) / Caixa d\'Água Esférica',
        description: 'Usada em refinarias petroquímicas e indústrias químicas porque a esfera suporta pressão interna uniforme gastando a menor quantidade de aço por volume.',
        defaultParams: { r: 3 },
        paramDefs: [
            { key: 'r', label: 'Raio do Tanque (R)', min: 1, max: 6, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: false,
            verticesCount: 0,
            edgesCount: 0,
            facesCount: 1,
            faceTypes: '1 superfície esférica contínua',
            vertexTypes: 'Nenhum vértice',
            euler: { v: 0, a: 0, f: 1, valid: false, note: 'Superfície contínua' }
        },
        calculate: (p) => {
            const r = p.r;
            const at = 4 * Math.PI * r * r;
            const v = (4 / 3) * Math.PI * Math.pow(r, 3);
            const secaoMaxima = Math.PI * r * r;
            return {
                baseArea: secaoMaxima,
                lateralArea: at,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000,
                extraMeasures: [
                    { label: 'Círculo Máximo (Equador)', value: secaoMaxima.toFixed(2) + ' m²', formula: 'A = π · R²' },
                    { label: 'Diâmetro do Tanque', value: (2 * r).toFixed(2) + ' m', formula: 'D = 2 · R' }
                ],
                formulas: {
                    baseArea: 'A<sub>círculo</sub> = π · R²',
                    lateralArea: 'A<sub>superfície</sub> = 4 · π · R²',
                    totalArea: 'A<sub>t</sub> = 4 · π · R²',
                    volume: 'V = (4/3) · π · R³'
                },
                stepByStep: {
                    baseArea: `A<sub>círculo</sub> = π · ${r}² = ${secaoMaxima.toFixed(2)} m²`,
                    lateralArea: `A<sub>t</sub> = 4 · π · ${r}² = ${at.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = 4 · π · ${r}² = ${at.toFixed(2)} m²`,
                    volume: `V = (4/3) · π · (${r}³) = ${v.toFixed(2)} m³`
                }
            };
        },
        liquidVolumeAtHeight: (p, y) => {
            const r = p.r;
            const clampedY = Math.max(0, Math.min(2 * r, y));
            return (Math.PI * clampedY * clampedY * (3 * r - clampedY)) / 3;
        },
        height: (p) => 2 * p.r
    },

    square_pyramid: {
        id: 'square_pyramid',
        name: 'Pirâmide Regular de Base Quadrada',
        category: 'Pirâmide',
        realWorldApplication: 'Telhado de Galpão / Pirâmide do Museu do Louvre / Monumento',
        description: 'Usada em coberturas arquitetônicas de vidro como a do Museu do Louvre em Paris e em telhados de 4 águas na construção civil.',
        defaultParams: { l: 6, h: 4 },
        paramDefs: [
            { key: 'l', label: 'Lado da Base (L)', min: 2, max: 10, step: 0.5, unit: 'm' },
            { key: 'h', label: 'Altura do Telhado (h)', min: 1, max: 8, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: true,
            verticesCount: 5,
            edgesCount: 8,
            facesCount: 5,
            faceTypes: '1 quadrado e 4 triângulos isósceles',
            vertexTypes: '4 na base (3 arestas) e 1 no topo (4 arestas)',
            euler: { v: 5, a: 8, f: 5, valid: true }
        },
        calculate: (p) => {
            const { l, h } = p;
            const apBase = l / 2;
            const apPiramide = Math.sqrt(h * h + apBase * apBase);
            const ab = l * l;
            const al = 4 * ((l * apPiramide) / 2);
            const at = ab + al;
            const v = (1 / 3) * ab * h;
            return {
                baseArea: ab,
                lateralArea: al,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000,
                extraMeasures: [
                    { label: 'Apótema da Pirâmide', value: apPiramide.toFixed(2) + ' m', formula: 'a<sub>p</sub> = √(h² + (L/2)²)' },
                    { label: 'Apótema da Base', value: apBase.toFixed(2) + ' m', formula: 'a<sub>b</sub> = L / 2' }
                ],
                formulas: {
                    baseArea: 'A<sub>b</sub> = L²',
                    lateralArea: 'A<sub>l</sub> = 2 · L · a<sub>p</sub>',
                    totalArea: 'A<sub>t</sub> = A<sub>b</sub> + A<sub>l</sub> = L² + 2 · L · a<sub>p</sub>',
                    volume: 'V = (1/3) · L² · h'
                },
                stepByStep: {
                    baseArea: `A<sub>b</sub> = ${l}² = ${ab.toFixed(2)} m²`,
                    lateralArea: `A<sub>l</sub> = 2 · ${l} · ${apPiramide.toFixed(2)} = ${al.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = ${ab.toFixed(2)} + ${al.toFixed(2)} = ${at.toFixed(2)} m²`,
                    volume: `V = (1/3) · (${ab.toFixed(2)}) · ${h} = ${v.toFixed(2)} m³`
                }
            };
        },
        liquidVolumeAtHeight: (p, y) => {
            const { l, h } = p;
            const clampedY = Math.max(0, Math.min(h, y));
            const totalVol = (1 / 3) * l * l * h;
            const ratio = (h - clampedY) / h;
            return totalVol * (1 - Math.pow(ratio, 3));
        },
        height: (p) => p.h
    },

    triangular_prism: {
        id: 'triangular_prism',
        name: 'Prisma Triangular Regular',
        category: 'Prisma Reto',
        realWorldApplication: 'Tenda de Acampamento / Telhado de Duas Águas / Rampa de Acessibilidade',
        description: 'Arquitetura clássica de telhados residenciais de duas águas, barracas de acampamento em formato delta e rampas de acesso.',
        defaultParams: { l: 3, h: 5 },
        paramDefs: [
            { key: 'l', label: 'Largura da Base (L)', min: 1.5, max: 6, step: 0.5, unit: 'm' },
            { key: 'h', label: 'Comprimento (h)', min: 2, max: 10, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: true,
            verticesCount: 6,
            edgesCount: 9,
            facesCount: 5,
            faceTypes: '2 triângulos equiláteros e 3 retângulos',
            vertexTypes: 'Triédricos (3 arestas por vértice)',
            euler: { v: 6, a: 9, f: 5, valid: true }
        },
        calculate: (p) => {
            const { l, h } = p;
            const ab = (l * l * Math.sqrt(3)) / 4;
            const al = 3 * l * h;
            const at = 2 * ab + al;
            const v = ab * h;
            return {
                baseArea: ab,
                lateralArea: al,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000,
                extraMeasures: [
                    { label: 'Altura do Triângulo', value: ((l * Math.sqrt(3)) / 2).toFixed(2) + ' m', formula: 'h<sub>t</sub> = (L·√3) / 2' }
                ],
                formulas: {
                    baseArea: 'A<sub>b</sub> = (L² · √3) / 4',
                    lateralArea: 'A<sub>l</sub> = 3 · L · h',
                    totalArea: 'A<sub>t</sub> = 2 · A<sub>b</sub> + A<sub>l</sub>',
                    volume: 'V = A<sub>b</sub> · h'
                },
                stepByStep: {
                    baseArea: `A<sub>b</sub> = (${l}² · √3) / 4 = ${ab.toFixed(2)} m²`,
                    lateralArea: `A<sub>l</sub> = 3 · ${l} · ${h} = ${al.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = 2 · (${ab.toFixed(2)}) + ${al.toFixed(2)} = ${at.toFixed(2)} m²`,
                    volume: `V = (${ab.toFixed(2)}) · ${h} = ${v.toFixed(2)} m³`
                }
            };
        },
        liquidVolumeAtHeight: (p, y) => {
            const { l, h } = p;
            const clampedY = Math.max(0, Math.min(h, y));
            const ab = (l * l * Math.sqrt(3)) / 4;
            return ab * clampedY;
        },
        height: (p) => p.h
    },

    hexagonal_prism: {
        id: 'hexagonal_prism',
        name: 'Prisma Hexagonal Regular',
        category: 'Prisma Reto',
        realWorldApplication: 'Colmeia de Abelhas (Biomimética) / Porca e Parafuso / Pavimento de Calçadas',
        description: 'Usado na engenharia de fixação (porcas sextavadas) e em pisos ecológicos intertravados devido à eficiência de encaixe contínuo.',
        defaultParams: { l: 2, h: 4 },
        paramDefs: [
            { key: 'l', label: 'Lado da Base (L)', min: 1, max: 4, step: 0.25, unit: 'm' },
            { key: 'h', label: 'Altura da Peça (h)', min: 1, max: 8, step: 0.5, unit: 'm' }
        ],
        elements: {
            isPolyhedron: true,
            verticesCount: 12,
            edgesCount: 18,
            facesCount: 8,
            faceTypes: '2 hexágonos regulares e 6 retângulos',
            vertexTypes: 'Triédricos (3 arestas por vértice)',
            euler: { v: 12, a: 18, f: 8, valid: true }
        },
        calculate: (p) => {
            const { l, h } = p;
            const ab = 6 * ((l * l * Math.sqrt(3)) / 4);
            const al = 6 * l * h;
            const at = 2 * ab + al;
            const v = ab * h;
            return {
                baseArea: ab,
                lateralArea: al,
                totalArea: at,
                volume: v,
                volumeLiters: v * 1000,
                extraMeasures: [
                    { label: 'Apótema da Base', value: ((l * Math.sqrt(3)) / 2).toFixed(2) + ' m', formula: 'a<sub>p</sub> = (L·√3) / 2' }
                ],
                formulas: {
                    baseArea: 'A<sub>b</sub> = (3 · √3 · L²) / 2',
                    lateralArea: 'A<sub>l</sub> = 6 · L · h',
                    totalArea: 'A<sub>t</sub> = 2 · A<sub>b</sub> + A<sub>l</sub>',
                    volume: 'V = A<sub>b</sub> · h'
                },
                stepByStep: {
                    baseArea: `A<sub>b</sub> = 6 · [(${l}² · √3) / 4] = ${ab.toFixed(2)} m²`,
                    lateralArea: `A<sub>l</sub> = 6 · ${l} · ${h} = ${al.toFixed(2)} m²`,
                    totalArea: `A<sub>t</sub> = 2 · (${ab.toFixed(2)}) + ${al.toFixed(2)} = ${at.toFixed(2)} m²`,
                    volume: `V = (${ab.toFixed(2)}) · ${h} = ${v.toFixed(2)} m³`
                }
            };
        },
        liquidVolumeAtHeight: (p, y) => {
            const { l, h } = p;
            const clampedY = Math.max(0, Math.min(h, y));
            const ab = 6 * ((l * l * Math.sqrt(3)) / 4);
            return ab * clampedY;
        },
        height: (p) => p.h
    }
};

window.SOLIDS_DATA = SOLIDS_DATA;
