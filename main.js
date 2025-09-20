import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWireframeMaterial } from './utils.js';
import { createNightSky, updateNightSky } from './nightsky.js';
import { createSkybox, updateSkybox } from './skybox.js';
import { createParkElements, createBuildingFacade } from './buildings.js';
import { createNPCs } from './npcs.js';
import { getCurrentScene, getPlazaConfig, SCENE_CONFIGS } from './scenes.js';
import { 
    startConversation, 
    advanceConversation, 
    endConversation, 
    hasActiveConversation, 
    getCurrentDialogue,
    getUnlockedSongs,
    checkIfLastLine,
    unlockCurrentSong,
    conversationAtEnd,
    setConversationAtEnd
} from './dialogue.js';

// Scene setup
const scene = new THREE.Scene();
// Background will be handled by skybox

// Add PS2-style fog for retro aesthetic
scene.fog = new THREE.Fog(0x1a1a2e, 50, 200); // Dark blue fog, starts at 50 units, fully opaque at 200

// Scene Configuration System (now imported from scenes.js)

// Current active scene - load from localStorage or default to PLAZA
let CURRENT_SCENE = getCurrentScene();
let PLAZA_CONFIG = getPlazaConfig(CURRENT_SCENE);

// Function to switch scenes
const switchScene = (sceneName) => {
    if (SCENE_CONFIGS[sceneName]) {
        CURRENT_SCENE = sceneName;
        PLAZA_CONFIG = SCENE_CONFIGS[sceneName];
        
        // Save current camera position (should be at bus stop)
        const cameraPos = camera.position;
        const busStopCameraPosition = {
            x: -15, // Bus stop X position
            y: cameraPos.y, // Keep current height
            z: SCENE_CONFIGS[sceneName].NEAR_SIDEWALK_Z + 3 // A bit back from the bus stop in new scene
        };
        localStorage.setItem('busStopCameraPosition', JSON.stringify(busStopCameraPosition));
        
        // Save scene choice to localStorage
        localStorage.setItem('suburbanAdventureScene', sceneName);
        console.log(`Switching to ${PLAZA_CONFIG.name}`);
        // Trigger scene rebuild
        location.reload();
    }
};

/*
HOW TO USE THE ROW GROUPING SYSTEM:

1. MOVE ENTIRE SHOP ROW: 
   streetElements.frontShopsGroup.position.z = newZPosition;
   
2. MOVE ENTIRE FAR BUILDINGS ROW:
   streetElements.farBuildingsGroup.position.z = newZPosition;
   
3. MOVE STREET ELEMENTS:
   streetElements.nearSidewalkElementsGroup.position.z = newZPosition;  // Near sidewalk stuff
   streetElements.streetElementsGroup.position.z = newZPosition;        // Cars, buses
   streetElements.farSidewalkElementsGroup.position.z = newZPosition;   // Far sidewalk stuff
   
4. ADJUST ALL POSITIONS AT ONCE:
   Change values in PLAZA_CONFIG above, all elements will use them
   
5. ACCESS GROUPS:
   - streetElements.frontShopsGroup - Contains all shops + complete karaoke bar (building, door, windows, sign, text, interior: bar, stools, tables, chairs, stage, microphone, TV, speakers, beers, signup sheet, fairies)
   - streetElements.farBuildingsGroup - Contains all background buildings
   - streetElements.nearSidewalkElementsGroup - Contains streetlights, benches, trash cans, bus stop (near)
   - streetElements.streetElementsGroup - Contains cars, buses (vehicles on street)
   - streetElements.farSidewalkElementsGroup - Contains streetlights, benches, trash cans (far)
   
6. ELEMENTS IN GROUPS:
   - All individual elements positioned at their X coordinates, Z=0 (group handles Z)
   - Near sidewalk: streetlights, benches, trash cans, bus stop
   - Street: cars, buses (with relative lane positioning)
   - Far sidewalk: streetlights, benches, trash cans
   - All Z positioning is handled by the group that contains each element
   
7. LANE SYSTEM (within streetElementsGroup):
   - Left lane (cars going left): Z = +2 (relative to street group)
   - Right lane (cars going right): Z = -2 (relative to street group)  
   - Bus lane (far right): Z = -5 (relative to street group)
   - Street group itself positioned at PLAZA_CONFIG.STREET_Z (11)
*/

// Track the orbiting center point for fairies
let fairyOrbitCenter = new THREE.Vector3(0, 6, -10); // Default position
let fairyOrbitTime = 0;

// Share scene reference with audio.js for test buttons
if (typeof setSceneReference === 'function') {
    setSceneReference(scene);
}

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Check if we're returning from a bus stop scene switch
const savedBusStopPosition = localStorage.getItem('busStopCameraPosition');
let shouldRotate180 = false;
if (savedBusStopPosition) {
    const busStopPos = JSON.parse(savedBusStopPosition);
    camera.position.set(busStopPos.x, busStopPos.y, busStopPos.z);
    shouldRotate180 = true; // Flag to rotate 180° after yaw is initialized
    localStorage.removeItem('busStopCameraPosition'); // Clean up after use
} else {
    camera.position.set(0, 2, PLAZA_CONFIG.CAMERA_START_Z); // Default starting position
}

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    antialias: false, // Disable antialiasing for pixelated effect
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Force pixel ratio to 1 for more pixelated look
document.body.appendChild(renderer.domElement);

// First-person camera controls
let mouseX = 0, mouseY = 0;
let pitch = 0, yaw = 0;
const mouseSensitivity = 0.002;
const maxPitch = Math.PI / 3; // Limit vertical look range

// Apply 180° rotation if returning from bus travel
if (shouldRotate180) {
    yaw = Math.PI; // Face opposite direction (180°)
}

// Pointer lock for first-person controls
let isPointerLocked = false;

const onMouseMove = (event) => {
    if (!isPointerLocked) return;
    
    mouseX = event.movementX;
    mouseY = event.movementY;
    
    yaw -= mouseX * mouseSensitivity;
    pitch -= mouseY * mouseSensitivity;
    
    // Limit vertical look
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
};

const onPointerLockChange = () => {
    isPointerLocked = document.pointerLockElement === renderer.domElement;
};

const onPointerLockError = () => {
    console.log('Pointer lock error');
};

// Click to enable mouse look
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('pointerlockchange', onPointerLockChange, false);
document.addEventListener('pointerlockerror', onPointerLockError, false);

// Controls UI removed - players can figure out basic FPS controls

// Add WASD and arrow keyboard controls for camera movement
const keyboard = { w: false, a: false, s: false, d: false, shift: false, up: false, down: false, left: false, right: false };
const moveSpeed = 0.2; // Speed of movement
const sprintMultiplier = 2.0; // Speed multiplier when shift is pressed

// Mobile touch controls
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchControls = {
    joystick: { active: false, x: 0, y: 0, centerX: 0, centerY: 0 },
    look: { active: false, startX: 0, startY: 0, lastX: 0, lastY: 0 },
    sprint: false
};

// Mobile action button state
let mobileActionButton = null;
let currentAction = null; // 'talk', 'travel', or null

// Camera movement function updated for first-person controls

document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'KeyW': keyboard.w = true; break;
        case 'KeyA': keyboard.a = true; break;
        case 'KeyS': keyboard.s = true; break;
        case 'KeyD': keyboard.d = true; break;
        case 'ArrowUp': keyboard.up = true; break;
        case 'ArrowDown': keyboard.down = true; break;
        case 'ArrowLeft': keyboard.left = true; break;
        case 'ArrowRight': keyboard.right = true; break;
        case 'ShiftLeft':
        case 'ShiftRight':
            keyboard.shift = true; break;
        case 'KeyF': // Press F to switch between scenes (only at bus stop)
            // Check if player is near the bus stop (approximate position)
            const busStopPosition = new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z); // Bus stop position
            const playerPosition = camera.position;
            const distanceToBusStop = playerPosition.distanceTo(busStopPosition);
            
            if (distanceToBusStop < 5) { // Within 5 units of bus stop
                if (CURRENT_SCENE === 'PLAZA') {
                    switchScene('FOREST_SUBURBAN');
                } else {
                    switchScene('PLAZA');
                }
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'KeyW': keyboard.w = false; break;
        case 'KeyA': keyboard.a = false; break;
        case 'KeyS': keyboard.s = false; break;
        case 'KeyD': keyboard.d = false; break;
        case 'ArrowUp': keyboard.up = false; break;
        case 'ArrowDown': keyboard.down = false; break;
        case 'ArrowLeft': keyboard.left = false; break;
        case 'ArrowRight': keyboard.right = false; break;
        case 'ShiftLeft':
        case 'ShiftRight':
            keyboard.shift = false; break;
    }
});

// Mobile touch controls
if (isMobile) {
    // Create mobile UI elements
    const mobileUI = document.createElement('div');
    mobileUI.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 1000;
        user-select: none;
    `;
    document.body.appendChild(mobileUI);

    // Virtual joystick for movement
    const joystick = document.createElement('div');
    joystick.style.cssText = `
        position: absolute;
        bottom: 80px;
        left: 80px;
        width: 120px;
        height: 120px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const joystickKnob = document.createElement('div');
    joystickKnob.style.cssText = `
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        transition: transform 0.1s ease;
    `;
    joystick.appendChild(joystickKnob);
    mobileUI.appendChild(joystick);

    // Dynamic action button (Talk/Travel)
    mobileActionButton = document.createElement('div');
    mobileActionButton.style.cssText = `
        position: absolute;
        bottom: 80px;
        right: 80px;
        width: 80px;
        height: 80px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        text-align: center;
        line-height: 1.2;
        font-weight: bold;
    `;
    mobileActionButton.innerHTML = 'RUN';
    mobileUI.appendChild(mobileActionButton);

    // Touch event handlers for joystick
    const handleJoystickStart = (e) => {
        e.preventDefault();
        const rect = joystick.getBoundingClientRect();
        touchControls.joystick.centerX = rect.left + rect.width / 2;
        touchControls.joystick.centerY = rect.top + rect.height / 2;
        touchControls.joystick.active = true;
        
        const touch = e.touches ? e.touches[0] : e;
        touchControls.joystick.x = touch.clientX - touchControls.joystick.centerX;
        touchControls.joystick.y = touch.clientY - touchControls.joystick.centerY;
        
        updateJoystickPosition();
    };

    const handleJoystickMove = (e) => {
        if (!touchControls.joystick.active) return;
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        touchControls.joystick.x = touch.clientX - touchControls.joystick.centerX;
        touchControls.joystick.y = touch.clientY - touchControls.joystick.centerY;
        
        updateJoystickPosition();
    };

    const handleJoystickEnd = (e) => {
        e.preventDefault();
        touchControls.joystick.active = false;
        touchControls.joystick.x = 0;
        touchControls.joystick.y = 0;
        joystickKnob.style.transform = 'translate(0, 0)';
    };

    const updateJoystickPosition = () => {
        const maxDistance = 40; // Half of joystick radius
        const distance = Math.sqrt(touchControls.joystick.x * touchControls.joystick.x + touchControls.joystick.y * touchControls.joystick.y);
        
        if (distance > maxDistance) {
            const angle = Math.atan2(touchControls.joystick.y, touchControls.joystick.x);
            touchControls.joystick.x = Math.cos(angle) * maxDistance;
            touchControls.joystick.y = Math.sin(angle) * maxDistance;
        }
        
        joystickKnob.style.transform = `translate(${touchControls.joystick.x}px, ${touchControls.joystick.y}px)`;
    };

    // Touch event handlers for camera look
    const handleLookStart = (e) => {
        // Only handle look if not touching joystick or action button
        const rect = joystick.getBoundingClientRect();
        const actionRect = mobileActionButton.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        
        if (touch.clientX >= rect.left && touch.clientX <= rect.right && 
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            return; // Touching joystick
        }
        
        if (touch.clientX >= actionRect.left && touch.clientX <= actionRect.right && 
            touch.clientY >= actionRect.top && touch.clientY <= actionRect.bottom) {
            return; // Touching action button
        }
        
        e.preventDefault();
        touchControls.look.active = true;
        touchControls.look.startX = touch.clientX;
        touchControls.look.startY = touch.clientY;
        touchControls.look.lastX = touch.clientX;
        touchControls.look.lastY = touch.clientY;
    };

    const handleLookMove = (e) => {
        if (!touchControls.look.active) return;
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - touchControls.look.lastX;
        const deltaY = touch.clientY - touchControls.look.lastY;
        
        yaw -= deltaX * mouseSensitivity * 2; // Slightly more sensitive for touch
        pitch -= deltaY * mouseSensitivity * 2;
        
        // Limit vertical look
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
        
        touchControls.look.lastX = touch.clientX;
        touchControls.look.lastY = touch.clientY;
    };

    const handleLookEnd = (e) => {
        e.preventDefault();
        touchControls.look.active = false;
    };

    // Action button handlers
    const handleActionStart = (e) => {
        e.preventDefault();
        
        if (currentAction === 'talk') {
            // Handle NPC conversation
            if (hasActiveConversation()) {
                // Continue ongoing conversation
                const stillActive = advanceConversation();
                if (stillActive) {
                    const dialogue = getCurrentDialogue();
                    interactionUI.style.display = 'block';
                    showDialogueStep(dialogue);
                } else {
                    // Conversation ended
                    interactionUI.style.display = 'none';
                    setTimeout(() => {
                        // Allow new interactions after a brief delay
                    }, 1000);
                }
            } else if (nearbyNPC) {
                // Start new conversation
                const success = startConversation(nearbyNPC.userData.name, CURRENT_SCENE);
                if (success) {
                    const dialogue = getCurrentDialogue();
                    interactionUI.style.display = 'block';
                    showDialogueStep(dialogue);
                }
            }
        } else if (currentAction === 'travel') {
            // Handle scene switching
            const busStopPosition = new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
            const playerPosition = camera.position;
            const distanceToBusStop = playerPosition.distanceTo(busStopPosition);
            
            if (distanceToBusStop < 5) { // Within 5 units of bus stop
                if (CURRENT_SCENE === 'PLAZA') {
                    switchScene('FOREST_SUBURBAN');
                } else {
                    switchScene('PLAZA');
                }
            }
        } else {
            // Default to sprint
            touchControls.sprint = true;
        }
        
        mobileActionButton.style.background = 'rgba(255, 255, 255, 0.3)';
    };

    const handleActionEnd = (e) => {
        e.preventDefault();
        touchControls.sprint = false;
        mobileActionButton.style.background = 'rgba(0, 0, 0, 0.3)';
    };

    // Add event listeners
    joystick.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystick.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystick.addEventListener('touchend', handleJoystickEnd, { passive: false });
    
    mobileActionButton.addEventListener('touchstart', handleActionStart, { passive: false });
    mobileActionButton.addEventListener('touchend', handleActionEnd, { passive: false });
    
    document.addEventListener('touchstart', handleLookStart, { passive: false });
    document.addEventListener('touchmove', handleLookMove, { passive: false });
    document.addEventListener('touchend', handleLookEnd, { passive: false });
}

// Function to update mobile action button based on proximity
const updateMobileActionButton = () => {
    if (!isMobile || !mobileActionButton) return;
    
    const cameraPosition = camera.position;
    let newAction = null;
    let buttonText = 'RUN';
    let buttonColor = 'rgba(0, 0, 0, 0.3)';
    
    // Check for nearby NPCs
    if (streetElements.npcs) {
        for (let npc of streetElements.npcs) {
            const distance = cameraPosition.distanceTo(npc.position);
            if (distance < 3) {
                newAction = 'talk';
                buttonText = 'TALK';
                buttonColor = 'rgba(255, 100, 100, 0.3)';
                break;
            }
        }
    }
    
    // Check for bus stop proximity
    if (newAction === null) {
        const busStopPosition = new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
        const distanceToBusStop = cameraPosition.distanceTo(busStopPosition);
        
        if (distanceToBusStop < 5) {
            newAction = 'travel';
            buttonText = 'TRAVEL';
            buttonColor = 'rgba(100, 255, 100, 0.3)';
        }
    }
    
    // Update button if action changed
    if (newAction !== currentAction) {
        currentAction = newAction;
        mobileActionButton.innerHTML = buttonText;
        mobileActionButton.style.background = buttonColor;
    }
};

// Function to update camera position based on WASD input
const updateCameraPosition = () => {
    // Update camera rotation based on mouse movement (first-person)
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    
    // Calculate actual speed (with sprint if shift is pressed or mobile sprint button)
    const actualSpeed = (keyboard.shift || touchControls.sprint) ? moveSpeed * sprintMultiplier : moveSpeed;
    
    // Get the camera's forward and right directions
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    
    // Remove vertical component for level movement
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();
    
    // Apply movement based on keys pressed (WASD, Arrow keys, and mobile joystick)
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    // Forward movement (W, Up Arrow, or mobile joystick up)
    if (keyboard.w || keyboard.up || (touchControls.joystick.active && touchControls.joystick.y < -10)) {
        moveDirection.add(forward);
    }
    // Backward movement (S, Down Arrow, or mobile joystick down)
    if (keyboard.s || keyboard.down || (touchControls.joystick.active && touchControls.joystick.y > 10)) {
        moveDirection.sub(forward);
    }
    // Left movement (A, Left Arrow, or mobile joystick left)
    if (keyboard.a || keyboard.left || (touchControls.joystick.active && touchControls.joystick.x < -10)) {
        moveDirection.sub(right);
    }
    // Right movement (D, Right Arrow, or mobile joystick right)
    if (keyboard.d || keyboard.right || (touchControls.joystick.active && touchControls.joystick.x > 10)) {
        moveDirection.add(right);
    }
    
    // Normalize and scale by speed
    if (moveDirection.length() > 0) {
        moveDirection.normalize().multiplyScalar(actualSpeed);
        camera.position.add(moveDirection);
    }
};


// Low resolution effect
const pixelRatio = 0.7; // Increased from 0.5 for less blur

// Create pixelated render target
const renderTargetWidth = Math.floor(window.innerWidth * pixelRatio);
const renderTargetHeight = Math.floor(window.innerHeight * pixelRatio);
const renderTarget = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight);

// Create ping-pong render targets for feedback post-processing
let postBufferA = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
});
let postBufferB = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
});

// Add a solid black plane below the road to block stars from showing through
const createGroundPlane = () => {
    // Create a large black plane to prevent stars from being visible through the plaza
    const groundGeometry = new THREE.PlaneGeometry(300, 300); // Larger for plaza
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        side: THREE.DoubleSide,
    });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = Math.PI / 2; // Flat horizontal plane
    groundPlane.position.y = -1; // Positioned below the road
    scene.add(groundPlane);
};

