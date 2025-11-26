// skybox.js - Deep blue-purple gradient skybox for the 3D scene

import * as THREE from 'three';

// Get gradient color stops based on scene type
const getGradientColors = (sceneType) => {
    const isInterior = sceneType && sceneType.includes('INTERIOR');
    
    switch (sceneType) {
        case 'PLAZA':
            // Original sunset gradient - blue-purple-pink
            return [
                { stop: 0, color: '#1a1a2e' },    // Dark blue at top
                { stop: 0.3, color: '#16213e' }, // Navy blue
                { stop: 0.5, color: '#2d1b69' }, // Deep purple
                { stop: 0.7, color: '#4a2c7a' }, // Purple
                { stop: 0.9, color: '#6b3a8a' }, // Pinkish purple
                { stop: 1, color: '#8b4a9a' }     // Soft pink-purple at bottom
            ];
            
        case 'FOREST_SUBURBAN':
            // Warmer sunset - orange and golden tones
            return [
                { stop: 0, color: '#1a1a3e' },    // Dark blue-purple at top
                { stop: 0.2, color: '#2d1b4e' },  // Deep purple-blue
                { stop: 0.4, color: '#4a2c5a' },  // Purple
                { stop: 0.6, color: '#6b3a6a' },  // Warm purple
                { stop: 0.8, color: '#8b4a7a' },  // Pink-orange
                { stop: 1, color: '#cc6b5a' }     // Golden-orange at bottom
            ];
            
        case 'POND':
            // Deep haunted twilight - darker purple and blue
            return [
                { stop: 0, color: '#0a0a1e' },    // Very dark blue at top
                { stop: 0.2, color: '#0f0f2e' }, // Dark blue
                { stop: 0.4, color: '#1a1a3e' },  // Dark blue-purple
                { stop: 0.6, color: '#2d1b4e' },  // Deep purple
                { stop: 0.8, color: '#3a2a5a' },  // Purple-blue
                { stop: 1, color: '#4a3a6a' }     // Muted purple at bottom
            ];
            
        // Interior scenes - each with unique color palettes
        case 'CUMBYS_INTERIOR':
            // Convenience store - bright, commercial fluorescent lighting
            return [
                { stop: 0, color: '#2a2a3a' },    // Dark gray-blue at top
                { stop: 0.3, color: '#3a3a4a' },  // Medium gray
                { stop: 0.5, color: '#4a4a5a' },  // Light gray
                { stop: 0.7, color: '#5a5a4a' },  // Warm gray
                { stop: 0.9, color: '#6a6a3a' },  // Yellow-tinted
                { stop: 1, color: '#7a7a2a' }     // Bright yellow at bottom
            ];
            
        case 'GROHOS_INTERIOR':
            // Pizza restaurant - warm, cozy, Italian vibes
            return [
                { stop: 0, color: '#2a1a1a' },    // Dark red-brown at top
                { stop: 0.3, color: '#3a2a1a' },  // Medium red-brown
                { stop: 0.5, color: '#4a3a2a' },  // Warm brown
                { stop: 0.7, color: '#5a4a3a' },  // Orange-brown
                { stop: 0.9, color: '#6a5a3a' },  // Golden-orange
                { stop: 1, color: '#7a6a2a' }     // Warm orange at bottom
            ];
            
        case 'CLOTHING_STORE_INTERIOR':
            // Modern retail - clean, fashionable, slightly purple
            return [
                { stop: 0, color: '#2a2a3a' },    // Dark gray-purple at top
                { stop: 0.3, color: '#3a3a4a' },  // Medium gray-purple
                { stop: 0.5, color: '#4a4a5a' },  // Light gray-purple
                { stop: 0.7, color: '#5a4a6a' },  // Purple-pink
                { stop: 0.9, color: '#6a5a7a' },  // Soft pink-purple
                { stop: 1, color: '#7a6a8a' }     // Light pink at bottom
            ];
            
        case 'DRYCLEANER_INTERIOR':
            // Clean, professional - cool blues and grays
            return [
                { stop: 0, color: '#2a2a3a' },    // Dark gray-blue at top
                { stop: 0.3, color: '#2a3a4a' },  // Medium gray-blue
                { stop: 0.5, color: '#3a4a5a' },  // Light gray-blue
                { stop: 0.7, color: '#4a5a6a' },  // Cool blue-gray
                { stop: 0.9, color: '#5a6a7a' },  // Light blue-gray
                { stop: 1, color: '#6a7a8a' }     // Soft blue at bottom
            ];
            
        case 'DUNKIN_INTERIOR':
            // Coffee shop - warm, inviting, coffee tones
            return [
                { stop: 0, color: '#2a1a0a' },    // Dark brown at top
                { stop: 0.3, color: '#3a2a1a' },  // Medium brown
                { stop: 0.5, color: '#4a3a2a' },  // Coffee brown
                { stop: 0.7, color: '#5a4a3a' },  // Warm brown
                { stop: 0.9, color: '#6a5a4a' },  // Light brown
                { stop: 1, color: '#7a6a5a' }     // Creamy beige at bottom
            ];
            
        case 'FLOWER_SHOP_INTERIOR':
            // Vibrant, colorful - pinks, purples, greens
            return [
                { stop: 0, color: '#2a1a3a' },    // Dark purple at top
                { stop: 0.3, color: '#3a2a4a' },  // Medium purple
                { stop: 0.5, color: '#4a3a5a' },  // Light purple
                { stop: 0.7, color: '#5a4a6a' },  // Pink-purple
                { stop: 0.9, color: '#6a5a7a' },  // Soft pink
                { stop: 1, color: '#7a6a8a' }     // Light pink at bottom
            ];
            
        case 'CHURCH_INTERIOR':
            // Stained glass, ethereal - rich purples, blues, golds
            return [
                { stop: 0, color: '#1a1a3a' },    // Deep purple-blue at top
                { stop: 0.2, color: '#2a2a4a' },  // Rich purple
                { stop: 0.4, color: '#3a3a5a' },  // Medium purple
                { stop: 0.6, color: '#4a3a6a' },  // Purple-blue
                { stop: 0.8, color: '#5a4a7a' },  // Golden-purple
                { stop: 1, color: '#6a5a8a' }     // Soft gold-purple at bottom
            ];
            
        case 'TOWNHALL_INTERIOR':
            // Formal, official - cool grays and blues
            return [
                { stop: 0, color: '#1a1a2a' },    // Dark gray at top
                { stop: 0.3, color: '#2a2a3a' },  // Medium gray
                { stop: 0.5, color: '#3a3a4a' },  // Light gray
                { stop: 0.7, color: '#4a4a5a' },  // Cool gray
                { stop: 0.9, color: '#5a5a6a' },  // Light blue-gray
                { stop: 1, color: '#6a6a7a' }     // Soft blue-gray at bottom
            ];
            
        case 'HOUSE_INTERIOR':
            // Colonial home - warm, cozy, homey
            return [
                { stop: 0, color: '#2a1a1a' },    // Dark warm gray at top
                { stop: 0.3, color: '#3a2a1a' },  // Medium warm gray
                { stop: 0.5, color: '#4a3a2a' },  // Warm beige
                { stop: 0.7, color: '#5a4a3a' },  // Light beige
                { stop: 0.9, color: '#6a5a4a' },  // Creamy yellow
                { stop: 1, color: '#7a6a5a' }     // Warm cream at bottom
            ];
            
        case 'GRAVEYARD_INTERIOR':
            // Spooky, misty - dark grays, greens, purples
            return [
                { stop: 0, color: '#0a0a1a' },    // Very dark gray at top
                { stop: 0.2, color: '#1a1a2a' },  // Dark gray
                { stop: 0.4, color: '#2a2a3a' },  // Medium gray
                { stop: 0.6, color: '#2a3a2a' },  // Gray-green
                { stop: 0.8, color: '#3a4a3a' },  // Muted green
                { stop: 1, color: '#4a5a4a' }     // Dark green-gray at bottom
            ];
            
        case 'HOSPITAL_INTERIOR':
            // Clean, sterile - cool whites and blues
            return [
                { stop: 0, color: '#2a2a3a' },    // Dark gray-blue at top
                { stop: 0.3, color: '#3a3a4a' },  // Medium gray-blue
                { stop: 0.5, color: '#4a4a5a' },  // Light gray-blue
                { stop: 0.7, color: '#5a5a6a' },  // Cool white-blue
                { stop: 0.9, color: '#6a6a7a' },  // Light blue-white
                { stop: 1, color: '#7a7a8a' }     // Soft white-blue at bottom
            ];
            
        case 'MODERN_INTERIOR':
            // Sleek, contemporary - cool grays and blues
            return [
                { stop: 0, color: '#1a1a2a' },    // Dark gray at top
                { stop: 0.3, color: '#2a2a3a' },  // Medium gray
                { stop: 0.5, color: '#3a3a4a' },  // Light gray
                { stop: 0.7, color: '#4a4a5a' },  // Cool gray
                { stop: 0.9, color: '#5a5a6a' },  // Light blue-gray
                { stop: 1, color: '#6a6a7a' }     // Soft silver-blue at bottom
            ];
            
        case 'BRICK_INTERIOR':
            // Industrial, urban - warm browns and oranges
            return [
                { stop: 0, color: '#2a1a0a' },    // Dark brown at top
                { stop: 0.3, color: '#3a2a1a' },  // Medium brown
                { stop: 0.5, color: '#4a3a2a' },  // Brick brown
                { stop: 0.7, color: '#5a4a3a' },  // Warm brown
                { stop: 0.9, color: '#6a5a4a' },  // Orange-brown
                { stop: 1, color: '#7a6a5a' }     // Warm orange at bottom
            ];
            
        case 'SHOP_INTERIOR':
            // Generic retail - neutral grays
            return [
                { stop: 0, color: '#2a2a2a' },    // Dark gray at top
                { stop: 0.3, color: '#3a3a3a' },  // Medium gray
                { stop: 0.5, color: '#4a4a4a' },  // Light gray
                { stop: 0.7, color: '#5a5a5a' },  // Cool gray
                { stop: 0.9, color: '#6a6a6a' },  // Light gray
                { stop: 1, color: '#7a7a7a' }     // Soft gray at bottom
            ];
            
        case 'INDUSTRIAL_INTERIOR':
            // Raw, utilitarian - grays and yellows
            return [
                { stop: 0, color: '#1a1a1a' },    // Very dark gray at top
                { stop: 0.3, color: '#2a2a2a' },  // Dark gray
                { stop: 0.5, color: '#3a3a3a' },  // Medium gray
                { stop: 0.7, color: '#4a4a3a' },  // Gray-yellow
                { stop: 0.9, color: '#5a5a4a' },  // Yellow-tinted gray
                { stop: 1, color: '#6a6a5a' }     // Warm yellow-gray at bottom
            ];
            
        default:
            // Fallback to PLAZA gradient for unknown exterior scenes
            if (isInterior) {
                // Generic interior fallback - neutral gray-blue
                return [
                    { stop: 0, color: '#1a1a2a' },    // Dark gray-blue at top
                    { stop: 0.3, color: '#1e1e2e' },  // Slightly lighter
                    { stop: 0.5, color: '#2a2a3a' },  // Medium gray-blue
                    { stop: 0.7, color: '#2e2e3e' },  // Lighter gray-blue
                    { stop: 0.9, color: '#3a3a4a' },  // Light gray-blue
                    { stop: 1, color: '#4a4a5a' }     // Soft gray at bottom
                ];
            }
            // Fallback to PLAZA gradient for unknown exterior scenes
            return [
                { stop: 0, color: '#1a1a2e' },
                { stop: 0.3, color: '#16213e' },
                { stop: 0.5, color: '#2d1b69' },
                { stop: 0.7, color: '#4a2c7a' },
                { stop: 0.9, color: '#6b3a8a' },
                { stop: 1, color: '#8b4a9a' }
            ];
    }
};

