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
        this.cutHeight = h / 2;
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
        } else if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    update() {
        if (!this.active) return;
        this.sm.setClipping(true, this.cutHeight, this.cutAngleX, this.cutAngleZ);
        const sectionInfo = this.detectCrossSection();
        this.render2DPreview(sectionInfo);

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

        let shape = 'Círculo';
        let description = 'Seção transversal circular regular.';
        let estimatedArea = 0;
        let previewType = 'circle';

        switch (id) {
            case 'cube':
            case 'rectangular_prism': {
                const a = p.a || 4;
                const b = p.b || a;
                const c = p.c || a;

                if (angle < 4) {
                    shape = (a === b) ? 'Quadrado' : 'Retângulo';
                    estimatedArea = a * b;
                    description = `Corte paralelo à base resultando em um ${shape} de ${a}×${b} cm.`;
                    previewType = (a === b) ? 'square' : 'rect';
                } else if (angle >= 4 && angle < 40) {
                    shape = 'Retângulo Inclinado';
                    const f = 1 / Math.cos((angle * Math.PI) / 180);
                    estimatedArea = a * b * f;
                    description = `Corte inclinado interceptando 4 faces laterais.`;
                    previewType = 'rect';
                } else if (angle >= 40 && angle < 65) {
                    shape = 'Hexágono / Trapézio';
                    estimatedArea = a * b * 0.9;
                    description = 'Corte oblíquo atravessando as arestas dos cantos do poliedro.';
                    previewType = 'polygon';
                } else {
                    shape = 'Triângulo / Pentágono';
                    estimatedArea = (a * b) * 0.5;
                    description = 'Corte tangenciando vértices angulares.';
                    previewType = 'triangle';
                }
                break;
            }

            case 'cylinder': {
                const r = p.r || 2.5;
                const H = p.h || 5;
                if (angle < 3) {
                    shape = 'Círculo';
                    estimatedArea = Math.PI * r * r;
                    description = `Corte horizontal perpendicular ao eixo central (Raio = ${r.toFixed(1)} cm).`;
                    previewType = 'circle';
                } else if (angle >= 3 && angle < 60) {
                    shape = 'Elipse (Cônica)';
                    const semimajor = r / Math.cos((angle * Math.PI) / 180);
                    estimatedArea = Math.PI * r * semimajor;
                    description = `Corte oblíquo interceptando todas as geratrizes sem tocar as bases.`;
                    previewType = 'ellipse';
                } else {
                    shape = 'Retângulo / Segmento Retangular';
                    estimatedArea = (2 * r) * H;
                    description = 'Corte longitudinal paralelo ao eixo do cilindro.';
                    previewType = 'rect';
                }
                break;
            }

            case 'cone': {
                const r = p.r || 3;
                const H = p.h || 5;
                const rCut = Math.max(0.1, r * ((H - h) / H));

                if (angle < 3) {
                    shape = 'Círculo Menor';
                    estimatedArea = Math.PI * rCut * rCut;
                    description = `Corte paralelo à base circular na altura ${h.toFixed(1)} cm (Raio = ${rCut.toFixed(1)} cm).`;
                    previewType = 'circle';
                } else if (angle < 35) {
                    shape = 'Elipse Cônica';
                    estimatedArea = Math.PI * rCut * (rCut * 1.3);
                    description = 'Seção cônica elíptica fechada.';
                    previewType = 'ellipse';
                } else if (angle >= 35 && angle < 65) {
                    shape = 'Parábola';
                    estimatedArea = (4 / 3) * rCut * H * 0.4;
                    description = 'Corte paralelo à reta geratriz do cone, gerando uma parábola.';
                    previewType = 'parabola';
                } else {
                    shape = 'Hipérbole';
                    estimatedArea = rCut * H * 0.6;
                    description = 'Corte perpendicular à base interceptando a face lateral em hipérbole.';
                    previewType = 'hyperbola';
                }
                break;
            }

            case 'sphere': {
                const R = p.r || 3;
                const distCenter = Math.abs(h - R);
                if (distCenter >= R) {
                    shape = 'Ponto Tangente';
                    estimatedArea = 0;
                    description = 'O plano de corte tangencia a esfera na extremidade.';
                    previewType = 'point';
                } else {
                    const rSecao = Math.sqrt(R * R - distCenter * distCenter);
                    shape = (distCenter < 0.2) ? 'Círculo Máximo (Equador)' : 'Círculo Menor';
                    estimatedArea = Math.PI * rSecao * rSecao;
                    description = `Toda seção plana de uma esfera é sempre um círculo perfeito (Raio da seção: ${rSecao.toFixed(2)} cm).`;
                    previewType = 'circle';
                }
                break;
            }

            case 'square_pyramid': {
                const L = p.l || 4;
                const H = p.h || 5;
                const lCut = Math.max(0.1, L * ((H - h) / H));
                if (angle < 4) {
                    shape = 'Quadrado Menor';
                    estimatedArea = lCut * lCut;
                    description = `Corte paralelo à base quadrada (Lado = ${lCut.toFixed(2)} cm).`;
                    previewType = 'square';
                } else if (angle < 45) {
                    shape = 'Trapézio Isósceles';
                    estimatedArea = lCut * lCut * 1.2;
                    description = 'Corte oblíquo interceptando as faces laterais em trapézio.';
                    previewType = 'trapezoid';
                } else {
                    shape = 'Triângulo';
                    estimatedArea = (L * H) / 2;
                    description = 'Corte vertical passando pelo vértice da pirâmide.';
                    previewType = 'triangle';
                }
                break;
            }

            default: {
                shape = 'Polígono Convexo';
                estimatedArea = 12.5;
                description = 'Seção transversal plana poligonal.';
                previewType = 'polygon';
            }
        }

        return {
            shapeName: shape,
            estimatedArea: estimatedArea.toFixed(2) + ' cm²',
            description,
            previewType,
            cutHeight: h.toFixed(1) + ' cm',
            cutAngle: angle.toFixed(0) + '°'
        };
    }

    render2DPreview(info) {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        this.ctx.clearRect(0, 0, w, h);

        // Fundo com grade sutil de radar
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

        // Desenhar forma da seção 2D
        this.ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        this.ctx.strokeStyle = '#f43f5e';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        switch (info.previewType) {
            case 'circle':
                this.ctx.arc(cx, cy, 45, 0, Math.PI * 2);
                break;
            case 'ellipse':
                this.ctx.ellipse(cx, cy, 60, 35, 0, 0, Math.PI * 2);
                break;
            case 'square':
                this.ctx.rect(cx - 40, cy - 40, 80, 80);
                break;
            case 'rect':
                this.ctx.rect(cx - 55, cy - 35, 110, 70);
                break;
            case 'triangle':
                this.ctx.moveTo(cx, cy - 50);
                this.ctx.lineTo(cx + 45, cy + 40);
                this.ctx.lineTo(cx - 45, cy + 40);
                this.ctx.closePath();
                break;
            case 'trapezoid':
                this.ctx.moveTo(cx - 30, cy - 35);
                this.ctx.lineTo(cx + 30, cy - 35);
                this.ctx.lineTo(cx + 50, cy + 35);
                this.ctx.lineTo(cx - 50, cy + 35);
                this.ctx.closePath();
                break;
            case 'parabola':
            case 'hyperbola':
                this.ctx.moveTo(cx - 50, cy + 45);
                this.ctx.quadraticCurveTo(cx, cy - 60, cx + 50, cy + 45);
                this.ctx.lineTo(cx - 50, cy + 45);
                break;
            default:
                // Hexágono
                for (let i = 0; i < 6; i++) {
                    const ang = (i * Math.PI) / 3;
                    const px = cx + 45 * Math.cos(ang);
                    const py = cy + 45 * Math.sin(ang);
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
        }

        this.ctx.fill();
        this.ctx.stroke();

        // Rótulo da forma no canvas
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = 'bold 12px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(info.shapeName, cx, h - 10);
    }
}

window.CrossSectionAnalyzer = CrossSectionAnalyzer;
