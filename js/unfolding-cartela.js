// Cartela Interativa de Planificação: Decomposição e Composição da Área Total (BNCC)
class UnfoldingCartela {
    constructor(unfoldingSystem, sceneManager) {
        this.unfoldSys = unfoldingSystem;
        this.sm = sceneManager;
        this.selectedPieceIndex = null;
    }

    getPiecesData(solidId, params) {
        const p = params;
        const pieces = [];

        switch (solidId) {
            case 'cube': {
                const a = p.a || 3.0;
                const areaFace = a * a;
                const names = [
                    'Base Inferior (Chão)', 'Face Frontal', 'Face Traseira',
                    'Face Lateral Direita', 'Tampa Superior (Teto)', 'Face Lateral Esquerda'
                ];
                names.forEach((name, idx) => {
                    pieces.push({
                        id: 'piece_' + idx,
                        name,
                        shape: 'Quadrado',
                        formula: 'a²',
                        calcText: `${a.toFixed(2)} × ${a.toFixed(2)}`,
                        area: areaFace,
                        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][idx]
                    });
                });
                break;
            }

            case 'rectangular_prism': {
                const a = p.a || 4.0, b = p.b || 3.0, c = p.c || 5.0;
                pieces.push({ id: 'p0', name: 'Base Inferior', shape: 'Retângulo', formula: 'a · b', calcText: `${a} × ${b}`, area: a * b, color: '#3b82f6' });
                pieces.push({ id: 'p1', name: 'Face Frontal', shape: 'Retângulo', formula: 'a · c', calcText: `${a} × ${c}`, area: a * c, color: '#10b981' });
                pieces.push({ id: 'p2', name: 'Face Traseira', shape: 'Retângulo', formula: 'a · c', calcText: `${a} × ${c}`, area: a * c, color: '#f59e0b' });
                pieces.push({ id: 'p3', name: 'Face Direita', shape: 'Retângulo', formula: 'b · c', calcText: `${b} × ${c}`, area: b * c, color: '#ef4444' });
                pieces.push({ id: 'p4', name: 'Tampa Superior', shape: 'Retângulo', formula: 'a · b', calcText: `${a} × ${b}`, area: a * b, color: '#8b5cf6' });
                pieces.push({ id: 'p5', name: 'Face Esquerda', shape: 'Retângulo', formula: 'b · c', calcText: `${b} × ${c}`, area: b * c, color: '#06b6d4' });
                break;
            }

            case 'cylinder': {
                const r = p.r || 2.0, h = p.h || 5.0;
                const baseArea = Math.PI * r * r;
                const lateralArea = 2 * Math.PI * r * h;
                const circ = 2 * Math.PI * r;
                pieces.push({
                    id: 'cyl_bottom',
                    name: 'Base Circular Inferior',
                    shape: 'Círculo',
                    formula: 'π · r²',
                    calcText: `π · (${r.toFixed(2)})²`,
                    area: baseArea,
                    color: '#10b981'
                });
                pieces.push({
                    id: 'cyl_lateral',
                    name: 'Parede Lateral Desdobrada',
                    shape: 'Retângulo',
                    formula: '(2·π·r) · h',
                    calcText: `${circ.toFixed(2)} m (comprimento) × ${h.toFixed(2)} m (altura)`,
                    area: lateralArea,
                    color: '#3b82f6'
                });
                pieces.push({
                    id: 'cyl_top',
                    name: 'Tampa Circular Superior',
                    shape: 'Círculo',
                    formula: 'π · r²',
                    calcText: `π · (${r.toFixed(2)})²`,
                    area: baseArea,
                    color: '#f59e0b'
                });
                break;
            }

            case 'cone': {
                const r = p.r || 2.0, h = p.h || 4.0;
                const g = Math.sqrt(r * r + h * h);
                const baseArea = Math.PI * r * r;
                const lateralArea = Math.PI * r * g;
                const thetaDeg = (360 * r) / g;
                pieces.push({
                    id: 'cone_base',
                    name: 'Base Circular',
                    shape: 'Círculo',
                    formula: 'π · r²',
                    calcText: `π · (${r.toFixed(2)})²`,
                    area: baseArea,
                    color: '#3b82f6'
                });
                pieces.push({
                    id: 'cone_sector',
                    name: 'Superfície Lateral (Setor Circular)',
                    shape: 'Setor Circular',
                    formula: 'π · r · g',
                    calcText: `Raio = geratriz (${g.toFixed(2)} m) · Ângulo central = ${thetaDeg.toFixed(0)}°`,
                    area: lateralArea,
                    color: '#8b5cf6'
                });
                break;
            }

            case 'square_pyramid': {
                const l = p.l || 4.0, h = p.h || 5.0;
                const ap = Math.sqrt(h * h + (l / 2) * (l / 2));
                const baseArea = l * l;
                const triArea = (l * ap) / 2;

                pieces.push({
                    id: 'pyr_base',
                    name: 'Base Quadrada Central',
                    shape: 'Quadrado',
                    formula: 'L²',
                    calcText: `${l.toFixed(2)} × ${l.toFixed(2)}`,
                    area: baseArea,
                    color: '#3b82f6'
                });

                ['Face Triangular Norte', 'Face Triangular Sul', 'Face Triangular Leste', 'Face Triangular Oeste'].forEach((name, i) => {
                    pieces.push({
                        id: 'pyr_tri_' + i,
                        name,
                        shape: 'Triângulo Isósceles',
                        formula: '(L · ap) / 2',
                        calcText: `(${l.toFixed(2)} × ${ap.toFixed(2)}) / 2`,
                        area: triArea,
                        color: ['#10b981', '#f59e0b', '#ef4444', '#06b6d4'][i]
                    });
                });
                break;
            }

            default:
                break;
        }

