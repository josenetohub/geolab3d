// Construtor de Malhas 3D, Vértices, Arestas e Faces destacáveis
class SolidsBuilder {
    static build(sceneManager, solidId, params) {
        sceneManager.clearGroups();

        let geometry, height = 4;
        const vertexPositions = [];
        const faceColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0xec4899, 0x14b8a6];

        switch (solidId) {
            case 'cube': {
                const a = params.a;
                height = a;
                geometry = new THREE.BoxGeometry(a, a, a);
                // Vértices do cubo
                const half = a / 2;
                [
                    [-half, -half, -half], [half, -half, -half], [half, -half, half], [-half, -half, half],
                    [-half, half, -half], [half, half, -half], [half, half, half], [-half, half, half]
                ].forEach(p => vertexPositions.push(new THREE.Vector3(p[0], p[1] + half, p[2])));
                break;
            }

            case 'rectangular_prism': {
                const { a, b, c } = params;
                height = c;
                geometry = new THREE.BoxGeometry(a, c, b);
                const ha = a / 2, hb = b / 2, hc = c / 2;
                [
                    [-ha, -hc, -hb], [ha, -hc, -hb], [ha, -hc, hb], [-ha, -hc, hb],
                    [-ha, hc, -hb], [ha, hc, -hb], [ha, hc, hb], [-ha, hc, hb]
                ].forEach(p => vertexPositions.push(new THREE.Vector3(p[0], p[1] + hc, p[2])));
                break;
            }

            case 'cylinder': {
                const { r, h } = params;
                height = h;
                geometry = new THREE.CylinderGeometry(r, r, h, 36);
                break;
            }

            case 'cone': {
                const { r, h } = params;
                height = h;
                geometry = new THREE.CylinderGeometry(0.001, r, h, 36);
                vertexPositions.push(new THREE.Vector3(0, h, 0)); // Ápice
                break;
            }

            case 'sphere': {
                const r = params.r;
                height = 2 * r;
                geometry = new THREE.SphereGeometry(r, 36, 36);
                break;
            }

            case 'square_pyramid': {
                const { l, h } = params;
                height = h;
                geometry = new THREE.ConeGeometry(l * Math.SQRT1_2, h, 4);
                geometry.rotateY(Math.PI / 4);
                const hl = l / 2;
                vertexPositions.push(new THREE.Vector3(0, h, 0)); // Ápice
                vertexPositions.push(new THREE.Vector3(-hl, 0, -hl));
                vertexPositions.push(new THREE.Vector3(hl, 0, -hl));
                vertexPositions.push(new THREE.Vector3(hl, 0, hl));
                vertexPositions.push(new THREE.Vector3(-hl, 0, hl));
                break;
            }

            case 'triangular_prism': {
                const { l, h } = params;
                height = h;
                geometry = new THREE.CylinderGeometry(l / Math.sqrt(3), l / Math.sqrt(3), h, 3);
                const r = l / Math.sqrt(3);
                for (let i = 0; i < 3; i++) {
                    const ang = (i * 2 * Math.PI) / 3 - Math.PI / 6;
                    vertexPositions.push(new THREE.Vector3(r * Math.cos(ang), 0, r * Math.sin(ang)));
                    vertexPositions.push(new THREE.Vector3(r * Math.cos(ang), h, r * Math.sin(ang)));
                }
                break;
            }

            case 'hexagonal_prism': {
                const { l, h } = params;
                height = h;
                geometry = new THREE.CylinderGeometry(l, l, h, 6);
                for (let i = 0; i < 6; i++) {
                    const ang = (i * 2 * Math.PI) / 6;
                    vertexPositions.push(new THREE.Vector3(l * Math.cos(ang), 0, l * Math.sin(ang)));
                    vertexPositions.push(new THREE.Vector3(l * Math.cos(ang), h, l * Math.sin(ang)));
                }
                break;
            }

            case 'tetrahedron': {
                const a = params.a;
                const h = (a * Math.sqrt(6)) / 3;
                height = h;
                geometry = new THREE.TetrahedronGeometry(a / Math.sqrt(2));
                // 4 vértices
                const r = a * Math.sqrt(3) / 3;
                vertexPositions.push(new THREE.Vector3(0, h, 0));
                for (let i = 0; i < 3; i++) {
                    const ang = (i * 2 * Math.PI) / 3 - Math.PI / 6;
                    vertexPositions.push(new THREE.Vector3(r * Math.cos(ang), 0, r * Math.sin(ang)));
                }
                break;
            }

            case 'truncated_cone': {
                const { r1, r2, h } = params;
                height = h;
                geometry = new THREE.CylinderGeometry(r2, r1, h, 36);
                break;
            }

            default:
                geometry = new THREE.BoxGeometry(4, 4, 4);
                height = 4;
        }

