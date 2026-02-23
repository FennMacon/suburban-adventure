// skybox.js - Deep blue-purple gradient skybox for the 3D scene

import * as THREE from 'three';

// Check for unified map mode (avoids circular dep - sceneType is passed as 'UNIFIED_MAP' from main.js)
const isUnifiedMapScene = (sceneType) => sceneType === 'UNIFIED_MAP' || sceneType === 'CITY_MAP';

// Daylight cycle keyframes: midnight (0), dawn (0.25), noon (0.5), dusk (0.75)
const DAY_GRADIENT_KEYFRAMES = {
    midnight: [
        { stop: 0, color: '#0a0a1e' },
        { stop: 0.2, color: '#0f0f2e' },
        { stop: 0.4, color: '#1a1a3e' },
        { stop: 0.6, color: '#2d1b4e' },
        { stop: 0.8, color: '#3a2a5a' },
        { stop: 1, color: '#4a3a6a' }
    ],
    dawn: [
        { stop: 0, color: '#ff7b00' },
        { stop: 0.3, color: '#ff9f4d' },
        { stop: 0.5, color: '#ffb380' },
        { stop: 0.7, color: '#ffccb3' },
        { stop: 0.9, color: '#ffe6d9' },
        { stop: 1, color: '#fff0eb' }
    ],
    noon: [
        { stop: 0, color: '#87CEEB' },
        { stop: 0.3, color: '#b0d9f0' },
        { stop: 0.5, color: '#d4ecf7' },
        { stop: 0.7, color: '#e8f4fa' },
        { stop: 0.9, color: '#f0f8ff' },
        { stop: 1, color: '#ffffff' }
    ],
    dusk: [
        { stop: 0, color: '#2d1b69' },
        { stop: 0.2, color: '#6b3a8a' },
        { stop: 0.4, color: '#9a5a8a' },
        { stop: 0.6, color: '#cc6b5a' },
        { stop: 0.8, color: '#e88b6a' },
        { stop: 1, color: '#ffaa80' }
    ]
};

// Canonical stop positions - unified layout for all phases (fixes jump at boundaries)
const CANONICAL_STOPS = [0, 0.2, 0.4, 0.5, 0.6, 0.8, 1];

