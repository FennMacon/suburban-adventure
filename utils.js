// utils.js - Shared utility functions
import * as THREE from 'three';

// Create wireframe material with color and optional opacity
export const createWireframeMaterial = (color = 0xFFFFFF, opacity = 1.0) => {
    return new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: opacity < 1.0,
        opacity: opacity
    });
};

// Other utility functions
export const getRandomColor = () => {
    return Math.floor(Math.random() * 0xFFFFFF);
};

export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

// Car creation
export const createCar = (x, color, direction) => {
    const carGroup = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 0.7, 1, 3, 2, 2);
    const bodyMaterial = createWireframeMaterial(color);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    carGroup.add(body);
    
    // Car top
    const topGeometry = new THREE.BoxGeometry(1, 0.5, 0.8, 2, 2, 2);
    const topMaterial = createWireframeMaterial(color);
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(0, 1.1, 0);
    carGroup.add(top);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8, 1);
    const wheelMaterial = createWireframeMaterial(0x111111);
    
    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.rotation.x = Math.PI / 2;
    wheel1.position.set(-0.7, 0.2, 0.5);
    carGroup.add(wheel1);
    
    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.rotation.x = Math.PI / 2;
    wheel2.position.set(-0.7, 0.2, -0.5);
    carGroup.add(wheel2);
    
    const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel3.rotation.x = Math.PI / 2;
    wheel3.position.set(0.7, 0.2, 0.5);
    carGroup.add(wheel3);
    
    const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel4.rotation.x = Math.PI / 2;
    wheel4.position.set(0.7, 0.2, -0.5);
    carGroup.add(wheel4);
    
    carGroup.position.set(x, 0, 0);
    if (direction === 'left') {
        carGroup.rotation.y = 0;
    } else {
        carGroup.rotation.y = Math.PI;
    }
    
    carGroup.userData.direction = direction;
    return carGroup;
};

// Get random car color
export const getRandomCarColor = () => {
    const carColors = [
        0xff0000, 0x00ff00, 0x0000ff, 0xffff00,
        0xff00ff, 0x00ffff, 0xffa500, 0x800080,
        0x008000, 0x000080, 0x808080, 0xffffff
    ];
    return carColors[Math.floor(Math.random() * carColors.length)];
};

