// main.js - Refactored version using modular structure
// This is the streamlined orchestration file

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Import from our new modular files
import { createWireframeMaterial, createCar, getRandomCarColor, createTree, createBush } from './utils.js';
import { loadAllContent } from './content-loader.js';
import { createUnifiedMapGround, createCityMapGround, createConnectorRoads, createCityConnectorRoads, createConnectorVehicles, createCityConnectorVehicles, createUnifiedMapTrees, createCityTripleDeckers, createCitySkyline, createGroundFog, createForestClearings, createCarnival, createMansionCompound, createRiver, createZoneScene, createSubwayStop, createRecordStrip, createFoodRow, createUrbanPark } from './world/zone-scene.js';
import { createNightSky, updateNightSky } from './nightsky.js';
import { createSkybox, updateSkybox } from './skybox.js';
import { createParkElements, createBuildingFacade, createInteriorScene, createGlowingWireframeMaterial, createPondElements, createShopInterior, INTERIOR_REGISTRY, INTERIOR_TARGET_SIZE } from './buildings.js';
import { createNPCs, createInteriorNPCs, initializeNPCInteraction, checkNearbyNPCs, checkNearbyItems, checkBusStopProximity, initializeConversationHandlers, getNextSceneInfo, handleInteractionInput } from './npcs.js';
import { getCurrentScene, getPlazaConfig, SCENE_CONFIGS, UNIFIED_MAP, UNIFIED_MAP_ZONE_OFFSETS, UNIFIED_MAP_ZONES, getBuildingPortalDestination, getBusStopArrivalPosition, getCurrentMap, setCurrentMap, getSubwayArrivalPosition, SUBWAY_POSITIONS, CITY_MAP_ZONE_OFFSETS } from './scenes.js';
import { getFogConfigForZone } from './fog.js';
import { 
    startConversation, advanceConversation, endConversation, hasActiveConversation, 
    getCurrentDialogue, getUnlockedSongs, checkIfLastLine, unlockCurrentSong, 
    getConversationAtEnd, setConversationAtEnd
} from './dialogue.js';
import { initializeControls, updateCameraPosition, isMobile } from './controls.js';
import { initializeMobileControls, updateMobileActionButton, getMobileActionButton } from './mobile-controls.js';
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
        scene: UNIFIED_MAP ? 'Unified Map' : PLAZA_CONFIG.name,
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

console.log('🎬 Loading scene:', CURRENT_SCENE, 'Config:', PLAZA_CONFIG.name, UNIFIED_MAP ? '(Unified Map)' : '');
console.log('Scene flags:', {
    FRONT_IS_PARK: PLAZA_CONFIG.FRONT_IS_PARK,
    FRONT_IS_POND: PLAZA_CONFIG.FRONT_IS_POND,
    HAUNTED_ATMOSPHERE: PLAZA_CONFIG.HAUNTED_ATMOSPHERE
});

