// Analisador e Fatiador de Seções Transversais 2D/3D (Cross-Sections)
class CrossSectionAnalyzer {
    constructor(sceneManager, canvas2DId) {
        this.sm = sceneManager;
        this.canvas = document.getElementById(canvas2DId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.active = false;
        this.cutHeight = 2.5;
        this.cutAngleX = 0; // graus
        this.cutAngleZ = 0; // graus
        this.currentSolidId = 'cube';
        this.currentParams = {};
    }

    setSolid(solidId, params) {
        this.currentSolidId = solidId;
        this.currentParams = { ...params };
        const solidDef = SOLIDS_DATA[solidId];
        const h = solidDef ? solidDef.height(params) : 5;
        this.cutHeight = Math.min(this.cutHeight, h);
        if (this.cutHeight <= 0) this.cutHeight = h / 2;
        this.update();
    }

    setCut(height, angleX, angleZ) {
        this.cutHeight = height;
        this.cutAngleX = angleX;
        this.cutAngleZ = angleZ;
        this.update();
    }

    setActive(active) {
        this.active = active;
        this.sm.setClipping(active, this.cutHeight, this.cutAngleX, this.cutAngleZ);
        if (active) {
            this.update();
        } else {
            if (this.ctx && this.canvas) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            if (window.dimensionsHelper && typeof window.dimensionsHelper.update === 'function') {
                window.dimensionsHelper.update(this.currentSolidId, this.currentParams);
            }
        }
    }

    update() {
        if (!this.active) return;
        this.sm.setClipping(true, this.cutHeight, this.cutAngleX, this.cutAngleZ);
        const sectionInfo = this.detectCrossSection();
        this.render2DPreview(sectionInfo);

        // Atualiza as cotas 3D no modelo cortado
        if (window.dimensionsHelper && typeof window.dimensionsHelper.updateCutDimensions === 'function') {
            window.dimensionsHelper.updateCutDimensions(
                this.currentSolidId,
                this.currentParams,
                this.cutHeight,
                sectionInfo
            );
        }

        if (typeof window.onCrossSectionChange === 'function') {
            window.onCrossSectionChange(sectionInfo);
        }
    }

    detectCrossSection() {
        const id = this.currentSolidId;
        const p = this.currentParams;
        const h = this.cutHeight;
        const ax = Math.abs(this.cutAngleX);
        const az = Math.abs(this.cutAngleZ);
        const angle = Math.sqrt(ax * ax + az * az);

        const solidDef = SOLIDS_DATA[id];
        const totalHeight = solidDef ? solidDef.height(p) : 5;
        const clampedH = Math.max(0, Math.min(totalHeight, h));

        let shape = 'Círculo';
        let description = 'Seção transversal circular regular.';
        let estimatedArea = 0;
        let sliceDimensions = '';
        let previewType = 'circle';
        let remainingVolume = 0;
        let totalVolume = solidDef ? solidDef.calculate(p).volume : 10;

        switch (id) {
            case 'cube':
            case 'rectangular_prism': {
                const a = p.a || 4;
                const b = p.b || a;
                const c = p.c || a;

                if (angle < 4) {
                    shape = (a === b) ? 'Quadrado' : 'Retângulo';
                    estimatedArea = a * b;
                    sliceDimensions = `Largura: ${a.toFixed(2)} m × Comprimento: ${b.toFixed(2)} m`;
                    description = `Corte horizontal paralelo à base gerando um ${shape} de ${a.toFixed(2)}×${b.toFixed(2)} m.`;
                    previewType = (a === b) ? 'square' : 'rect';
                    remainingVolume = a * b * clampedH;
                } else {
                    shape = 'Retângulo Inclinado';
                    const f = 1 / Math.cos((angle * Math.PI) / 180);
                    estimatedArea = a * b * f;
                    sliceDimensions = `Seção inclinada a ${angle.toFixed(0)}°`;
                    description = `Corte oblíquo interceptando as 4 faces laterais.`;
                    previewType = 'rect';
                    remainingVolume = a * b * clampedH;
                }
                break;
            }

            case 'cylinder': {
                const r = p.r || 2.5;
                const H = p.h || 5;
                if (angle < 3) {
                    shape = 'Círculo Perfeito';
                    estimatedArea = Math.PI * r * r;
                    sliceDimensions = `Raio: ${r.toFixed(2)} m (Diâmetro: ${(2 * r).toFixed(2)} m)`;
                    description = `Corte horizontal perpendicular ao eixo do cilindro. A seção tem as mesmas dimensões da base.`;
                    previewType = 'circle';
                    remainingVolume = Math.PI * r * r * clampedH;
                } else {
                    shape = 'Elipse';
                    const semimajor = r / Math.cos((angle * Math.PI) / 180);
                    estimatedArea = Math.PI * r * semimajor;
                    sliceDimensions = `Eixo Menor: ${(2 * r).toFixed(2)} m · Eixo Maior: ${(2 * semimajor).toFixed(2)} m`;
                    description = `Corte oblíquo interceptando as paredes cilíndricas em uma elipse cônica.`;
                    previewType = 'ellipse';
                    remainingVolume = Math.PI * r * r * clampedH;
                }
                break;
            }

            case 'cone': {
                const r = p.r || 3;
                const H = p.h || 5;
                // Raio da seção transversal na altura h (semelhança de triângulos)
                const rCut = Math.max(0.01, r * ((H - clampedH) / H));

                if (angle < 3) {
                    shape = 'Círculo Menor';
                    estimatedArea = Math.PI * rCut * rCut;
                    sliceDimensions = `Raio da fatia: ${rCut.toFixed(2)} m (Diâmetro: ${(2 * rCut).toFixed(2)} m)`;
                    description = `Corte paralelo à base a ${clampedH.toFixed(2)} m de altura. Por semelhança, o raio reduz para ${rCut.toFixed(2)} m.`;
                    previewType = 'circle';
                    // Volume do tronco de cone inferior
                    remainingVolume = (Math.PI * clampedH / 3) * (r * r + r * rCut + rCut * rCut);
                } else {
                    shape = 'Elipse / Parábola';
                    estimatedArea = Math.PI * rCut * (rCut * 1.3);
                    sliceDimensions = `Corte Cônico Inclinado a ${angle.toFixed(0)}°`;
                    description = 'Corte oblíquo das geratrizes do cone.';
                    previewType = 'ellipse';
                    remainingVolume = totalVolume * (clampedH / H);
                }
                break;
            }

            case 'sphere': {
                const R = p.r || 3;
                const distCenter = Math.abs(clampedH - R);
                if (distCenter >= R) {
                    shape = 'Ponto Tangente';
                    estimatedArea = 0;
                    sliceDimensions = 'Raio = 0 (Tangente)';
                    description = 'O plano toca a esfera no polo sem fatiá-la.';
                    previewType = 'point';
                    remainingVolume = clampedH <= R ? 0 : totalVolume;
                } else {
                    const rSecao = Math.sqrt(R * R - distCenter * distCenter);
                    shape = (distCenter < 0.15) ? 'Círculo Máximo (Equador)' : 'Círculo Menor';
                    estimatedArea = Math.PI * rSecao * rSecao;
                    sliceDimensions = `Raio da seção: ${rSecao.toFixed(2)} m (Diâmetro: ${(2 * rSecao).toFixed(2)} m)`;
                    description = `Corte a ${clampedH.toFixed(2)} m. A seção é um círculo interno de raio r = √(R² - d²) = ${rSecao.toFixed(2)} m.`;
                    previewType = 'circle';
                    // Volume da calota esférica inferior
                    remainingVolume = (Math.PI * clampedH * clampedH / 3) * (3 * R - clampedH);
                }
                break;
            }

            case 'square_pyramid': {
                const L = p.l || 4;
                const H = p.h || 5;
                // Lado da seção quadrada na altura h
                const lCut = Math.max(0.01, L * ((H - clampedH) / H));

                if (angle < 4) {
                    shape = 'Quadrado Menor';
                    estimatedArea = lCut * lCut;
                    sliceDimensions = `Lado da fatia: ${lCut.toFixed(2)} m × ${lCut.toFixed(2)} m`;
                    description = `Corte paralelo à base a ${clampedH.toFixed(2)} m. O lado do quadrado reduz para ${lCut.toFixed(2)} m.`;
                    previewType = 'square';
                    // Volume do tronco de pirâmide
                    remainingVolume = (clampedH / 3) * (L * L + L * lCut + lCut * lCut);
                } else {
                    shape = 'Trapézio / Polígono';
                    estimatedArea = lCut * lCut * 1.1;
                    sliceDimensions = `Corte Inclinado a ${angle.toFixed(0)}°`;
                    description = 'Corte oblíquo atravessando as faces triangulares da pirâmide.';
                    previewType = 'trapezoid';
                    remainingVolume = totalVolume * (clampedH / H);
                }
                break;
            }

            default: {
                shape = 'Polígono Convexo';
                estimatedArea = 4.5;
                sliceDimensions = `Altura: ${clampedH.toFixed(2)} m`;
                description = 'Seção transversal do prisma.';
                previewType = 'polygon';
                remainingVolume = totalVolume * (clampedH / totalHeight);
            }
        }

        const remainingH = clampedH;
        const removedH = Math.max(0, totalHeight - clampedH);
        const removedVolume = Math.max(0, totalVolume - remainingVolume);

        return {
            shapeName: shape,
            estimatedArea: estimatedArea.toFixed(2) + ' m²',
            sliceDimensions,
            description,
            previewType,
            cutHeightVal: clampedH,
            totalHeight: totalHeight.toFixed(2) + ' m',
            remainingHeight: remainingH.toFixed(2) + ' m',
            removedHeight: removedH.toFixed(2) + ' m',
            remainingVolume: `${remainingVolume.toFixed(2)} m³ (${(remainingVolume * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L)`,
            removedVolume: `${removedVolume.toFixed(2)} m³ (${(removedVolume * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L)`,
            equivalenceNote: '1 m³ = 1.000 Litros'
        };
    }

    render2DPreview(info) {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        this.ctx.clearRect(0, 0, w, h);

        // Grade sutil de radar técnico
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        // Círculos concêntricos de radar
        this.ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
        [25, 45, 65].forEach(r => {
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.stroke();
        });

        // Desenha a forma geométrica da fatia
        this.ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        this.ctx.strokeStyle = '#f43f5e';
        this.ctx.lineWidth = 3;

        switch (info.previewType) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, 40, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'ellipse':
                this.ctx.beginPath();
                this.ctx.ellipse(cx, cy, 55, 32, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'square':
                this.ctx.beginPath();
                this.ctx.rect(cx - 36, cy - 36, 72, 72);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'rect':
                this.ctx.beginPath();
                this.ctx.rect(cx - 50, cy - 30, 100, 60);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'trapezoid':
                this.ctx.beginPath();
                this.ctx.moveTo(cx - 25, cy - 30);
                this.ctx.lineTo(cx + 25, cy - 30);
                this.ctx.lineTo(cx + 45, cy + 30);
                this.ctx.lineTo(cx - 45, cy + 30);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;

            default:
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, 35, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;
        }

        // Centro marcado com cruz ciano
        this.ctx.strokeStyle = '#00f2fe';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 6, cy);
        this.ctx.lineTo(cx + 6, cy);
        this.ctx.moveTo(cx, cy - 6);
        this.ctx.lineTo(cx, cy + 6);
        this.ctx.stroke();
    }
}

window.CrossSectionAnalyzer = CrossSectionAnalyzer;