// Create post-processing scene
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;         // Current scene render
        uniform sampler2D tFeedback;        // Previous frame's post-processed output
        uniform vec2 resolution;            // Resolution of the screen
        uniform float scanlineIntensity;
        uniform float scanlineFrequency;
        uniform float barrelDistortion;     // For screen curvature
        uniform float feedbackAmount;       // How much of the previous frame to blend
        uniform bool u_applyEffects;        // Switch for effect pass vs display pass
        uniform float toneMappingStrength;  // Strength of the tone mapping

        varying vec2 vUv;
        
        // Barrel distortion function
        vec2 distort(vec2 uv, float strength) {
            vec2 cc = uv - 0.5; // Center coordinates
            float dist = dot(cc, cc) * strength;
            return (uv + cc * dist);
        }

        void main() {
            if (u_applyEffects) {
                // Apply barrel distortion for current scene lookup
                vec2 distortedUv = distort(vUv, barrelDistortion);

                vec4 currentFrameTexel = vec4(0.0);
                // Only sample if UVs are within [0,1] range after distortion
                if (distortedUv.x >= 0.0 && distortedUv.x <= 1.0 && distortedUv.y >= 0.0 && distortedUv.y <= 1.0) {
                    currentFrameTexel = texture2D(tDiffuse, distortedUv);
                }

                // Feedback from previous post-processed frame (sample with non-distorted UVs)
                vec4 feedbackTexel = texture2D(tFeedback, vUv);

                // Slightly dim the current frame before blending to compensate for brightness increase
                vec3 dimmedCurrentFrame = currentFrameTexel.rgb * 0.92; // Dim factor (0.0 to 1.0)
                // Blend the dimmed current frame with the faded feedback
                vec3 blendedColor = dimmedCurrentFrame + feedbackTexel.rgb * feedbackAmount;
                
                // Apply scanlines to the blended result (using distorted UVs for CRT consistency)
                float scanlineEffect = sin(distortedUv.y * scanlineFrequency) * scanlineIntensity;
                vec3 crtAffectedColor = blendedColor - scanlineEffect;

                // Reinhard tone mapping to control brightness and glow
                vec3 reinhardMapped = crtAffectedColor / (crtAffectedColor + vec3(1.0));

                // Blend between original (pre-tone mapping) and tone-mapped color
                vec3 blendedToneMappedColor = mix(crtAffectedColor, reinhardMapped, toneMappingStrength);
                
                // Clamp the final color to ensure it's within displayable range
                vec3 finalColor = clamp(blendedToneMappedColor, 0.0, 1.0);
                
                gl_FragColor = vec4(finalColor, currentFrameTexel.a); // Use alpha from current frame
            } else {
                // Simple display pass: just show the input texture
                gl_FragColor = texture2D(tDiffuse, vUv);
            }
        }
    `,
    uniforms: {
        tDiffuse: { value: renderTarget.texture },
        tFeedback: { value: null }, // Will be set to postBufferB.texture
        resolution: { value: new THREE.Vector2(renderTargetWidth, renderTargetHeight) },
        scanlineIntensity: { value: 0.03 }, // Reduced from 0.05
        scanlineFrequency: { value: renderTargetHeight * 1.5 },
        barrelDistortion: { value: 0.15 }, // Reduced from 0.15 for less blur
        feedbackAmount: { value: 0.65 }, // User adjusted value
        u_applyEffects: { value: true }, // Default to applying effects
        toneMappingStrength: { value: 0.65 } // Default to 70% tone mapping strength
    }
});
const postPlane = new THREE.PlaneGeometry(2, 2);
const postQuad = new THREE.Mesh(postPlane, postMaterial);
const postScene = new THREE.Scene();
postScene.add(postQuad);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Create a glowing wireframe material
const createGlowingWireframeMaterial = (color, opacity = 1.0, glowIntensity = 0.5) => {
    // Create a custom shader material that adds a glow effect
    return new THREE.ShaderMaterial({
        uniforms: {
            baseColor: { value: new THREE.Color(color) },
            opacity: { value: opacity },
            glowIntensity: { value: glowIntensity }
        },
        vertexShader: `
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vPosition = position;
                vNormal = normal;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 baseColor;
            uniform float opacity;
            uniform float glowIntensity;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                // Calculate wireframe effect
                float thickness = 0.05;
                vec3 fdx = vec3(dFdx(vPosition.x), dFdx(vPosition.y), dFdx(vPosition.z));
                vec3 fdy = vec3(dFdy(vPosition.x), dFdy(vPosition.y), dFdy(vPosition.z));
                vec3 normal = normalize(cross(fdx, fdy));
                
                // Calculate edge factor for wireframe effect
                float edgeFactor = abs(dot(normal, normalize(vNormal)));
                edgeFactor = step(1.0 - thickness, edgeFactor);
                
                // Apply color with glow
                vec3 finalColor = baseColor * (1.0 + glowIntensity);
                gl_FragColor = vec4(finalColor, opacity * (1.0 - edgeFactor));
            }
        `,
        wireframe: true,
        transparent: true,
        side: THREE.DoubleSide
    });
};

// Materials - now imported from utils.js

// Helper function to create thick wireframes for objects
const addThickWireframe = (mesh, color, thickness = 2) => {
    // Create edges geometry from the original geometry
    const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry);
    
    // Create a line material with the given color and thickness
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: color,
        linewidth: thickness // Note: linewidth has limited browser support
    });
    
    // Create line segments for the edges
    const wireframe = new THREE.LineSegments(edgesGeometry, lineMaterial);
    
    // Add the wireframe directly to the mesh so it moves with it
    mesh.add(wireframe);
    
    return wireframe;
};

// Scene management
const sceneGroups = {
    exterior: new THREE.Group(),
    interior: new THREE.Group()
};

// Add scene groups to main scene
Object.values(sceneGroups).forEach(group => {
    scene.add(group);
});

// Create the ground plane to block stars from being visible through the road
createGroundPlane();

// Scene state management - simplified to always be interior
let currentScene = 'interior';

// Update opacity of interior elements
const updateInteriorOpacity = (progress) => {
    // We don't need to modify interior opacity anymore
    // Interior elements are always visible, but hidden by the building walls
    // console.log(`Interior opacity updateInteriorOpacity() no longer needed`);
};

// New function to update building opacity during transition
const updateBuildingOpacity = (progress) => {
    // We no longer need to manipulate opacity
    // The transition is now handled by camera movement only
    console.log(`Camera transition progress: ${progress.toFixed(2)}`);
};

// Update exterior opacity - MODIFIED for new approach
const updateExteriorOpacity = (progress) => {
    // Only fade out things like streetlights, cars, etc. but not the building itself
    sceneGroups.exterior.traverse(function(object) {
        if (object.isMesh && object.material) {
            // Check if the object is not one of our building walls
            if (!streetElements.walls.includes(object)) {
                if (!object.userData.originalOpacity) {
                    object.userData.originalOpacity = object.material.opacity !== undefined ? object.material.opacity : 1.0;
                }
                
                // Set transparent flag and update opacity
                object.material.transparent = true;
                object.material.opacity = progress * object.userData.originalOpacity;
                object.material.needsUpdate = true;
            }
        }
    });
};

// Create a car with the specified color and direction
const createCar = (x, color, direction) => {
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
    
    // Front-left wheel
    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.rotation.x = Math.PI / 2;
    wheel1.position.set(-0.7, 0.2, 0.5);
    carGroup.add(wheel1);
    
    // Front-right wheel
    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.rotation.x = Math.PI / 2;
    wheel2.position.set(-0.7, 0.2, -0.5);
    carGroup.add(wheel2);
    
    // Back-left wheel
    const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel3.rotation.x = Math.PI / 2;
    wheel3.position.set(0.7, 0.2, 0.5);
    carGroup.add(wheel3);
    
    // Back-right wheel
    const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel4.rotation.x = Math.PI / 2;
    wheel4.position.set(0.7, 0.2, -0.5);
    carGroup.add(wheel4);
    
    // Position and rotate based on direction
    carGroup.position.set(x, 0, 0); // Z is handled by the group that contains it
    if (direction === 'left') {
        // Fix rotation: cars going left should point in the -x direction (looking from +z to -z)
        carGroup.rotation.y = 0; // No rotation needed as the car model already faces the right way
    } else {
        // Fix rotation: cars going right should point in the +x direction (looking from +z to -z)
        carGroup.rotation.y = Math.PI; // 180 degrees to face the opposite direction
    }
    
    carGroup.userData.direction = direction; // Store direction for animation
    
    return carGroup;
};

// Function to get a random car color
const getRandomCarColor = () => {
    const carColors = [
        0xff0000, // Red
        0x00ff00, // Green
        0x0000ff, // Blue
        0xffff00, // Yellow
        0xff00ff, // Magenta
        0x00ffff, // Cyan
        0xffa500, // Orange
        0x800080, // Purple
        0x008000, // Dark Green
        0x000080, // Navy
        0x808080, // Gray
        0xffffff  // White
    ];
    return carColors[Math.floor(Math.random() * carColors.length)];
};

// New England Tree Species Creation
const createTree = (x, z, scale = 1, treeType = null) => {
    const treeGroup = new THREE.Group();
    
    // Define New England tree species with realistic characteristics
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
            foliageColor: 0x8B0000,  // Deep red for fall colors
            height: 6 + Math.random() * 3,
            trunkWidth: 0.5,
            foliageShape: 'round',
            foliageSize: 3.0,
            layers: 2
        },
        'Northern Red Oak': {
            trunkColor: 0x8B4513,
            foliageColor: 0x2F4F2F,  // Dark green
            height: 7 + Math.random() * 5,
            trunkWidth: 0.8,
            foliageShape: 'broad',
            foliageSize: 3.5,
            layers: 3
        },
        'Eastern Hemlock': {
            trunkColor: 0x696969,
            foliageColor: 0x006400,  // Dark forest green
            height: 6 + Math.random() * 3,
            trunkWidth: 0.4,
            foliageShape: 'drooping',
            foliageSize: 2.5,
            layers: 5
        },
        'Red Pine': {
            trunkColor: 0xA0522D,  // Reddish brown
            foliageColor: 0x228B22,
            height: 7 + Math.random() * 4,
            trunkWidth: 0.5,
            foliageShape: 'sparse',
            foliageSize: 1.8,
            layers: 3
        },
        'American Beech': {
            trunkColor: 0xD2B48C,  // Light brown/gray
            foliageColor: 0x32CD32,  // Bright green
            height: 5 + Math.random() * 3,
            trunkWidth: 0.6,
            foliageShape: 'dense',
            foliageSize: 2.8,
            layers: 2
        }
    };
    
    // Select random tree type if none specified
    const typeNames = Object.keys(treeTypes);
    const selectedType = treeType || typeNames[Math.floor(Math.random() * typeNames.length)];
    const tree = treeTypes[selectedType];
    
    // Create trunk with species-specific characteristics
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
    
    // Create foliage based on tree type
    const foliageMaterial = createWireframeMaterial(tree.foliageColor);
    
    switch (tree.foliageShape) {
        case 'conical': // Pine trees
            for (let i = 0; i < tree.layers; i++) {
                const layerHeight = trunkHeight * 0.6 + (i * trunkHeight * 0.15);
                const layerSize = tree.foliageSize * scale * (1 - i * 0.2);
                const coneGeometry = new THREE.ConeGeometry(layerSize, layerSize * 0.8, 8);
                const layer = new THREE.Mesh(coneGeometry, foliageMaterial);
                layer.position.y = layerHeight;
                treeGroup.add(layer);
            }
            break;
            
        case 'round': // Maple
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
            
        case 'broad': // Oak
            for (let i = 0; i < tree.layers; i++) {
                const foliageGeometry = new THREE.SphereGeometry(tree.foliageSize * scale, 6, 6);
                foliageGeometry.scale(1.2, 0.8, 1.2); // Flatten for broad canopy
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.set(
                    (Math.random() - 0.5) * 2 * scale,
                    trunkHeight * 0.8 + (Math.random() - 0.5) * scale,
                    (Math.random() - 0.5) * 2 * scale
                );
                treeGroup.add(foliage);
            }
            break;
            
        case 'drooping': // Hemlock
            for (let i = 0; i < tree.layers; i++) {
                // Start from the top and work down
                const layerHeight = trunkHeight * 0.95 - (i * trunkHeight * 0.15);
                const layerSize = tree.foliageSize * scale * (0.7 + i * 0.1); // Smaller at top, larger at bottom
                const ellipseGeometry = new THREE.SphereGeometry(layerSize, 6, 6);
                ellipseGeometry.scale(1, 0.6, 1); // Drooping effect
                const layer = new THREE.Mesh(ellipseGeometry, foliageMaterial);
                layer.position.y = layerHeight;
                treeGroup.add(layer);
            }
            break;
            
        case 'sparse': // Red Pine
            for (let i = 0; i < tree.layers; i++) {
                if (Math.random() > 0.2) { // Less sparse foliage
                    const needleGeometry = new THREE.SphereGeometry(tree.foliageSize * scale, 6, 6);
                    const needles = new THREE.Mesh(needleGeometry, foliageMaterial);
                    needles.position.set(
                        (Math.random() - 0.5) * 1.5 * scale,
                        trunkHeight * 0.7 + Math.random() * trunkHeight * 0.25, // 70% to 95% coverage
                        (Math.random() - 0.5) * 1.5 * scale
                    );
                    treeGroup.add(needles);
                }
            }
            break;
            
        case 'dense': // Beech
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

const createBush = (x, z, scale = 1) => {
    const bushGroup = new THREE.Group();
    
    // Multiple small spheres for bushy look
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

const createForestElements = () => {
    const forestGroup = new THREE.Group();
    forestGroup.name = "Forest Elements";
    
    let treeCount = 0;
    
    // Define clear zones to avoid building conflicts and road
    const buildingZones = [
        // Front shops area
        { left: -70, right: 70, front: -10, back: 15 },
        // Far buildings area (if any) - expanded to cover actual building positions
        { left: -70, right: 70, front: 20, back: 50 },
        // Parking area
        { left: -50, right: 50, front: 50, back: 70 }
    ];
    
    // Road exclusion zone (street is 300 wide, 12 deep, centered at Z=11)
    const roadZone = {
        left: -150,  // Half of 300
        right: 150,  // Half of 300
        front: 5,    // Street starts at Z=5 (11 - 6)
        back: 17     // Street ends at Z=17 (11 + 6)
    };
    
    // Sidewalk exclusion zones
    const nearSidewalkZone = {
        left: -150,  // Full width
        right: 150,  // Full width
        front: -1,   // Near sidewalk starts at Z=-1 (2 - 3)
        back: 5      // Near sidewalk ends at Z=5 (2 + 3)
    };
    
    const farSidewalkZone = {
        left: -150,  // Full width
        right: 150,  // Full width
        front: 17,   // Far sidewalk starts at Z=17 (20 - 3)
        back: 23     // Far sidewalk ends at Z=23 (20 + 3)
    };
    
    const isInBuildingZone = (x, z) => {
        return buildingZones.some(zone => 
            x >= zone.left && x <= zone.right && 
            z >= zone.front && z <= zone.back
        );
    };
    
    const isInRoadZone = (x, z) => {
        return x >= roadZone.left && x <= roadZone.right && 
               z >= roadZone.front && z <= roadZone.back;
    };
    
    const isInSidewalkZone = (x, z) => {
        // Check near sidewalk
        const inNearSidewalk = x >= nearSidewalkZone.left && x <= nearSidewalkZone.right && 
                              z >= nearSidewalkZone.front && z <= nearSidewalkZone.back;
        // Check far sidewalk
        const inFarSidewalk = x >= farSidewalkZone.left && x <= farSidewalkZone.right && 
                             z >= farSidewalkZone.front && z <= farSidewalkZone.back;
        return inNearSidewalk || inFarSidewalk;
    };
    
    // Park exclusion zone (gazebo, benches, and stone wall area)
    const parkZone = {
        left: -45,    // Park extends 45 units left and right from center (outside stone wall)
        right: 45,
        front: -50,   // Park extends from z=-50 (behind stone wall) to z=5 (front of park)
        back: 5
    };
    
    const isInParkZone = (x, z) => {
        return x >= parkZone.left && x <= parkZone.right && 
               z >= parkZone.front && z <= parkZone.back;
    };
    
    const selectTreeType = () => {
        const rand = Math.random() * 100;
        if (rand < 25) return 'Eastern White Pine';
        else if (rand < 45) return 'Red Maple';
        else if (rand < 65) return 'Northern Red Oak';
        else if (rand < 80) return 'Eastern Hemlock';
        else if (rand < 92) return 'American Beech';
        else return 'Red Pine';
    };
    
    // Unified forest generation - cover entire floor area except exclusion zones
    const forestBounds = {
        left: -145,
        right: 145, 
        front: -145,
        back: 145
    };
    
    // Generate trees across the entire floor area with consistent spacing
    for (let x = forestBounds.left; x <= forestBounds.right; x += 6 + Math.random() * 2) {
        for (let z = forestBounds.front; z <= forestBounds.back; z += 6 + Math.random() * 2) {
            const treeX = x + (Math.random() - 0.5) * 2;
            const treeZ = z + (Math.random() - 0.5) * 2;
            
            // Only place trees if they're not in any exclusion zone
            if (!isInBuildingZone(treeX, treeZ) && !isInRoadZone(treeX, treeZ) && !isInSidewalkZone(treeX, treeZ) && !isInParkZone(treeX, treeZ)) {
                const tree = createTree(treeX, treeZ, 0.6 + Math.random() * 0.4, selectTreeType());
                forestGroup.add(tree);
                treeCount++;
            }
        }
    }
    
    console.log(`🌲 Generated ${treeCount} New England trees for forest (avoiding buildings)`);
    return forestGroup;
};

const createStoneWall = () => {
    const wallGroup = new THREE.Group();
    wallGroup.name = "New England Stone Wall";
    
    // Create classic New England stone wall along the road edge
    const wallLength = 160; // Total length
    const stoneSize = 0.8;
    const wallHeight = 1.2;
    
    for (let x = -80; x <= 80; x += stoneSize + Math.random() * 0.3) {
        // No gaps - continuous stone wall across the whole length
        
        // Create wall segment with stacked stones
        for (let y = 0; y < wallHeight; y += stoneSize * 0.7) {
            const stoneGeometry = new THREE.BoxGeometry(
                stoneSize + Math.random() * 0.4,
                stoneSize * 0.6 + Math.random() * 0.2,
                stoneSize * 0.8 + Math.random() * 0.3
            );
            const stoneMaterial = createWireframeMaterial(0x696969); // Gray stone
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            stone.position.set(
                x + (Math.random() - 0.5) * 0.3,
                y + stoneSize * 0.3,
                (PLAZA_CONFIG.FAR_SIDEWALK_Z + PLAZA_CONFIG.FAR_BUILDINGS_Z) / 2 + (Math.random() - 0.5) * 0.4 // Between far sidewalk and far buildings
            );
            
            // Slight rotation for natural look
            stone.rotation.y = (Math.random() - 0.5) * 0.3;
            wallGroup.add(stone);
        }
    }
    
    console.log("🧱 Created classic New England stone wall");
    return wallGroup;
};

const createSuburbanElements = () => {
    const suburbanGroup = new THREE.Group();
    suburbanGroup.name = "Suburban Elements";
    
    // Add stone wall if enabled
    if (PLAZA_CONFIG.STONE_WALL) {
        const stoneWall = createStoneWall();
        suburbanGroup.add(stoneWall);
    }
    
    // Scattered bushes and small trees in open areas (fewer for park feel)
    for (let i = 0; i < 12; i++) {
        const x = -80 + Math.random() * 160;
        const z = -15 + Math.random() * 40;
        
        // Avoid placing too close to main structures, stone wall, road, and sidewalks
        if (Math.abs(x) < 75 && z > -10 && z < 25) continue;
        
        // Check if in road or sidewalk zones
        const inRoad = x >= -150 && x <= 150 && z >= 5 && z <= 17;
        const inNearSidewalk = x >= -150 && x <= 150 && z >= -1 && z <= 5;
        const inFarSidewalk = x >= -150 && x <= 150 && z >= 17 && z <= 23;
        
        if (inRoad || inNearSidewalk || inFarSidewalk) continue;
        
        if (Math.random() > 0.7) {
            const tree = createTree(x, z, 0.4 + Math.random() * 0.3);
            suburbanGroup.add(tree);
        } else {
            const bush = createBush(x, z, 0.6 + Math.random() * 0.3);
            suburbanGroup.add(bush);
        }
    }
    
    // Mailboxes removed - were in random positions instead of in front of houses
    
    return suburbanGroup;
};

// NPCs are now created in npcs.js

// Street scene
const createStreetScene = () => {
    const streetElements = {};
    
    // Create row groups for easy positioning
    const frontShopsGroup = new THREE.Group();
    frontShopsGroup.name = "Front Shops Row";
    frontShopsGroup.position.z = PLAZA_CONFIG.FRONT_SHOPS_Z;
    scene.add(frontShopsGroup);
    streetElements.frontShopsGroup = frontShopsGroup;
    
    const farBuildingsGroup = new THREE.Group(); 
    farBuildingsGroup.name = "Far Buildings Row";
    farBuildingsGroup.position.z = PLAZA_CONFIG.FAR_BUILDINGS_Z;
    scene.add(farBuildingsGroup);
    streetElements.farBuildingsGroup = farBuildingsGroup;
    
    // Create street element groups for better organization
    const nearSidewalkElementsGroup = new THREE.Group();
    nearSidewalkElementsGroup.name = "Near Sidewalk Elements";
    nearSidewalkElementsGroup.position.z = PLAZA_CONFIG.NEAR_SIDEWALK_Z;
    scene.add(nearSidewalkElementsGroup);
    streetElements.nearSidewalkElementsGroup = nearSidewalkElementsGroup;
    
    const streetElementsGroup = new THREE.Group();
    streetElementsGroup.name = "Street Elements";
    streetElementsGroup.position.z = PLAZA_CONFIG.STREET_Z;
    scene.add(streetElementsGroup);
    streetElements.streetElementsGroup = streetElementsGroup;
    
    const farSidewalkElementsGroup = new THREE.Group();
    farSidewalkElementsGroup.name = "Far Sidewalk Elements";
    farSidewalkElementsGroup.position.z = PLAZA_CONFIG.FAR_SIDEWALK_Z;
    scene.add(farSidewalkElementsGroup);
    streetElements.farSidewalkElementsGroup = farSidewalkElementsGroup;

    const parkingElementsGroup = new THREE.Group();
    parkingElementsGroup.name = "Parking Elements";
    parkingElementsGroup.position.z = PLAZA_CONFIG.PARKING_LOT_Z;
    scene.add(parkingElementsGroup);
    streetElements.parkingElementsGroup = parkingElementsGroup;
    
    // Create a proper street layout
    
    // Create ground planes using configuration
    
    // Main street (where cars drive) - extended to match floor
    const streetGeometry = new THREE.PlaneGeometry(300, 12, 20, 3);
    const streetMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 }); // Dark street color - solid material
    const street = new THREE.Mesh(streetGeometry, streetMaterial);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, -0.1, PLAZA_CONFIG.STREET_Z);
    sceneGroups.exterior.add(street);
    streetElements.street = street;
    
    // Near sidewalk (where shops are) - extended to match floor
    const nearSidewalkGeometry = new THREE.PlaneGeometry(300, 6, 20, 2);
    const sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 }); // Solid sidewalk material
    const nearSidewalk = new THREE.Mesh(nearSidewalkGeometry, sidewalkMaterial);
    nearSidewalk.rotation.x = -Math.PI / 2;
    nearSidewalk.position.set(0, -0.09, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
    sceneGroups.exterior.add(nearSidewalk);
    streetElements.nearSidewalk = nearSidewalk;
    
    // Far sidewalk - extended to match floor
    const farSidewalkGeometry = new THREE.PlaneGeometry(300, 6, 20, 2);
    const farSidewalk = new THREE.Mesh(farSidewalkGeometry, sidewalkMaterial);
    farSidewalk.rotation.x = -Math.PI / 2;
    farSidewalk.position.set(0, -0.09, PLAZA_CONFIG.FAR_SIDEWALK_Z);
    sceneGroups.exterior.add(farSidewalk);
    streetElements.farSidewalk = farSidewalk;
    
    // Back parking lot - only for city scene (not forest scene)
    if (!PLAZA_CONFIG.FRONT_IS_PARK) {
        const parkingGeometry = new THREE.PlaneGeometry(300, 60, 20, 6);
        const parkingMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 }); // Parking lot color - solid material
        const parkingLot = new THREE.Mesh(parkingGeometry, parkingMaterial);
        parkingLot.rotation.x = -Math.PI / 2;
        parkingLot.position.set(0, -0.08, PLAZA_CONFIG.PARKING_LOT_Z);
        sceneGroups.exterior.add(parkingLot);
        streetElements.parkingLot = parkingLot;
        
        // Parking space lines for the back parking lot
        const createParkingLines = () => {
            const lineGroup = new THREE.Group();
            const lineMaterial = createWireframeMaterial(0xFFFFFF);
            
            // Create parking space dividers in back lot
            for (let i = -5; i <= 5; i++) {
                const lineGeometry = new THREE.PlaneGeometry(0.2, 15, 1, 3);
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.position.set(i * 8, -0.07, 0); // Relative to parking lot group
                lineGroup.add(line);
            }
            
            // Add horizontal lines in parking lot
            for (let i = 0; i < 3; i++) {
                const lineGeometry = new THREE.PlaneGeometry(100, 0.2, 8, 1);
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.position.set(0, -0.07, -10 + i * 10); // Relative to parking lot group
                lineGroup.add(line);
            }
            
            return lineGroup;
        };
        
        const parkingLines = createParkingLines();
        parkingElementsGroup.add(parkingLines);
        streetElements.parkingLines = parkingLines;
    } else {
        console.log("🌳 Skipped parking lot creation for forest scene");
    }
    
    // Sidewalk lines for texture (every 12 feet)
    const createSidewalkLines = () => {
        const lineGroup = new THREE.Group();
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 }); // Slightly darker than sidewalk
        
        // Create lines every 12 feet (12 units) across the sidewalk width
        for (let x = -150; x <= 150; x += 6) {
            const lineGeometry = new THREE.PlaneGeometry(0.1, 6, 1, 1);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, -0.08, 0); // Slightly above sidewalk surface
            lineGroup.add(line);
        }
        
        return lineGroup;
    };
    
    // Add sidewalk lines to both sidewalks
    const nearSidewalkLines = createSidewalkLines();
    nearSidewalkElementsGroup.add(nearSidewalkLines);
    streetElements.nearSidewalkLines = nearSidewalkLines;
    
    const farSidewalkLines = createSidewalkLines();
    farSidewalkElementsGroup.add(farSidewalkLines);
    streetElements.farSidewalkLines = farSidewalkLines;
    
    // Road lines for texture
    const createRoadLines = () => {
        const lineGroup = new THREE.Group();
        const yellowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 }); // Yellow center lines
        const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White lane dividers
        
        // Solid double yellow center line (running along the road length)
        // Top yellow line
        const topYellowGeometry = new THREE.PlaneGeometry(300, 0.1, 1, 1); // Full road length
        const topYellowLine = new THREE.Mesh(topYellowGeometry, yellowMaterial);
        topYellowLine.rotation.x = -Math.PI / 2;
        topYellowLine.position.set(0, -0.09, 0.1); // Slightly offset from center
        lineGroup.add(topYellowLine);
        
        // Bottom yellow line
        const bottomYellowGeometry = new THREE.PlaneGeometry(300, 0.1, 1, 1); // Full road length
        const bottomYellowLine = new THREE.Mesh(bottomYellowGeometry, yellowMaterial);
        bottomYellowLine.rotation.x = -Math.PI / 2;
        bottomYellowLine.position.set(0, -0.09, -0.1); // Slightly offset from center
        lineGroup.add(bottomYellowLine);
        
        // White lane dividers (solid lines running along the road length)
        // Left lane divider
        const leftLineGeometry = new THREE.PlaneGeometry(300, 0.1, 1, 1); // Full road length
        const leftLine = new THREE.Mesh(leftLineGeometry, whiteMaterial);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(0, -0.09, 5); // Left side of road
        lineGroup.add(leftLine);
        
        // Right lane divider
        const rightLineGeometry = new THREE.PlaneGeometry(300, 0.1, 1, 1); // Full road length
        const rightLine = new THREE.Mesh(rightLineGeometry, whiteMaterial);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(0, -0.09, -5); // Right side of road
        lineGroup.add(rightLine);
        
        return lineGroup;
    };
    
    const roadLines = createRoadLines();
    streetElementsGroup.add(roadLines);
    streetElements.roadLines = roadLines;
    
    // Create a wireframe bus (needed for both scenes)
    const createBus = (x, z, color, direction) => {
        const busGroup = new THREE.Group();
        
        // Bus body - larger than a car - updated to MBTA white color
        const bodyGeometry = new THREE.BoxGeometry(6, 2.2, 2.2, 5, 3, 3);
        const bodyMaterial = createWireframeMaterial(0xFFFFFF); // MBTA white body
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.1;
        busGroup.add(body);
        
        // Add yellow stripe along the sides (MBTA signature color)
        const stripeGeometry = new THREE.BoxGeometry(6.01, 0.4, 2.22);
        const stripeMaterial = createWireframeMaterial(0xFFD700); // MBTA yellow
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set(0, 0.4, 0);
        busGroup.add(stripe);
        
        // Bus roof with integrated luggage rack
        const roofGeometry = new THREE.BoxGeometry(6.2, 0.2, 2.4, 6, 1, 3);
        const roofMaterial = createWireframeMaterial(0xE0E0E0); // Light gray roof
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 2.3;
        busGroup.add(roof);
        
        // Side windows (multiple windows along the side)
        for (let i = 0; i < 5; i++) {
            const windowGeometry = new THREE.BoxGeometry(1, 0.8, 0.1);
            const windowMaterial = createWireframeMaterial(0x88ccff, 0.5); // Light blue, semi-transparent
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(-2.5 + i * 1.2, 1.5, 1.15);
            busGroup.add(window);
            
            // Windows on the other side
            const windowOtherSide = window.clone();
            windowOtherSide.position.z = -1.15;
            busGroup.add(windowOtherSide);
        }
        
        // Front windshield
        const windshieldGeometry = new THREE.BoxGeometry(0.1, 1, 1.8);
        const windshieldMaterial = createWireframeMaterial(0x88ccff, 0.5); // Light blue, semi-transparent
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(-2.95, 1.5, 0);
        busGroup.add(windshield);
        
        // Front bumper in MBTA black
        const bumperGeometry = new THREE.BoxGeometry(0.2, 0.4, 2.2);
        const bumperMaterial = createWireframeMaterial(0x000000); // MBTA black
        const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        bumper.position.set(-3, 0.4, 0);
        busGroup.add(bumper);
        
        // Back bumper in MBTA black
        const backBumperGeometry = new THREE.BoxGeometry(0.2, 0.4, 2.2);
        const backBumperMaterial = createWireframeMaterial(0x000000); // MBTA black
        const backBumper = new THREE.Mesh(backBumperGeometry, backBumperMaterial);
        backBumper.position.set(3, 0.4, 0);
        busGroup.add(backBumper);
        
        // Wheels (larger than car wheels)
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8, 1);
        const wheelMaterial = createWireframeMaterial(0x111111);
        
        // Front wheels
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.rotation.y = Math.PI / 2;
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheel.position.set(-2.2, 0.4, 1.1);
        busGroup.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.rotation.y = Math.PI / 2;
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheel.position.set(-2.2, 0.4, -1.1);
        busGroup.add(frontRightWheel);
        
        // Back wheels
        const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backLeftWheel.rotation.y = Math.PI / 2;
        backLeftWheel.rotation.z = Math.PI / 2;
        backLeftWheel.position.set(2.2, 0.4, 1.1);
        busGroup.add(backLeftWheel);
        
        const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backRightWheel.rotation.y = Math.PI / 2;
        backRightWheel.rotation.z = Math.PI / 2;
        backRightWheel.position.set(2.2, 0.4, -1.1);
        busGroup.add(backRightWheel);
        
        // Side route number display
        const routeDisplayGeometry = new THREE.BoxGeometry(1.5, 0.6, 0.1);
        const routeDisplayMaterial = createWireframeMaterial(0x000000); // Black background
        const routeDisplay = new THREE.Mesh(routeDisplayGeometry, routeDisplayMaterial);
        routeDisplay.position.set(2, 1.6, 1.12);
        busGroup.add(routeDisplay);
        
        // MBTA logo on the side of the bus
        const logoGeometry = new THREE.CircleGeometry(0.4, 8);
        const logoMaterial = createWireframeMaterial(0x000080, 0.9); // MBTA navy blue
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(2, 1.5, 1.11);
        busGroup.add(logo);
        
        // Position and rotate based on direction
        busGroup.position.set(x, 0, 0); // Z is handled by the group that contains it
        if (direction === 'left') {
            // Buses going left should point in the -x direction (looking from +z to -z)
            busGroup.rotation.y = 0;
        } else {
            // Buses going right should point in the +x direction (looking from +z to -z)
            busGroup.rotation.y = Math.PI; // 180 degrees to face the opposite direction
        }
        
        busGroup.userData.direction = direction; // Store direction for animation
        busGroup.userData.speed = 0.03; // Buses move slower than cars
        
        return busGroup;
    };

    // Create a bus stop shelter with MBTA colors (needed for both scenes)
    const createBusStop = (x) => {
        const busStopGroup = new THREE.Group();
        
        // Platform/curb
        const platformGeometry = new THREE.BoxGeometry(4, 0.2, 1.5, 4, 1, 2);
        const platformMaterial = createWireframeMaterial(0xaaaaaa);
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 0.1;
        busStopGroup.add(platform);
        
        // Shelter roof
        const roofGeometry = new THREE.BoxGeometry(3.5, 0.1, 1.2, 4, 1, 2);
        const roofMaterial = createWireframeMaterial(0x4040c0, 0.9); // MBTA navy blue
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 2.5;
        busStopGroup.add(roof);
        
        // Support pillars for the roof
        const pillarGeometry = new THREE.BoxGeometry(0.15, 2.5, 0.15, 2, 5, 2);
        const pillarMaterial = createWireframeMaterial(0x777777);
        
        // Front pillars
        const frontLeftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        frontLeftPillar.position.set(-1.5, 1.25, 0.5);
        busStopGroup.add(frontLeftPillar);
        
        const frontRightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        frontRightPillar.position.set(1.5, 1.25, 0.5);
        busStopGroup.add(frontRightPillar);
        
        // Back pillars
        const backLeftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        backLeftPillar.position.set(-1.5, 1.25, -0.5);
        busStopGroup.add(backLeftPillar);
        
        const backRightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        backRightPillar.position.set(1.5, 1.25, -0.5);
        busStopGroup.add(backRightPillar);
        
        // Sign pole
        const signPoleGeometry = new THREE.BoxGeometry(0.1, 3.2, 0.1, 2, 6, 2);
        const signPoleMaterial = createWireframeMaterial(0x444444);
        const signPole = new THREE.Mesh(signPoleGeometry, signPoleMaterial);
        signPole.position.set(2.5, 1.6, 1.3);
        busStopGroup.add(signPole);
        
        // Create a proper MBTA bus stop sign group
        const signGroup = new THREE.Group();
        signGroup.position.set(2.3, 2.7, 1.3);
        signGroup.scale.set(0.5, 0.5, 0.5); // Make the sign smaller by half
        
        // Yellow top section (header)
        const topSectionGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1, 2, 2, 1);
        const topSectionMaterial = createWireframeMaterial(0xFFA500, 0.8); // Brighter orange-yellow
        const topSection = new THREE.Mesh(topSectionGeometry, topSectionMaterial);
        topSection.position.set(0, 0.8, 0);
        signGroup.add(topSection);
        
        // Add "T" logo to top section
        const tLogoGeometry = new THREE.CircleGeometry(0.25, 8);
        const tLogoMaterial = createWireframeMaterial(0xFF0000, 0.8); // Brighter red
        const tLogo = new THREE.Mesh(tLogoGeometry, tLogoMaterial);
        tLogo.position.set(0, 0.8, 0.06);
        signGroup.add(tLogo);
        
        // White middle section with route numbers
        const middleSectionGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.1, 2, 2, 1);
        const middleSectionMaterial = createWireframeMaterial(0xFFFFFF, 0.8); // Bright white
        const middleSection = new THREE.Mesh(middleSectionGeometry, middleSectionMaterial);
        middleSection.position.set(0, 0, 0);
        signGroup.add(middleSection);
        
        // Route number 80 (as in the image) - black pill-shaped background
        const routeOneBgGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.12, 2, 2, 1);
        const routeOneBgMaterial = createWireframeMaterial(0x000000, 0.8); // Black background
        const routeOneBg = new THREE.Mesh(routeOneBgGeometry, routeOneBgMaterial);
        routeOneBg.position.set(0, 0.3, 0.06);
        signGroup.add(routeOneBg);
        
        // Route number 119 (second route) - black pill-shaped background
        const routeTwoBgGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.12, 2, 2, 1);
        const routeTwoBgMaterial = createWireframeMaterial(0x000000, 0.8); // Black background
        const routeTwoBg = new THREE.Mesh(routeTwoBgGeometry, routeTwoBgMaterial);
        routeTwoBg.position.set(0, -0.3, 0.06);
        signGroup.add(routeTwoBg);
        
        busStopGroup.add(signGroup);
        
        // Create a simple bench inside the bus stop
        const benchSeatGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.8, 3, 1, 1);
        const benchSeatMaterial = createWireframeMaterial(0xaaaaaa);
        const benchSeat = new THREE.Mesh(benchSeatGeometry, benchSeatMaterial);
        benchSeat.position.set(0, 0.6, -0.2);
        busStopGroup.add(benchSeat);
        
        // Create bench legs using a helper function
        const createBenchLeg = (x) => {
            const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6, 1, 1, 1);
            const legMaterial = createWireframeMaterial(0x885500);
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, 0.5, 0);
            return leg;
        };
        
        busStopGroup.add(createBenchLeg(-1.3));
        busStopGroup.add(createBenchLeg(1.3));
        
        // Position the bus stop
        busStopGroup.position.set(x, 0, 0); // Z is handled by the group that contains it
        busStopGroup.rotation.y = 0; // Face away from the street
        
        return busStopGroup;
    };

    // Only create karaoke bar and shops for PLAZA scene, not for park scene
    if (!PLAZA_CONFIG.FRONT_IS_PARK) {
    // Karaoke Bar Building - created as a separate structure
    const buildingGroup = new THREE.Group();
    
    // Define building dimensions and position - INCREASED SIZE
    const buildingWidth = 20; // Increased from 15
    const buildingHeight = 5; // Increased from 4
    const buildingDepth = 15; // Increased from 10
    const wallThickness = 0.2;
    
    // Create solid back panels for walls (not wireframe)
    const createSolidPanel = (width, height, depth, color) => {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.2 // Slightly visible
        });
        return new THREE.Mesh(geometry, material);
    };
    
    // Front wall (facing the street)
    const frontWallGroup = new THREE.Group();
    
    // Door dimensions for reference
    const doorWidth = 1.8;
    const doorHeight = 3.2;
    
    // Clear any potentially overlapping planes from before
    const frontFacingPlanes = [];
    
    // Function to create a double-layered wall segment with a black center
    const createSandwichedWallSegment = (width, height, depth) => {
        const segmentGroup = new THREE.Group();
        
        // Front wireframe layer
        const frontGeometry = new THREE.BoxGeometry(width, height, depth/3, Math.max(3, Math.floor(width*2)), Math.max(2, Math.floor(height*2)), 1);
        const wireframeMaterial = createWireframeMaterial(0x4169E1); // Royal blue
        wireframeMaterial.side = THREE.DoubleSide;
        const frontLayer = new THREE.Mesh(frontGeometry, wireframeMaterial);
        frontLayer.position.z = depth/3;
        
        // Back wireframe layer
        const backGeometry = new THREE.BoxGeometry(width, height, depth/3, Math.max(3, Math.floor(width*2)), Math.max(2, Math.floor(height*2)), 1);
        const backLayer = new THREE.Mesh(backGeometry, wireframeMaterial.clone());
        backLayer.position.z = -depth/3;
        
        // Solid black middle layer
        const middleGeometry = new THREE.BoxGeometry(width, height, depth/3);
        const blackMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: false,
            opacity: 1.0
        });
        const middleLayer = new THREE.Mesh(middleGeometry, blackMaterial);
        
        segmentGroup.add(frontLayer);
        segmentGroup.add(middleLayer);
        segmentGroup.add(backLayer);
        
        return {
            group: segmentGroup,
            frontLayer,
            middleLayer,
            backLayer
        };
    };
    
    // Instead of a single front wall, create wall segments around a door cutout
    
    // Top wall segment (above the door)
    const topWallWidth = buildingWidth;
    const topWallHeight = buildingHeight - doorHeight;
    const { group: topWallGroup, middleLayer: topWallMiddle } = createSandwichedWallSegment(topWallWidth, topWallHeight, wallThickness);
    topWallGroup.position.set(0, doorHeight + (buildingHeight - doorHeight)/2, 0);
    topWallGroup.userData.position = 'front-top'; // Add userData to identify this segment
    frontWallGroup.add(topWallGroup);
    
    // Left wall segment (to the left of the door)
    const leftWallWidth = (buildingWidth - doorWidth) / 2;
    const { group: leftWallGroup, middleLayer: leftWallMiddle } = createSandwichedWallSegment(leftWallWidth, doorHeight, wallThickness);
    leftWallGroup.position.set(-buildingWidth/2 + leftWallWidth/2, doorHeight/2, 0);
    leftWallGroup.userData.position = 'front-left'; // Add userData to identify this segment
    frontWallGroup.add(leftWallGroup);
    
    // Right wall segment (to the right of the door)
    const rightWallWidth = (buildingWidth - doorWidth) / 2;
    const { group: rightWallGroup, middleLayer: rightWallMiddle } = createSandwichedWallSegment(rightWallWidth, doorHeight, wallThickness);
    rightWallGroup.position.set(buildingWidth/2 - rightWallWidth/2, doorHeight/2, 0);
    rightWallGroup.userData.position = 'front-right'; // Add userData to identify this segment
    frontWallGroup.add(rightWallGroup);
    
    // Position the entire front wall group
    frontWallGroup.position.set(0, 0, 0);
    buildingGroup.add(frontWallGroup);
    
    // Back wall with sandwiched structure
    const { group: backWallGroup, middleLayer: backWallMiddle } = createSandwichedWallSegment(buildingWidth, buildingHeight, wallThickness);
    backWallGroup.position.set(0, buildingHeight/2, -buildingDepth);
    buildingGroup.add(backWallGroup);
    
    // Left wall with sandwiched structure
    const { group: leftSideWallGroup, middleLayer: leftSideWallMiddle } = createSandwichedWallSegment(buildingDepth, buildingHeight, wallThickness);
    leftSideWallGroup.rotation.y = Math.PI/2; // Rotate to be a side wall
    leftSideWallGroup.position.set(-buildingWidth/2, buildingHeight/2, -buildingDepth/2);
    buildingGroup.add(leftSideWallGroup);
    
    // Right wall with sandwiched structure
    const { group: rightSideWallGroup, middleLayer: rightSideWallMiddle } = createSandwichedWallSegment(buildingDepth, buildingHeight, wallThickness);
    rightSideWallGroup.rotation.y = Math.PI/2; // Rotate to be a side wall
    rightSideWallGroup.position.set(buildingWidth/2, buildingHeight/2, -buildingDepth/2);
    buildingGroup.add(rightSideWallGroup);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(buildingWidth, buildingDepth, 8, 8);
    const floorMaterial = createWireframeMaterial(0x333333);
    floorMaterial.side = THREE.DoubleSide;
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -buildingDepth/2);
    floor.userData.isFloor = true; // Mark as floor so it's not removed by cleanup
    buildingGroup.add(floor);
    
    // Ceiling/Roof
    const ceilingGeometry = new THREE.PlaneGeometry(buildingWidth, buildingDepth, 6, 6);
    const ceilingMaterial = createWireframeMaterial(0x333333);
    ceilingMaterial.side = THREE.DoubleSide;
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, buildingHeight, -buildingDepth/2);
    ceiling.userData.isCeiling = true; // Mark as ceiling so it's not removed by cleanup
    buildingGroup.add(ceiling);
    
    // Instead of one glow box, create separate glow segments to avoid crossing the doorway
    // Glow color
    const glowColor = 0x00BFFF; // Deep sky blue for glow
    const glowOpacity = 0.5;
    
    // Create a helper function to create a glow segment box
    const createGlowSegment = (width, height, depth, x, y, z) => {
        const geometry = new THREE.BoxGeometry(width, height, depth, 
            Math.max(2, Math.floor(width*2)), 
            Math.max(2, Math.floor(height*2)), 
            Math.max(2, Math.floor(depth*2)));
        const material = createWireframeMaterial(glowColor, glowOpacity);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        return mesh;
    };
    
    // Dimensions with slight padding
    const glowWidth = buildingWidth + 0.4;
    const glowHeight = buildingHeight + 0.2;
    const glowDepth = buildingDepth + 0.4;
    const glowThickness = 0.1; // Thickness of each glow segment

    // Create a glow group to hold all segments
    const glowGroup = new THREE.Group();
    
    // Top glow (above the doorway)
    const topGlow = createGlowSegment(
        glowWidth, // full width
        glowThickness, // thin height at top
        glowDepth, // full depth
        0, // centered
        buildingHeight + glowThickness/2, // at the top
        -buildingDepth/2 // centered in depth
    );
    glowGroup.add(topGlow);
    
    // Bottom glow (below, but not in the doorway)
    const bottomGlow = createGlowSegment(
        glowWidth, // full width
        glowThickness, // thin height at bottom
        glowDepth, // full depth
        0, // centered
        -glowThickness/2, // at the bottom
        -buildingDepth/2 // centered in depth
    );
    glowGroup.add(bottomGlow);
    
    // Left glow (full height on the left side)
    const leftGlow = createGlowSegment(
        glowThickness, // thin width at left
        glowHeight, // full height
        glowDepth, // full depth
        -buildingWidth/2 - glowThickness/2, // at the left side
        buildingHeight/2, // centered in height
        -buildingDepth/2 // centered in depth
    );
    glowGroup.add(leftGlow);
    
    // Right glow (full height on the right side)
    const rightGlow = createGlowSegment(
        glowThickness, // thin width at right
        glowHeight, // full height
        glowDepth, // full depth
        buildingWidth/2 + glowThickness/2, // at the right side
        buildingHeight/2, // centered in height
        -buildingDepth/2 // centered in depth
    );
    glowGroup.add(rightGlow);
    
    // Back glow (full width and height at the back)
    const backGlow = createGlowSegment(
        glowWidth, // full width
        glowHeight, // full height
        glowThickness, // thin depth at back
        0, // centered
        buildingHeight/2, // centered in height
        -buildingDepth - glowThickness/2 // at the back
    );
    glowGroup.add(backGlow);
    
    // Front glow segments (need to account for the doorway)
    // Front Top (above the door)
    const frontTopGlow = createGlowSegment(
        glowWidth, // full width
        glowHeight - doorHeight, // height minus door
        glowThickness, // thin depth at front
        0, // centered
        doorHeight + (glowHeight - doorHeight)/2, // positioned above the door
        glowThickness/2 // at the front
    );
    glowGroup.add(frontTopGlow);
    
    // Front Left (left of the door)
    const frontLeftGlow = createGlowSegment(
        (glowWidth - doorWidth)/2, // half width minus half door
        doorHeight, // door height
        glowThickness, // thin depth at front
        -glowWidth/4 - doorWidth/4, // positioned left of the door
        doorHeight/2, // centered on door height
        glowThickness/2 // at the front
    );
    glowGroup.add(frontLeftGlow);
    
    // Front Right (right of the door)
    const frontRightGlow = createGlowSegment(
        (glowWidth - doorWidth)/2, // half width minus half door
        doorHeight, // door height
        glowThickness, // thin depth at front
        glowWidth/4 + doorWidth/4, // positioned right of the door
        doorHeight/2, // centered on door height
        glowThickness/2 // at the front
    );
    glowGroup.add(frontRightGlow);
    
    // Add the glow group to the building
    glowGroup.position.set(0, 0, 0);
    buildingGroup.add(glowGroup);
    streetElements.glowGroup = glowGroup;
    
    // Remove the glow from doorway even more directly - create a "black hole" in the door area
    const doorwayGlowCutout = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth + 0.4, doorHeight + 0.4, 1),
        new THREE.MeshBasicMaterial({
            colorWrite: false,
            depthWrite: false,
            transparent: true,
            opacity: 0,
            depthTest: false
        })
    );
    doorwayGlowCutout.position.set(0, doorHeight/2, 0);
    buildingGroup.add(doorwayGlowCutout);
    
    // Position the karaoke bar at X=0 within the front shops group (Z is handled by group)
    buildingGroup.position.set(PLAZA_CONFIG.KARAOKE_BAR_X, 0, 0); // X position only, Z handled by frontShopsGroup
    frontShopsGroup.add(buildingGroup); // Add to front shops group instead of scene
    streetElements.buildingGroup = buildingGroup;
    
    // Store references to wall components
    streetElements.walls = [topWallGroup, leftWallGroup, rightWallGroup, backWallGroup, leftSideWallGroup, rightSideWallGroup]; 
    streetElements.wallMiddleLayers = [topWallMiddle, leftWallMiddle, rightWallMiddle, backWallMiddle, leftSideWallMiddle, rightSideWallMiddle];
    
    // Door - integrated with the front wall but now with thickness
    const doorThickness = 0.2; // Added thickness to door
    
    // Create a door group to handle the rotation around a hinge
    const doorGroup = new THREE.Group();
    
    // Use BoxGeometry instead of PlaneGeometry for thickness
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness, 3, 4, 2);
    const doorMaterial = createWireframeMaterial(0xff0000); // Red door wireframe
    doorMaterial.side = THREE.DoubleSide; // Make sure both sides are visible
    
    // Create solid black backing for the door
    const doorBackingGeometry = new THREE.BoxGeometry(doorWidth - 0.2, doorHeight - 0.2, doorThickness * 0.5, 1, 1, 1);
    const doorBackingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        transparent: false,
        opacity: 1.0
    });
    const doorBacking = new THREE.Mesh(doorBackingGeometry, doorBackingMaterial);
    
    // Create door mesh with the wireframe
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    
    // Add small windows to the door
    const createDoorWindow = (x, y) => {
        // Window frame
        const windowFrameGeometry = new THREE.BoxGeometry(0.4, 0.4, doorThickness + 0.02, 1, 1, 1);
        const windowFrameMaterial = createWireframeMaterial(0xffffff);
        const windowFrame = new THREE.Mesh(windowFrameGeometry, windowFrameMaterial);
        windowFrame.position.set(x, y, 0);
        
        // Window glass - transparent blue
        const windowGlassGeometry = new THREE.BoxGeometry(0.35, 0.35, doorThickness + 0.03, 1, 1, 1);
        const windowGlassMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x88ccff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const windowGlass = new THREE.Mesh(windowGlassGeometry, windowGlassMaterial);
        windowGlass.position.set(x, y, 0);
        
        return [windowFrame, windowGlass];
    };
    
    // Add 4 small windows to the door - positioned even lower than before
    const doorWindows = [
        ...createDoorWindow(-0.325, 1.0),  // Top left - lowered from 1.8
        ...createDoorWindow(0.325, 1.0),   // Top right - lowered from 1.8
        ...createDoorWindow(-0.325, 0.4),  // Bottom left - lowered from 1.2
        ...createDoorWindow(0.325, 0.4)    // Bottom right - lowered from 1.2
    ];
    
    // Position door properly in the group
    // Move door so its left edge is at the origin (the hinge point)
    door.position.set(doorWidth/2, doorHeight/2, doorThickness/2);
    doorBacking.position.set(doorWidth/2, doorHeight/2, doorThickness/2);
    
    // Add door parts to the door group
    doorGroup.add(door);
    doorGroup.add(doorBacking);
    
    // Add windows to the door
    doorWindows.forEach(windowPart => {
        windowPart.position.x += doorWidth/2;
        windowPart.position.y += doorHeight/2;
        windowPart.position.z += doorThickness/2;
        doorGroup.add(windowPart);
    });
    
    // Add a light to help visualize the door position and rotation
    const doorLight = new THREE.PointLight(0xffff00, 0.5, 2);
    doorLight.position.set(0, doorHeight/2, 0);
    doorGroup.add(doorLight);
    
    // Position the door group at the proper location in the building
    // We position it so the hinge is at the left side of the doorway
    doorGroup.position.set(-doorWidth/2, 0, 0.1); 
    // Start with door open (rotated 90 degrees outward)
    doorGroup.rotation.y = -Math.PI / 2;
    frontShopsGroup.add(doorGroup); // Add to front shops group instead of exterior
    streetElements.door = doorGroup; // Store reference to door group
    
    // Windows - integrated with the front wall but now transparent from both sides
    // Create window with frame and transparent glass visible from both sides
    const createTransparentWindow = (x, y, z) => {
        const windowGroup = new THREE.Group();
        
        // Window frame - wireframe
        const frameGeometry = new THREE.BoxGeometry(2, 2, 0.1, 2, 2, 1);
        const frameMaterial = createWireframeMaterial(0x00ffff); // Cyan window frame
        frameMaterial.side = THREE.DoubleSide; // Visible from both sides
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        
        // Glass - transparent
        const glassGeometry = new THREE.BoxGeometry(1.8, 1.8, 0.12, 1, 1, 1);
        const glassMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x88ccff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide // Visible from both sides
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        
        windowGroup.add(frame);
        windowGroup.add(glass);
        windowGroup.position.set(x, y, z);
        
        return windowGroup;
    };
    
    // Left window
    const window1 = createTransparentWindow(-5, 3, 0.1); 
    window1.rotation.y = Math.PI;
    frontShopsGroup.add(window1); // Add to front shops group instead of exterior
    
    // Right window
    const window2 = createTransparentWindow(5, 3, 0.1);
    window2.rotation.y = Math.PI;
    frontShopsGroup.add(window2); // Add to front shops group instead of exterior
    
    streetElements.windows = [window1, window2];
    
    // Create window cutouts in the black middle layers
    const cutOutWindowInWall = (windowObj, wallMiddleLayer) => {
        // Get the window position relative to the wall
        const windowWorldPos = new THREE.Vector3();
        windowObj.getWorldPosition(windowWorldPos);
        
        // Get the wall middle layer position
        const wallWorldPos = new THREE.Vector3();
        wallMiddleLayer.getWorldPosition(wallWorldPos);
        
        // Calculate the relative position
        const relX = windowWorldPos.x - wallWorldPos.x;
        const relY = windowWorldPos.y - wallWorldPos.y;
        
        // Calculate the size of the window (assuming it's 2x2 units)
        const windowSize = 2.0;
        
        // Create a hole with a fully transparent material that's the same size as the window
        // Increased to match window size exactly
        const cutoutSize = windowSize;
        const holeGeometry = new THREE.BoxGeometry(cutoutSize, cutoutSize, 1);
        const holeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, 
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            depthWrite: false // Don't write to depth buffer
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        
        // Position the hole at the window location
        hole.position.set(relX, relY, 0);
        
        // Add the hole to the wall's middle layer
        wallMiddleLayer.add(hole);
        
        // Create a completely invisible mesh to ensure we have a proper hole
        const completeHoleGeometry = new THREE.BoxGeometry(cutoutSize, cutoutSize, 2);
        const completeHoleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false // Skip depth testing completely to ensure visibility
        });
        const completeHole = new THREE.Mesh(completeHoleGeometry, completeHoleMaterial);
        completeHole.position.set(relX, relY, 0);
        wallMiddleLayer.add(completeHole);
        
        // Remove the actual material where the window is by using a custom shader
        if (wallMiddleLayer.material) {
            // Make sure the wall middle layer's material is transparent
            wallMiddleLayer.material.transparent = true;
            
            // Apply a stronger cutout shader that makes a complete hole
            const newMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    baseColor: { value: new THREE.Color(0x000000) },
                    holeCenter: { value: new THREE.Vector2(relX, relY) },
                    holeSize: { value: cutoutSize * 0.5 }, // Half size for radius calculation
                    wallSize: { value: new THREE.Vector2(
                        wallMiddleLayer.geometry.parameters.width,
                        wallMiddleLayer.geometry.parameters.height
                    )}
                },
                vertexShader: `
                    varying vec3 vPosition;
                    
                    void main() {
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 baseColor;
                    uniform vec2 holeCenter;
                    uniform float holeSize;
                    uniform vec2 wallSize;
                    varying vec3 vPosition;
                    
                    void main() {
                        // Calculate distance from hole center
                        float dx = abs(vPosition.x - holeCenter.x);
                        float dy = abs(vPosition.y - holeCenter.y);
                        
                        // Simple box test - if inside the box dimensions, make transparent
                        if (dx < holeSize && dy < holeSize) {
                            discard; // Complete transparency - fully discard the fragment
                        } else {
                            gl_FragColor = vec4(baseColor, 1.0); // Solid black
                        }
                    }
                `,
                side: THREE.DoubleSide
            });
            
            // Apply the new material
            wallMiddleLayer.material = newMaterial;
        }
    };
    
    // Completely remove the door area wireframe
    const createDoorwayOpening = () => {
        // Reference the front wall elements directly
        const frontWallTop = frontWallGroup.children.find(segment => 
            segment.userData && segment.userData.position === 'front-top');
        const frontWallLeft = frontWallGroup.children.find(segment => 
            segment.userData && segment.userData.position === 'front-left');
        const frontWallRight = frontWallGroup.children.find(segment => 
            segment.userData && segment.userData.position === 'front-right');
        
        console.log('Wall segments found:', !!frontWallTop, !!frontWallLeft, !!frontWallRight);
        
        // Get all layers of the front wall (each wall has three layers: front wireframe, middle black, back wireframe)
        const getAllWallLayers = (wallSegment) => {
            if (!wallSegment) return [];
            
            const layers = [];
            wallSegment.traverse(child => {
                if (child.isMesh && child !== wallSegment) {
                    layers.push(child);
                }
            });
            return layers;
        };
        
        // Create a simple doorway cutout as a fallback, in case we can't find the wall segments
        let doorwayCreated = false;
        
        // Process all front wall segments
        [frontWallTop, frontWallLeft, frontWallRight].forEach(wallSegment => {
            if (!wallSegment) return;
            
            doorwayCreated = true;
            const wallLayers = getAllWallLayers(wallSegment);
            console.log(`Layers found for ${wallSegment.userData.position}:`, wallLayers.length);
            
            // For each layer in the wall, create an invisible box in the doorway area
            wallLayers.forEach(layer => {
                // Create a fully transparent material for the doorway area
                const doorwayMaterial = new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    depthWrite: false,
                    colorWrite: false, // Prevent any color writing
                    depthTest: false   // Skip depth testing to ensure nothing appears
                });
                
                // Create an invisible mesh to cover any wireframe in the doorway area
                const doorwayGeometry = new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.2, 3);
                const doorway = new THREE.Mesh(doorwayGeometry, doorwayMaterial);
                
                // Position the invisible mesh at the door's location
                // This needs to be calculated based on the wall segment's position
                const wallWorldPos = new THREE.Vector3();
                wallSegment.getWorldPosition(wallWorldPos);
                
                // Door is at the center of the front wall at y = doorHeight/2
                const relX = 0 - wallWorldPos.x; // Center of front wall
                const relY = doorHeight / 2 - wallWorldPos.y;
                doorway.position.set(relX, relY, 0);
                
                // Add the invisible mesh to completely cover any wireframe
                layer.add(doorway);
                
                // For wireframe layers, we need to actively remove any faces in the doorway area
                if (layer.material && layer.material.wireframe) {
                    // Apply a custom shader material that discards fragments in the doorway area
                    const customMaterial = new THREE.ShaderMaterial({
                        uniforms: {
                            baseColor: { value: new THREE.Color(layer.material.color ? layer.material.color.getHex() : 0xffffff) },
                            doorwayCenter: { value: new THREE.Vector2(relX, relY) },
                            doorwaySize: { value: new THREE.Vector2((doorWidth + 0.2) / 2, (doorHeight + 0.2) / 2) }
                        },
                        vertexShader: `
                            varying vec3 vPosition;
                            
                            void main() {
                                vPosition = position;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `,
                        fragmentShader: `
                            uniform vec3 baseColor;
                            uniform vec2 doorwayCenter;
                            uniform vec2 doorwaySize;
                            varying vec3 vPosition;
                            
                            void main() {
                                // Calculate distance from doorway center
                                float dx = abs(vPosition.x - doorwayCenter.x);
                                float dy = abs(vPosition.y - doorwayCenter.y);
                                
                                // If inside doorway dimensions, make fully transparent
                                if (dx < doorwaySize.x && dy < doorwaySize.y) {
                                    discard; // Complete transparency
                                } else {
                                    gl_FragColor = vec4(baseColor, 1.0);
                                }
                            }
                        `,
                        wireframe: true,
                        side: THREE.DoubleSide
                    });
                    
                    // Apply the custom material to the wireframe layer
                    layer.material = customMaterial;
                }
            });
        });
        
        // If we couldn't find the wall segments, create a simpler doorway opening
        if (!doorwayCreated) {
            console.log('No wall segments found, using fallback doorway');
            const doorwayGeometry = new THREE.BoxGeometry(doorWidth + 0.4, doorHeight + 0.4, wallThickness * 3);
            const doorwayMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.0,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: false
            });
            
            const doorwayHole = new THREE.Mesh(doorwayGeometry, doorwayMaterial);
            doorwayHole.position.set(0, doorHeight/2, 0);
            frontWallGroup.add(doorwayHole);
            
            // Also add another hole to ensure the doorway is clear
            const additionalHole = new THREE.Mesh(
                new THREE.BoxGeometry(doorWidth + 0.5, doorHeight + 0.5, wallThickness * 4),
                doorwayMaterial.clone()
            );
            additionalHole.position.set(0, doorHeight/2, 0);
            buildingGroup.add(additionalHole);
            
            return doorwayHole;
        }
        
        // Extra safety measure: Create a complete doorway void to ensure nothing is rendered there
        const completeVoidGeometry = new THREE.BoxGeometry(doorWidth + 0.3, doorHeight + 0.3, 5);
        const completeVoidMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
            depthTest: false
        });
        const completeVoid = new THREE.Mesh(completeVoidGeometry, completeVoidMaterial);
        
        // Position this void at the door's center
        completeVoid.position.set(0, doorHeight/2, 0);
        sceneGroups.exterior.add(completeVoid);
        
        // Add one more void directly to the scene for absolute certainty
        const finalVoid = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth + 0.6, doorHeight + 0.6, 6),
            completeVoidMaterial.clone()
        );
        finalVoid.position.set(0, doorHeight/2, 0);
        scene.add(finalVoid);
        
        return completeVoid;
    };
    
    // Create doorway opening
    const doorwayOpening = createDoorwayOpening();
    streetElements.doorwayOpening = doorwayOpening;
    
    // Cut out windows from left and right side of front wall
    // First, find the actual wall layers that contain the window positions
    const findWallWithWindow = (windowX) => {
        // Determine which wall segment the window is in based on X position
        if (windowX < 0) {
            return leftWallMiddle; // Left window is in left wall segment
        } else {
            return rightWallMiddle; // Right window is in right wall segment
        }
    };
    
    // Create the actual cutouts
    cutOutWindowInWall(window1, findWallWithWindow(window1.position.x));
    cutOutWindowInWall(window2, findWallWithWindow(window2.position.x));
    
    // Create additional buildings along the street
    const createBuildingFacade = (x, z, width, height, depth, style) => {
        const buildingGroup = new THREE.Group();
        
        // Define base colors based on style
        let baseColor, windowColor, roofColor;
        
        switch(style) {
            case 'modern':
                baseColor = 0x555555; // Dark gray
                windowColor = 0x88CCFF; // Light blue
                roofColor = 0x333333; // Darker gray
                break;
            case 'brick':
                baseColor = 0x992222; // Brick red
                windowColor = 0xFFFFAA; // Warm light
                roofColor = 0x553333; // Dark red
                break;
            case 'shop':
                baseColor = 0x227722; // Green (will be overridden by specific shop colors)
                windowColor = 0xFFFFFF; // White
                roofColor = 0x333333; // Dark roof
                break;
            case 'convenience':
                baseColor = 0xFF4444; // Red for Cumby's
                windowColor = 0xFFFFFF; // White
                roofColor = 0x333333; // Dark roof
                break;
            case 'pizza':
                baseColor = 0x44AA44; // Green for Grohos
                windowColor = 0xFFFFAA; // Warm light
                roofColor = 0x333333; // Dark roof
                break;
            case 'clothing':
                baseColor = 0x4444FF; // Blue for clothing store
                windowColor = 0xFFFFFF; // White
                roofColor = 0x333333; // Dark roof
                break;
            case 'drycleaner':
                baseColor = 0xFFFFAA; // Yellow for dry cleaners
                windowColor = 0x000088; // Dark blue
                roofColor = 0x333333; // Dark roof
                break;
            case 'coffee':
                baseColor = 0xFF6600; // Orange for Dunkin
                windowColor = 0xFFFFFF; // White
                roofColor = 0x663300; // Brown roof
                break;
            case 'flowers':
                baseColor = 0xFF88FF; // Pink for flower shop
                windowColor = 0xFFFFFF; // White
                roofColor = 0x333333; // Dark roof
                break;
            case 'industrial':
                baseColor = 0x777777; // Gray
                windowColor = 0x99AAAA; // Gray blue
                roofColor = 0x555555; // Medium gray
                break;
            case 'hospital':
                baseColor = 0xEEEEEE; // White
                windowColor = 0xCCFFFF; // Light cyan
                roofColor = 0xCCCCCC; // Light gray
                break;
            case 'graveyard':
                baseColor = 0x666666; // Dark gray
                windowColor = 0x444455; // Dark blue-gray
                roofColor = 0x333333; // Dark gray
                break;
            case 'groton_church':
                baseColor = 0xFFF8DC; // Cream white (classic New England church)
                windowColor = 0x4169E1; // Royal blue (stained glass)
                roofColor = 0x2F4F2F; // Dark slate gray
                break;
            case 'groton_townhall':
                baseColor = 0xB22222; // Fire brick red (classic town hall brick)
                windowColor = 0xF5F5DC; // Beige window frames
                roofColor = 0x556B2F; // Dark olive green roof
                break;
            case 'groton_colonial':
                baseColor = 0xFFF8DC; // Cream white (colonial houses)
                windowColor = 0x000080; // Navy blue shutters/trim
                roofColor = 0x2F4F2F; // Dark slate gray shingles
                break;
            default:
                baseColor = 0x4169E1; // Default blue
                windowColor = 0x00FFFF; // Cyan
                roofColor = 0x333333; // Dark gray
        }
        
        // Special case for graveyard - no building facade, just ground and gravestones
        if (style === 'graveyard') {
            // Create graveyard ground
            const groundGeometry = new THREE.PlaneGeometry(width, depth);
            const groundMaterial = createWireframeMaterial(0x2E5D30); // Earth green
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            ground.position.set(0, 0.01, -depth/2); // Slightly above ground level
            buildingGroup.add(ground);
            
            // Create path down the middle
            const pathWidth = width * 0.4;
            const pathGeometry = new THREE.PlaneGeometry(pathWidth, depth);
            const pathMaterial = createWireframeMaterial(0x4A6741); // Brownish green
            const path = new THREE.Mesh(pathGeometry, pathMaterial);
            path.rotation.x = -Math.PI / 2;
            path.position.set(0, 0.02, -depth/2); // Slightly above the ground
            buildingGroup.add(path);
            
            // Create gravestones in the yard area
            const graveyard = new THREE.Group();
            
            // Create rows of gravestones
            const rowCount = Math.floor(depth / 5);
            const colCount = Math.floor(width / 2);
            
            for (let row = 0; row < rowCount; row++) {
                for (let col = 0; col < colCount; col++) {
                    // Skip positions in the middle (path area)
                    const isCenterCol = col >= Math.floor(colCount * 0.4) && col <= Math.floor(colCount * 0.6);
                    if (isCenterCol && row > 0) continue;
                    
                    // Skip some positions randomly
                    if (Math.random() > 0.7) continue;
                    
                    // Position with some randomness
                    const posX = -width/2 + 1 + col * 2 + (Math.random() * 0.8 - 0.4);
                    const posZ = -2 - row * 4 - (Math.random() * 2);
                    
                    // Create gravestone
                    const stoneHeight = 0.8 + Math.random() * 0.6;
                    const stoneWidth = 0.6 + Math.random() * 0.3;
                    
                    // Stone base shape varies
                    let stoneGeometry;
                    if (Math.random() > 0.5) {
                        // Rectangle with rounded top
                        stoneGeometry = new THREE.BoxGeometry(stoneWidth, stoneHeight, 0.2);
                    } else {
                        // Cross shape
                        stoneGeometry = new THREE.BoxGeometry(stoneWidth, stoneHeight, 0.2);
                    }
                    
                    const stoneMaterial = createWireframeMaterial(0x999999);
                    const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
                    
                    stone.position.set(posX, stoneHeight/2, posZ);
                    graveyard.add(stone);
                }
            }
            
            // Add the graveyard group to the building group
            buildingGroup.add(graveyard);
            
            // Position the building group
            buildingGroup.position.set(x, 0, z);
            
            return buildingGroup;
        }
        
        // For non-graveyard buildings, continue with normal facade creation
        const frontWallGroup = new THREE.Group();
        
        // Create sandwich wall (outer layer, middle layer, inner layer)
        const wallOuterGeometry = new THREE.BoxGeometry(width, height, 0.05);
        const wallOuterMaterial = createWireframeMaterial(baseColor);
        const wallOuter = new THREE.Mesh(wallOuterGeometry, wallOuterMaterial);
        wallOuter.position.set(0, height/2, 0);
        frontWallGroup.add(wallOuter);
        
        // Middle layer
        const wallMiddleGeometry = new THREE.BoxGeometry(width, height, 0.05);
        const wallMiddleMaterial = createWireframeMaterial(baseColor);
        const wallMiddle = new THREE.Mesh(wallMiddleGeometry, wallMiddleMaterial);
        wallMiddle.position.set(0, height/2, 0);
        frontWallGroup.add(wallMiddle);
        
        // Inner layer
        const wallInnerGeometry = new THREE.BoxGeometry(width, height, 0.05);
        const wallInnerMaterial = createWireframeMaterial(baseColor);
        const wallInner = new THREE.Mesh(wallInnerGeometry, wallInnerMaterial);
        wallInner.position.set(0, height/2, 0);
        frontWallGroup.add(wallInner);
        
        // Add windows based on building style
         // Fixed window layout: 5 windows across, 2 rows
         const windowRows = 2;
         const windowCols = 5;
        
        // Create and distribute windows
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                 // Skip center window on bottom row for door
                 if (row === 0 && col === 2) continue; // Skip middle position for door
                 
                 // Calculate window position - evenly spaced across the width
                 const windowSpacing = width / (windowCols + 1);
                 const windowX = -width/2 + windowSpacing * (col + 1);
                 const windowY = height * 0.3 + row * (height * 0.4);
                 
                 // Create bigger windows
                 let windowWidth = 1.2;
                 let windowHeight = 1.4;
                
                // Vary window size for different styles
                if (style === 'modern') {
                    windowWidth = 1.2;
                    windowHeight = 1.2;
                } else if (style === 'shop' && row === 0) {
                    // Larger windows for shop fronts on ground floor
                    windowWidth = 1.5;
                    windowHeight = 1.8;
                } else if (style === 'hospital') {
                    // Uniform windows for hospital
                    windowWidth = 1.0;
                    windowHeight = 1.4;
                }
                
                // Create window frame
                const frameGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.15);
                const frameMaterial = createWireframeMaterial(windowColor);
                frameMaterial.side = THREE.DoubleSide;
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                frame.position.set(windowX, windowY, 0.05);
                frontWallGroup.add(frame);
                
                // Create a window cutout in the middle layer
                const cutoutSize = Math.min(windowWidth, windowHeight) * 0.8;
                const holeGeometry = new THREE.BoxGeometry(cutoutSize, cutoutSize, 0.25);
                const holeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.0,
                    side: THREE.DoubleSide
                });
                const hole = new THREE.Mesh(holeGeometry, holeMaterial);
                hole.position.set(windowX, windowY, 0);
                wallMiddle.add(hole);
            }
        }
        
        // Add a door for all buildings (center position where we skipped the window)
        // Make doors bigger for far buildings so they're more visible
        let doorWidth = 1.4;
        let doorHeight = 2.2;
        
        // Scale up door for far buildings (they appear smaller)
        if (style === 'groton_church' || style === 'groton_townhall' || style === 'groton_colonial' || style === 'graveyard' || style === 'modern' || style === 'brick' || style === 'industrial' || style === 'hospital') {
            doorWidth = width * 0.15; // Scale with building width
            doorHeight = height * 0.4; // Scale with building height
        }
        
        const windowSpacing = width / (windowCols + 1);
        const doorX = -width/2 + windowSpacing * (2 + 1); // Center position (col 2)
        const doorY = doorHeight/2;
        
        // Door frame
        const doorFrameGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.15);
        const doorFrameMaterial = createWireframeMaterial(baseColor);
        doorFrameMaterial.color.multiplyScalar(0.8); // Slightly darker than wall
        const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
        doorFrame.position.set(doorX, doorY, 0.05);
        frontWallGroup.add(doorFrame);
        
        // Door handle
        const handleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const handleMaterial = createWireframeMaterial(windowColor);
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(doorX + doorWidth/3, doorY, 0.1);
        frontWallGroup.add(handle);
        
        // Add a storefront door for shop style buildings
        if (style === 'shop') {
            const doorWidth = 1.2;
            const doorHeight = 2.0;
            
            // Door frame
            const doorFrameGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.15);
            const doorFrameMaterial = createWireframeMaterial(baseColor);
            doorFrameMaterial.color.multiplyScalar(1.2); // Slightly brighter
            const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
            doorFrame.position.set(0, doorHeight/2, 0.05);
            frontWallGroup.add(doorFrame);
            
            // Door cutout in the middle layer
            const cutoutGeometry = new THREE.BoxGeometry(doorWidth * 0.8, doorHeight * 0.9, 0.25);
            const cutoutMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.0,
                side: THREE.DoubleSide
            });
            const doorCutout = new THREE.Mesh(cutoutGeometry, cutoutMaterial);
            doorCutout.position.set(0, doorHeight/2, 0);
            wallMiddle.add(doorCutout);
        } 
        
        // Add hospital entrance
        if (style === 'hospital') {
            const doorWidth = 2.5;
            const doorHeight = 2.8;
            
            // Double door frame
            const doorFrameGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.15);
            const doorFrameMaterial = createWireframeMaterial(0xDDDDDD); // Light gray
            doorFrameMaterial.side = THREE.DoubleSide;
            const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
            doorFrame.position.set(0, doorHeight/2, 0.05);
            frontWallGroup.add(doorFrame);
            
            // Door cutout in the middle layer
            const cutoutGeometry = new THREE.BoxGeometry(doorWidth * 0.9, doorHeight * 0.95, 0.25);
            const cutoutMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.0,
                side: THREE.DoubleSide
            });
            const doorCutout = new THREE.Mesh(cutoutGeometry, cutoutMaterial);
            doorCutout.position.set(0, doorHeight/2, 0);
            wallMiddle.add(doorCutout);
            
            // Add cross sign
            const crossGroup = new THREE.Group();
            
            // Vertical bar
            const verticalGeometry = new THREE.BoxGeometry(0.8, 2.2, 0.1);
            const crossMaterial = createWireframeMaterial(0xFF0000); // Red
            const verticalBar = new THREE.Mesh(verticalGeometry, crossMaterial);
            crossGroup.add(verticalBar);
            
            // Horizontal bar
            const horizontalGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.1);
            const horizontalBar = new THREE.Mesh(horizontalGeometry, crossMaterial);
            crossGroup.add(horizontalBar);
            
            // Position the cross
            crossGroup.position.set(0, height - 1.5, 0.2);
            frontWallGroup.add(crossGroup);
        }
        
        // Add specialized features for graveyard building
        if (style === 'graveyard') {
            // Add a gate entrance
            const gateWidth = 1.6;
            const gateHeight = 2.5;
            
            // Gate frame
            const gateFrameGeometry = new THREE.BoxGeometry(gateWidth, gateHeight, 0.2);
            const gateFrameMaterial = createWireframeMaterial(0x333333); // Dark gray
            const gateFrame = new THREE.Mesh(gateFrameGeometry, gateFrameMaterial);
            gateFrame.position.set(0, gateHeight/2, 0.1);
            frontWallGroup.add(gateFrame);
            
            // Gate arched top
            const archGeometry = new THREE.TorusGeometry(gateWidth/2, 0.2, 8, 8, Math.PI);
            const archMaterial = createWireframeMaterial(0x333333);
            const arch = new THREE.Mesh(archGeometry, archMaterial);
            arch.rotation.x = Math.PI/2;
            arch.position.set(0, gateHeight + 0.2, 0.1);
            frontWallGroup.add(arch);
            
            // Create gravestones in the yard area
            const graveyard = new THREE.Group();
            
            // Create rows of gravestones
            const rowCount = Math.floor(depth / 5);
            const colCount = Math.floor(width / 2);
            
            for (let row = 0; row < rowCount; row++) {
                for (let col = 0; col < colCount; col++) {
                    // Skip some positions randomly
                    if (Math.random() > 0.7) continue;
                    
                    // Position with some randomness
                    const posX = -width/2 + 1 + col * 2 + (Math.random() * 0.8 - 0.4);
                    const posZ = -2 - row * 4 - (Math.random() * 2);
                    
                    // Create gravestone
                    const stoneHeight = 0.8 + Math.random() * 0.6;
                    const stoneWidth = 0.6 + Math.random() * 0.3;
                    
                    // Stone base shape varies
                    let stoneGeometry;
                    if (Math.random() > 0.5) {
                        // Rectangle with rounded top
                        stoneGeometry = new THREE.BoxGeometry(stoneWidth, stoneHeight, 0.2);
                    } else {
                        // Cross shape
                        stoneGeometry = new THREE.BoxGeometry(stoneWidth, stoneHeight, 0.2);
                    }
                    
                    const stoneMaterial = createWireframeMaterial(0x999999);
                    const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
                    
                    stone.position.set(posX, stoneHeight/2, posZ);
                    graveyard.add(stone);
                }
            }
            
            // Position the graveyard
            graveyard.position.set(0, 0, -depth/6);
            frontWallGroup.add(graveyard);
        }
        
        // Add roof
        const roofGeometry = new THREE.BoxGeometry(width, 0.2, depth);
        const roofMaterial = createWireframeMaterial(roofColor);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height, -depth/2);
        frontWallGroup.add(roof);
        
        // Add some details based on style
        if (style === 'modern') {
            // Add a rooftop structure for modern buildings
            const rooftopGeometry = new THREE.BoxGeometry(width/3, 0.8, depth/2);
            const rooftopMaterial = createWireframeMaterial(baseColor);
            const rooftop = new THREE.Mesh(rooftopGeometry, rooftopMaterial);
            rooftop.position.set(0, height + 0.5, -depth/2);
            frontWallGroup.add(rooftop);
        } else if (style === 'industrial') {
            // Add pipes or vents for industrial buildings
            const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, height, 4, 1);
            const pipeMaterial = createWireframeMaterial(0x999999);
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.position.set(width/2 - 0.5, height/2, -0.1);
            frontWallGroup.add(pipe);
        } else if (style === 'brick') {
            // Add a chimney for brick buildings
            const chimneyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
            const chimneyMaterial = createWireframeMaterial(baseColor);
            chimneyMaterial.color.multiplyScalar(0.8); // Darker
            const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
            chimney.position.set(width/3, height + 0.6, -depth/3);
            frontWallGroup.add(chimney);
        } else if (style === 'hospital') {
            // Add a helicopter pad on the roof
            const padGeometry = new THREE.CylinderGeometry(width/6, width/6, 0.1, 16);
            const padMaterial = createWireframeMaterial(0x333333);
            const helipad = new THREE.Mesh(padGeometry, padMaterial);
            helipad.position.set(0, height + 0.1, -depth/2);
            frontWallGroup.add(helipad);
            
            // H letter on helipad
            const hGeometry = new THREE.BoxGeometry(width/18, 0.05, width/9);
            const hMaterial = createWireframeMaterial(0xFFFFFF);
            const hLetter = new THREE.Mesh(hGeometry, hMaterial);
            hLetter.position.set(0, height + 0.16, -depth/2);
            frontWallGroup.add(hLetter);
            
            // Vertical parts of H
            const vLeftGeometry = new THREE.BoxGeometry(width/45, 0.05, width/9);
            const vLeftLetter = new THREE.Mesh(vLeftGeometry, hMaterial);
            vLeftLetter.position.set(-width/24, height + 0.16, -depth/2);
            frontWallGroup.add(vLeftLetter);
            
            const vRightGeometry = new THREE.BoxGeometry(width/45, 0.05, width/9);
            const vRightLetter = new THREE.Mesh(vRightGeometry, hMaterial);
            vRightLetter.position.set(width/24, height + 0.16, -depth/2);
            frontWallGroup.add(vRightLetter);
        } else if (style === 'groton_church') {
            // Add classic New England church steeple - much taller and more prominent
            const steepleBase = new THREE.BoxGeometry(width/2.5, height * 1.2, depth/2.5);
            const steepleBaseMaterial = createWireframeMaterial(baseColor);
            const steepleBaseMesh = new THREE.Mesh(steepleBase, steepleBaseMaterial);
            steepleBaseMesh.position.set(0, height + height * 0.6, -depth/3);
            frontWallGroup.add(steepleBaseMesh);
            
            // Bell tower section
            const bellTower = new THREE.BoxGeometry(width/3.5, height * 0.6, depth/3.5);
            const bellTowerMaterial = createWireframeMaterial(baseColor);
            const bellTowerMesh = new THREE.Mesh(bellTower, bellTowerMaterial);
            bellTowerMesh.position.set(0, height + height * 1.2 + height * 0.3, -depth/3);
            frontWallGroup.add(bellTowerMesh);
            
            // Tall spire on top - much more prominent
            const spireGeometry = new THREE.ConeGeometry(width/10, height * 1.5, 8);
            const spireMaterial = createWireframeMaterial(roofColor);
            const spire = new THREE.Mesh(spireGeometry, spireMaterial);
            spire.position.set(0, height + height * 1.2 + height * 0.6 + height * 0.75, -depth/3);
            frontWallGroup.add(spire);
            
            // Cross on top of spire - larger and more visible
            const crossVertical = new THREE.BoxGeometry(0.15, 1.2, 0.15);
            const crossHorizontal = new THREE.BoxGeometry(0.6, 0.15, 0.15);
            const crossMaterial = createWireframeMaterial(0xFFFFFF);
            
            const crossV = new THREE.Mesh(crossVertical, crossMaterial);
            crossV.position.set(0, height + height * 1.2 + height * 0.6 + height * 1.5 + 0.6, -depth/3);
            frontWallGroup.add(crossV);
            
            const crossH = new THREE.Mesh(crossHorizontal, crossMaterial);
            crossH.position.set(0, height + height * 1.2 + height * 0.6 + height * 1.5 + 0.3, -depth/3);
            frontWallGroup.add(crossH);
            
        } else if (style === 'groton_townhall') {
            // Simple brick town hall - no fancy stuff
            baseColor = 0x8B4513; // Brown brick
            windowColor = 0xFFFFFF; // White trim
            roofColor = 0x654321; // Brown roof
            
            // Just two simple white columns at entrance
            for (let i = 0; i < 2; i++) {
                const columnX = (i - 0.5) * width * 0.3;
                const column = new THREE.BoxGeometry(0.5, height * 0.6, 0.5);
                const columnMaterial = createWireframeMaterial(windowColor);
                const columnMesh = new THREE.Mesh(column, columnMaterial);
                columnMesh.position.set(columnX, height * 0.3, 0.2);
                frontWallGroup.add(columnMesh);
            }
            
            // Simple "TOWN HALL" sign
            const sign = new THREE.BoxGeometry(width/2, 0.5, 0.1);
            const signMaterial = createWireframeMaterial(windowColor);
            const signMesh = new THREE.Mesh(sign, signMaterial);
            signMesh.position.set(0, height * 0.8, 0.1);
            frontWallGroup.add(signMesh);
            
        } else if (style === 'groton_colonial') {
            // Simple New England colonial with classic triangular roof
            baseColor = 0xFFF8DC; // Cream white siding
            windowColor = 0x000080; // Navy blue shutters
            roofColor = 0x2F4F2F; // Dark slate gray roof
            
            // Simple triangular prism roof - like a real New England colonial
            const roofHeight = height * 0.4;
            
            // Create a custom triangular prism geometry
            const roofGeometry = new THREE.BufferGeometry();
            
             // Define vertices for a triangular prism roof (no front face)
             // Ridge line runs along the center of the house from left to right
             const vertices = new Float32Array([
                 // Back sloped face (triangle)  
                  width/2, 0, depth/2,   // back right corner of house
                 -width/2, 0, depth/2,   // back left corner of house
                  0, roofHeight, 0,       // peak at center of house depth
                 
                 // Left sloped face
                 -width/2, 0, -depth/2,  // front left corner
                 -width/2, 0, depth/2,   // back left corner
                  0, roofHeight, 0,       // peak at center
                 
                 // Right sloped face
                  width/2, 0, -depth/2,  // front right corner
                  0, roofHeight, 0,       // peak at center
                  width/2, 0, depth/2    // back right corner
             ]);
             
             const indices = [
                 0, 1, 2,    // back triangle  
                 3, 4, 5,    // left sloped face
                 6, 7, 8     // right sloped face
             ];
            
            roofGeometry.setIndex(indices);
            roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            roofGeometry.computeVertexNormals();
            
            const roofMaterial = createWireframeMaterial(roofColor);
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(0, height, -depth/2); // Move roof back to center it on the house
            frontWallGroup.add(roof);
            
            // Simple brick chimney - positioned on the center ridge
            const chimney = new THREE.BoxGeometry(0.8, height * 0.6, 0.8);
            const chimneyMaterial = createWireframeMaterial(0xB22222); // Brick red
            const chimneyMesh = new THREE.Mesh(chimney, chimneyMaterial);
            chimneyMesh.position.set(width/4, height + (height * 0.6)/2, -depth/2); // Starts at top of house cube
            frontWallGroup.add(chimneyMesh);
        }
        
        // Side walls for a little more depth
        const sideWallGeometry = new THREE.BoxGeometry(0.2, height, depth);
        const sideWallMaterial = createWireframeMaterial(baseColor);
        sideWallMaterial.color.multiplyScalar(0.9); // Slightly darker
        
        const leftWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
        leftWall.position.set(-width/2, height/2, -depth/2);
        frontWallGroup.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
        rightWall.position.set(width/2, height/2, -depth/2);
        frontWallGroup.add(rightWall);
        
        // Add a sign for shop buildings
        if (style === 'shop') {
            const signGeometry = new THREE.BoxGeometry(width * 0.7, 0.8, 0.3);
            const signMaterial = createWireframeMaterial(0xffaa00); // Orange sign
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(0, height - 1, 0.2);
            frontWallGroup.add(sign);
        }
        
        buildingGroup.add(frontWallGroup);
        buildingGroup.position.set(x, 0, z);
        
        return buildingGroup;
    };
    
    // Create specific Massachusetts plaza shops using configuration
    const facadeDepth = PLAZA_CONFIG.SHOP_DEPTH; // Depth for all buildings
    const shopHeight = PLAZA_CONFIG.SHOP_HEIGHT; // Standard shop height
    const shopGap = 1; // Small gap between shops
    
    // Define our 6 specific shops with their characteristics
    const plazaShops = [
        { name: 'Cumby\'s', width: 18, style: 'convenience', signColor: 0xFFFFFF },
        { name: 'Grohos', width: 16, style: 'pizza', signColor: 0xFFFFFF },
        { name: 'Clothing Store', width: 14, style: 'clothing', signColor: 0xFFFFFF },
        { name: 'Dry Cleaners', width: 12, style: 'drycleaner', signColor: 0x000000 },
        { name: 'Dunkin', width: 15, style: 'coffee', signColor: 0xFFFFFF },
        { name: 'Flower Shop', width: 13, style: 'flowers', signColor: 0x000000 }
    ];
    
    // Position shops in a line, keeping the karaoke bar in the center
    let currentX = PLAZA_CONFIG.SHOP_ROW_START_X; // Start from left side of plaza
    
    plazaShops.forEach((shop, index) => {
        // Skip the center position where karaoke bar is
        if (currentX > -12 && currentX < 12) {
            currentX = 22; // Jump to right side of karaoke bar
        }
        
        // Create building at X position (Z=0 since it's in frontShopsGroup which handles Z)
        const building = createBuildingFacade(currentX, 0, shop.width, shopHeight, facadeDepth, shop.style);
        
        // Add shop sign (positioned relative to the group)
        const signGeometry = new THREE.PlaneGeometry(shop.width * 0.8, 1, 4, 1);
        const signMaterial = createWireframeMaterial(shop.signColor);
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(currentX, shopHeight - 0.5, 0.1); // Position close to building facade front
        frontShopsGroup.add(sign); // Add to front shops group
        
        // Add shop name to streetElements for future reference
        streetElements[`${shop.name.replace(/[^a-zA-Z]/g, '').toLowerCase()}Shop`] = building;
        
        frontShopsGroup.add(building); // Add to front shops group instead of scene
        currentX += shop.width + shopGap;
    });
    
    // NPCs will be created by the createNPCs function later in the scene creation
    
    // Add buildings on the opposite side - these go behind the main shops (the plaza layout)
    
    // Karaoke Sign above the door
    const signGeometry = new THREE.BoxGeometry(10, 1.2, 0.5, 6, 2, 1); // Larger sign
    const signMaterial = createWireframeMaterial(0xff00ff); // Magenta sign
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, buildingHeight + 0.8, 0.5); // Above the door
    frontShopsGroup.add(sign); // Add to front shops group instead of exterior
    streetElements.sign = sign;
    
    // "KARAOKE" text on the sign
    const textGroup = new THREE.Group();
    textGroup.position.set(-4, buildingHeight + 0.8, 0.7); // On the sign
    
    // Create "KARAOKE" letters - improved sizing and spacing
    const letterPositions = [
        { x: 0, y: 0, z: 0 },    // K
        { x: 1.0, y: 0, z: 0 },  // A
        { x: 2.0, y: 0, z: 0 },  // R
        { x: 3.0, y: 0, z: 0 },  // A
        { x: 4.0, y: 0, z: 0 },  // O
        { x: 5.0, y: 0, z: 0 },  // K
        { x: 6.0, y: 0, z: 0 },  // E
        { x: 7.0, y: 0, z: 0 },  // K
        { x: 8.0, y: 0, z: 0 },  // E
    ];
    
    // Create simple wireframe boxes for each letter - larger
    letterPositions.forEach((pos, index) => {
        // Alternate colors for a flashing effect
        const letterColor = index % 2 === 0 ? 0xff0000 : 0x00ffff;
        const letterGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.2, 2, 2, 1);
        const letterMaterial = createWireframeMaterial(letterColor);
        const letter = new THREE.Mesh(letterGeometry, letterMaterial);
        letter.position.set(pos.x, pos.y, pos.z);
        textGroup.add(letter);
    });
    
    frontShopsGroup.add(textGroup); // Add to front shops group instead of exterior
    streetElements.karaokeSigns = textGroup;
    
    // Street Lamps - positioned on both sidewalks
    const createStreetLamp = (x, z) => {
        const lampGroup = new THREE.Group();
        
        // Concrete base
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 6, 1);
        const concreteMaterial = createWireframeMaterial(0x999999); // Concrete gray
        const base = new THREE.Mesh(baseGeometry, concreteMaterial);
        base.position.y = 0.4;
        lampGroup.add(base);
        
        // Main vertical pole
        const poleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 7, 6, 1);
        const pole = new THREE.Mesh(poleGeometry, concreteMaterial);
        pole.position.y = 4;
        lampGroup.add(pole);
        
        // Horizontal arm
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6, 1);
        const arm = new THREE.Mesh(armGeometry, concreteMaterial);
        arm.rotation.z = Math.PI / 2; // Rotate to be horizontal
        arm.position.set(0.8, 7.5, 0); // Centered on pole
        lampGroup.add(arm);
        
        // Light fixture housing
        const housingGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.6, 6, 1);
        const housingMaterial = createWireframeMaterial(0x777777); // Darker gray for housing
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.rotation.x = Math.PI / 2; // Rotate to point downward
        housing.position.set(2.0, 7.5, 0); // Position at the end of the horizontal arm
        lampGroup.add(housing);
        
        // Orange sodium vapor light
        const lightGeometry = new THREE.SphereGeometry(0.25, 8, 4);
        const lightMaterial = createWireframeMaterial(0xFF8C00); // Orange sodium vapor color
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(2.0, 7.3, 0); // Slightly below the housing
        lampGroup.add(light);
        
        // Add a point light for actual illumination
        const pointLight = new THREE.PointLight(0xFF8C00, 0.8, 10);
        pointLight.position.copy(light.position);
        lampGroup.add(pointLight);
        
        lampGroup.position.set(x, 0, 0); // Z is handled by the group that contains it
        return lampGroup;
    };
    
    // Add street lamps on both sides - organized by sidewalk groups
    const nearLampLeft = createStreetLamp(-10);   // Near building, left
    const nearLampRight = createStreetLamp(10);   // Near building, right
    const farLampLeft = createStreetLamp(-10);    // Far side, left
    const farLampRight = createStreetLamp(10);    // Far side, right
    
    // Add near sidewalk lamps to near sidewalk group
    nearSidewalkElementsGroup.add(nearLampLeft);
    nearSidewalkElementsGroup.add(nearLampRight);
    
    // Add far sidewalk lamps to far sidewalk group
    farSidewalkElementsGroup.add(farLampLeft);
    farSidewalkElementsGroup.add(farLampRight);
    
    // Add more street lamps along the street for better coverage
    const additionalLamps = [];
    for (let x = -120; x <= 120; x += 30) { // Every 30 units along the street
        if (x !== -10 && x !== 10 && x !== 0) { // Skip positions where we already have lamps and center
            // Near sidewalk lamps
            const nearLamp = createStreetLamp(x);
            nearSidewalkElementsGroup.add(nearLamp);
            additionalLamps.push(nearLamp);
            
            // Far sidewalk lamps
            const farLamp = createStreetLamp(x);
            farSidewalkElementsGroup.add(farLamp);
            additionalLamps.push(farLamp);
        }
    }
    
    streetElements.streetLamps = [nearLampLeft, nearLampRight, farLampLeft, farLampRight, ...additionalLamps];

    // Create a bench
    const createBench = (x) => {
        const benchGroup = new THREE.Group();
        
        // Bench seat
        const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
        const benchMaterial = createWireframeMaterial(0x885500); // Wood brown
        const seat = new THREE.Mesh(seatGeometry, benchMaterial);
        seat.position.y = 0.5;
        benchGroup.add(seat);
        
        // Bench back
        const backGeometry = new THREE.BoxGeometry(2, 0.8, 0.1);
        const back = new THREE.Mesh(backGeometry, benchMaterial);
        back.position.set(0, 0.9, -0.25);
        benchGroup.add(back);
        
        // Bench legs
        const createLeg = (x) => {
            const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
            const leg = new THREE.Mesh(legGeometry, benchMaterial);
            leg.position.set(x, 0.25, 0);
            return leg;
        };
        
        // Add four legs
        benchGroup.add(createLeg(-0.8));
        benchGroup.add(createLeg(0.8));
        benchGroup.add(createLeg(-0.8));
        benchGroup.add(createLeg(0.8));
        
        benchGroup.position.set(x, 0, 0); // Z is handled by the group that contains it
        return benchGroup;
    };
    
    // Create a trashcan
    const createTrashcan = (x) => {
        const trashGroup = new THREE.Group();
        
        // Trashcan body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 8);
        const trashMaterial = createWireframeMaterial(0x444444); // Dark gray
        const body = new THREE.Mesh(bodyGeometry, trashMaterial);
        body.position.y = 0.4;
        trashGroup.add(body);
        
        // Trashcan lid
        const lidGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 8);
        const lidMaterial = createWireframeMaterial(0x666666); // Lighter gray
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 0.85;
        trashGroup.add(lid);
        
        trashGroup.position.set(x, 0, 0); // Z is handled by the group that contains it
        return trashGroup;
    };
    
    // Original benches removed - they were facing the wrong way
    
    // Add more benches along the street for better coverage
    const additionalBenches = [];
    for (let x = -100; x <= 100; x += 25) { // Every 25 units along the street
        if (x !== -8 && x !== 8 && x !== 0) { // Skip positions where we already have benches and center
            // Near sidewalk benches
            const nearBench = createBench(x);
            nearSidewalkElementsGroup.add(nearBench);
            additionalBenches.push(nearBench);
            
            // Far sidewalk benches
            const farBench = createBench(x);
            farSidewalkElementsGroup.add(farBench);
            additionalBenches.push(farBench);
        }
    }
    
    streetElements.benches = [...additionalBenches];
    
    // Add trashcans organized by sidewalk groups
    const nearTrashLeft = createTrashcan(-12);   // Near sidewalk, left
    const nearTrashRight = createTrashcan(12);   // Near sidewalk, right
    const farTrashLeft = createTrashcan(-12);    // Far sidewalk, left
    const farTrashRight = createTrashcan(12);    // Far sidewalk, right
    
    // Add near sidewalk trashcans to near sidewalk group
    nearSidewalkElementsGroup.add(nearTrashLeft);
    nearSidewalkElementsGroup.add(nearTrashRight);
    
    // Add far sidewalk trashcans to far sidewalk group
    farSidewalkElementsGroup.add(farTrashLeft);
    farSidewalkElementsGroup.add(farTrashRight);
    
    // Add more trash cans along the street for better coverage (avoiding bench and lamp positions)
    const additionalTrashCans = [];
    for (let x = -110; x <= 110; x += 35) { // Every 35 units along the street
        // Skip positions where we already have trash cans, benches, or lamps
        const isBenchPosition = (x >= -8 && x <= -8) || (x >= 8 && x <= 8) || 
                               (x >= -100 && x <= 100 && (x - (-100)) % 25 === 0); // Bench spacing every 25 units
        const isLampPosition = (x >= -10 && x <= -10) || (x >= 10 && x <= 10) || 
                              (x >= -120 && x <= 120 && (x - (-120)) % 30 === 0); // Lamp spacing every 30 units
        
        if (x !== -12 && x !== 12 && !isBenchPosition && !isLampPosition) {
            // Near sidewalk trash cans
            const nearTrash = createTrashcan(x);
            nearSidewalkElementsGroup.add(nearTrash);
            additionalTrashCans.push(nearTrash);
            
            // Far sidewalk trash cans
            const farTrash = createTrashcan(x);
            farSidewalkElementsGroup.add(farTrash);
            additionalTrashCans.push(farTrash);
        }
    }
    
    streetElements.trashcans = [nearTrashLeft, nearTrashRight, farTrashLeft, farTrashRight, ...additionalTrashCans];

    // Rotate all benches to face the street properly
    streetElements.benches.forEach((bench, index) => {
        // Check which group the bench belongs to by looking at its parent
        const isNearSidewalk = bench.parent === nearSidewalkElementsGroup;
        
        if (isNearSidewalk) {
            // Near sidewalk benches - face away from street (toward buildings)
            bench.rotation.y = 0;
        } else {
            // Far sidewalk benches - face toward street (away from buildings)
            bench.rotation.y = -Math.PI;
        }
    });
    
    // Rotate all lamps to face the street properly
    streetElements.streetLamps.forEach((lamp, index) => {
        // Check which group the lamp belongs to by looking at its parent
        const isNearSidewalk = lamp.parent === nearSidewalkElementsGroup;
        
        if (isNearSidewalk) {
            // Near sidewalk lamps - face away from street (toward buildings)
            lamp.rotation.y = -Math.PI / 2;
        } else {
            // Far sidewalk lamps - face toward street (away from buildings)
            lamp.rotation.y = Math.PI / 2;
        }
    });
    
    } 
    
    // Add cars driving on the street - organized to street group with proper lane positioning
    let car1, car2, car3, car4;
    car1 = createCar(-120, getRandomCarColor(), 'left');   // Car on left lane, far left
    car1.position.z = 2; // Left lane (relative to street group at Z=11, so actual Z=13)
    car2 = createCar(120, getRandomCarColor(), 'right');   // Car on right lane, far right
    car2.position.z = -2; // Right lane (relative to street group at Z=11, so actual Z=9)
    car3 = createCar(-60, getRandomCarColor(), 'left');   // Car on left lane, mid-left
    car3.position.z = 2; // Left lane
    car4 = createCar(60, getRandomCarColor(), 'right');   // Car on right lane, mid-right
    car4.position.z = -2; // Right lane
    
    // Add cars to street group
    streetElementsGroup.add(car1);
    streetElementsGroup.add(car2);
    streetElementsGroup.add(car3);
    streetElementsGroup.add(car4);
    
    streetElements.cars = [car1, car2, car3, car4];
    
    // Store the last time a car was spawned
    streetElements.lastCarSpawnTime = 0;
    
    // Add a bus to the street group with proper lane positioning
    const bus = createBus(-140, 0xFFFFFF, 'right'); // White MBTA bus, start at far left
    bus.position.z = -3.75; // Bus lane moved 2 units closer to center (relative to street group at Z=11, so actual Z=8)
    streetElementsGroup.add(bus);
    streetElements.bus = bus;
    
    // Add a bus stop to the near sidewalk group
    const busStop = createBusStop(-15); // On the near sidewalk
    busStop.rotation.y = 0; // Face away from the street
    nearSidewalkElementsGroup.add(busStop);
    streetElements.busStop = busStop;
    
    // Add forest elements if enabled for this scene
    if (PLAZA_CONFIG.FOREST_ELEMENTS) {
        const forestElements = createForestElements();
        scene.add(forestElements);
        streetElements.forestElements = forestElements;
        console.log("Added forest elements to scene");
    }
    
    // Add suburban elements if enabled for this scene
    if (PLAZA_CONFIG.SUBURBAN_ELEMENTS) {
        const suburbanElements = createSuburbanElements();
        scene.add(suburbanElements);
        streetElements.suburbanElements = suburbanElements;
        console.log("Added suburban elements to scene");
    }
    
    // Conditional front area creation - park vs karaoke bar/shops
    if (PLAZA_CONFIG.FRONT_IS_PARK) {
        // Create park elements for forest suburban scene
        const parkElements = createParkElements(frontShopsGroup);
        streetElements.parkElements = parkElements;
        console.log("🌳 Created park for forest suburban scene");
        } else {
        // Create karaoke bar and shops for plaza scene
        console.log("🎤 Creating karaoke bar and shops for plaza scene");
        // The karaoke bar creation is currently happening earlier in the function
        // This needs to be restructured to only run for PLAZA scene
    }
    
    // Define facade depth for buildings (needed for both scenes)
    const facadeDepth = 15; // Standard building depth
    
    // Create far buildings (available for both scenes)
    // Buildings on the far side, using a consistent approach across the entire street width
    // Define the total street coverage range
    const streetLeftEdge = -40;
    const streetRightEdge = 40;
    const streetWidth = streetRightEdge - streetLeftEdge;
    
    // Create buildings based on scene type
    let numFarBuildings, buildingStyles;
    
    if (PLAZA_CONFIG.FEWER_BUILDINGS) {
        // Park-like New England setting - fewer, specific building types based on Groton, MA
        numFarBuildings = 3 + Math.floor(Math.random() * 2); // 3-4 buildings only
        buildingStyles = ['groton_church', 'groton_townhall', 'groton_colonial', 'graveyard']; // Authentic Groton buildings
        console.log("🏘️ Creating Groton, MA style buildings for forest scene");
    } else {
        // Original urban setting
        numFarBuildings = 4 + Math.floor(Math.random() * 2); // 4-5 buildings
        buildingStyles = ['modern', 'brick', 'shop', 'industrial', 'hospital', 'graveyard'];
    }
    
    const avgBuildingWidth = streetWidth / Math.max(numFarBuildings, 4); // Ensure reasonable spacing
    
    // Track previous building type to avoid duplicates
    let previousBuildingStyle = null;
    
    // Loop through and create buildings with predictable placement
    for (let i = 0; i < numFarBuildings; i++) {
        // Calculate a reasonable width that won't cause overlap
        const buildingGap = PLAZA_CONFIG.FEWER_BUILDINGS ? 3 : 2; // More space in both settings
        const maxWidth = avgBuildingWidth - buildingGap;
        const width = 8 + Math.random() * Math.min(6, maxWidth - 6); // Reasonable building sizes to prevent overlap
        
        // Building position across the street
        const x = streetLeftEdge + (i * avgBuildingWidth) + (avgBuildingWidth / 2);
        
        // Randomize other properties with minimum height to prevent "smushed" buildings
        const height = PLAZA_CONFIG.FEWER_BUILDINGS ? 
            5 + Math.random() * 4 : // Taller, more substantial buildings
            Math.max(6, 4 + Math.random() * 3); // Minimum 6 units tall for city buildings
        
        // Choose building style - avoid consecutive duplicates
        let buildingStyle;
        do {
            buildingStyle = buildingStyles[Math.floor(Math.random() * buildingStyles.length)];
        } while (buildingStyle === previousBuildingStyle && buildingStyles.length > 1);
        previousBuildingStyle = buildingStyle;
        
        // Create the building with the proper facadeDepth
        const building = createBuildingFacade(
            width, height, facadeDepth, 
            buildingStyle
        );
        building.position.set(x, 0, 0); // Z position handled by farBuildingsGroup
        building.rotation.y = Math.PI; // Face toward the front shops
        
        // Add small random offset to avoid perfect alignment
        building.position.z += Math.random() * 2 - 1; // +/- 1 unit random z variation
        
        farBuildingsGroup.add(building); // Add to far buildings group instead of scene
    }

    // Add NPCs to the scene
    streetElements.npcs = createNPCs(PLAZA_CONFIG, CURRENT_SCENE, scene);
    
    return streetElements;
};

// Create the interior bar scene with adjusted positioning
const createInteriorScene = (frontShopsGroup) => {
    const interiorElements = {};
    
    // Building dimensions are larger now: 20x5x15
    
    // Bar counter - rotated to be along the left wall with prominent wireframe
    const barGeometry = new THREE.BoxGeometry(10, 1, 1.5, 2, 1, 1); // Very few segments for thicker wireframe
    const barMaterial = createWireframeMaterial(0xDA8A67); // Brighter brown/orange
    barMaterial.wireframeLinewidth = 2; // Note: This has limited effect in WebGL
    const barCounter = new THREE.Mesh(barGeometry, barMaterial);
    
    // Rotate to align with left wall and position appropriately
    barCounter.rotation.y = Math.PI / 2; // Rotate 90 degrees so length runs along z-axis
    barCounter.position.set(-8, 1, -7.5); // Position along left wall, centered in depth
    barCounter.scale.set(1.02, 1.02, 1.02); // Slightly larger to emphasize
    
    frontShopsGroup.add(barCounter); // Add to front shops group to move with building
    interiorElements.barCounter = barCounter;
    
    // Bar stools - repositioned to be in front of the rotated bar
    const createBarStool = (z) => {
        const stoolGroup = new THREE.Group();
        
        // Stool seat with enhanced visibility
        const seatGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8, 1);
        const seatMaterial = createGlowingWireframeMaterial(0x88CCFF, 1.0, 0.3); // Light blue glow
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 1;
        stoolGroup.add(seat);
        
        // Stool leg
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 4, 1);
        const legMaterial = createWireframeMaterial(0x555555);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.y = 0.5;
        stoolGroup.add(leg);
        
        // Position stool in front of bar along z-axis
        stoolGroup.position.set(-6.6, 0, z);
        frontShopsGroup.add(stoolGroup); // Add to front shops group to move with building
        return stoolGroup;
    };
    
    // Add bar stools along the bar
    interiorElements.barStools = [
        createBarStool(-4),
        createBarStool(-6),
        createBarStool(-8),
        createBarStool(-10),
        createBarStool(-12)
    ];
    
    // Create a diner booth (seat + backrest + table)
    const createDinerBooth = (x, z) => {
        const boothGroup = new THREE.Group();
        
        // Booth seat
        const seatGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.8, 3, 2, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4); // Brighter red with glow
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.3, 0);
        boothGroup.add(seat);
        
        // Booth backrest
        const backrestGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.2, 3, 2, 1);
        const backrestMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4); // Matching red
        const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
        backrest.position.set(0, 0.9, -0.4);
        boothGroup.add(backrest);
        
        // Booth table
        const tableGeometry = new THREE.BoxGeometry(2, 0.1, 0.8, 3, 1, 2);
        const tableMaterial = createGlowingWireframeMaterial(0xFFAA44, 1.0, 0.3); // Warm orange
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(0, 0.65, 0.8); // Positioned in front of the seat
        boothGroup.add(table);
        
        // Table legs
        const legGeometry = new THREE.BoxGeometry(0.08, 0.8, 0.08, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x8B4513);
        
        // Add four legs to the table
        const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontLeftLeg.position.set(0.85, 0.3, 1.1);
        boothGroup.add(frontLeftLeg);
        
        const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontRightLeg.position.set(-0.85, 0.3, 1.1);
        boothGroup.add(frontRightLeg);
        
        const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        backLeftLeg.position.set(0.85, 0.3, 0.5);
        boothGroup.add(backLeftLeg);
        
        const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        backRightLeg.position.set(-0.85, 0.3, 0.5);
        boothGroup.add(backRightLeg);
        
        // Optional details - condiment tray
        const condimentTrayGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.3, 1, 1, 1);
        const condimentTrayMaterial = createWireframeMaterial(0x666666);
        const condimentTray = new THREE.Mesh(condimentTrayGeometry, condimentTrayMaterial);
        condimentTray.position.set(0.7, 0.8, 0.8);
        boothGroup.add(condimentTray);
        
        // Salt and pepper shakers
        const shakerGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 6, 1);
        const saltMaterial = createWireframeMaterial(0xFFFFFF);
        const pepperMaterial = createWireframeMaterial(0x222222);
        
        const saltShaker = new THREE.Mesh(shakerGeometry, saltMaterial);
        saltShaker.position.set(0.65, 0.87, 0.75);
        boothGroup.add(saltShaker);
        
        const pepperShaker = new THREE.Mesh(shakerGeometry, pepperMaterial);
        pepperShaker.position.set(0.75, 0.87, 0.85);
        boothGroup.add(pepperShaker);
        
        // Position the entire booth
        boothGroup.position.set(x, 0, z);
        frontShopsGroup.add(boothGroup); // Add to front shops group to move with building
        return boothGroup;
    };
    
    // Create the opposite bench with backrest on the other side
    const createOppositeBench = (x, z) => {
        const boothGroup = new THREE.Group();
        
        // Booth seat
        const seatGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.8, 3, 2, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4); // Brighter red with glow
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.3, -0.7);
        boothGroup.add(seat);
        
        // Booth backrest on the opposite side
        const backrestGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.2, 3, 2, 1);
        const backrestMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4); // Matching red
        const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
        // This is the key change - backrest is on the opposite side
        backrest.position.set(0, 0.9, -1.0); // Backrest faces the opposite direction
        boothGroup.add(backrest);
        
        // Position the entire booth
        boothGroup.position.set(x, 0, z);
        frontShopsGroup.add(boothGroup); // Add to front shops group to move with building
        return boothGroup;
    };
    
    // Create a row of booth pairs along the right wall
    interiorElements.dinerBooths = [];
    
    // Spacing for the booths
    const boothSpacing = 2.9;
    const rightWallX = 9.2; // Position along right wall, moved closer to wall
    const startZ = -2; // Start near the front of the bar
    
    // Create 5 booth pairs along the wall
    for (let i = 0; i < 5; i++) {
        const z = startZ - (i * boothSpacing);
        
        // First booth - right side against wall
        const firstBooth = createDinerBooth(rightWallX - 0.8, z - 0.5);
        firstBooth.rotation.y = 0; // No rotation - right side against wall
        
        // Second booth - back-to-back with first booth
        const secondBooth = createOppositeBench(rightWallX - 0.8, z + 0.5);
        secondBooth.rotation.y = Math.PI; // 180 degrees - back to back with first booth
        
        // Track these booths
        interiorElements.dinerBooths.push(firstBooth, secondBooth);
    }
    
    // Tables and chairs - keep the creation functions
    const createTable = (x, z) => {
        const tableGroup = new THREE.Group();
        
        // Table top with enhanced visibility
        const tableGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5, 2, 1, 2);
        const tableMaterial = createGlowingWireframeMaterial(0xFFAA44, 1.0, 0.3); // Warm orange glow
        const tableTop = new THREE.Mesh(tableGeometry, tableMaterial);
        tableTop.position.y = 0.75;
        tableGroup.add(tableTop);
        
        // Table legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.75, 0.1, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x8B4513);
        
        // Create four legs
        const leg1 = new THREE.Mesh(legGeometry, legMaterial);
        leg1.position.set(0.6, 0.375, 0.6);
        tableGroup.add(leg1);
        
        const leg2 = new THREE.Mesh(legGeometry, legMaterial);
        leg2.position.set(0.6, 0.375, -0.6);
        tableGroup.add(leg2);
        
        const leg3 = new THREE.Mesh(legGeometry, legMaterial);
        leg3.position.set(-0.6, 0.375, 0.6);
        tableGroup.add(leg3);
        
        const leg4 = new THREE.Mesh(legGeometry, legMaterial);
        leg4.position.set(-0.6, 0.375, -0.6);
        tableGroup.add(leg4);
        
        tableGroup.position.set(x, 0, z);
        frontShopsGroup.add(tableGroup); // Add to front shops group to move with building
        return tableGroup;
    };
    
    const createChair = (x, z, rotation) => {
        const chairGroup = new THREE.Group();
        
        // Chair seat with enhanced visibility
        const seatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6, 2, 1, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xAA88FF, 1.0, 0.3); // Lavender glow
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.5;
        chairGroup.add(seat);
        
        // Chair back
        const backGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1, 2, 2, 1);
        const backMaterial = createGlowingWireframeMaterial(0xAA88FF, 1.0, 0.3); // Matching lavender
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.set(0, 0.8, -0.25);
        chairGroup.add(back);
        
        // Chair legs
        const legGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x666666);
        
        // Create four legs
        const leg1 = new THREE.Mesh(legGeometry, legMaterial);
        leg1.position.set(0.25, 0.25, 0.25);
        chairGroup.add(leg1);
        
        const leg2 = new THREE.Mesh(legGeometry, legMaterial);
        leg2.position.set(0.25, 0.25, -0.25);
        chairGroup.add(leg2);
        
        const leg3 = new THREE.Mesh(legGeometry, legMaterial);
        leg3.position.set(-0.25, 0.25, 0.25);
        chairGroup.add(leg3);
        
        const leg4 = new THREE.Mesh(legGeometry, legMaterial);
        leg4.position.set(-0.25, 0.25, -0.25);
        chairGroup.add(leg4);
        
        chairGroup.position.set(x, 0, z);
        chairGroup.rotation.y = rotation;
        frontShopsGroup.add(chairGroup); // Add to front shops group to move with building
        return chairGroup;
    };
    
    // Add table with chairs in better positions
    const centerTable = createTable(3, -5); // Moved inside
    interiorElements.tables = [centerTable];
    
    // Add chairs around center table - repositioned
    interiorElements.chairs = [
        createChair(3, -6, 0),
        createChair(3, -4, Math.PI),
        createChair(4, -5, -Math.PI / 2),
        createChair(2, -5, Math.PI / 2)
    ];
    
    // Add another table
    const sideTable = createTable(-3, -3);
    interiorElements.tables.push(sideTable);
    
    // Add chairs around side table
    interiorElements.chairs.push(
        createChair(-3, -4, 0),
        createChair(-3, -2, Math.PI),
        createChair(-2, -3, -Math.PI / 2),
        createChair(-4, -3, Math.PI / 2)
    );
    
    // Karaoke Stage - repositioned with prominent wireframe
    const stageGeometry = new THREE.BoxGeometry(8, 0.3, 4, 2, 1, 2); // Very few segments for thicker wireframe
    const stageMaterial = createWireframeMaterial(0xBF8F00); // Bright yellow 
    stageMaterial.wireframeLinewidth = 2; // Limited browser support
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    
    stage.position.set(0, 0.15, -12.5); // Back of the room
    stage.scale.set(1.02, 1.02, 1.02); // Slightly larger to emphasize
    frontShopsGroup.add(stage); // Add to front shops group to move with building
    interiorElements.stage = stage;
    
    
    // Reposition signup sheet on the rotated bar
    const createSignupSheet = () => {
        const sheetGroup = new THREE.Group();
        
        // Paper
        const paperGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.4, 2, 1, 2);
        const paperMaterial = createWireframeMaterial(0xFFFFFF); // White paper
        const paper = new THREE.Mesh(paperGeometry, paperMaterial);
        sheetGroup.add(paper);
        
        // Dotted lines (simplified as thin boxes)
        const lineCount = 4;
        for (let i = 0; i < lineCount; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.25, 0.005, 0.01, 4, 1, 1);
            const lineMaterial = createWireframeMaterial(0x000000); // Black lines
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.z = -0.15 + i * 0.1;
            sheetGroup.add(line);
        }
        
        // Pen
        const penGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.15, 1, 1, 2);
        const penMaterial = createWireframeMaterial(0x0000FF); // Blue pen
        const pen = new THREE.Mesh(penGeometry, penMaterial);
        pen.position.set(0.15, 0.01, -0.1);
        pen.rotation.y = Math.PI / 4;
        sheetGroup.add(pen);
        
        return sheetGroup;
    };
    
    // Add signup sheet to bar counter
    const signupSheet = createSignupSheet();
    signupSheet.position.set(-7.5, 1.52, -9.5); // Near the front end of the bar, on top of the bar (y=1.51)
    frontShopsGroup.add(signupSheet); // Add to front shops group to move with building
    interiorElements.signupSheet = signupSheet;
    
    // Narragansett Tallboy Beer Cans (from lyrics: "I'll order us a Gansett pair")
    const createBeerCan = (x, z, customY = null) => {
        const canGroup = new THREE.Group();
        
        // Can body
        const canGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6, 1);
        const canMaterial = createWireframeMaterial(0xCCCCCC); // Silver can
        const can = new THREE.Mesh(canGeometry, canMaterial);
        canGroup.add(can);
        
        // Beer can label (simplified as a band)
        const labelGeometry = new THREE.CylinderGeometry(0.101, 0.101, 0.2, 6, 1);
        const labelMaterial = createWireframeMaterial(0xFF0000); // Red label
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        canGroup.add(label);
        
        // Position the can group - using custom Y if provided, otherwise default to table height
        canGroup.position.set(x, customY !== null ? customY : 1.0, z);
        frontShopsGroup.add(canGroup); // Add to front shops group to move with building
        return canGroup;
    };
    
    // Add a pair of beers on the center table ("a Gansett pair")
    interiorElements.beerCans = [
        createBeerCan(3.2, -5.2),  // Default y=1.0 for table height
        createBeerCan(2.8, -4.8)   // Default y=1.0 for table height
    ];
    
    // Add beers to the back booth table on the right wall
    interiorElements.boothBeers = [
        createBeerCan(8.6, -13.3, 1),  // On the back booth table
        createBeerCan(8.3, -13.1, 1)   // Slightly offset for natural placement
    ];
    
    // Add beers along the bar counter with y=1.5 (top of bar)
    interiorElements.barBeers = [
        createBeerCan(-8.3, -6, 1.75),  // On top of bar counter (y=1.5)
        createBeerCan(-8.2, -8, 1.75),  // On top of bar counter (y=1.5)
        createBeerCan(-7.9, -12, 1.75)   // On top of bar counter (y=1.5)
    ];
    
    // Add TV/Screen on the wall for karaoke lyrics - moved to back wall
    const screenGeometry = new THREE.BoxGeometry(7, 2, 0.3, 6, 4, 1); // Bigger screen: wider and taller
    const screenMaterial = createWireframeMaterial(0x00FFFF); // Cyan for screen
    const tvScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    tvScreen.position.set(0, 3.5, -14.9); // Moved to back wall
    tvScreen.rotation.y = Math.PI; // Rotate to face into the room
    frontShopsGroup.add(tvScreen); // Add to front shops group to move with building
    interiorElements.tvScreen = tvScreen;
    
    // Add counter on the stage
    const counterGeometry = new THREE.BoxGeometry(6, 1.2, 1.5, 4, 3, 2);
    const counterMaterial = createWireframeMaterial(0x8B4513); // Brown wood color
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 0.6, -11.25); // Centered on the stage
    frontShopsGroup.add(counter); // Add to front shops group to move with building
    interiorElements.counter = counter;
    
    // Add counter top
    const counterTopGeometry = new THREE.BoxGeometry(6.2, 0.1, 1.7, 4, 1, 2);
    const counterTopMaterial = createWireframeMaterial(0xDEB887); // Light wood color
    const counterTop = new THREE.Mesh(counterTopGeometry, counterTopMaterial);
    counterTop.position.set(0, 1.25, -11.25); // On top of the counter
    frontShopsGroup.add(counterTop); // Add to front shops group to move with building
    interiorElements.counterTop = counterTop;
    
    
    return interiorElements;
};

// Create all scenes
const streetElements = createStreetScene();

// Only create interior elements for the plaza scene (not for forest park scene)
let interiorElements = {};
if (!PLAZA_CONFIG.FRONT_IS_PARK) {
    interiorElements = createInteriorScene(streetElements.frontShopsGroup);
    console.log("🎤 Created karaoke bar interior elements for plaza scene");
} else {
    console.log("🌳 Skipped karaoke bar interior elements for forest park scene");
}

// Check for and remove any unwanted wireframe elements in the doorway area
const cleanupUnwantedElements = () => {
    console.log("Cleaning up unwanted elements in the front wall area...");
    
    // Get the building dimensions from the street elements
    // We need to reference these in a scope outside createStreetScene
    const buildingWidth = 20; // Same as defined in createStreetScene
    const doorWidth = 1.8;    // Same as in createStreetScene
    const doorHeight = 3.2;   // Same as in createStreetScene
    
    // Function to determine if a plane might be a misplaced floor or ceiling
    // Function to determine if a plane might be a misplaced floor or ceiling
    const isMisplacedFloorOrCeiling = (obj) => {
        // Check if it's a plane geometry rotated like a floor/ceiling
        if (obj.geometry.type === 'PlaneGeometry') {
            // If it's rotated like a floor/ceiling (around X axis)
            const isFloorRotation = Math.abs(obj.rotation.x - Math.PI/2) < 0.1 || 
                                  Math.abs(obj.rotation.x + Math.PI/2) < 0.1;
            
            // If it's marked as a valid floor/ceiling, it's not misplaced
            if (obj.userData.isFloor || obj.userData.isCeiling) {
                return false;
            }
            
            // Otherwise, check its position
            const pos = new THREE.Vector3();
            obj.getWorldPosition(pos);
            
            // If it's near the front wall and rotated like a floor/ceiling, it's likely misplaced
            return isFloorRotation && Math.abs(pos.z) < 1.0;
        }
        return false;
    };
    
    // Remove any wireframe planes that might be overlapping with the front wall
    scene.traverse((object) => {
        // Check for meshes
        if (object.isMesh && object.geometry) {
            // Check if it might be a misplaced floor or ceiling
            if (isMisplacedFloorOrCeiling(object)) {
                console.log("Found misplaced floor/ceiling-like object:", object);
                object.visible = false;
            }
            
            // Get position in world space
            const pos = new THREE.Vector3();
            object.getWorldPosition(pos);
            
            // If this mesh is near the front wall (z near 0)
            if (Math.abs(pos.z) < 0.5) {
                // Check for any plane that goes across the entire front and isn't part of our walls
                if (object.geometry.type === 'PlaneGeometry' && 
                    Math.abs(pos.x) < buildingWidth/2 &&
                    Math.abs(object.rotation.x) < 0.1) {
                    console.log("Found unwanted plane at position:", pos.x, pos.y, pos.z);
                    object.visible = false;
                }
            }
        }
    });
    
    // Create an additional clearing object to ensure nothing appears in the doorway
    const doorwayClearingSurface = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth + 1.0, doorHeight + 1.0, 10),
        new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
            depthTest: false
        })
    );
    doorwayClearingSurface.position.set(0, doorHeight/2, 0);
    scene.add(doorwayClearingSurface);
};

// Call the cleanup function
cleanupUnwantedElements();

// Initialize scene visibility - MODIFIED to support the new approach
const resetSceneVisibility = () => {
    // Keep both scenes visible at all times
    sceneGroups.exterior.visible = true;
    sceneGroups.interior.visible = true;
    
    // Verify scene contents
    console.log(`Exterior scene contains ${sceneGroups.exterior.children.length} children`);
    console.log(`Interior scene contains ${sceneGroups.interior.children.length} children`);
    console.log("Scene visibility reset - all elements remain visible");
};

// Call this after creating scenes
resetSceneVisibility();

// Neon light glow animation and shared animation variables
let time = 0;

// Get average frequency in a range of the analyzer data (simplified - no audio)
const getAverageFrequency = (start, end) => {
    return 0; // No audio, always return 0
};

const animateNeonSigns = () => {
    time += 0.05;
    
    // Animate the KARAOKE sign letters with alternating colors
    if (streetElements.karaokeSigns) {
        streetElements.karaokeSigns.children.forEach((letter, index) => {
            // Create flashing effect with sine wave
            const blinkSpeed = 0.5 + index * 0.1;
            const brightness = Math.sin(time * blinkSpeed) * 0.5 + 0.5;
            
            // Alternate colors
            const baseColor = index % 2 === 0 ? 0xff0000 : 0x00ffff;
            
            // Update the letter color
            const r = (baseColor >> 16) & 255;
            const g = (baseColor >> 8) & 255;
            const b = baseColor & 255;
            
            letter.material.color.setRGB(
                r / 255 * brightness,
                g / 255 * brightness,
                b / 255 * brightness
            );
        });
    }
    
    // Animate street lamp lights
    if (streetElements.streetLamps) {
        streetElements.streetLamps.forEach((lamp, index) => {
            // Get both the light mesh and point light
            const lightMesh = lamp.children[4]; // The orange light sphere
            const pointLight = lamp.children[5]; // The point light
            
            // Create a subtle flicker effect typical of sodium vapor lamps
            const baseIntensity = 0.8;
            const flickerSpeed = 0.1;
            const flickerAmount = 0.15;
            const flicker = baseIntensity + (Math.sin(time * flickerSpeed + index * 2.1) * flickerAmount) +
                           (Math.sin(time * flickerSpeed * 2.7 + index * 1.3) * flickerAmount * 0.5);
            
            // Update both the mesh color and point light intensity
            const color = new THREE.Color(0xFF8C00);
            color.multiplyScalar(flicker);
            lightMesh.material.color.copy(color);
            pointLight.intensity = flicker;
        });
    }
    
    // Animate the bar building exterior walls with slow color changes
    if (streetElements.walls) {
        // Use a very slow cycle for color changes
        const slowTime = time * 0.05; 
        
        // Create a cycling color effect with RGB components
        const r = 0.25 + 0.25 * Math.sin(slowTime);
        const g = 0.25 + 0.25 * Math.sin(slowTime + Math.PI/2);
        const b = 0.6 + 0.3 * Math.sin(slowTime + Math.PI);
        
        // Apply to all wall segments
        streetElements.walls.forEach(wallSegment => {
            // Skip null or undefined wall segments
            if (!wallSegment) return;
            
            wallSegment.traverse(child => {
                // Check if it's a valid mesh with a material and color
                if (child.isMesh && child.material) {
                    // Only proceed if material has a color property
                    if (child.material.wireframe && child.material.color) {
                        // Store original color on first pass if not already stored
                        if (!child.userData.originalColor && child.material.color.clone) {
                            child.userData.originalColor = child.material.color.clone();
                        }
                        
                        // Update the color
                        child.material.color.setRGB(r, g, b);
                    }
                }
            });
        });
        
        // Also update the glow segments with a complementary color
        if (streetElements.glowGroup) {
            // Slightly different color for the glow to complement the walls
            const glowR = b;
            const glowG = r;
            const glowB = g;
            
            streetElements.glowGroup.traverse(child => {
                // Only proceed if it's a valid mesh with wireframe material
                if (child.isMesh && child.material && child.material.wireframe && child.material.color) {
                    child.material.color.setRGB(glowR, glowG, glowB);
                    
                    // Only modify opacity if the material supports transparency
                    if (child.material.transparent) {
                        // Vary the opacity slightly as well for a pulsing effect
                        const opacity = 0.4 + 0.2 * Math.sin(slowTime * 1.5);
                        child.material.opacity = opacity;
                    }
                }
            });
        }
    }
    
    // Animate cars
    if (streetElements.cars) {
        // Track positions for collision detection
        const carPositions = {};
        
        // Move existing cars
        for (let i = streetElements.cars.length - 1; i >= 0; i--) {
            const car = streetElements.cars[i];
            const direction = car.userData.direction;
            
            // Set a consistent speed for all cars in the same direction
            const speed = direction === 'left' ? 0.05 : -0.05;
            
            // Store previous position for collision detection
            const prevX = car.position.x;
            
            // Calculate new position
            const newX = prevX + speed;
            
            // Remove cars that go off-screen
            if ((direction === 'left' && newX > 140) || 
                (direction === 'right' && newX < -140)) {
                streetElements.streetElementsGroup.remove(car);
                streetElements.cars.splice(i, 1);
                continue;
            }
            
            // Check for collisions with other cars before moving
            let canMove = true;
            const carWidth = 2; // Car width
            const minSafeDistance = 3; // Minimum safe distance between cars
            
            Object.keys(carPositions).forEach(otherCarIndex => {
                if (parseInt(otherCarIndex) !== i) {
                    const otherCarInfo = carPositions[otherCarIndex];
                    const otherX = otherCarInfo.x;
                    const otherZ = otherCarInfo.z;
                    const otherDirection = otherCarInfo.direction;
                    
                    // Only check for collisions in the same lane
                    if (Math.abs(car.position.z - otherZ) < 1) {
                        // Check if cars are too close (based on direction)
                        if (direction === otherDirection) {
                            // Cars moving in same direction
                            const distance = Math.abs(newX - otherX);
                            if (distance < minSafeDistance) {
                                canMove = false;
                            }
                        }
                    }
                }
            });
            
            // Move car if no collision
            if (canMove) {
                car.position.x = newX;
            }
            
            // Store this car's position for collision checking with other cars
            carPositions[i] = {
                x: car.position.x,
                z: car.position.z,
                direction: direction
            };
        }
        
        // More controlled car spawning
        const currentTime = time;
        const timeSinceLastSpawn = currentTime - (streetElements.lastCarSpawnTime || 0);
        
        // Fixed time intervals for car spawning (6-12 seconds)
        const spawnInterval = 6 + Math.sin(time * 0.1) * 3; // Varies between 3-9 seconds
        
        // Only spawn new cars if we're below the limit and enough time has passed
        if (timeSinceLastSpawn > spawnInterval && streetElements.cars.length < 6) {
            // Alternate between left and right lanes for more balance
            const spawnLeft = !streetElements.lastSpawnedLeft;
            streetElements.lastSpawnedLeft = spawnLeft;
            
            // Check if there's already a car near the spawn point
            let canSpawn = true;
            const spawnX = spawnLeft ? -140 : 140; // Spawn at the far ends of the 300-unit road
            const spawnZ = spawnLeft ? 2 : -2; // Relative to street group (2 = left lane, -2 = right lane)
            
            Object.values(carPositions).forEach(carInfo => {
                const distance = Math.abs(carInfo.x - spawnX);
                if (Math.abs(carInfo.z - spawnZ) < 1 && distance < 10) {
                    canSpawn = false; // Don't spawn if another car is near the spawn point
                }
            });
            
            if (canSpawn) {
                // Spawn new car
                const direction = spawnLeft ? 'left' : 'right';
                const newCar = createCar(spawnX, getRandomCarColor(), direction);
                newCar.position.z = spawnZ; // Set proper lane position
                streetElements.streetElementsGroup.add(newCar); // Add to street group
                streetElements.cars.push(newCar);
                
                // Update the last spawn time
                streetElements.lastCarSpawnTime = currentTime;
            }
        }
    }
    
    // Animate bus
    if (streetElements.bus) {
        const bus = streetElements.bus;
        // Move bus based on direction and custom speed
        const speed = bus.userData.speed || 0.03;
        if (bus.userData.direction === 'left') {
            bus.position.x += speed;
            if (bus.position.x > 140) bus.position.x = -140; // Loop when off-screen (full road length)
        } else { // 'right'
            bus.position.x -= speed;
            if (bus.position.x < -140) bus.position.x = 140; // Loop when off-screen (full road length)
            
            // Make the bus stop briefly at the bus stop
            const busStopX = -15; // Same X position as the bus stop
            if (Math.abs(bus.position.x - busStopX) < 1) {
                // Slow down near bus stop but stay in same lane
                bus.userData.speed = 0.005;
            } else {
                // Normal speed elsewhere
                bus.userData.speed = 0.03;
            }
        }
    }
    
    // Don't force transition - let audio system handle it
};

// Event listener for scene transitions with spacebar - COMMENTED OUT
/*
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isTransitioning) {
        const nextSceneName = currentScene === 'exterior' ? 'interior' : 'exterior';
        console.log(`Spacebar pressed: Transitioning to ${nextSceneName}`);
        transitionToScene(nextSceneName);
    }
});
*/

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update the pixelated render target
    const newRenderTargetWidth = Math.floor(window.innerWidth * pixelRatio);
    const newRenderTargetHeight = Math.floor(window.innerHeight * pixelRatio);
    renderTarget.setSize(newRenderTargetWidth, newRenderTargetHeight);

    // Update post-processing ping-pong buffers
    postBufferA.setSize(newRenderTargetWidth, newRenderTargetHeight);
    postBufferB.setSize(newRenderTargetWidth, newRenderTargetHeight);

    // Update shader resolution uniform
    if (postMaterial.uniforms.resolution) {
        postMaterial.uniforms.resolution.value.set(newRenderTargetWidth, newRenderTargetHeight);
    }
    if (postMaterial.uniforms.scanlineFrequency) { // Also update scanline frequency if it depends on height
        postMaterial.uniforms.scanlineFrequency.value = newRenderTargetHeight * 1.5;
    }
});

// NPC Interaction System - moved before animate function
let nearbyNPC = null;
const interactionUI = document.createElement('div');
interactionUI.style.position = 'fixed';
interactionUI.style.bottom = '20px';
interactionUI.style.left = '50%';
interactionUI.style.transform = 'translateX(-50%)';
interactionUI.style.padding = '15px';
interactionUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
interactionUI.style.color = 'white';
interactionUI.style.fontFamily = 'Arial, sans-serif';
interactionUI.style.fontSize = '16px';
interactionUI.style.borderRadius = '8px';
interactionUI.style.display = 'none';
interactionUI.style.zIndex = '1000';
interactionUI.style.maxWidth = '400px';
interactionUI.style.textAlign = 'center';
document.body.appendChild(interactionUI);

// Old scene UI removed - now using bus stop proximity UI instead

// Dialogue system is now handled by dialogue.js

// Check for nearby NPCs
const checkNearbyNPCs = () => {
    const cameraPosition = camera.position;
    let closestNPC = null;
    let closestDistance = Infinity;
    
    if (streetElements.npcs) {
        streetElements.npcs.forEach(npc => {
            const npcPosition = npc.position;
            const distance = cameraPosition.distanceTo(npcPosition);
            
            if (distance < 3 && distance < closestDistance) { // Within 3 units
                closestNPC = npc;
                closestDistance = distance;
            }
        });
    }
    
    if (closestNPC !== nearbyNPC) {
        nearbyNPC = closestNPC;
        
        if (nearbyNPC) {
            const npcName = nearbyNPC.userData.name;
            interactionUI.innerHTML = `
                <div>Near ${npcName}</div>
                <div style="font-size: 14px; margin-top: 5px;">Press 'E' to talk</div>
            `;
            interactionUI.style.display = 'block';
        } else {
            interactionUI.style.display = 'none';
        }
    }
};

// Handle interaction key
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyE') {
        if (hasActiveConversation()) {
            // Check if conversation is at the end waiting for final E press
            if (conversationAtEnd) {
                // Final E press - unlock song and end conversation
                console.log('Final E press - ending conversation...');
                const unlockedSong = unlockCurrentSong();
                if (unlockedSong) {
                    interactionUI.innerHTML = `
                        <div style="font-size: 14px; color: #88FF88; margin-bottom: 10px;">
                            🎵 Unlocked: ${unlockedSong.replace(/_/g, ' ')}
                        </div>
                        <div style="font-size: 12px; color: #CCCCCC;">
                            Press any key to continue...
                        </div>
                    `;
                    
                    setTimeout(() => {
                        const endConversationHandler = () => {
                            endConversation();
                            if (nearbyNPC) {
                                const npcName = nearbyNPC.userData.name;
                                interactionUI.innerHTML = `
                                    <div>Near ${npcName}</div>
                                    <div style="font-size: 14px; margin-top: 5px;">Press 'E' to talk</div>
                                `;
                            } else {
                                interactionUI.style.display = 'none';
                            }
                            document.removeEventListener('keydown', endConversationHandler);
                        };
                        document.addEventListener('keydown', endConversationHandler);
                    }, 100);
                } else {
                    // No unlock, just end the conversation immediately
                    endConversation();
                    if (nearbyNPC) {
                        const npcName = nearbyNPC.userData.name;
                        interactionUI.innerHTML = `
                            <div>Near ${npcName}</div>
                            <div style="font-size: 14px; margin-top: 5px;">Press 'E' to talk</div>
                        `;
                    } else {
                        interactionUI.style.display = 'none';
                    }
                }
            } else {
                // Continue ongoing conversation
                const dialogue = getCurrentDialogue();
                if (dialogue) {
                    console.log('Showing dialogue:', dialogue.text);
                    // Show current dialogue
                    showDialogueStep(dialogue);
                    
                    // Advance to next line
                    advanceConversation();
                    
                    // Check if there are more lines
                    const nextDialogue = getCurrentDialogue();
                    console.log('After advance, nextDialogue:', nextDialogue);
                    if (!nextDialogue) {
                        // No more lines, set flag to wait for final E press
                        console.log('Last line shown, waiting for final E press...');
                        setConversationAtEnd(true);
                    }
                }
            }
        } else if (nearbyNPC) {
            // Start new conversation
            const npcName = nearbyNPC.userData.name;
            const sceneType = CURRENT_SCENE;
            
            if (startConversation(npcName, sceneType)) {
                // Show the first line immediately
                const dialogue = getCurrentDialogue();
                if (dialogue) {
                    showDialogueStep(dialogue);
                    advanceConversation();
                }
            }
        }
    }
});

const showDialogueStep = (dialogue) => {
    if (!dialogue) return;
    
    interactionUI.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: ${dialogue.speaker === 'Player' ? '#88AAFF' : '#FFFFFF'};">
            ${dialogue.speaker}:
        </div>
        <div style="margin-bottom: 15px;">"${dialogue.text}"</div>
        <div style="font-size: 12px; color: #CCCCCC;">
            Press E to continue...
        </div>
    `;
};

// Create scene switching UI
const sceneSwichUI = document.createElement('div');
sceneSwichUI.style.position = 'fixed';
sceneSwichUI.style.top = '150px';
sceneSwichUI.style.left = '20px';
sceneSwichUI.style.color = '#FFFF88';
sceneSwichUI.style.fontFamily = 'monospace';
sceneSwichUI.style.fontSize = '14px';
sceneSwichUI.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
sceneSwichUI.style.padding = '10px';
sceneSwichUI.style.borderRadius = '5px';
sceneSwichUI.style.display = 'none'; // Hidden by default
sceneSwichUI.style.zIndex = '1000';
document.body.appendChild(sceneSwichUI);

// Check for bus stop proximity for scene switching
const checkBusStopProximity = () => {
    const busStopPosition = new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
    const playerPosition = camera.position;
    const distanceToBusStop = playerPosition.distanceTo(busStopPosition);
    
    if (distanceToBusStop < 5) { // Within 5 units of bus stop
        const targetScene = CURRENT_SCENE === 'PLAZA' ? 'The Suburbs' : 'Downtown';
        sceneSwichUI.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">🚌 Bus Stop</div>
            <div style="font-size: 12px; margin-bottom: 5px;">Press F to travel to:</div>
            <div style="color: #88FF88;">${targetScene}</div>
        `;
        sceneSwichUI.style.display = 'block';
    } else {
        sceneSwichUI.style.display = 'none';
    }
};

// Animation loop with time tracking for transitions
let lastTime = 0;
const animate = (currentTime) => {
    requestAnimationFrame(animate);
    
    // Calculate delta time for smooth transitions
    const deltaTime = (currentTime - lastTime) / 1000; // convert to seconds
    lastTime = currentTime;
    
    // Update time variable for animations
    time += 0.05;
    
    // Update camera position with WASD controls
    updateCameraPosition();
    
    // Check for nearby NPCs for interaction
    checkNearbyNPCs();
    
    // Check for bus stop proximity for scene switching
    checkBusStopProximity();
    
    // Update mobile action button
    updateMobileActionButton();
    
    // Update all animations
    animateNeonSigns();
    updateNightSky(scene, time); // Update night sky
    updateSkybox(scene, time); // Update skybox
    
    // 1. Render main scene to low-res renderTarget (for pixelation)
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    
    // 2. Prepare postMaterial for effects pass (CRT + Trails)
    postMaterial.uniforms.tDiffuse.value = renderTarget.texture;
    postMaterial.uniforms.tFeedback.value = postBufferB.texture; // Previous frame with trails
    postMaterial.uniforms.u_applyEffects.value = true;

    // 3. Render postScene (quad with postMaterial) into postBufferA
    renderer.setRenderTarget(postBufferA);
    renderer.render(postScene, postCamera);

    // 4. Prepare postMaterial for simple display pass (no new effects, just show postBufferA)
    postMaterial.uniforms.tDiffuse.value = postBufferA.texture;
    postMaterial.uniforms.u_applyEffects.value = false; // Turn off effects for final render to screen

    // 5. Render postScene to screen
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);

    // 6. Swap buffers for next frame (postBufferB will hold the latest trails for feedback)
    let temp = postBufferA;
    postBufferA = postBufferB;
    postBufferB = temp;
};

animate(0); 

// Create the starry night sky with moon
createNightSky(scene);

// Create skybox gradient
const skybox = createSkybox(scene, CURRENT_SCENE); 

// Store camera reference for skybox following
scene.userData.camera = camera; 


// Make the interior and street elements accessible to the test buttons
if (typeof setSceneReference === 'function') {
    // Update the scene reference with the latest data
    setSceneReference(scene);
    // Share the elements with the scene
    if (!scene.userData) scene.userData = {};
    scene.userData.interiorElements = interiorElements;
    scene.userData.streetElements = streetElements;
}

// Start the animation immediately when the page loads
animate(0);