// Adjust fog based on scene - PS2-style zone fog
// Disable fog for interior scenes
if (PLAZA_CONFIG.IS_INTERIOR) {
    scene.fog = null;
} else {
    const fogCfg = getCurrentMap() === 'city'
        ? getFogConfigForZone('CITY_PLAZA', 'CITY_PLAZA')
        : (UNIFIED_MAP
            ? getFogConfigForZone('PLAZA', 'PLAZA')
            : (PLAZA_CONFIG.FOG || getFogConfigForZone(CURRENT_SCENE, CURRENT_SCENE)));
    scene.fog = new THREE.Fog(fogCfg.color, fogCfg.near, fogCfg.far);
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
// LOAD CONTENT (dialogue + flavor text from content/*.txt)
// =====================================================
await loadAllContent();
console.log('Content loaded.');

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

    const registryEntry = INTERIOR_REGISTRY[CURRENT_SCENE];
    if (registryEntry) {
        interiorGroup = registryEntry.create(scene);
        interiorDimensions = registryEntry.dimensions;
    } else {
        // Generic interior for unregistered scene types
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
} else if (getCurrentMap() === 'city') {
    // City map (Allston-style) - 9 zones, 3 main street zones
    console.log('🗺️ Creating city map with 9-zone ground, connector roads, and CITY_PLAZA, CITY_N, CITY_S zones');
    createCityMapGround(scene);
    createGroundFog(scene);
    createCityConnectorRoads(scene);
    const cityTripleDeckers = createCityTripleDeckers(scene);
    const citySkyline = createCitySkyline(scene);
    createRecordStrip(scene);
    createFoodRow(scene);
    createUrbanPark(scene);
    const cityPlazaZone = createZoneScene(scene, SCENE_CONFIGS.CITY_PLAZA, CITY_MAP_ZONE_OFFSETS.CITY_PLAZA, 'CITY_PLAZA');
    const cityNorthZone = createZoneScene(scene, SCENE_CONFIGS.CITY_N, CITY_MAP_ZONE_OFFSETS.CITY_N, 'CITY_N');
    const citySouthZone = createZoneScene(scene, SCENE_CONFIGS.CITY_S, CITY_MAP_ZONE_OFFSETS.CITY_S, 'CITY_S');
    
    const connectorVehiclesGroup = createCityConnectorVehicles(scene, createCar, getRandomCarColor);
    const connectorCars = connectorVehiclesGroup.children.filter(c => c.userData.roadType === 'vertical');

    const subwayStop = createSubwayStop(SUBWAY_POSITIONS.city.x, SUBWAY_POSITIONS.city.z);
    scene.add(subwayStop);
    
    streetElements = {
        ...cityPlazaZone,
        cityTripleDeckers,
        citySkyline,
        buildingPortals: [...(cityPlazaZone.buildingPortals || []), ...(cityNorthZone.buildingPortals || []), ...(citySouthZone.buildingPortals || [])],
        npcs: [...(cityPlazaZone.npcs || []), ...(cityNorthZone.npcs || []), ...(citySouthZone.npcs || [])],
        zoneRootGroups: [cityPlazaZone.zoneRootGroup, cityNorthZone.zoneRootGroup, citySouthZone.zoneRootGroup],
        cars: [...(cityPlazaZone.cars || []), ...(cityNorthZone.cars || []), ...(citySouthZone.cars || []), ...connectorCars],
        connectorVehiclesGroup,
        buses: [cityPlazaZone.bus, cityNorthZone.bus, citySouthZone.bus].filter(Boolean),
        subwayStopPosition: SUBWAY_POSITIONS.city,
        mapType: 'city'
    };
    streetElements.interactiveItems = [];
    interiorElements = createInteriorScene(streetElements.frontShopsGroup);
    console.log('🗺️ City map ready.');
} else if (UNIFIED_MAP) {
    // Create unified map - 1000x1000 ground, connector roads, and three populated zones
    console.log('🗺️ Creating unified map with 9-zone ground, connector roads, and PLAZA, FOREST_SUBURBAN, POND zones');
    createUnifiedMapGround(scene);
    createGroundFog(scene);
    createConnectorRoads(scene);
    const clearingResult = createForestClearings(scene);
    const carnivalResult = createCarnival(scene);
    const mansionResult = createMansionCompound(scene);
    const riverResult = createRiver(scene);
    const unifiedMapTrees = createUnifiedMapTrees(scene);
    const plazaZone = createZoneScene(scene, SCENE_CONFIGS.PLAZA, UNIFIED_MAP_ZONE_OFFSETS.PLAZA, 'PLAZA');
    const forestZone = createZoneScene(scene, SCENE_CONFIGS.FOREST_SUBURBAN, UNIFIED_MAP_ZONE_OFFSETS.FOREST_SUBURBAN, 'FOREST_SUBURBAN');
    const pondZone = createZoneScene(scene, SCENE_CONFIGS.POND, UNIFIED_MAP_ZONE_OFFSETS.POND, 'POND');
    
    const subwayStop = createSubwayStop(SUBWAY_POSITIONS.suburban.x, SUBWAY_POSITIONS.suburban.z);
    scene.add(subwayStop);
    
    const connectorVehiclesGroup = createConnectorVehicles(scene, createCar, getRandomCarColor);
    const connectorCars = connectorVehiclesGroup.children.filter(c => c.userData.roadType === 'vertical');
    
    // Merge zone results - combine all cars and buses from all zones + connector vehicles
    streetElements = {
        ...plazaZone,
        mapType: 'suburban',
        riverUpdate: riverResult?.updateFlow,
        carnivalUpdate: carnivalResult?.updateCarnival,
        unifiedMapTrees,
        buildingPortals: [...(plazaZone.buildingPortals || []), ...(forestZone.buildingPortals || []), ...(pondZone.buildingPortals || [])],
        npcs: [...(plazaZone.npcs || []), ...(forestZone.npcs || []), ...(pondZone.npcs || [])],
        zoneRootGroups: [plazaZone.zoneRootGroup, forestZone.zoneRootGroup, pondZone.zoneRootGroup],
        pondElements: pondZone.pondElements,
        campfire: pondZone.campfire,
        pond: pondZone.pond,
        campsiteObjects: pondZone.campsiteObjects,
        cars: [...(plazaZone.cars || []), ...(forestZone.cars || []), ...(pondZone.cars || []), ...connectorCars],
        connectorVehiclesGroup,
        buses: [plazaZone.bus, forestZone.bus, pondZone.bus].filter(Boolean),
        subwayStopPosition: SUBWAY_POSITIONS.suburban
    };
    streetElements.interactiveItems = [
        ...(clearingResult?.interactiveItems || []),
        ...(carnivalResult?.interactiveItems || []),
        ...(mansionResult?.interactiveItems || [])
    ];
    
    // Create interior elements for karaoke bar (only in PLAZA zone)
    interiorElements = createInteriorScene(streetElements.frontShopsGroup);
    
    // Use PLAZA config for animation/compatibility refs (cars, bus, etc. from PLAZA zone)
    console.log('🗺️ Unified map ready. Building portals:', streetElements.buildingPortals?.length, 'NPCs:', streetElements.npcs?.length);
} else {
    // Create single street scene (exterior) - legacy scene-switching mode
    streetElements = createZoneScene(scene, PLAZA_CONFIG, { x: 0, z: 0 }, CURRENT_SCENE);
    
    // Initialize interactive items as empty array for exterior scenes
    streetElements.interactiveItems = [];
    
    // Create interior elements for karaoke bar (only in PLAZA scene)
    if (CURRENT_SCENE === 'PLAZA') {
        interiorElements = createInteriorScene(streetElements.frontShopsGroup);
    }
    
    // Add NPCs (already created by createZoneScene)
    streetElements.npcs = streetElements.npcs || createNPCs(PLAZA_CONFIG, CURRENT_SCENE, scene);
}

// Initialize NPC interaction system
initializeNPCInteraction();
initializeConversationHandlers();

// handleActionInput: unified handler for Space/mobile button - conversations, items, portals, bus
const handleActionInput = () => {
    // Skip portals/bus if in conversation (Space is for conversation only in that case)
    if (hasActiveConversation()) {
        handleInteractionInput(CURRENT_SCENE);
        return;
    }
    // Conversations, items, NPC talk - returns true if consumed
    if (handleInteractionInput(CURRENT_SCENE)) return;

    // Building door portals
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
            const targetScene = getBuildingPortalDestination(nearestPortal.style);
            console.log(`Entering ${nearestPortal.name}, switching to ${targetScene.key} (${targetScene.name})`);
            localStorage.setItem('previousExteriorScene', nearestPortal.zoneKey || CURRENT_SCENE);
            const portalPosition = { x: nearestPortal.position.x, y: camera.position.y, z: nearestPortal.position.z };
            localStorage.setItem('buildingPortalPosition', JSON.stringify(portalPosition));
            const isFarBuilding = nearestPortal.isFarBuilding === true;
            localStorage.setItem('isFarBuilding', isFarBuilding ? 'true' : 'false');
            switchScene(targetScene.key);
            return;
        }
    }

    // Exit portal if in interior scene
    if (PLAZA_CONFIG.IS_INTERIOR && streetElements && streetElements.exitPortal) {
        const exitPortalPos = new THREE.Vector3();
        streetElements.exitPortal.getWorldPosition(exitPortalPos);
        if (camera.position.distanceTo(exitPortalPos) < 3) {
            const previousScene = localStorage.getItem('previousExteriorScene') || 'PLAZA';
            console.log(`Exiting interior, returning to ${previousScene}`);
            switchScene(previousScene);
            return;
        }
    }

    // Subway travel - switch between suburban and city maps (same as "t" key)
    if (streetElements?.subwayStopPosition) {
        const subwayPos = streetElements.subwayStopPosition;
        const dist = camera.position.distanceTo(new THREE.Vector3(subwayPos.x, 0, subwayPos.z));
        if (dist < 6 && performMapSwitch()) return;
    }

    // Bus stop travel - UNIFIED_MAP
    if (!PLAZA_CONFIG.IS_INTERIOR && UNIFIED_MAP && streetElements?.zoneRootGroups) {
        let nearestZone = null;
        let distanceToBusStop = Infinity;
        streetElements.zoneRootGroups.forEach(zoneRoot => {
            const zoneKey = zoneRoot.userData?.zoneKey;
            const zoneConfig = SCENE_CONFIGS[zoneKey] || PLAZA_CONFIG;
            const offset = zoneRoot.userData?.zoneOffset || { x: 0, z: 0 };
            const busStopPos = new THREE.Vector3(
                offset.x + (zoneConfig.ROAD_POSITION_X ? zoneConfig.ROAD_POSITION_X + 3 : -15),
                0,
                offset.z + zoneConfig.NEAR_SIDEWALK_Z
            );
            const d = camera.position.distanceTo(busStopPos);
            if (d < distanceToBusStop) {
                distanceToBusStop = d;
                nearestZone = zoneKey;
            }
        });
        if (distanceToBusStop < 5 && nearestZone) {
            const next = getNextSceneInfo(nearestZone);
            const pos = getBusStopArrivalPosition(next.key);
            camera.position.set(pos.x, pos.y, pos.z);
            console.log(`🚌 Travelled to ${next.name}`);
            return;
        }
    }

    // Fall back to bus stop (non-unified exterior scenes)
    if (!PLAZA_CONFIG.IS_INTERIOR && !UNIFIED_MAP) {
        const busStopX = PLAZA_CONFIG.ROAD_POSITION_X ? PLAZA_CONFIG.ROAD_POSITION_X + 3 : -15;
        const busStopPosition = new THREE.Vector3(busStopX, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
        if (camera.position.distanceTo(busStopPosition) < 5) {
            const nextScene = getNextSceneInfo(CURRENT_SCENE);
            console.log(`Switching to ${nextScene.key} (${nextScene.name})`);
            switchScene(nextScene.key);
        }
    }
};

