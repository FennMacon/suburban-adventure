// main.js - Refactored version using modular structure
// This is the streamlined orchestration file

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Import from our new modular files
import { createWireframeMaterial, createCar, getRandomCarColor, createTree, createBush } from './utils.js';
import { createNightSky, updateNightSky } from './nightsky.js';
import { createSkybox, updateSkybox } from './skybox.js';
import { createParkElements, createBuildingFacade, createInteriorScene, createGlowingWireframeMaterial } from './buildings.js';
import { createNPCs, initializeNPCInteraction, checkNearbyNPCs, checkBusStopProximity, initializeConversationHandlers } from './npcs.js';
import { getCurrentScene, getPlazaConfig, SCENE_CONFIGS } from './scenes.js';
import { 
    startConversation, advanceConversation, endConversation, hasActiveConversation, 
    getCurrentDialogue, getUnlockedSongs, checkIfLastLine, unlockCurrentSong, 
    conversationAtEnd, setConversationAtEnd
} from './dialogue.js';
import { initializeControls, updateCameraPosition, isMobile, getMobileActionButton, updateMobileActionButton, setCurrentAction } from './controls.js';
import { initializeRenderer, initializePostProcessing, renderScene, handleResize, getRenderer } from './renderer.js';
import { createAnimationLoop } from './animation.js';

// =====================================================
// SCENE SETUP
// =====================================================
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);

// Current active scene configuration
let CURRENT_SCENE = getCurrentScene();
let PLAZA_CONFIG = getPlazaConfig(CURRENT_SCENE);

// Scene switching function
const switchScene = (sceneName) => {
    if (SCENE_CONFIGS[sceneName]) {
        CURRENT_SCENE = sceneName;
        PLAZA_CONFIG = SCENE_CONFIGS[sceneName];
        
        const cameraPos = camera.position;
        const busStopCameraPosition = {
            x: -15,
            y: cameraPos.y,
            z: SCENE_CONFIGS[sceneName].NEAR_SIDEWALK_Z + 3
        };
        localStorage.setItem('busStopCameraPosition', JSON.stringify(busStopCameraPosition));
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
let shouldRotate180 = false;

if (savedBusStopPosition) {
    const pos = JSON.parse(savedBusStopPosition);
    camera.position.set(pos.x, pos.y, pos.z);
    localStorage.removeItem('busStopCameraPosition');
    shouldRotate180 = true;
} else {
    camera.position.set(0, 2, PLAZA_CONFIG.CAMERA_START_Z);
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// =====================================================
// CREATE STREET SCENE
// =====================================================
// NOTE: This function is kept here temporarily. It's ~2000 lines and should
// eventually be moved to scenes.js for better organization.

const createStreetScene = () => {
    const streetElements = {};
    
    // Groups for organizing scene elements
    const frontShopsGroup = new THREE.Group();
    const farBuildingsGroup = new THREE.Group();
    const nearSidewalkElementsGroup = new THREE.Group();
    const streetElementsGroup = new THREE.Group();
    const farSidewalkElementsGroup = new THREE.Group();
    
    // Position groups at their Z locations
    frontShopsGroup.position.z = PLAZA_CONFIG.FRONT_SHOPS_Z;
    farBuildingsGroup.position.z = PLAZA_CONFIG.FAR_BUILDINGS_Z;
    nearSidewalkElementsGroup.position.z = PLAZA_CONFIG.NEAR_SIDEWALK_Z;
    streetElementsGroup.position.z = PLAZA_CONFIG.STREET_Z;
    farSidewalkElementsGroup.position.z = PLAZA_CONFIG.FAR_SIDEWALK_Z;
    
    // Add groups to scene
    scene.add(frontShopsGroup);
    scene.add(farBuildingsGroup);
    scene.add(nearSidewalkElementsGroup);
    scene.add(streetElementsGroup);
    scene.add(farSidewalkElementsGroup);
    
    streetElements.frontShopsGroup = frontShopsGroup;
    streetElements.farBuildingsGroup = farBuildingsGroup;
    streetElements.nearSidewalkElementsGroup = nearSidewalkElementsGroup;
    streetElements.streetElementsGroup = streetElementsGroup;
    streetElements.farSidewalkElementsGroup = farSidewalkElementsGroup;
    
    // ===== REST OF createStreetScene IMPLEMENTATION =====
    // TODO: Copy the remaining ~1800 lines from main.js.old
    // This includes:
    // - Karaoke bar creation
    // - Street lamps, benches, trash cans
    // - Bus stop
    // - Cars and bus
    // - Park elements (if FOREST_SUBURBAN)
    // - Far buildings
    // - Forest elements
    // - etc.
    
    // For now, returning a minimal structure
    console.log("⚠️  createStreetScene: Full implementation needed from main.js.old");
    
    return streetElements;
};

// =====================================================
// INITIALIZE SCENE
// =====================================================
const streetElements = createStreetScene();

// Create interior elements
let interiorElements = {};
if (CURRENT_SCENE === 'PLAZA') {
    interiorElements = createInteriorScene(streetElements.frontShopsGroup);
}

// Add NPCs
streetElements.npcs = createNPCs(PLAZA_CONFIG, CURRENT_SCENE, scene);

// Initialize NPC interaction system
initializeNPCInteraction();
initializeConversationHandlers(CURRENT_SCENE);

// =====================================================
// SKYBOX AND ENVIRONMENT
// =====================================================
createNightSky(scene);
const skybox = createSkybox(scene, CURRENT_SCENE);
scene.userData.camera = camera;

// =====================================================
// KEYBOARD EVENT HANDLERS
// =====================================================
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF') {
        const busStopPosition = new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
        const distanceToBusStop = camera.position.distanceTo(busStopPosition);
        
        if (distanceToBusStop < 5) {
            const targetScene = CURRENT_SCENE === 'PLAZA' ? 'FOREST_SUBURBAN' : 'PLAZA';
            console.log(`Switching to ${targetScene}`);
            switchScene(targetScene);
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
    postBufferA,
    postBufferB,
    postMaterial,
    postScene,
    postCamera,
    streetElements,
    () => updateCameraPosition(camera),
    () => checkNearbyNPCs(camera, streetElements.npcs),
    () => checkBusStopProximity(camera, PLAZA_CONFIG, CURRENT_SCENE),
    () => {
        // Update mobile action button based on context
        if (!isMobile) return;
        
        const nearbyNPC = streetElements.npcs?.find(npc => {
            return camera.position.distanceTo(npc.position) < 3;
        });
        
        const busStopPosition = new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
        const distanceToBusStop = camera.position.distanceTo(busStopPosition);
        
        if (nearbyNPC) {
            updateMobileActionButton('talk', 'TALK');
        } else if (distanceToBusStop < 5) {
            updateMobileActionButton('travel', 'TRAVEL');
        } else if (conversationAtEnd) {
            updateMobileActionButton('continue', 'CONTINUE');
        } else {
            updateMobileActionButton('run', 'RUN');
        }
    },
    createCar,
    getRandomCarColor
);

// Start the animation loop
animate(0);

console.log("✅ Suburban Adventure initialized with modular architecture!");