// Interpolate between two color stops
const interpolateColor = (fromHex, toHex, t) => {
    const fromR = parseInt(fromHex.slice(1, 3), 16) / 255;
    const fromG = parseInt(fromHex.slice(3, 5), 16) / 255;
    const fromB = parseInt(fromHex.slice(5, 7), 16) / 255;
    const toR = parseInt(toHex.slice(1, 3), 16) / 255;
    const toG = parseInt(toHex.slice(3, 5), 16) / 255;
    const toB = parseInt(toHex.slice(5, 7), 16) / 255;
    const r = Math.round((fromR + (toR - fromR) * t) * 255);
    const g = Math.round((fromG + (toG - fromG) * t) * 255);
    const b = Math.round((fromB + (toB - fromB) * t) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Sample color at any stop position by interpolating between keyframe's adjacent stops
const sampleColorAtStop = (keyframeStops, stop) => {
    if (keyframeStops.length === 0) return '#000000';
    if (stop <= keyframeStops[0].stop) return keyframeStops[0].color;
    if (stop >= keyframeStops[keyframeStops.length - 1].stop) return keyframeStops[keyframeStops.length - 1].color;
    for (let i = 0; i < keyframeStops.length - 1; i++) {
        const a = keyframeStops[i];
        const b = keyframeStops[i + 1];
        if (stop >= a.stop && stop <= b.stop) {
            const t = (stop - a.stop) / (b.stop - a.stop);
            return interpolateColor(a.color, b.color, t);
        }
    }
    return keyframeStops[keyframeStops.length - 1].color;
};

// Get gradient colors for daylight cycle (UNIFIED_MAP only)
// dayProgress: 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk, 1 = midnight
const getGradientColorsForTime = (dayProgress) => {
    const keys = ['midnight', 'dawn', 'noon', 'dusk'];
    const positions = [0, 0.25, 0.5, 0.75];
    let idx = 0;
    for (let i = 0; i < positions.length; i++) {
        if (dayProgress >= positions[i]) idx = i;
    }
    const nextIdx = (idx + 1) % 4;
    const fromStops = DAY_GRADIENT_KEYFRAMES[keys[idx]];
    const toStops = DAY_GRADIENT_KEYFRAMES[keys[nextIdx]];
    const span = 0.25;
    const localProgress = nextIdx === 0 ? dayProgress - positions[idx] : (dayProgress - positions[idx]);
    const t = Math.min(1, Math.max(0, localProgress / span));
    const easedT = t * t * (3 - 2 * t); // smoothstep for softer fade
    // #region agent log
    const _lastIdx = getGradientColorsForTime._lastIdx;
    if (_lastIdx !== undefined && _lastIdx !== idx) {
        fetch('http://127.0.0.1:7242/ingest/f3d0524f-f482-4ec8-b4f3-8319dd2a9758',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'skybox.js:getGradientColorsForTime',message:'phase boundary crossed',data:{dayProgress,idx,nextIdx,prevIdx:_lastIdx,keyFrom:keys[idx],keyTo:keys[nextIdx],t},hypothesisId:'H3'})}).catch(()=>{});
    }
    getGradientColorsForTime._lastIdx = idx;
    // #endregion

    return CANONICAL_STOPS.map((stop) => ({
        stop,
        color: interpolateColor(sampleColorAtStop(fromStops, stop), sampleColorAtStop(toStops, stop), easedT)
    }));
};

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
        
        case 'UNIFIED_MAP':
            // Blended gradient for the full outdoor map - neutral twilight
            return [
                { stop: 0, color: '#1a1a2e' },    // Dark blue at top
                { stop: 0.3, color: '#16213e' }, // Navy blue
                { stop: 0.5, color: '#2d1b69' },  // Deep purple
                { stop: 0.7, color: '#4a2c7a' },  // Purple
                { stop: 0.9, color: '#6b3a8a' }, // Pinkish purple
                { stop: 1, color: '#8b4a9a' }     // Soft pink-purple at bottom
            ];

        case 'CITY_MAP':
            // Urban Allston - darker, streetlight amber glow at horizon
            return [
                { stop: 0, color: '#1a1a28' },    // Dark navy at top
                { stop: 0.3, color: '#1e1e30' },  // Slightly lighter
                { stop: 0.5, color: '#2a2535' },  // Muted
                { stop: 0.7, color: '#3a2a45' },  // Urban purple-gray
                { stop: 0.9, color: '#4a3540' },  // Warm streetlight tint
                { stop: 1, color: '#5a4035' }      // Amber sodium-vapor at bottom
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
    // #region agent log
    if (sceneType === 'UNIFIED_MAP') {
        fetch('http://127.0.0.1:7242/ingest/f3d0524f-f482-4ec8-b4f3-8319dd2a9758',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'skybox.js:createSkybox',message:'UNIFIED_MAP initial gradient',data:{firstColor:colorStops[0]?.color,lastColor:colorStops[colorStops.length-1]?.color},hypothesisId:'H4'})}).catch(()=>{});
    }
    // #endregion
    
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
    
    // Unified map uses zone-based ground from createUnifiedMapGround - skip floor here
    let floor = null;
    if (!isUnifiedMapScene(sceneType)) {
        // Create a semi-transparent floor
        // For interior scenes, match the interior dimensions
        // For single exterior, use 300x300
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
        const floorColor = sceneType === 'FOREST_SUBURBAN' ? 0x228B22 : 
                          sceneType === 'POND' ? 0x1B4D3E : 0x333333;
        const floorMaterial = new THREE.MeshBasicMaterial({
            color: floorColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.2;
        floor.name = "worldFloor";
        scene.add(floor);
    } else {
        console.log(`🗺️ Skipping skybox floor - unified map uses zone-based ground`);
    }
    
    // Store reference in scene.userData for updateSkybox
    if (!scene.userData) scene.userData = {};
    scene.userData.skybox = gradientTexture;
    scene.userData.skyboxCanvas = canvas;
    scene.userData.sceneType = sceneType;
    if (floor) scene.userData.floor = floor;
    
    return gradientTexture;
};

// Redraw gradient on canvas and mark texture for update
const redrawGradientTexture = (canvas, colorStops) => {
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    colorStops.forEach(({ stop, color }) => gradient.addColorStop(stop, color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
};

// Function to update skybox if needed in animation loop
const updateSkybox = (scene, time, dayProgress = 0) => {
    const st = scene.userData?.sceneType;
    if (st !== 'UNIFIED_MAP' && st !== 'CITY_MAP') return;
    const texture = scene.userData.skybox;
    const canvas = scene.userData.skyboxCanvas;
    if (!texture || !canvas) return;
    
    const prevProgress = scene.userData._skyLastDayProgress;
    const isFirstUpdate = prevProgress === undefined;
    // #region agent log
    if (isFirstUpdate) {
        fetch('http://127.0.0.1:7242/ingest/f3d0524f-f482-4ec8-b4f3-8319dd2a9758',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'skybox.js:updateSkybox',message:'first updateSkybox',data:{dayProgress,firstColorStop:getGradientColorsForTime(dayProgress)[0]?.color},hypothesisId:'H4'})}).catch(()=>{});
    } else if (prevProgress !== undefined && (Math.abs(dayProgress - prevProgress) > 0.08 || (prevProgress > 0.9 && dayProgress < 0.1))) {
        fetch('http://127.0.0.1:7242/ingest/f3d0524f-f482-4ec8-b4f3-8319dd2a9758',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'skybox.js:updateSkybox',message:'dayProgress jump in updateSkybox',data:{dayProgress,prevProgress,delta:dayProgress-prevProgress},hypothesisId:'H2'})}).catch(()=>{});
    }
    scene.userData._skyLastDayProgress = dayProgress;
    // #endregion
    
    const colorStops = getGradientColorsForTime(dayProgress);
    redrawGradientTexture(canvas, colorStops);
    texture.needsUpdate = true;
};

export { createSkybox, updateSkybox }; 