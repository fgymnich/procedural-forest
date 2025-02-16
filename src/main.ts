import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { VoxelObjects } from './objects/VoxelObjects';

class ForestGenerator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private gui: dat.GUI;
  private container: HTMLElement | null;

  // Store objects by type for selective updates
  private forestElements: {
    trees: THREE.Object3D[];
    rocks: THREE.Object3D[];
    bushes: THREE.Object3D[];
    flowers: THREE.Object3D[];
    grassPatches: THREE.Object3D[];
  } = {
    trees: [],
    rocks: [],
    bushes: [],
    flowers: [],
    grassPatches: []
  };

  private settings = {
    trees: 10,
    rocks: 5,
    bushes: 8,
    flowers: 15,
    grassPatches: 20
  };

  constructor() {
    this.container = document.getElementById('app');
    if (!this.container) throw new Error('No container found');

    // Initialize Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Initialize Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      800 / 600, // Fixed aspect ratio for the container
      0.1,
      1000
    );
    this.camera.position.set(25, 15, 25);
    this.camera.lookAt(0, 0, 0);

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(800, 600); // Fixed size matching container
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better shadow quality
    this.container.appendChild(this.renderer.domElement);

    // Initialize Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.5; // Limit vertical rotation
    this.controls.target.set(0, 0, 0); // Set control target to center

    // Initialize GUI with custom styling
    this.gui = new dat.GUI({ autoPlace: true });
    const style = document.createElement('style');
    style.innerHTML = `
      .dg.main {
        width: 300px !important;
      }
      .dg li.title {
        font-size: 14px !important;
      }
      .dg li:not(.folder) {
        font-size: 13px !important;
        height: 30px !important;
        line-height: 30px !important;
      }
      .dg .c input[type=text] {
        font-size: 13px !important;
      }
      .dg .c .slider {
        height: 20px !important;
      }
    `;
    document.head.appendChild(style);
    this.setupGUI();

    // Setup basic scene
    this.setupLights();
    this.createGround();
    this.generateInitialForest();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private setupGUI(): void {
    const regenerateFolder = this.gui.addFolder('Forest Elements');
    regenerateFolder.add(this.settings, 'trees', 0, 50, 1)
      .onChange(() => this.updateElementCount('trees'));
    regenerateFolder.add(this.settings, 'rocks', 0, 30, 1)
      .onChange(() => this.updateElementCount('rocks'));
    regenerateFolder.add(this.settings, 'bushes', 0, 40, 1)
      .onChange(() => this.updateElementCount('bushes'));
    regenerateFolder.add(this.settings, 'flowers', 0, 50, 1)
      .onChange(() => this.updateElementCount('flowers'));
    regenerateFolder.add(this.settings, 'grassPatches', 0, 100, 1)
      .onChange(() => this.updateElementCount('grassPatches'));
    regenerateFolder.open();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    //DIRECTIONAL LIGHT
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 70);
    directionalLight.castShadow = true;
    
    // Improve shadow quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    this.scene.add(directionalLight);
  }

  //GROUND
  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a5a05,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private getRandomPosition(maxRadius: number = 24): THREE.Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * maxRadius;
    return new THREE.Vector2(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    );
  }

  private getElementSize(elementType: keyof typeof this.forestElements): THREE.Vector3 {
    // Define approximate sizes for each element type
    switch (elementType) {
      case 'trees':
        return new THREE.Vector3(3, 6, 3); // Width, Height, Depth
      case 'rocks':
        return new THREE.Vector3(1.5, 1.2, 1.5);
      case 'bushes':
        return new THREE.Vector3(2, 2, 2);
      case 'flowers':
        return new THREE.Vector3(0.5, 1, 0.5);
      case 'grassPatches':
        return new THREE.Vector3(0.5, 0.75, 0.5);
      default:
        return new THREE.Vector3(1, 1, 1);
    }
  }

  private isPositionOccupied(position: THREE.Vector2, elementType: keyof typeof this.forestElements): boolean {
    const newElementSize = this.getElementSize(elementType);
    const padding = 0.5; // Additional space between objects

    // Create a box for the new element
    const newBox = new THREE.Box3();
    newBox.min.set(
      position.x - (newElementSize.x / 2) - padding,
      0,
      position.y - (newElementSize.z / 2) - padding
    );
    newBox.max.set(
      position.x + (newElementSize.x / 2) + padding,
      newElementSize.y,
      position.y + (newElementSize.z / 2) + padding
    );

    // Check collision with all existing elements
    for (const type in this.forestElements) {
      const elements = this.forestElements[type as keyof typeof this.forestElements];
      const elementSize = this.getElementSize(type as keyof typeof this.forestElements);

      for (const element of elements) {
        const position = element.position;
        const existingBox = new THREE.Box3();
        existingBox.min.set(
          position.x - (elementSize.x / 2) - padding,
          0,
          position.z - (elementSize.z / 2) - padding
        );
        existingBox.max.set(
          position.x + (elementSize.x / 2) + padding,
          elementSize.y,
          position.z + (elementSize.z / 2) + padding
        );

        if (newBox.intersectsBox(existingBox)) {
          return true;
        }
      }
    }

    return false;
  }

  private getFreePosition(elementType: keyof typeof this.forestElements, maxAttempts: number = 50): THREE.Vector2 | null {
    for (let i = 0; i < maxAttempts; i++) {
      const position = this.getRandomPosition();
      if (!this.isPositionOccupied(position, elementType)) {
        return position;
      }
    }
    return null; // No free position found after maxAttempts
  }

  private generateInitialForest(): void {
    this.updateElementCount('trees');
    this.updateElementCount('rocks');
    this.updateElementCount('bushes');
    this.updateElementCount('flowers');
    this.updateElementCount('grassPatches');
  }

  private updateElementCount(elementType: keyof typeof this.forestElements): void {
    const currentCount = this.forestElements[elementType].length;
    const targetCount = this.settings[elementType];
    
    if (currentCount === targetCount) return;

    if (currentCount > targetCount) {
      // Calculate how many elements to remove
      const removeCount = currentCount - targetCount;
      
      // Create a copy of the array to avoid modifying while iterating
      const elements = [...this.forestElements[elementType]];
      
      // Remove random elements
      for (let i = 0; i < removeCount; i++) {
        // Get a random index from the remaining elements
        const randomIndex = Math.floor(Math.random() * elements.length);
        
        // Remove the element from the scene
        const elementToRemove = elements[randomIndex];
        this.scene.remove(elementToRemove);
        
        // Remove the element from our tracking arrays
        elements.splice(randomIndex, 1);
        this.forestElements[elementType] = this.forestElements[elementType].filter(
          el => el !== elementToRemove
        );
      }
    } else {
      // Add new elements
      let attemptsToAdd = 0;
      const maxAttempts = 100; // Prevent infinite loops if the scene is too crowded

      while (this.forestElements[elementType].length < targetCount && attemptsToAdd < maxAttempts) {
        const pos = this.getFreePosition(elementType);
        
        if (pos === null) {
          console.warn(`Could not find free position for ${elementType} after multiple attempts`);
          break;
        }

        let element: THREE.Object3D;
        
        switch (elementType) {
          case 'trees':
            element = VoxelObjects.createTree(3 + Math.random() * 3);
            this.setupTreeShadows(element);
            break;
          case 'rocks':
            element = VoxelObjects.createRock(0.5 + Math.random() * 1.5);
            this.disableShadows(element);
            break;
          case 'bushes':
            element = VoxelObjects.createBush(1 + Math.random());
            this.disableShadows(element);
            break;
          case 'flowers':
            element = VoxelObjects.createFlower(0.5 + Math.random() * 0.5);
            this.disableShadows(element);
            break;
          case 'grassPatches':
            element = VoxelObjects.createGrassPatch(0.3 + Math.random() * 0.3);
            this.disableShadows(element);
            break;
          default:
            return;
        }

        element.position.set(pos.x, 0, pos.y);
        element.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(element);
        this.forestElements[elementType].push(element);
        attemptsToAdd++;
      }
    }

    // Force shadow map update
    this.renderer.shadowMap.needsUpdate = true;
  }

  private setupTreeShadows(tree: THREE.Object3D): void {
    tree.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });
  }

  private disableShadows(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
      }
    });
  }

  private onWindowResize(): void {
    // We don't need to handle window resize anymore since we have fixed dimensions
    // But we'll keep the method in case we want to make it responsive later
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
new ForestGenerator();
