// skybox.js - Deep blue-purple gradient skybox for the 3D scene

import * as THREE from 'three';

// Create a deep blue-purple gradient skybox
const createSkybox = (scene, sceneType = 'PLAZA') => {
    // Create a simple gradient using a canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create vertical gradient from pinkish-purple (bottom) to dark blue (top)
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#1a1a2e'); // Dark blue at top
    gradient.addColorStop(0.3, '#16213e'); // Navy blue
    gradient.addColorStop(0.5, '#2d1b69'); // Deep purple
    gradient.addColorStop(0.7, '#4a2c7a'); // Purple
    gradient.addColorStop(0.9, '#6b3a8a'); // Pinkish purple
    gradient.addColorStop(1, '#8b4a9a'); // Soft pink-purple at bottom
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Create texture from canvas
    const gradientTexture = new THREE.CanvasTexture(canvas);
    
    // Set the scene background directly using the gradient texture
    scene.background = gradientTexture;
    
    // Create a semi-transparent floor at y=-1
    const floorGeometry = new THREE.PlaneGeometry(300, 300); // Floor size matching star distribution area
    
    // Set floor color based on scene type
    const floorColor = sceneType === 'FOREST_SUBURBAN' ? 0x228B22 : 0x333333; // Green for forest, dark gray for city
    
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: floorColor,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide // Render both sides
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = -0.2; // Position at y=-0.1
    floor.name = "worldFloor";
    
    scene.add(floor);
    
    // Store reference in scene.userData
    if (!scene.userData) scene.userData = {};
    scene.userData.skybox = gradientTexture;
    scene.userData.floor = floor;
    
    return gradientTexture;
};

// Function to update skybox if needed in animation loop
const updateSkybox = (scene, time) => {
    // No updates needed for background texture
    return;
};

export { createSkybox, updateSkybox }; 