// main.js - Refactored version using modular structure
// This is the streamlined orchestration file

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Import from our new modular files
import { createWireframeMaterial, createCar, getRandomCarColor, createTree, createBush } from './utils.js';
import { createNightSky, updateNightSky } from './nightsky.js';
import { createSkybox, updateSkybox } from './skybox.js';
import { createParkElements, createBuildingFacade, createInteriorScene, createGlowingWireframeMaterial, createPondElements, createCumbysInterior, createShopInterior, createChurchInterior, createTownHallInterior, createHouseInterior, createHospitalInterior, createModernInterior, createBrickInterior, createIndustrialInterior, createGraveyardInterior, INTERIOR_TARGET_SIZE } from './buildings.js';
import { createNPCs, createInteriorNPCs, initializeNPCInteraction, checkNearbyNPCs, checkNearbyItems, checkBusStopProximity, initializeConversationHandlers, getNextSceneInfo } from './npcs.js';
import { getCurrentScene, getPlazaConfig, SCENE_CONFIGS } from './scenes.js';
import { 
    startConversation, advanceConversation, endConversation, hasActiveConversation, 
    getCurrentDialogue, getUnlockedSongs, checkIfLastLine, unlockCurrentSong, 
    getConversationAtEnd, setConversationAtEnd
} from './dialogue.js';
import { initializeControls, updateCameraPosition, isMobile, getMobileActionButton, updateMobileActionButton, setCurrentAction } from './controls.js';
import { initializeRenderer, initializePostProcessing, renderScene, handleResize, getRenderer } from './renderer.js';
import { createAnimationLoop } from './animation.js';
import { initializePhoneUI, initializePhoneKeyboard, updatePhoneDebugInfo } from './phone-ui.js';

// =====================================================
// SCENE SETUP
// =====================================================
const scene = new THREE.Scene();

const INTERIOR_CAMERA_OFFSET = 5;
const INTERIOR_HALF_SIZE = INTERIOR_TARGET_SIZE / 2;
const INTERIOR_CAMERA_Z = Math.max(0, INTERIOR_HALF_SIZE - INTERIOR_CAMERA_OFFSET);

// =====================================================
// DEBUG OVERLAY SETUP
// =====================================================
let debugInfo = {
    cameraPosition: { x: 0, y: 0, z: 0 },
    cameraSpeed: 0,
    lastPosition: { x: 0, y: 0, z: 0 },
    lastTime: Date.now(),
    fps: 0,
    frameCount: 0,
    lastFpsTime: Date.now()
};