// Create a deep blue-purple gradient skybox
const createSkybox = (scene, sceneType = 'PLAZA', interiorDimensions = null) => {
    // Create a simple gradient using a canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Get gradient colors based on scene type
    const colorStops = getGradientColors(sceneType);
    console.log(`🌅 Creating ${sceneType} skybox gradient with ${colorStops.length} color stops`);
    
    // Create vertical gradient from bottom to top
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    
    // Add color stops from the scene-specific palette
    colorStops.forEach(({ stop, color }) => {
        gradient.addColorStop(stop, color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Create texture from canvas
    const gradientTexture = new THREE.CanvasTexture(canvas);
    
    // Set the scene background directly using the gradient texture
    scene.background = gradientTexture;
    
    // Remove existing floor if it exists (from previous scene)
    if (scene.userData && scene.userData.floor) {
        scene.remove(scene.userData.floor);
        scene.userData.floor.geometry.dispose();
        scene.userData.floor.material.dispose();
    }
    
    // Also check for floor by name in case userData wasn't set
    const existingFloor = scene.getObjectByName("worldFloor");
    if (existingFloor) {
        scene.remove(existingFloor);
        existingFloor.geometry.dispose();
        existingFloor.material.dispose();
    }
    
    // Create a semi-transparent floor
    // For interior scenes, match the interior dimensions
    // For exterior scenes, use the default 300x300
    let floorWidth, floorHeight;
    if (interiorDimensions && interiorDimensions.width && interiorDimensions.depth) {
        floorWidth = interiorDimensions.width;
        floorHeight = interiorDimensions.depth;
        console.log(`🏪 Creating interior floor: ${floorWidth}x${floorHeight}`);
    } else {
        floorWidth = 300;
        floorHeight = 300;
        console.log(`🌍 Creating exterior floor: ${floorWidth}x${floorHeight}`);
    }
    
    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorHeight);
    
    // Set floor color based on scene type
    const floorColor = sceneType === 'FOREST_SUBURBAN' ? 0x228B22 : 
                      sceneType === 'POND' ? 0x1B4D3E : 0x333333; // Dark forest green for pond, green for forest, dark gray for city
    
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