        // Material Principal do Sólido (PBR Studio Shader - Suave e Profissional)
        const solidMaterial = new THREE.MeshStandardMaterial({
            color: 0x4f46e5,       // Indigo sofisticado
            roughness: 0.45,       // Toque acetinado mate, sem brilhos estourados
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        const solidMesh = new THREE.Mesh(geometry, solidMaterial);
        solidMesh.name = 'solidBody';
        solidMesh.position.y = height / 2;
        solidMesh.castShadow = true;
        solidMesh.receiveShadow = true;
        sceneManager.solidGroup.add(solidMesh);

        // Arestas estruturais sutis e elegantes
        const edgesGeo = new THREE.EdgesGeometry(geometry);
        const edgesLine = new THREE.LineSegments(
            edgesGeo,
            new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.6, linewidth: 1.5 })
        );
        edgesLine.name = 'solidEdgesBase';
        solidMesh.add(edgesLine);

        // --- ELEMENTOS DESTACADOS ---

        // 1. Arestas Neon (quando ativado "Arestas")
        const edgeColor = sceneManager.edgeColor || 0x00f2fe;
        const neonEdgeMat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 3 });
        const neonEdges = new THREE.LineSegments(edgesGeo, neonEdgeMat);
        neonEdges.name = 'edgeHighlight';
        neonEdges.visible = sceneManager.showEdges;
        solidMesh.add(neonEdges);

        // 2. Vértices destacados (Esferas brilhantes)
        const vertexGeo = new THREE.SphereGeometry(0.16, 16, 16);
        const vertexMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            roughness: 0.2,
            metalness: 0.8
        });

        vertexPositions.forEach((pos, idx) => {
            const vMesh = new THREE.Mesh(vertexGeo, vertexMat);
            vMesh.position.copy(pos);
            vMesh.name = 'vertexMarker';
            vMesh.visible = sceneManager.showVertices;
            sceneManager.elementsGroup.add(vMesh);
        });

        // 3. Faces destacadas com cores diferentes
        SolidsBuilder.buildFaceHighlights(sceneManager, solidId, params, height, faceColors);

        // Aplica o viewMode atual (solid, xray, wireframe)
        sceneManager.setViewMode(sceneManager.viewMode);

        return { height };
    }

    static buildFaceHighlights(sceneManager, solidId, params, height, colors) {
        const group = new THREE.Group();
        group.name = 'faceHighlight';
        group.visible = sceneManager.showFaces;

        const createFaceMat = (c) => new THREE.MeshStandardMaterial({
            color: c,
            transparent: true,
            opacity: 0.65,
            roughness: 0.3,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        if (solidId === 'cube' || solidId === 'rectangular_prism') {
            const a = solidId === 'cube' ? params.a : params.a;
            const b = solidId === 'cube' ? params.a : params.b;
            const c = solidId === 'cube' ? params.a : params.c;

            // 6 faces do paralelepípedo/cubo
            const faces = [
                { geo: new THREE.PlaneGeometry(a, c), pos: [0, c / 2, b / 2 + 0.01], rot: [0, 0, 0] },
                { geo: new THREE.PlaneGeometry(a, c), pos: [0, c / 2, -b / 2 - 0.01], rot: [0, Math.PI, 0] },
                { geo: new THREE.PlaneGeometry(b, c), pos: [a / 2 + 0.01, c / 2, 0], rot: [0, Math.PI / 2, 0] },
                { geo: new THREE.PlaneGeometry(b, c), pos: [-a / 2 - 0.01, c / 2, 0], rot: [0, -Math.PI / 2, 0] },
                { geo: new THREE.PlaneGeometry(a, b), pos: [0, c + 0.01, 0], rot: [-Math.PI / 2, 0, 0] },
                { geo: new THREE.PlaneGeometry(a, b), pos: [0, -0.01, 0], rot: [Math.PI / 2, 0, 0] }
            ];

            faces.forEach((f, idx) => {
                const mesh = new THREE.Mesh(f.geo, createFaceMat(colors[idx % colors.length]));
                mesh.position.set(...f.pos);
                mesh.rotation.set(...f.rot);
                group.add(mesh);
            });
        }

        sceneManager.elementsGroup.add(group);
    }
}

window.SolidsBuilder = SolidsBuilder;
