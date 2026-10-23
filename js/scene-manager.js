// Gerenciador da Cena 3D com Three.js
class SceneManager {
    constructor(canvasContainer) {
        this.container = canvasContainer;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Grupos de objetos
        this.solidGroup = new THREE.Group();
        this.elementsGroup = new THREE.Group(); // vértices, arestas destacadas, faces
        this.liquidGroup = new THREE.Group();
        this.faucetGroup = new THREE.Group();
        this.clippingPlaneMesh = null;
        this.unfoldGroup = new THREE.Group();

        // Estado visual
        this.viewMode = 'solid'; // 'solid', 'xray', 'wireframe'
        this.showVertices = false;
        this.showEdges = false;
        this.showFaces = false;
        this.edgeColor = 0x00f2fe; // Ciano vibrante padrão para arestas
        this.isAutoRotating = false;

        // Materiais
        this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 2);
        this.clippingEnabled = false;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 600;

        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b0f19);
        this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.035);

        // Câmera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(9, 7, 11);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.localClippingEnabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Controles de Órbita
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // Não deixa ir muito para debaixo do chão
        this.controls.minDistance = 3;
        this.controls.maxDistance = 35;

        // Iluminação
        this.setupLighting();

        // Chão e Grid
        this.setupFloor();

        // Adiciona os grupos à cena
        this.scene.add(this.solidGroup);
        this.scene.add(this.elementsGroup);
        this.scene.add(this.liquidGroup);
        this.scene.add(this.faucetGroup);
        this.scene.add(this.unfoldGroup);

        // Torneira
        this.createFaucet();

        // Plano de corte visual
        this.createClippingPlaneVisual();

        // Resize Listener
        window.addEventListener('resize', () => this.onWindowResize());

        // Animação Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientLight);

        // Luz Principal (Key Light) com sombras
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(10, 15, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 40;
        const d = 12;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        // Luz de Preenchimento (Ciano neon suave)
        const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
        fillLight.position.set(-10, 8, -10);
        this.scene.add(fillLight);

        // Rim Light de destaque (Roxo suave)
        const rimLight = new THREE.PointLight(0xa855f7, 0.6, 25);
        rimLight.position.set(0, 10, -8);
        this.scene.add(rimLight);
    }

    setupFloor() {
        // Grid cibernético
        const gridHelper = new THREE.GridHelper(30, 30, 0x00f2fe, 0x1e293b);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        // Chão receptor de sombra
        const floorGeo = new THREE.PlaneGeometry(60, 60);
        const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = -0.01;
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);
    }

    createFaucet() {
        // Modelo 3D estilizado de torneira de laboratório de alta tecnologia
        const faucet = new THREE.Group();
        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.85,
            roughness: 0.2
        });

        // Haste vertical
        const vPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.5, 16), pipeMat);
        vPipe.position.set(-5, 5, 0);
        faucet.add(vPipe);

        // Haste horizontal
        const hPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 16), pipeMat);
        hPipe.rotation.z = Math.PI / 2;
        hPipe.position.set(-2.5, 7.25, 0);
        faucet.add(hPipe);

        // Bico da torneira
        const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 1.2, 16), pipeMat);
        spout.position.set(0, 6.7, 0);
        faucet.add(spout);

        // Manopla / Válvula
        const valveGeo = new THREE.TorusGeometry(0.45, 0.08, 8, 24);
        const valveMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x0072b2, metalness: 0.5 });
        const valve = new THREE.Mesh(valveGeo, valveMat);
        valve.rotation.x = Math.PI / 2;
        valve.position.set(-2.5, 7.6, 0);
        valve.name = 'valve';
        faucet.add(valve);

        // Jato de água (inicialmente invisível)
        const streamGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 12);
        const streamMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.85,
            roughness: 0.1,
            metalness: 0.1
        });
        const stream = new THREE.Mesh(streamGeo, streamMat);
        stream.position.set(0, 3.4, 0);
        stream.visible = false;
        stream.name = 'waterStream';
        faucet.add(stream);

        faucet.position.set(0, 0, 0);
        this.faucetGroup.add(faucet);
    }

    createClippingPlaneVisual() {
        const planeGeo = new THREE.PlaneGeometry(12, 12);
        const planeMat = new THREE.MeshBasicMaterial({
            color: 0xf43f5e,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.clippingPlaneMesh = new THREE.Mesh(planeGeo, planeMat);
        this.clippingPlaneMesh.rotation.x = Math.PI / 2;
        this.clippingPlaneMesh.position.y = 2.5;

        // Borda neon no plano de corte
        const edges = new THREE.EdgesGeometry(planeGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff0055, linewidth: 2 });
        const edgeLine = new THREE.LineSegments(edges, lineMat);
        this.clippingPlaneMesh.add(edgeLine);

        this.clippingPlaneMesh.visible = false;
        this.scene.add(this.clippingPlaneMesh);
    }

    setClipping(enabled, height = 2.5, angleX = 0, angleZ = 0) {
        this.clippingEnabled = enabled;
        if (this.clippingPlaneMesh) {
            this.clippingPlaneMesh.visible = enabled;
            this.clippingPlaneMesh.position.y = height;
            this.clippingPlaneMesh.rotation.x = Math.PI / 2 + (angleX * Math.PI) / 180;
            this.clippingPlaneMesh.rotation.z = (angleZ * Math.PI) / 180;
        }

        if (enabled) {
            const normal = new THREE.Vector3(0, -1, 0);
            const euler = new THREE.Euler(
                (angleX * Math.PI) / 180,
                0,
                (angleZ * Math.PI) / 180,
                'XYZ'
            );
            normal.applyEuler(euler);
            this.clippingPlane.normal.copy(normal);
            this.clippingPlane.constant = height;
            this.renderer.clippingPlanes = [this.clippingPlane];
        } else {
            this.renderer.clippingPlanes = [];
        }
    }

    setWaterStream(active) {
        const stream = this.faucetGroup.getObjectByName('waterStream');
        const valve = this.faucetGroup.getObjectByName('valve');
        if (stream) stream.visible = active;
        if (valve && active) {
            valve.rotation.z += 0.08;
        }
    }

    clearGroups() {
        while (this.solidGroup.children.length > 0) {
            const obj = this.solidGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.solidGroup.remove(obj);
        }
        while (this.elementsGroup.children.length > 0) {
            const obj = this.elementsGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.elementsGroup.remove(obj);
        }
        while (this.liquidGroup.children.length > 0) {
            const obj = this.liquidGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.liquidGroup.remove(obj);
        }
        while (this.unfoldGroup.children.length > 0) {
            const obj = this.unfoldGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.unfoldGroup.remove(obj);
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.solidGroup.traverse(child => {
            if (child.isMesh && child.name === 'solidBody') {
                if (mode === 'xray') {
                    child.material.transparent = true;
                    child.material.opacity = 0.35;
                    child.material.wireframe = false;
                    child.material.depthWrite = false;
                } else if (mode === 'wireframe') {
                    child.material.transparent = false;
                    child.material.wireframe = true;
                    child.material.depthWrite = true;
                } else { // 'solid'
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.material.wireframe = false;
                    child.material.depthWrite = true;
                }
                child.material.needsUpdate = true;
            }
        });
    }

    setEdgeColor(hexColor) {
        this.edgeColor = typeof hexColor === 'string' ? parseInt(hexColor.replace('#', '0x'), 16) : hexColor;
        const applyColor = (root) => {
            root.traverse(child => {
                if (child.isLineSegments || child.name === 'edgeHighlight' || child.name === 'solidEdgesBase') {
                    if (child.material) {
                        child.material.color.setHex(this.edgeColor);
                        child.material.opacity = 1.0;
                        child.material.needsUpdate = true;
                    }
                }
            });
        };
        applyColor(this.solidGroup);
        applyColor(this.elementsGroup);
    }

    setElementsVisibility(vertices, edges, faces) {
        this.showVertices = vertices;
        this.showEdges = edges;
        this.showFaces = faces;

        const updateVisibility = (root) => {
            root.traverse(child => {
                if (child.name === 'vertexMarker') child.visible = vertices;
                if (child.name === 'edgeHighlight') {
                    child.visible = edges;
                    if (edges && child.material) {
                        child.material.color.setHex(this.edgeColor || 0x00f2fe);
                        child.material.opacity = 1.0;
                    }
                }
                if (child.name === 'solidEdgesBase') {
                    if (child.material) {
                        if (edges) {
                            child.material.color.setHex(this.edgeColor || 0x00f2fe);
                            child.material.opacity = 1.0;
                        } else {
                            child.material.color.setHex(0x818cf8);
                            child.material.opacity = 0.6;
                        }
                        child.material.needsUpdate = true;
                    }
                }
                if (child.name === 'faceHighlight') child.visible = faces;
            });
        };

        updateVisibility(this.solidGroup);
        updateVisibility(this.elementsGroup);
    }

    resetCamera() {
        this.camera.position.set(9, 7, 11);
        this.controls.target.set(0, 2.5, 0);
        this.controls.update();
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        if (this.isAutoRotating) {
            this.solidGroup.rotation.y += 0.008;
            this.elementsGroup.rotation.y = this.solidGroup.rotation.y;
            this.liquidGroup.rotation.y = this.solidGroup.rotation.y;
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.SceneManager = SceneManager;