        const totalArea = pieces.reduce((sum, p) => sum + p.area, 0);
        return { pieces, totalArea };
    }

    renderCartelaUI(containerElement, solidId, params, onHighlightPiece) {
        if (!containerElement) return;
        const data = this.getPiecesData(solidId, params);

        if (data.pieces.length === 0) {
            containerElement.innerHTML = `
                <div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:12px;">
                    Cartela de planificação disponível para Prismas, Cilindro, Cone e Pirâmide.
                </div>
            `;
            return;
        }

        containerElement.innerHTML = `
            <div class="cartela-container">
                <div class="cartela-header">
                    <span style="font-weight:700; color:#fff; font-size:0.85rem;">📋 Cartela de Montagem & Pedaços</span>
                    <span class="cartela-pieces-count">${data.pieces.length} Peças Planas</span>
                </div>

                <div class="cartela-pieces-list">
                    ${data.pieces.map((p, idx) => `
                        <div class="cartela-piece-card" data-idx="${idx}" style="border-left: 3px solid ${p.color};">
                            <div class="piece-header">
                                <span class="piece-name" style="color:#fff; font-weight:600;">${p.name}</span>
                                <span class="piece-shape-badge">${p.shape}</span>
                            </div>
                            <div class="piece-formula-row">
                                <span style="font-family:'JetBrains Mono'; color:var(--accent-cyan); font-size:0.75rem;">${p.formula} = ${p.calcText}</span>
                                <span class="piece-area-val">${p.area.toFixed(2)} m²</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- SOMA TOTALIZADORA DA ÁREA -->
                <div class="cartela-total-card">
                    <div style="display:flex; justify-content:space-between; align-items:baseline;">
                        <span style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">
                            Soma das ${data.pieces.length} Peças (Área Total At):
                        </span>
                        <span style="font-family:'JetBrains Mono'; font-size:1.15rem; font-weight:800; color:var(--accent-amber);">
                            ${data.totalArea.toFixed(2)} m²
                        </span>
                    </div>
                    <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:4px;">
                        ${data.pieces.map(p => p.area.toFixed(1)).join(' + ')} = <b>${data.totalArea.toFixed(2)} m²</b>
                    </div>
                </div>
            </div>
        `;

        containerElement.querySelectorAll('.cartela-piece-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.dataset.idx);
                containerElement.querySelectorAll('.cartela-piece-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                if (typeof onHighlightPiece === 'function') {
                    onHighlightPiece(idx);
                }
                if (window.sounds) window.sounds.playClick();
            });
        });
    }
}

window.UnfoldingCartela = UnfoldingCartela;