// Initialize mobile controls (joysticks, action button) when on mobile
if (isMobile) {
    initializeMobileControls({ onAction: handleActionInput });
}

// Initialize phone UI (mobileLayout: phone button top-center on mobile to avoid joystick overlap)
initializePhoneUI({ mobileLayout: isMobile });
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
const skyboxSceneType = PLAZA_CONFIG.IS_INTERIOR ? CURRENT_SCENE : (getCurrentMap() === 'city' ? 'CITY_MAP' : (UNIFIED_MAP ? 'UNIFIED_MAP' : CURRENT_SCENE));
const skybox = createSkybox(scene, skyboxSceneType, interiorDims);
scene.userData.camera = camera;

// Switch between suburban and city maps (same as subway travel)
const performMapSwitch = () => {
    if (PLAZA_CONFIG.IS_INTERIOR) return false;
    const currentMap = getCurrentMap();
    if (currentMap === 'suburban') {
        setCurrentMap('city');
        localStorage.setItem('suburbanAdventureScene', 'CITY_PLAZA');
        localStorage.setItem('busStopCameraPosition', JSON.stringify(getSubwayArrivalPosition('city')));
        console.log('🚇 Travelling to Allston');
        location.reload();
        return true;
    } else if (currentMap === 'city') {
        setCurrentMap('suburban');
        localStorage.setItem('suburbanAdventureScene', 'PLAZA');
        localStorage.setItem('busStopCameraPosition', JSON.stringify(getSubwayArrivalPosition('suburban')));
        console.log('🚇 Travelling to the suburbs');
        location.reload();
        return true;
    }
    return false;
};