// New England Tree Species Creation
export const createTree = (x, z, scale = 1, treeType = null) => {
    const treeGroup = new THREE.Group();
    
    const treeTypes = {
        'Eastern White Pine': {
            trunkColor: 0x696969,
            foliageColor: 0x228B22,
            height: 8 + Math.random() * 4,
            trunkWidth: 0.6,
            foliageShape: 'conical',
            foliageSize: 2.2,
            layers: 4
        },
        'Red Maple': {
            trunkColor: 0x654321,
            foliageColor: 0x8B0000,
            height: 6 + Math.random() * 3,
            trunkWidth: 0.5,
            foliageShape: 'round',
            foliageSize: 3.0,
            layers: 2
        },
        'Northern Red Oak': {
            trunkColor: 0x8B4513,
            foliageColor: 0x2F4F2F,
            height: 7 + Math.random() * 5,
            trunkWidth: 0.8,
            foliageShape: 'broad',
            foliageSize: 3.5,
            layers: 3
        },
        'Eastern Hemlock': {
            trunkColor: 0x696969,
            foliageColor: 0x006400,
            height: 6 + Math.random() * 3,
            trunkWidth: 0.4,
            foliageShape: 'drooping',
            foliageSize: 2.5,
            layers: 5
        },
        'Red Pine': {
            trunkColor: 0xA0522D,
            foliageColor: 0x228B22,
            height: 7 + Math.random() * 4,
            trunkWidth: 0.5,
            foliageShape: 'sparse',
            foliageSize: 1.8,
            layers: 3
        },
        'American Beech': {
            trunkColor: 0xD2B48C,
            foliageColor: 0x32CD32,
            height: 5 + Math.random() * 3,
            trunkWidth: 0.6,
            foliageShape: 'dense',
            foliageSize: 2.8,
            layers: 2
        }
    };
    
    const typeNames = Object.keys(treeTypes);
    const selectedType = treeType || typeNames[Math.floor(Math.random() * typeNames.length)];
    const tree = treeTypes[selectedType];
    
    // Create trunk
    const trunkHeight = tree.height * scale;
    const trunkGeometry = new THREE.CylinderGeometry(
        tree.trunkWidth * scale * 0.7, 
        tree.trunkWidth * scale, 
        trunkHeight, 
        8
    );
    const trunkMaterial = createWireframeMaterial(tree.trunkColor);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    treeGroup.add(trunk);
    
    // Create foliage
    const foliageMaterial = createWireframeMaterial(tree.foliageColor);
    
    switch (tree.foliageShape) {
        case 'conical':
            for (let i = 0; i < tree.layers; i++) {
                const layerHeight = trunkHeight * 0.6 + (i * trunkHeight * 0.15);
                const layerSize = tree.foliageSize * scale * (1 - i * 0.2);
                const coneGeometry = new THREE.ConeGeometry(layerSize, layerSize * 0.8, 8);
                const layer = new THREE.Mesh(coneGeometry, foliageMaterial);
                layer.position.y = layerHeight;
                treeGroup.add(layer);
            }
            break;
            
        case 'round':
            for (let i = 0; i < tree.layers; i++) {
                const sphereGeometry = new THREE.SphereGeometry(tree.foliageSize * scale + Math.random() * 0.5, 6, 6);
                const sphere = new THREE.Mesh(sphereGeometry, foliageMaterial);
                sphere.position.set(
                    (Math.random() - 0.5) * scale,
                    trunkHeight * 0.7 + Math.random() * scale,
                    (Math.random() - 0.5) * scale
                );
                treeGroup.add(sphere);
            }
            break;
            
        case 'broad':
            for (let i = 0; i < tree.layers; i++) {
                const foliageGeometry = new THREE.SphereGeometry(tree.foliageSize * scale, 6, 6);
                foliageGeometry.scale(1.2, 0.8, 1.2);
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.set(
                    (Math.random() - 0.5) * 2 * scale,
                    trunkHeight * 0.8 + (Math.random() - 0.5) * scale,
                    (Math.random() - 0.5) * 2 * scale
                );
                treeGroup.add(foliage);
            }
            break;
            
        case 'drooping':
            for (let i = 0; i < tree.layers; i++) {
                const layerHeight = trunkHeight * 0.95 - (i * trunkHeight * 0.15);
                const layerSize = tree.foliageSize * scale * (0.7 + i * 0.1);
                const ellipseGeometry = new THREE.SphereGeometry(layerSize, 6, 6);
                ellipseGeometry.scale(1, 0.6, 1);
                const layer = new THREE.Mesh(ellipseGeometry, foliageMaterial);
                layer.position.y = layerHeight;
                treeGroup.add(layer);
            }
            break;
            
        case 'sparse':
            for (let i = 0; i < tree.layers; i++) {
                if (Math.random() > 0.2) {
                    const needleGeometry = new THREE.SphereGeometry(tree.foliageSize * scale, 6, 6);
                    const needles = new THREE.Mesh(needleGeometry, foliageMaterial);
                    needles.position.set(
                        (Math.random() - 0.5) * 1.5 * scale,
                        trunkHeight * 0.7 + Math.random() * trunkHeight * 0.25,
                        (Math.random() - 0.5) * 1.5 * scale
                    );
                    treeGroup.add(needles);
                }
            }
            break;
            
        case 'dense':
            for (let i = 0; i < tree.layers; i++) {
                const denseGeometry = new THREE.SphereGeometry(tree.foliageSize * scale, 8, 8);
                const dense = new THREE.Mesh(denseGeometry, foliageMaterial);
                dense.position.set(
                    (Math.random() - 0.5) * scale * 0.5,
                    trunkHeight * 0.7 + (Math.random() - 0.5) * scale * 0.5,
                    (Math.random() - 0.5) * scale * 0.5
                );
                treeGroup.add(dense);
            }
            break;
    }
    
    treeGroup.position.set(x, 0, z);
    treeGroup.userData.species = selectedType;
    return treeGroup;
};

// Bush creation
export const createBush = (x, z, scale = 1) => {
    const bushGroup = new THREE.Group();
    
    const bushColors = [0x228B22, 0x32CD32, 0x90EE90];
    for (let i = 0; i < 2 + Math.random() * 3; i++) {
        const bushGeometry = new THREE.SphereGeometry(0.8 * scale + Math.random() * 0.4, 6, 6);
        const bushColor = bushColors[Math.floor(Math.random() * bushColors.length)];
        const bushMaterial = createWireframeMaterial(bushColor);
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(
            (Math.random() - 0.5) * 2 * scale,
            0.8 * scale + Math.random() * 0.5,
            (Math.random() - 0.5) * 2 * scale
        );
        bushGroup.add(bush);
    }
    
    bushGroup.position.set(x, 0, z);
    return bushGroup;
};