// Create debug overlay
const createDebugOverlay = () => {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug-overlay';
    debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        min-width: 200px;
        border: 1px solid #00ff00;
    `;
    
    debugDiv.innerHTML = `
        <div><strong>🐛 DEBUG INFO</strong></div>
        <div>Camera Position: <span id="cam-pos">0, 0, 0</span></div>
        <div>Camera Speed: <span id="cam-speed">0.00</span> units/sec</div>
        <div>FPS: <span id="fps">60</span></div>
        <div>Scene: <span id="scene-name">Loading...</span></div>
        <div>Time: <span id="time">00:00</span></div>
    `;
    
    document.body.appendChild(debugDiv);
    return debugDiv;
};

// Update debug info
const updateDebugInfo = (camera, controls) => {
    const now = Date.now();
    const deltaTime = (now - debugInfo.lastTime) / 1000;
    
    // Update camera position
    debugInfo.cameraPosition.x = camera.position.x.toFixed(2);
    debugInfo.cameraPosition.y = camera.position.y.toFixed(2);
    debugInfo.cameraPosition.z = camera.position.z.toFixed(2);
    
    // Calculate speed
    const distance = Math.sqrt(
        Math.pow(camera.position.x - debugInfo.lastPosition.x, 2) +
        Math.pow(camera.position.y - debugInfo.lastPosition.y, 2) +
        Math.pow(camera.position.z - debugInfo.lastPosition.z, 2)
    );
    debugInfo.cameraSpeed = deltaTime > 0 ? (distance / deltaTime).toFixed(2) : 0;
    
    // Update FPS
    debugInfo.frameCount++;
    if (now - debugInfo.lastFpsTime >= 1000) {
        debugInfo.fps = Math.round(debugInfo.frameCount * 1000 / (now - debugInfo.lastFpsTime));
        debugInfo.frameCount = 0;
        debugInfo.lastFpsTime = now;
    }
    
    // Update phone UI with debug info
    updatePhoneDebugInfo({
        scene: PLAZA_CONFIG.name,
        time: new Date().toLocaleTimeString(),
        fps: debugInfo.fps,
        cameraPosition: {
            x: debugInfo.cameraPosition.x,
            y: debugInfo.cameraPosition.y,
            z: debugInfo.cameraPosition.z
        },
        cameraSpeed: debugInfo.cameraSpeed
    });
    
    // Store current position for next frame
    debugInfo.lastPosition.x = camera.position.x;
    debugInfo.lastPosition.y = camera.position.y;
    debugInfo.lastPosition.z = camera.position.z;
    debugInfo.lastTime = now;
};

// Current active scene configuration
let CURRENT_SCENE = getCurrentScene();
let PLAZA_CONFIG = getPlazaConfig(CURRENT_SCENE);

console.log('🎬 Loading scene:', CURRENT_SCENE, 'Config:', PLAZA_CONFIG.name);
console.log('Scene flags:', {
    FRONT_IS_PARK: PLAZA_CONFIG.FRONT_IS_PARK,
    FRONT_IS_POND: PLAZA_CONFIG.FRONT_IS_POND,
    HAUNTED_ATMOSPHERE: PLAZA_CONFIG.HAUNTED_ATMOSPHERE
});

// Adjust fog based on scene atmosphere
// Disable fog for interior scenes
if (PLAZA_CONFIG.IS_INTERIOR) {
    scene.fog = null;
} else {
    const fogColor = PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 0x1a1f2e : 0x1a1a2e;
    const fogNear = PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 30 : 50;
    const fogFar = PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 150 : 200;
    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
}

// Scene switching function
const switchScene = (sceneName) => {
    if (SCENE_CONFIGS[sceneName]) {
        CURRENT_SCENE = sceneName;
        PLAZA_CONFIG = SCENE_CONFIGS[sceneName];
        
        const cameraPos = camera.position;
        
        // Handle interior scenes differently
        if (PLAZA_CONFIG.IS_INTERIOR) {
            // For interior scenes, start camera at the door looking in
            // All interiors are 75x75, door is at z ≈ 37.5 (storeDepth/2)
            // Position camera just inside the door (z ≈ 32.5) looking inward
            const interiorCameraPosition = {
                x: 0,
                y: cameraPos.y,
                z: INTERIOR_CAMERA_Z // Just inside the door (door depth - offset)
            };
            localStorage.setItem('interiorCameraPosition', JSON.stringify(interiorCameraPosition));
        } else {
            // For exterior scenes, check if we're returning from an interior
            const savedPortalPosition = localStorage.getItem('buildingPortalPosition');
            if (savedPortalPosition) {
                // Use the saved building portal position
                localStorage.setItem('busStopCameraPosition', savedPortalPosition);
                localStorage.removeItem('buildingPortalPosition');
                
                // Check if we're exiting from a far-side building
                // Far buildings face the street, so we should NOT rotate 180 (face forward/toward street)
                const isFarBuilding = localStorage.getItem('isFarBuilding') === 'true';
                localStorage.setItem('isFarBuildingExit', isFarBuilding ? 'true' : 'false');
                localStorage.removeItem('isFarBuilding');
                console.log(`Restoring building portal position: ${savedPortalPosition}, isFarBuilding: ${isFarBuilding}`);
            } else {
                // Default to bus stop position
                const busStopCameraPosition = {
                    x: -15,
                    y: cameraPos.y,
                    z: SCENE_CONFIGS[sceneName].NEAR_SIDEWALK_Z + 3
                };
                localStorage.setItem('busStopCameraPosition', JSON.stringify(busStopCameraPosition));
            }
        }
        
        localStorage.setItem('suburbanAdventureScene', sceneName);
        console.log(`Switching to ${PLAZA_CONFIG.name}`);
        location.reload();
    }
};

// =====================================================
// CAMERA SETUP
// =====================================================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const savedBusStopPosition = localStorage.getItem('busStopCameraPosition');
const savedInteriorPosition = localStorage.getItem('interiorCameraPosition');
let shouldRotate180 = false;

if (savedInteriorPosition) {
    // Handle interior scene camera position
    const pos = JSON.parse(savedInteriorPosition);
    camera.position.set(pos.x, pos.y, pos.z);
    localStorage.removeItem('interiorCameraPosition');
    shouldRotate180 = false;
} else if (savedBusStopPosition) {
    // Handle exterior scene camera position (from bus stop or building portal)
    const pos = JSON.parse(savedBusStopPosition);
    camera.position.set(pos.x, pos.y, pos.z);
    localStorage.removeItem('busStopCameraPosition');
    
    // Check if we're exiting from a far-side building
    // Far buildings face the street, so we should NOT rotate 180 (face forward/toward street)
    const isFarBuildingExit = localStorage.getItem('isFarBuildingExit') === 'true';
    shouldRotate180 = !isFarBuildingExit; // Only rotate 180 if NOT a far building
    localStorage.removeItem('isFarBuildingExit');
    console.log(`Camera position restored, shouldRotate180: ${shouldRotate180} (isFarBuildingExit: ${isFarBuildingExit})`);
} else {
    // Default camera position
    if (PLAZA_CONFIG.IS_INTERIOR) {
        // All interiors are 75x75, door is at z ≈ 37.5
        // Position camera just inside the door looking inward
        camera.position.set(0, 2, INTERIOR_CAMERA_Z); // Just inside the door for interior scenes
    } else {
        camera.position.set(0, 2, PLAZA_CONFIG.CAMERA_START_Z);
    }
}

// =====================================================
// RENDERER SETUP (Using new module)
// =====================================================
const renderer = initializeRenderer();
const { renderTarget, postBufferA, postBufferB, postCamera, postMaterial, postScene } = initializePostProcessing();

// =====================================================
// CONTROLS SETUP (Using new module)
// =====================================================
initializeControls(camera, renderer.domElement, shouldRotate180);

// =====================================================
// LIGHTING
// =====================================================
// Adjust lighting based on scene atmosphere
const ambientIntensity = PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 0.3 : 0.5;
const directionalIntensity = PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 0.5 : 0.8;

const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// =====================================================
// HELPER FUNCTIONS FOR SCENE CREATION
// =====================================================

// Forest elements for suburban scenes (with buildings, roads, etc.)
const createForestElements = () => {
    const forestGroup = new THREE.Group();
    forestGroup.name = "Forest Elements";
    
    let treeCount = 0;
    
    // Define clear zones to avoid building conflicts and road
    const buildingZones = [
        { left: -70, right: 70, front: -10, back: 15 },
        { left: -70, right: 70, front: 20, back: 50 },
        { left: -50, right: 50, front: 50, back: 70 }
    ];
    
    const roadZone = { left: -150, right: 150, front: 5, back: 17 };
    const nearSidewalkZone = { left: -150, right: 150, front: -1, back: 5 };
    const farSidewalkZone = { left: -150, right: 150, front: 17, back: 23 };
    const parkZone = { left: -45, right: 45, front: -50, back: 5 };
    
    const isInBuildingZone = (x, z) => buildingZones.some(zone => 
        x >= zone.left && x <= zone.right && z >= zone.front && z <= zone.back
    );
    
    const isInRoadZone = (x, z) => 
        x >= roadZone.left && x <= roadZone.right && z >= roadZone.front && z <= roadZone.back;
    
    const isInSidewalkZone = (x, z) => {
        const inNearSidewalk = x >= nearSidewalkZone.left && x <= nearSidewalkZone.right && 
                              z >= nearSidewalkZone.front && z <= nearSidewalkZone.back;
        const inFarSidewalk = x >= farSidewalkZone.left && x <= farSidewalkZone.right && 
                             z >= farSidewalkZone.front && z <= farSidewalkZone.back;
        return inNearSidewalk || inFarSidewalk;
    };
    
    const isInParkZone = (x, z) => 
        x >= parkZone.left && x <= parkZone.right && z >= parkZone.front && z <= parkZone.back;
    
    const selectTreeType = () => {
        const rand = Math.random() * 100;
        if (rand < 25) return 'Eastern White Pine';
        else if (rand < 45) return 'Red Maple';
        else if (rand < 65) return 'Northern Red Oak';
        else if (rand < 80) return 'Eastern Hemlock';
        else if (rand < 92) return 'American Beech';
        else return 'Red Pine';
    };
    
    const forestBounds = { left: -145, right: 145, front: -145, back: 145 };
    
    for (let x = forestBounds.left; x <= forestBounds.right; x += 6 + Math.random() * 2) {
        for (let z = forestBounds.front; z <= forestBounds.back; z += 6 + Math.random() * 2) {
            const treeX = x + (Math.random() - 0.5) * 1;
            const treeZ = z + (Math.random() - 0.5) * 1;
            
            if (!isInBuildingZone(treeX, treeZ) && !isInRoadZone(treeX, treeZ) && 
                !isInSidewalkZone(treeX, treeZ) && !isInParkZone(treeX, treeZ)) {
                const tree = createTree(treeX, treeZ, 0.6 + Math.random() * 0.4, selectTreeType());
                forestGroup.add(tree);
                treeCount++;
            }
        }
    }
    
    console.log(`🌲 Generated ${treeCount} New England trees for suburban forest`);
    return forestGroup;
};

// Forest elements specifically for pond/camp scenes (no buildings, roads, etc.)
const createPondForestElements = () => {
    const forestGroup = new THREE.Group();
    forestGroup.name = "Pond Forest Elements";
    
    let treeCount = 0;
    
    // Road and sidewalk zones (road is vertical on left side at X: -100)
    const roadZone = { left: -156, right: 150, front: -10, back: 30 };
    const nearSidewalkZone = { left: -94, right: -88, front: -150, back: 150 };
    const farSidewalkZone = { left: -112, right: -106, front: -150, back: 150 };
    
    const isInRoadZone = (x, z) => 
        x >= roadZone.left && x <= roadZone.right && z >= roadZone.front && z <= roadZone.back;
    
    const isInSidewalkZone = (x, z) => {
        const inNearSidewalk = x >= nearSidewalkZone.left && x <= nearSidewalkZone.right && 
                              z >= nearSidewalkZone.front && z <= nearSidewalkZone.back;
        const inFarSidewalk = x >= farSidewalkZone.left && x <= farSidewalkZone.right && 
                             z >= farSidewalkZone.front && z <= farSidewalkZone.back;
        return inNearSidewalk || inFarSidewalk;
    };
    
    // Pond area clearing (back area) - around Z: 150, with buffer for random tree offset
    // Pond group at (0, 0, 150) with organic shape extending to X: -35 to 35, Z: 115 to 185
    // Main pond radius 18 * 1.2 = 21.6, plus jutting sections, plus buffer for random tree offset
    const pondZone = { left: -37, right: 37, front: 75, back: 125 };
    const isInPondZone = (x, z) => 
        x >= pondZone.left && x <= pondZone.right && z >= pondZone.front && z <= pondZone.back;
    
    // Campsite clearing (front area) - around Z: -20, with buffer for random tree offset
    // Campfire group at (50, 0, -20) with objects extending X: 35 to 70, Z: -40 to 0
    // Add buffer of 5 units to account for random tree placement offset and object spread
    const campsiteZone = { left: 20, right: 75, front: -100, back: -25 };
    const isInCampsiteZone = (x, z) => 
        x >= campsiteZone.left && x <= campsiteZone.right && z >= campsiteZone.front && z <= campsiteZone.back;
    
    // Path clearings - precise based on actual path positions
    // Left path: X: -20 to 0, Z: 0 to 150 (leads to pond) - wider path
    const leftPathZone = { left: -8, right: 8, front: 0, back: 125 };
    const isInLeftPathZone = (x, z) => 
        x >= leftPathZone.left && x <= leftPathZone.right && z >= leftPathZone.front && z <= leftPathZone.back;
    
    // Right path: X: 20 to 50, Z: 0 to -20 (leads to campfire) - wider path
    const rightPathZone = { left: 12, right: 58, front: -20, back: 0 };
    const isInRightPathZone = (x, z) => 
        x >= rightPathZone.left && x <= rightPathZone.right && z >= rightPathZone.front && z <= rightPathZone.back;
    
    const selectTreeType = () => {
        const rand = Math.random() * 100;
        if (rand < 25) return 'Eastern White Pine';
        else if (rand < 45) return 'Red Maple';
        else if (rand < 65) return 'Northern Red Oak';
        else if (rand < 80) return 'Eastern Hemlock';
        else if (rand < 92) return 'American Beech';
        else return 'Red Pine';
    };
    
    const forestBounds = { left: -145, right: 145, front: -145, back: 145 };
    
    for (let x = forestBounds.left; x <= forestBounds.right; x += 3 + Math.random() * 2) {
        for (let z = forestBounds.front; z <= forestBounds.back; z += 6 + Math.random() * 2) {
            const treeX = x + (Math.random() - 0.5) * 1;
            const treeZ = z + (Math.random() - 0.5) * 1;
            
            // Check pond-specific zones plus road and sidewalk zones
            if (!isInPondZone(treeX, treeZ) && !isInCampsiteZone(treeX, treeZ) &&
                !isInLeftPathZone(treeX, treeZ) && !isInRightPathZone(treeX, treeZ) &&
                !isInRoadZone(treeX, treeZ) && !isInSidewalkZone(treeX, treeZ)) {
                const tree = createTree(treeX, treeZ, 0.6 + Math.random() * 0.4, selectTreeType());
                forestGroup.add(tree);
                treeCount++;
            }
        }
    }
    
    console.log(`🌲 Generated ${treeCount} New England trees for pond forest`);
    return forestGroup;
};

const createStoneWall = () => {
    const wallGroup = new THREE.Group();
    wallGroup.name = "New England Stone Wall";
    
    const wallLength = 160;
    const stoneSize = 0.8;
    const wallHeight = 1.2;
    
    for (let x = -80; x <= 80; x += stoneSize + Math.random() * 0.3) {
        for (let y = 0; y < wallHeight; y += stoneSize * 0.7) {
            const stoneGeometry = new THREE.BoxGeometry(
                stoneSize + Math.random() * 0.4,
                stoneSize * 0.6 + Math.random() * 0.2,
                stoneSize * 0.8 + Math.random() * 0.3
            );
            const stoneMaterial = createWireframeMaterial(0x696969);
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            stone.position.set(
                x + (Math.random() - 0.5) * 0.3,
                y + stoneSize * 0.3,
                (PLAZA_CONFIG.FAR_SIDEWALK_Z + PLAZA_CONFIG.FAR_BUILDINGS_Z) / 2 + (Math.random() - 0.5) * 0.4
            );
            
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
    
    // Add scattered mailboxes
    for (let i = 0; i < 5; i++) {
        const x = -60 + Math.random() * 120;
        const z = 25 + Math.random() * 20;
        
        const mailboxGroup = new THREE.Group();
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
        const postMaterial = createWireframeMaterial(0x8B4513);
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 0.6;
        mailboxGroup.add(post);
        
        const boxGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.3);
        const boxMaterial = createWireframeMaterial(0x000000);
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.y = 1.2;
        mailboxGroup.add(box);
        
        mailboxGroup.position.set(x, 0, z);
        suburbanGroup.add(mailboxGroup);
    }
    
    console.log("🏘️ Created suburban elements");
    return suburbanGroup;
};

// =====================================================
// CREATE STREET SCENE
// =====================================================
// NOTE: This function is kept here temporarily. It's ~2000 lines and should
// eventually be moved to scenes.js for better organization.

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
    scene.add(street);
    streetElements.street = street;
    
    // Near sidewalk (where shops are) - extended to match floor
    const nearSidewalkGeometry = new THREE.PlaneGeometry(300, 6, 20, 2);
    const sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 }); // Solid sidewalk material
    const nearSidewalk = new THREE.Mesh(nearSidewalkGeometry, sidewalkMaterial);
    nearSidewalk.rotation.x = -Math.PI / 2;
    nearSidewalk.position.set(0, -0.09, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
    scene.add(nearSidewalk);
    streetElements.nearSidewalk = nearSidewalk;
    
    // Far sidewalk - extended to match floor
    const farSidewalkGeometry = new THREE.PlaneGeometry(300, 6, 20, 2);
    const farSidewalk = new THREE.Mesh(farSidewalkGeometry, sidewalkMaterial);
    farSidewalk.rotation.x = -Math.PI / 2;
    farSidewalk.position.set(0, -0.09, PLAZA_CONFIG.FAR_SIDEWALK_Z);
    scene.add(farSidewalk);
    streetElements.farSidewalk = farSidewalk;
    
    // Back parking lot - only for city scene (not forest or pond scene)
    if (!PLAZA_CONFIG.FRONT_IS_PARK && !PLAZA_CONFIG.FRONT_IS_POND) {
        const parkingGeometry = new THREE.PlaneGeometry(300, 60, 20, 6);
        const parkingMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 }); // Parking lot color - solid material
        const parkingLot = new THREE.Mesh(parkingGeometry, parkingMaterial);
        parkingLot.rotation.x = -Math.PI / 2;
        parkingLot.position.set(0, -0.08, PLAZA_CONFIG.PARKING_LOT_Z);
        scene.add(parkingLot);
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

    // Only create karaoke bar and shops for PLAZA scene
    if (!PLAZA_CONFIG.FRONT_IS_PARK && !PLAZA_CONFIG.FRONT_IS_POND) {
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
        scene.add(completeVoid);
        
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
                baseColor = 0xFF4444; // Red for Grumby's
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
                baseColor = 0xFF6600; // Orange for Donut Galaxy
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
    
    // Initialize building portals array if it doesn't exist
    if (!streetElements.buildingPortals) {
        streetElements.buildingPortals = [];
    }
    
    // Define our 6 specific shops with their characteristics
    const plazaShops = [
        { name: 'Grumby\'s', width: 18, style: 'convenience', signColor: 0xFFFFFF },
        { name: 'Grohos', width: 16, style: 'pizza', signColor: 0xFFFFFF },
        { name: 'Clothing Store', width: 14, style: 'clothing', signColor: 0xFFFFFF },
        { name: 'Dry Cleaners', width: 12, style: 'drycleaner', signColor: 0x000000 },
        { name: 'Donut Galaxy', width: 15, style: 'coffee', signColor: 0xFFFFFF },
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
        building.userData.buildingName = shop.name;
        building.userData.buildingStyle = shop.style;
        
        // Add shop sign (positioned relative to the group)
        const signGeometry = new THREE.PlaneGeometry(shop.width * 0.8, 1, 4, 1);
        const signMaterial = createWireframeMaterial(shop.signColor);
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(currentX, shopHeight - 0.5, 0.1); // Position close to building facade front
        frontShopsGroup.add(sign); // Add to front shops group
        
        // Add shop name to streetElements for future reference
        streetElements[`${shop.name.replace(/[^a-zA-Z]/g, '').toLowerCase()}Shop`] = building;
        
        // Store door position for portal system
        // Door is at the center of the building (x=currentX relative to group, but absolute in world)
        // Building is at FRONT_SHOPS_Z (the frontShopsGroup handles Z positioning)
        // The door is at the center front of the building
        // Player approaches from the front (positive Z direction), so portal should be at the building front
        const doorWorldX = currentX;
        const doorWorldZ = PLAZA_CONFIG.FRONT_SHOPS_Z; // At the building front face
        
        streetElements.buildingPortals.push({
            building: building,
            position: new THREE.Vector3(doorWorldX, 0, doorWorldZ),
            name: shop.name,
            style: shop.style
        });
        
        console.log(`🏪 Added portal for ${shop.name} at (${doorWorldX.toFixed(1)}, ${doorWorldZ.toFixed(1)})`);
        
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
    // Bus stop positioning (adjust for POND scene)
    const busStopX = PLAZA_CONFIG.ROAD_POSITION_X ? PLAZA_CONFIG.ROAD_POSITION_X + 3 : -15;
    const busStop = createBusStop(busStopX);
    busStop.rotation.y = PLAZA_CONFIG.ROAD_POSITION_X ? 0 : 0; // Rotate if on side (90 degrees clockwise)
    nearSidewalkElementsGroup.add(busStop);
    streetElements.busStop = busStop;
    
    // Add forest elements if enabled for this scene
    if (PLAZA_CONFIG.FOREST_ELEMENTS) {
        // Use pond-specific forest function for POND scene, regular forest for others
        const forestElements = PLAZA_CONFIG.FRONT_IS_POND ? 
            createPondForestElements() : createForestElements();
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
    
    // Conditional front area creation - park vs pond vs karaoke bar/shops
    if (PLAZA_CONFIG.FRONT_IS_PARK) {
        // Create park elements for forest suburban scene
        const parkElements = createParkElements(frontShopsGroup);
        streetElements.parkElements = parkElements;
        console.log("🌳 Created park for forest suburban scene");
    } else if (PLAZA_CONFIG.FRONT_IS_POND) {
        // Create pond elements for pond scene
        const pondElements = createPondElements(frontShopsGroup, PLAZA_CONFIG, scene);
        streetElements.pondElements = pondElements;
        streetElements.campsiteObjects = pondElements.campsiteObjects;
        streetElements.campfire = pondElements.campfire; // Add campfire for animation system
        streetElements.pond = pondElements.pond; // Add pond for animation system
        console.log("🏕️ Created pond scene with post-party campfire vibes");
    } else {
        // Create karaoke bar and shops for plaza scene
        console.log("🎤 Creating karaoke bar and shops for plaza scene");
        // The karaoke bar creation is currently happening earlier in the function
        // This needs to be restructured to only run for PLAZA scene
    }
    
    // Define facade depth for buildings (needed for both scenes)
    const facadeDepth = 15; // Standard building depth
    
    // Create far buildings (only for PLAZA and FOREST_SUBURBAN scenes, not POND)
    if (!PLAZA_CONFIG.FRONT_IS_POND) {
        // Buildings on the far side, using a consistent approach across the entire street width
        // Define the total street coverage range
        const streetLeftEdge = -40;
        const streetRightEdge = 40;
        const streetWidth = streetRightEdge - streetLeftEdge;
        
        // Create buildings based on scene type
        let buildings;
        
        if (PLAZA_CONFIG.FEWER_BUILDINGS) {
            // Park-like New England setting - specific buildings at fixed positions
            console.log("🏘️ Creating specific Groton, MA style buildings for forest scene");
            
            // Define specific buildings with fixed positions, sizes, and styles
            buildings = [
                { x: -25, width: 12, height: 7, style: 'groton_church', name: 'First Parish Church' },
                { x: -8, width: 10, height: 6, style: 'groton_townhall', name: 'Town Hall' },
                { x: 8, width: 11, height: 6.5, style: 'groton_colonial', name: 'Colonial House' },
                { x: 25, width: 10, height: 5.5, style: 'graveyard', name: 'Graveyard' }
            ];
        } else {
            // Original urban setting - specific buildings at fixed positions
            buildings = [
                { x: -30, width: 10, height: 7, style: 'modern', name: 'Modern Building' },
                { x: -15, width: 9, height: 6.5, style: 'brick', name: 'Brick Building' },
                { x: 0, width: 11, height: 7.5, style: 'hospital', name: 'Hospital' },
                { x: 15, width: 10, height: 6, style: 'industrial', name: 'Industrial Building' },
                { x: 30, width: 9, height: 6.5, style: 'shop', name: 'Shop Building' }
            ];
        }
        
        // Initialize building portals array if it doesn't exist (front shops may have already created it)
        if (!streetElements.buildingPortals) {
            streetElements.buildingPortals = [];
        }
        
        // Loop through and create specific buildings
        buildings.forEach((buildingConfig) => {
            const { x, width, height, style, name } = buildingConfig;
            
            // Create the building with the proper facadeDepth
            const building = createBuildingFacade(
                width, height, facadeDepth, 
                style
            );
            building.position.set(x, 0, 0); // Z position handled by farBuildingsGroup
            building.rotation.y = Math.PI; // Face toward the front shops
            building.userData.buildingName = name;
            building.userData.buildingStyle = style;
            
            // Store door position for portal system
            // Door is at the center of the building (x=0 relative to building)
            // Building is at FAR_BUILDINGS_Z, rotated to face forward
            const doorWorldX = x;
            const doorWorldZ = PLAZA_CONFIG.FAR_BUILDINGS_Z;
            
            streetElements.buildingPortals.push({
                building: building,
                position: new THREE.Vector3(doorWorldX, 0, doorWorldZ),
                name: name,
                style: style
            });
            
            farBuildingsGroup.add(building); // Add to far buildings group instead of scene
        });
    } else {
        console.log("🏕️ Skipped far buildings creation for pond scene");
    }

    // Add NPCs to the scene
    streetElements.npcs = createNPCs(PLAZA_CONFIG, CURRENT_SCENE, scene);
    
    console.log("🏁 createStreetScene complete. Returning:", Object.keys(streetElements));
    return streetElements;
};

// =====================================================
// INITIALIZE SCENE
// =====================================================
let streetElements = {};
let interiorElements = {};

// Check if we're in an interior scene
if (PLAZA_CONFIG.IS_INTERIOR) {
    // Create interior scene based on interior type
    console.log(`🏪 Creating interior scene: ${PLAZA_CONFIG.name}`);
    
    let interiorGroup;
    let interiorDimensions = { width: 0, depth: 0 };
    
    switch (CURRENT_SCENE) {
        case 'CUMBYS_INTERIOR':
            interiorGroup = createCumbysInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'GROHOS_INTERIOR':
            interiorGroup = createShopInterior(scene, 'pizza', 'Grohos Pizza', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'CLOTHING_STORE_INTERIOR':
            interiorGroup = createShopInterior(scene, 'clothing', 'Clothing Store', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'DRYCLEANER_INTERIOR':
            interiorGroup = createShopInterior(scene, 'drycleaner', 'Dry Cleaners', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'DUNKIN_INTERIOR':
            interiorGroup = createShopInterior(scene, 'coffee', 'Donut Galaxy', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'FLOWER_SHOP_INTERIOR':
            interiorGroup = createShopInterior(scene, 'flowers', 'Flower Shop', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'CHURCH_INTERIOR':
            interiorGroup = createChurchInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'TOWNHALL_INTERIOR':
            interiorGroup = createTownHallInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'HOUSE_INTERIOR':
            interiorGroup = createHouseInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'HOSPITAL_INTERIOR':
            interiorGroup = createHospitalInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'MODERN_INTERIOR':
            interiorGroup = createModernInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'BRICK_INTERIOR':
            interiorGroup = createBrickInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'SHOP_INTERIOR':
            interiorGroup = createShopInterior(scene, 'shop', 'Shop', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'INDUSTRIAL_INTERIOR':
            interiorGroup = createIndustrialInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        case 'GRAVEYARD_INTERIOR':
            interiorGroup = createGraveyardInterior(scene);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
            break;
        default:
            // Generic interior for other types
            interiorGroup = createShopInterior(scene, PLAZA_CONFIG.INTERIOR_TYPE, PLAZA_CONFIG.name, INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
    }
    
    // Store interior dimensions for skybox floor adjustment
    streetElements.interiorDimensions = interiorDimensions;
    
    // Store reference for exit portal and interior bounds
    streetElements.interiorGroup = interiorGroup;
    streetElements.interiorBounds = interiorGroup.userData.bounds;
    streetElements.exitPortal = null; // Will be set by finding the exit door
    
    // Find exit door in the interior
    interiorGroup.traverse((child) => {
        if (child.userData && child.userData.isExitPortal) {
            streetElements.exitPortal = child;
        }
    });
    
    // Extract interactive items for flavor text system
    streetElements.interactiveItems = interiorGroup.userData.interactiveItems || [];
    
    streetElements.npcs = createInteriorNPCs(CURRENT_SCENE, interiorGroup);
} else {
    // Create street scene (exterior)
    streetElements = createStreetScene();
    
    // Initialize interactive items as empty array for exterior scenes
    streetElements.interactiveItems = [];
    
    // Create interior elements for karaoke bar (only in PLAZA scene)
    if (CURRENT_SCENE === 'PLAZA') {
        interiorElements = createInteriorScene(streetElements.frontShopsGroup);
    }
    
    // Add NPCs
    streetElements.npcs = createNPCs(PLAZA_CONFIG, CURRENT_SCENE, scene);
}

// Initialize NPC interaction system
initializeNPCInteraction();
initializeConversationHandlers(CURRENT_SCENE);

// Initialize phone UI
initializePhoneUI();
initializePhoneKeyboard();

// =====================================================
// SKYBOX AND ENVIRONMENT
// =====================================================
createNightSky(scene);
// Pass interior dimensions if we're in an interior scene
const interiorDims = PLAZA_CONFIG.IS_INTERIOR ? streetElements.interiorDimensions : null;
if (interiorDims) {
    console.log(`🏪 Passing interior dimensions to skybox: ${interiorDims.width}x${interiorDims.depth}`);
}
const skybox = createSkybox(scene, CURRENT_SCENE, interiorDims);
scene.userData.camera = camera;

// =====================================================
// KEYBOARD EVENT HANDLERS
// =====================================================
document.addEventListener('keydown', (event) => {
    // Use Space or F for scene switching - Space is primary, F kept for backwards compatibility
    // Note: Space is also used for conversations/items in npcs.js, but that handler checks first
    // and only processes if there's an active conversation or item interaction
    if (event.code === 'Space' || event.code === 'KeyF') {
        // Skip if in conversation (Space will be handled by npcs.js for conversations)
        if (event.code === 'Space' && hasActiveConversation()) {
            return;
        }
        // First check for building door portals
        if (streetElements && streetElements.buildingPortals) {
            let nearestPortal = null;
            let nearestDistance = Infinity;
            
            streetElements.buildingPortals.forEach(portal => {
                const distance = camera.position.distanceTo(portal.position);
                if (distance < 5 && distance < nearestDistance) {
                    nearestPortal = portal;
                    nearestDistance = distance;
                }
            });
            
            if (nearestPortal) {
                // Get destination scene for building portal
                const getBuildingPortalDestination = (buildingStyle) => {
                    const portalMap = {
                        'groton_church': { key: 'CHURCH_INTERIOR', name: 'Church Interior' },
                        'groton_townhall': { key: 'TOWNHALL_INTERIOR', name: 'Town Hall Interior' },
                        'groton_colonial': { key: 'HOUSE_INTERIOR', name: 'Colonial House Interior' },
                        'graveyard': { key: 'GRAVEYARD_INTERIOR', name: 'Graveyard' },
                        'hospital': { key: 'HOSPITAL_INTERIOR', name: 'Hospital Interior' },
                        'modern': { key: 'MODERN_INTERIOR', name: 'Modern Building Interior' },
                        'brick': { key: 'BRICK_INTERIOR', name: 'Brick Building Interior' },
                        'shop': { key: 'SHOP_INTERIOR', name: 'Shop Interior' },
                        'industrial': { key: 'INDUSTRIAL_INTERIOR', name: 'Industrial Building Interior' },
                        // Shop styles for front shops
                        'convenience': { key: 'CUMBYS_INTERIOR', name: 'Grumby\'s Store' },
                        'pizza': { key: 'GROHOS_INTERIOR', name: 'Grohos Pizza' },
                        'clothing': { key: 'CLOTHING_STORE_INTERIOR', name: 'Clothing Store' },
                        'drycleaner': { key: 'DRYCLEANER_INTERIOR', name: 'Dry Cleaners' },
                        'coffee': { key: 'DUNKIN_INTERIOR', name: 'Donut Galaxy' },
                        'flowers': { key: 'FLOWER_SHOP_INTERIOR', name: 'Flower Shop' }
                    };
                    return portalMap[buildingStyle] || { key: 'PLAZA', name: 'Downtown' };
                };
                
                const targetScene = getBuildingPortalDestination(nearestPortal.style);
                console.log(`Entering ${nearestPortal.name}, switching to ${targetScene.key} (${targetScene.name})`);
                
                // Save which exterior scene we came from before switching to interior
                localStorage.setItem('previousExteriorScene', CURRENT_SCENE);
                
                // Save the building portal position so we can return to it when exiting
                const portalPosition = {
                    x: nearestPortal.position.x,
                    y: camera.position.y,
                    z: nearestPortal.position.z
                };
                localStorage.setItem('buildingPortalPosition', JSON.stringify(portalPosition));
                
                // Check if this is a far-side building (at FAR_BUILDINGS_Z)
                // Far buildings face the street, so when exiting we should face the street (no 180 rotation)
                const isFarBuilding = Math.abs(nearestPortal.position.z - PLAZA_CONFIG.FAR_BUILDINGS_Z) < 0.1;
                localStorage.setItem('isFarBuilding', isFarBuilding ? 'true' : 'false');
                console.log(`Saved building portal position: (${portalPosition.x}, ${portalPosition.y}, ${portalPosition.z}), isFarBuilding: ${isFarBuilding}`);
                
                // Switch to interior scene
                switchScene(targetScene.key);
                return;
            }
        }
        
        // Check exit portal if in interior scene
        if (PLAZA_CONFIG.IS_INTERIOR && streetElements && streetElements.exitPortal) {
            const exitPortalPos = new THREE.Vector3();
            streetElements.exitPortal.getWorldPosition(exitPortalPos);
            const distanceToExit = camera.position.distanceTo(exitPortalPos);
            
            if (distanceToExit < 3) {
                const previousScene = localStorage.getItem('previousExteriorScene') || 'PLAZA';
                console.log(`Exiting interior, returning to ${previousScene}`);
                switchScene(previousScene);
                return;
            }
        }
        
        // Fall back to bus stop if no building portal nearby (only for exterior scenes)
        if (!PLAZA_CONFIG.IS_INTERIOR) {
            // Linear scene progression: PLAZA → FOREST_SUBURBAN → POND → PLAZA
            const busStopX = PLAZA_CONFIG.ROAD_POSITION_X ? PLAZA_CONFIG.ROAD_POSITION_X + 3 : -15;
            const busStopPosition = new THREE.Vector3(busStopX, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
            const distanceToBusStop = camera.position.distanceTo(busStopPosition);
            
            if (distanceToBusStop < 5) {
                const nextScene = getNextSceneInfo(CURRENT_SCENE);
                console.log(`Switching to ${nextScene.key} (${nextScene.name})`);
                switchScene(nextScene.key);
            }
        }
    }
});

// =====================================================
// WINDOW RESIZE
// =====================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    handleResize();
});

// =====================================================
// ANIMATION LOOP (Using new module)
// =====================================================
const animate = createAnimationLoop(
    scene, 
    camera, 
    renderer, 
    renderTarget,
    postMaterial,
    postScene,
    postCamera,
    streetElements,
    () => updateCameraPosition(camera, PLAZA_CONFIG, streetElements),
    () => checkNearbyNPCs(camera, streetElements.npcs),
    () => checkNearbyItems(camera, streetElements.interactiveItems),
    () => checkBusStopProximity(camera, PLAZA_CONFIG, CURRENT_SCENE, streetElements),
    () => {
        // Update mobile action button based on context
        if (!isMobile) return;
        
        const nearbyNPC = streetElements.npcs?.find(npc => {
            return camera.position.distanceTo(npc.position) < 3;
        });
        
        // Check for building door portals first
        let nearBuildingPortal = false;
        if (streetElements && streetElements.buildingPortals) {
            nearBuildingPortal = streetElements.buildingPortals.some(portal => {
                return camera.position.distanceTo(portal.position) < 5;
            });
        }
        
        const busStopPosition = new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
        const distanceToBusStop = camera.position.distanceTo(busStopPosition);
        
        if (nearbyNPC) {
            updateMobileActionButton('talk', 'TALK');
        } else if (nearBuildingPortal) {
            updateMobileActionButton('enter', 'ENTER');
        } else if (distanceToBusStop < 5) {
            updateMobileActionButton('travel', 'TRAVEL');
        } else if (getConversationAtEnd()) {
            updateMobileActionButton('continue', 'CONTINUE');
        } else {
            updateMobileActionButton('run', 'RUN');
        }
    },
    createCar,
    getRandomCarColor,
    updateDebugInfo
);

// Start the animation loop
animate(0);

console.log("✅ Suburban Adventure initialized with modular architecture!");

// Debug overlay is now integrated into phone UI - no longer creating separate overlay