// =====================================================
// KEYBOARD EVENT HANDLERS
// =====================================================
document.addEventListener('keydown', (event) => {
    const inInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
    if (event.code === 'KeyT' && !event.ctrlKey && !event.metaKey && !event.altKey && !inInput) {
        if (performMapSwitch()) return;
    }
    if (event.code === 'Space' || event.code === 'KeyF') {
        handleActionInput();
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
        
        // Subway check (before bus stop)
        let distanceToSubway = Infinity;
        if (streetElements?.subwayStopPosition) {
            const sp = streetElements.subwayStopPosition;
            distanceToSubway = camera.position.distanceTo(new THREE.Vector3(sp.x, 0, sp.z));
        }

        // Bus stop position check - in UNIFIED_MAP use nearest of all zone bus stops
        let distanceToBusStop = Infinity;
        if (UNIFIED_MAP && streetElements.zoneRootGroups) {
            streetElements.zoneRootGroups.forEach(zoneRoot => {
                const zoneConfig = SCENE_CONFIGS[zoneRoot.userData?.zoneKey] || PLAZA_CONFIG;
                const offset = zoneRoot.userData?.zoneOffset || { x: 0, z: 0 };
                const busStopPos = new THREE.Vector3(offset.x + (zoneConfig.ROAD_POSITION_X ? zoneConfig.ROAD_POSITION_X + 3 : -15), 0, offset.z + zoneConfig.NEAR_SIDEWALK_Z);
                const d = camera.position.distanceTo(busStopPos);
                if (d < distanceToBusStop) distanceToBusStop = d;
            });
        } else {
            distanceToBusStop = camera.position.distanceTo(new THREE.Vector3(-15, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z));
        }
        
        if (nearbyNPC) {
            updateMobileActionButton('talk', 'TALK');
        } else if (nearBuildingPortal) {
            updateMobileActionButton('enter', 'ENTER');
        } else if (distanceToSubway < 6) {
            updateMobileActionButton('travel', 'TRAVEL');
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
    updateDebugInfo,
    PLAZA_CONFIG.IS_INTERIOR
);

// Start the animation loop
animate(0);

console.log("✅ Suburban Adventure initialized with modular architecture!");

// Debug overlay is now integrated into phone UI - no longer creating separate overlay

