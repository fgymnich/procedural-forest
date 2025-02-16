import * as THREE from 'three';

export class VoxelDog {
  public object: THREE.Group;
  private velocity: THREE.Vector3;
  private isJumping: boolean;
  private speed: number = 0.2;
  private rotationSpeed: number = Math.PI / 2; // 90 degrees
  private jumpForce: number = 0.5;
  private gravity: number = 0.02;
  private direction: number = 0; // Current rotation in radians

  constructor() {
    this.object = new THREE.Group();
    this.velocity = new THREE.Vector3();
    this.isJumping = false;

    // Create dog body 
    const bodyGeometry = new THREE.BoxGeometry(1.0, 0.8, 1.4); // width, height, length
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6; // Raised to make room for legs
    this.object.add(body);

    // Create head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.0, 0.7); // Adjusted Y position
    this.object.add(head);

    // Create legs with darker color for contrast
    const legGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xE0E0E0 });
    
    // Front legs
    const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontLeftLeg.position.set(0.35, 0.3, 0.5);
    this.object.add(frontLeftLeg);

    const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontRightLeg.position.set(-0.35, 0.3, 0.5);
    this.object.add(frontRightLeg);

    // Back legs
    const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    backLeftLeg.position.set(0.35, 0.3, -0.5);
    this.object.add(backLeftLeg);

    const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    backRightLeg.position.set(-0.35, 0.3, -0.5);
    this.object.add(backRightLeg);

    // Create tail
    const tailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.8, -0.9);
    tail.rotation.x = Math.PI / 6; // Slightly tilted up
    this.object.add(tail);

    // Add black nose
    const noseGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.9, 1.0);
    this.object.add(nose);

    // Set initial position
    this.object.position.y = 0.4; // Ground position
  }

  update(colliders: THREE.Object3D[]): void {
    // Apply gravity
    if (this.object.position.y > 0.4 || this.velocity.y > 0) {
      this.velocity.y -= this.gravity;
      this.isJumping = true;
    } else {
      this.object.position.y = 0.4;
      this.velocity.y = 0;
      this.isJumping = false;
    }

    // Update position based on current direction
    const movement = new THREE.Vector3(
      Math.sin(this.direction) * this.velocity.z,
      this.velocity.y,
      Math.cos(this.direction) * this.velocity.z
    );

    // Check collisions before applying movement
    let canMove = true;
    
    // Adjust bounding box for next position
    const nextBoundingBox = new THREE.Box3().setFromObject(this.object);
    nextBoundingBox.min.add(movement);
    nextBoundingBox.max.add(movement);

    for (const collider of colliders) {
      const colliderBox = new THREE.Box3().setFromObject(collider);
      if (nextBoundingBox.intersectsBox(colliderBox)) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      this.object.position.add(movement);
    }

    // Reset velocity
    this.velocity.set(0, this.velocity.y, 0);
  }

  jump(): void {
    if (!this.isJumping) {
      this.velocity.y = this.jumpForce;
      this.isJumping = true;
    }
  }

  moveForward(): void {
    this.velocity.z = this.speed;
  }

  moveBackward(): void {
    this.velocity.z = -this.speed;
  }

  turnLeft(): void {
    this.direction += this.rotationSpeed;
    this.object.rotation.y = this.direction;
  }

  turnRight(): void {
    this.direction -= this.rotationSpeed;
    this.object.rotation.y = this.direction;
  }
} 