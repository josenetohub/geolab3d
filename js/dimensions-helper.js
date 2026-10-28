// Sistema de Cotas e Medições Dimensionais 3D (Dimensions Helper)
class DimensionsHelper {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.group = new THREE.Group();
        this.group.name = 'dimensionsGroup';
        this.sm.scene.add(this.group);
        this.visible = true;
    }

    clear() {
        while (this.group.children.length > 0) {
            const child = this.group.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
            this.group.remove(child);
        }
    }

    setVisible(val) {
        this.visible = val;
        this.group.visible = val;
    }

    toggle() {
        this.setVisible(!this.visible);
        return this.visible;
    }

    // Cria um sprite de texto de alta resolução com fundo pill
    createTextSprite(text, color = '#ffffff', bg = 'rgba(15, 23, 42, 0.88)', border = '#0ea5e9') {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');

        // Fundo arredondado
        ctx.fillStyle = bg;
        ctx.strokeStyle = border;
        ctx.lineWidth = 4;

        const r = 24;
        const x = 6, y = 6, w = canvas.width - 12, h = canvas.height - 12;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Texto
        ctx.fillStyle = color;
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false // Sempre visível na frente das geometrias
        });

        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.4, 0.4, 1);
        return sprite;
    }

    // Desenha uma linha de cota com traços terminais perpendiculares
    createMeasureLine(p1, p2, labelText, tickSize = 0.2, lineColor = 0x0ea5e9, dimKey = null, dimVal = null) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const lineMat = new THREE.LineBasicMaterial({
            color: lineColor,
            linewidth: 2,
            depthTest: false,
            transparent: true,
            opacity: 0.9
        });
        const line = new THREE.Line(lineGeo, lineMat);
        this.group.add(line);

        // Direção da linha
        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        let normal = new THREE.Vector3(0, 1, 0);
        if (Math.abs(dir.y) > 0.9) {
            normal.set(1, 0, 0);
        }
        const perp = new THREE.Vector3().crossVectors(dir, normal).normalize().multiplyScalar(tickSize);

        // Traço terminal 1
        const t1Geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3().addVectors(p1, perp),
            new THREE.Vector3().subVectors(p1, perp)
        ]);
        this.group.add(new THREE.Line(t1Geo, lineMat));

        // Traço terminal 2
        const t2Geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3().addVectors(p2, perp),
            new THREE.Vector3().subVectors(p2, perp)
        ]);
        this.group.add(new THREE.Line(t2Geo, lineMat));

        // Rótulo de texto no ponto médio (interativo)
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const sprite = this.createTextSprite(labelText);
        sprite.position.copy(mid);
        if (dimKey !== null && dimVal !== null) {
            sprite.userData = {
                isDimensionLabel: true,
                key: dimKey,
                val: dimVal,
                label: labelText
            };
        }
        this.group.add(sprite);
    }

    buildDimensions(solidId, params) {
        this.clear();

        const p = params;
        const lineColor = 0x38bdf8; // Azul celeste nítido

        switch (solidId) {
            case 'cube': {
                const a = p.a;
                const offset = 0.4;
                // Largura da base (eixo X)
                this.createMeasureLine(
                    new THREE.Vector3(-a / 2, 0, a / 2 + offset),
                    new THREE.Vector3(a / 2, 0, a / 2 + offset),
                    `a = ${a} m`, 0.15, lineColor, 'a', a
                );
                // Altura vertical (eixo Y)
                this.createMeasureLine(
                    new THREE.Vector3(a / 2 + offset, 0, a / 2),
                    new THREE.Vector3(a / 2 + offset, a, a / 2),
                    `h = a = ${a} m`, 0.15, lineColor, 'a', a
                );
                // Profundidade (eixo Z)
                this.createMeasureLine(
                    new THREE.Vector3(a / 2 + offset, 0, -a / 2),
                    new THREE.Vector3(a / 2 + offset, 0, a / 2),
                    `a = ${a} m`, 0.15, lineColor, 'a', a
                );
                break;
            }

            case 'rectangular_prism': {
                const { a, b, c } = p;
                const offset = 0.4;
                // Comprimento (a)
                this.createMeasureLine(
                    new THREE.Vector3(-a / 2, 0, b / 2 + offset),
                    new THREE.Vector3(a / 2, 0, b / 2 + offset),
                    `a = ${a} m`, 0.15, lineColor, 'a', a
                );
                // Largura (b)
                this.createMeasureLine(
                    new THREE.Vector3(a / 2 + offset, 0, -b / 2),
                    new THREE.Vector3(a / 2 + offset, 0, b / 2),
                    `b = ${b} m`, 0.15, lineColor, 'b', b
                );
                // Altura (c)
                this.createMeasureLine(
                    new THREE.Vector3(a / 2 + offset, 0, b / 2),
                    new THREE.Vector3(a / 2 + offset, c, b / 2),
                    `c = ${c} m`, 0.15, lineColor, 'c', c
                );
                break;
            }

            case 'cylinder': {
                const { r, h } = p;
                const offset = 0.5;
                // Raio da base (r)
                this.createMeasureLine(
                    new THREE.Vector3(0, 0.05, 0),
                    new THREE.Vector3(r, 0.05, 0),
                    `r = ${r} m`, 0.15, 0xf59e0b, 'r', r
                );
                // Diâmetro da base (D = 2r)
                this.createMeasureLine(
                    new THREE.Vector3(-r, 0, r + offset),
                    new THREE.Vector3(r, 0, r + offset),
                    `D = ${(2 * r).toFixed(1)} m`, 0.15, lineColor
                );
                // Altura do cilindro (h)
                this.createMeasureLine(
                    new THREE.Vector3(r + offset, 0, 0),
                    new THREE.Vector3(r + offset, h, 0),
                    `h = ${h} m`, 0.15, lineColor, 'h', h
                );
                break;
            }

            case 'cone': {
                const { r, h } = p;
                const g = Math.sqrt(r * r + h * h);
                const offset = 0.4;
                // Raio da base (r)
                this.createMeasureLine(
                    new THREE.Vector3(0, 0.05, 0),
                    new THREE.Vector3(r, 0.05, 0),
                    `r = ${r} m`, 0.15, 0xf59e0b, 'r', r
                );
                // Altura vertical central (h)
                this.createMeasureLine(
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, h, 0),
                    `h = ${h} m`, 0.15, lineColor, 'h', h
                );
                // Geratriz (g)
                this.createMeasureLine(
                    new THREE.Vector3(-r, 0, 0),
                    new THREE.Vector3(0, h, 0),
                    `g = ${g.toFixed(2)} m`, 0.15, 0x10b981
                );
                break;
            }

            case 'sphere': {
                const r = p.r;
                // Raio da esfera (R) do centro até a borda
                this.createMeasureLine(
                    new THREE.Vector3(0, r, 0),
                    new THREE.Vector3(r, r, 0),
                    `R = ${r} m`, 0.18, 0xf59e0b, 'r', r
                );
                // Marcador central
                const centerGeo = new THREE.SphereGeometry(0.08, 12, 12);
                const centerMesh = new THREE.Mesh(centerGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
                centerMesh.position.set(0, r, 0);
                this.group.add(centerMesh);

                // Diâmetro vertical total
                this.createMeasureLine(
                    new THREE.Vector3(r + 0.4, 0, 0),
                    new THREE.Vector3(r + 0.4, 2 * r, 0),
                    `D = ${(2 * r).toFixed(1)} m`, 0.15, lineColor
                );
                break;
            }

            case 'square_pyramid': {
                const { l, h } = p;
                const apBase = l / 2;
                const apPiramide = Math.sqrt(h * h + apBase * apBase);
                const offset = 0.5;

                // Lado da base (L)
                this.createMeasureLine(
                    new THREE.Vector3(-l / 2, 0, l / 2 + offset),
                    new THREE.Vector3(l / 2, 0, l / 2 + offset),
                    `L = ${l} m`, 0.15, lineColor, 'l', l
                );
                // Altura central (h)
                this.createMeasureLine(
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, h, 0),
                    `h = ${h} m`, 0.15, lineColor, 'h', h
                );
                // Apótema da pirâmide (ap)
                this.createMeasureLine(
                    new THREE.Vector3(0, 0, l / 2),
                    new THREE.Vector3(0, h, 0),
                    `ap = ${apPiramide.toFixed(2)} m`, 0.15, 0x10b981, 'ap', parseFloat(apPiramide.toFixed(2))
                );
                break;
            }

            case 'triangular_prism': {
                const { l, h } = p;
                const offset = 0.4;
                const r = l / Math.sqrt(3);
                // Lado da base triangular (L)
                this.createMeasureLine(
                    new THREE.Vector3(-l / 2, 0, l / (2 * Math.sqrt(3)) + offset),
                    new THREE.Vector3(l / 2, 0, l / (2 * Math.sqrt(3)) + offset),
                    `L = ${l} m`, 0.15, lineColor
                );
                // Altura do prisma (h)
                this.createMeasureLine(
                    new THREE.Vector3(l / 2 + offset, 0, 0),
                    new THREE.Vector3(l / 2 + offset, h, 0),
                    `h = ${h} m`, 0.15, lineColor
                );
                break;
            }

            case 'hexagonal_prism': {
                const { l, h } = p;
                const offset = 0.5;
                // Lado da base hexagonal (L)
                this.createMeasureLine(
                    new THREE.Vector3(-l / 2, 0, l * Math.sqrt(3) / 2 + offset),
                    new THREE.Vector3(l / 2, 0, l * Math.sqrt(3) / 2 + offset),
                    `L = ${l} m`, 0.15, lineColor
                );
                // Altura da coluna (h)
                this.createMeasureLine(
                    new THREE.Vector3(l + offset, 0, 0),
                    new THREE.Vector3(l + offset, h, 0),
                    `h = ${h} m`, 0.15, lineColor
                );
                break;
            }

            default:
                break;
        }

        this.group.visible = this.visible;
    }

    // Atualiza as cotas 3D quando o sólido sofre um corte transversal
    updateCutDimensions(solidId, p, cutHeight, sectionInfo) {
        this.clear();
        if (!this.visible) return;

        const solidDef = SOLIDS_DATA[solidId];
        const totalH = solidDef ? solidDef.height(p) : 5;
        const clampedH = Math.max(0, Math.min(totalH, cutHeight));
        const remH = clampedH;
        const remSup = Math.max(0, totalH - clampedH);

        const xOffset = 3.2;

        // 1. Cota da altura restante inferior
        this.createMeasureLine(
            new THREE.Vector3(xOffset, 0, 0),
            new THREE.Vector3(xOffset, remH, 0),
            `h restante = ${remH.toFixed(2)} m`,
            0.15,
            0x00f2fe
        );

        // 2. Cota da altura cortada/removida superior
        if (remSup > 0.05) {
            this.createMeasureLine(
                new THREE.Vector3(xOffset, remH, 0),
                new THREE.Vector3(xOffset, totalH, 0),
                `h cortada = ${remSup.toFixed(2)} m`,
                0.15,
                0xf43f5e
            );
        }

        // 3. Cota transversal no plano de corte
        this.createMeasureLine(
            new THREE.Vector3(-2, remH, 0),
            new THREE.Vector3(2, remH, 0),
            `Fatia: ${sectionInfo.estimatedArea}`,
            0.15,
            0xf59e0b
        );

        this.group.visible = this.visible;
    }
}

window.DimensionsHelper = DimensionsHelper;
