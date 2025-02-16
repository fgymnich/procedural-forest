import * as THREE from 'three';

export class VoxelObjects {
  //TREE
  static createTree(height: number = 5): THREE.Group {
    const tree = new THREE.Group();

    // Create trunk
    const trunkGeometry = new THREE.BoxGeometry(1, height, 1);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2810 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = height / 2;
    tree.add(trunk);

    // Create leaves (voxel style)
    const leavesSize = 3;
    const leavesGeometry = new THREE.BoxGeometry(leavesSize, leavesSize, leavesSize);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = height + leavesSize / 2 - 1;
    tree.add(leaves);

    return tree;
  }

  //ROCK
  static createRock(size: number = 1): THREE.Mesh {
    const rockGeometry = new THREE.BoxGeometry(size, size * 0.8, size);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.8 
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.y = size * 0.4;
    return rock;
  }

  //BUSH
  static createBush(size: number = 2): THREE.Mesh {
    const bushGeometry = new THREE.BoxGeometry(size, size, size);
    const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x1b4d2e });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.y = size / 2;
    return bush;
  }

  //FLOWER
  static createFlower(height: number = 1): THREE.Group {
    const flower = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.BoxGeometry(0.2, height, 0.2);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = height / 2;
    flower.add(stem);

    // Flower head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6) 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = height;
    flower.add(head);

    return flower;
  }

  //GRASSPATCH
  static createGrassPatch(size: number = 0.5): THREE.Mesh {
    const grassGeometry = new THREE.BoxGeometry(size, size * 1.5, size);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5a40 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.position.y = size * 0.75;
    return grass;
  }
} 