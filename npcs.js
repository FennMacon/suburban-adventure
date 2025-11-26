// npcs.js - NPC creation and management
import * as THREE from 'three';
import { createWireframeMaterial } from './utils.js';
import { INTERIOR_TARGET_SIZE, createGlowingWireframeMaterial } from './buildings.js';
import { startConversation, getCurrentDialogue, advanceConversation, hasActiveConversation, endConversation, getConversationAtEnd, setConversationAtEnd, unlockCurrentSong, getUnlockedSongs, getCurrentConversationUnlock, isSongUnlocked, markItemEncountered } from './dialogue.js';
import { SCENE_CONFIGS } from './scenes.js';

const DEFAULT_NPC_COLOR = 0xFF6B9D;
const NPC_WORLD_POSITION = new THREE.Vector3();

const createNPCGroup = (name, color = DEFAULT_NPC_COLOR) => {
    const npcGroup = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.6, 6);
    const bodyMaterial = createWireframeMaterial(color);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    npcGroup.add(body);

    const headGeometry = new THREE.SphereGeometry(0.25, 6, 4);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.85;
    npcGroup.add(head);

    npcGroup.userData.isInteractable = true;
    npcGroup.userData.npcName = name;
    npcGroup.userData.hasConversation = true;
    npcGroup.userData.interactionRadius = 2;
    npcGroup.userData.name = name;
    npcGroup.userData.isNPC = true;
    npcGroup.userData.color = color; // Store NPC color for dialogue display

    return npcGroup;
};

const clampToBounds = (value, min, max) => Math.max(min, Math.min(max, value));

const attachNPC = (
    parent,
    name,
    x,
    z,
    color = DEFAULT_NPC_COLOR,
    y = 0,
    options = {}
) => {
    const npcGroup = createNPCGroup(name, color);
    let finalX = x;
    let finalZ = z;

    if (options.bounds) {
        const { minX, maxX, minZ, maxZ } = options.bounds;
        finalX = clampToBounds(finalX, minX, maxX);
        finalZ = clampToBounds(finalZ, minZ, maxZ);
    } else if (options.radius) {
        const { radius } = options;
        const distance = Math.sqrt(finalX * finalX + finalZ * finalZ);
        if (distance > radius) {
            const scale = radius / distance;
            finalX *= scale;
            finalZ *= scale;
        }
    }

    npcGroup.position.set(finalX, y, finalZ);
    parent.add(npcGroup);
    return npcGroup;
};

// Create NPCs for the scene
export const createNPCs = (PLAZA_CONFIG, CURRENT_SCENE, scene) => {
    const npcs = [];
    
    if (CURRENT_SCENE === 'PLAZA') {
        // Massachusetts Plaza positioning
        npcs.push(attachNPC(scene, 'Maya', -20, PLAZA_CONFIG.NEAR_SIDEWALK_Z, 0xFF6B9D)); // Pink
        npcs.push(attachNPC(scene, 'Jake', 15, PLAZA_CONFIG.NEAR_SIDEWALK_Z, 0x9D6BFF)); // Purple
        
        // Pizza guy behind the counter (interior NPC)
        npcs.push(attachNPC(scene, 'Rex', 0, -13.5, 0xFF883B)); // Red
        
        // Group conversations - position NPCs close together
        npcs.push(attachNPC(scene, 'Alex', -10, PLAZA_CONFIG.PARKING_LOT_Z, 0x6BFF9D)); // Green
        npcs.push(attachNPC(scene, 'Sam', -8, PLAZA_CONFIG.PARKING_LOT_Z, 0x6BFFFF)); // Cyan
        
        npcs.push(attachNPC(scene, 'Jordan', 25, PLAZA_CONFIG.PARKING_LOT_Z - 5, 0xFFFF6B)); // Yellow
        npcs.push(attachNPC(scene, 'Riley', 27, PLAZA_CONFIG.PARKING_LOT_Z - 5, 0xFF9D6B)); // Orange
    } else if (CURRENT_SCENE === 'FOREST_SUBURBAN') {
        // Witchy guy in the gazebo
        npcs.push(attachNPC(scene, 'Morgan', 0, -26, 0x8B008B, .25)); // Dark purple guy, elevated on gazebo platform
        // Forest Suburban positioning
        npcs.push(attachNPC(scene, 'Maya', -25, PLAZA_CONFIG.NEAR_SIDEWALK_Z + 1, 0xFF6B9D)); // Pink
        npcs.push(attachNPC(scene, 'Jake', 20, PLAZA_CONFIG.NEAR_SIDEWALK_Z + 1, 0x9D6BFF)); // Purple
        
        // Group conversations - by the stone wall area
        const wallZ = (PLAZA_CONFIG.FAR_SIDEWALK_Z + PLAZA_CONFIG.FAR_BUILDINGS_Z) / 2;
        npcs.push(attachNPC(scene, 'Alex', -15, wallZ - 2, 0x6BFF9D)); // Green
        npcs.push(attachNPC(scene, 'Sam', -13, wallZ - 2, 0x6BFFFF)); // Cyan
        
        npcs.push(attachNPC(scene, 'Jordan', 10, wallZ + 2, 0xFFFF6B)); // Yellow
        npcs.push(attachNPC(scene, 'Riley', 12, wallZ + 2, 0xFF9D6B)); // Orange
    } else if (CURRENT_SCENE === 'POND') {
        // Pond scene - post-party campfire vibes
        // Around the campfire
        npcs.push(attachNPC(scene, 'Maya', 12, -32, 0xFF6B9D)); // By fire
        npcs.push(attachNPC(scene, 'Jake', 18, -28, 0x9D6BFF)); // On log
        
        // By the pond
        npcs.push(attachNPC(scene, 'Alex', -15, -55, 0x6BFF9D)); // Pond edge
        npcs.push(attachNPC(scene, 'Sam', -12, -55, 0x6BFFFF)); // Next to Alex
        
        // Ghost story teller (new NPC) - near tent
        npcs.push(attachNPC(scene, 'Casey', 20, 110, 0xA2ABBB)); // In tent area
    }
    
    return npcs;
};

const INTERIOR_NPC_CONFIG = {
    CUMBYS_INTERIOR: [
        { name: 'Leah', x: -12, z: -18, color: 0xFFC857 },
        { name: 'Theo', x: 12, z: 8, color: 0x57C7FF }
    ],
    GROHOS_INTERIOR: [
        { name: 'Tony', x: 0, z: -24, color: 0xFF6B6B },
        { name: 'Nina', x: -15, z: 12, color: 0x6BFFB3 }
    ],
    CLOTHING_STORE_INTERIOR: [
        { name: 'Priya', x: -12, z: -28, color: 0x9D6BFF }
    ],
    DRYCLEANER_INTERIOR: [
        { name: 'Mr. Clean', x: 14, z: -26, color: 0x88E1FF }
    ],
    DUNKIN_INTERIOR: [
        { name: 'Kayla', x: 0, z: -17, color: 0xFF8A65 } // Cashier at counter
    ],
    FLOWER_SHOP_INTERIOR: [
        { name: 'Elli', x: 8, z: -22, color: 0x88FFAA }
    ],
    CHURCH_INTERIOR: [
        { name: 'Pastor Ruth', x: 0, z: -35, color: 0xFFE066 }
    ],
    TOWNHALL_INTERIOR: [
        { name: 'Clara', x: -20, z: -12, color: 0x66D0FF }
    ],
    HOUSE_INTERIOR: [
        { name: 'June', x: -10, z: -6, color: 0xFFB6C1 }
    ],
    HOSPITAL_INTERIOR: [
        { name: 'Nurse Mel', x: 10, z: -30, color: 0xC0E9FF }
    ],
    MODERN_INTERIOR: [
        { name: 'Owen', x: -15, z: -18, color: 0xA0A0FF }
    ],
    BRICK_INTERIOR: [
        { name: 'Harvey', x: 12, z: -28, color: 0xFFAA66 }
    ],
    SHOP_INTERIOR: [
        { name: 'Customer', x: 0, z: -15, color: 0xCCCCFF }
    ],
    INDUSTRIAL_INTERIOR: [
        { name: 'Foreman Dee', x: -8, z: -32, color: 0xFFAA00 }
    ],
    GRAVEYARD_INTERIOR: [
        { name: 'Caretaker Mo', x: 0, z: -20, color: 0xAAFFEE }
    ]
};

export const createInteriorNPCs = (CURRENT_SCENE, interiorGroup) => {
    const npcs = [];
    if (!interiorGroup) return npcs;
    const config = INTERIOR_NPC_CONFIG[CURRENT_SCENE];
    if (!config) return npcs;
    const bounds = {
        minX: -INTERIOR_TARGET_SIZE / 2 + 2,
        maxX: INTERIOR_TARGET_SIZE / 2 - 2,
        minZ: -INTERIOR_TARGET_SIZE / 2 + 2,
        maxZ: INTERIOR_TARGET_SIZE / 2 - 2
    };
    config.forEach(({ name, x, z, color = DEFAULT_NPC_COLOR, y = 0, clamp = true }) => {
        const options = clamp ? { bounds } : {};
        npcs.push(attachNPC(interiorGroup, name, x, z, color, y, options));
    });
    return npcs;
};

// Global variables for NPC interaction
let nearbyNPC = null;
let conversationNPC = null; // Track which NPC we're talking to
let interactionUI = null;
let sceneSwitchUI = null;
let nearbyItemUI = null; // UI for nearby item display (matches sceneSwitchUI style)
let allNPCs = []; // Store all NPCs for lookup by name
let showingUnlockedSong = false; // Flag to prevent checkBusStopProximity from hiding unlocked song display
let conversationFadeTimeout = null; // Timeout for conversation fade-out

// Global variables for item interaction
let nearbyItem = null;
let showingItemFlavor = false;
let flavorTextFadeTimeout = null;
let currentFlavorTextIndex = 0; // Track which flavor text we're showing
let currentItemNewlyEncountered = false; // Track if current item was newly encountered
let itemOriginalMaterials = new Map(); // Store original materials for glow effect

// Initialize interaction UI
export const initializeNPCInteraction = () => {
    // Create interaction UI
    interactionUI = document.createElement('div');
    interactionUI.style.position = 'fixed';
    interactionUI.style.bottom = '20px';
    interactionUI.style.left = '50%';
    interactionUI.style.transform = 'translateX(-50%)';
    interactionUI.style.padding = '20px';
    interactionUI.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    interactionUI.style.color = '#88FFE6';
    interactionUI.style.fontFamily = 'monospace';
    interactionUI.style.fontSize = '14px';
    interactionUI.style.border = '2px solid #88FFE6';
    interactionUI.style.borderRadius = '4px';
    interactionUI.style.display = 'none';
    interactionUI.style.zIndex = '1000';
    interactionUI.style.maxWidth = '500px';
    interactionUI.style.textAlign = 'left';
    interactionUI.style.boxShadow = '0 0 10px rgba(136, 255, 230, 0.5)';
    interactionUI.style.lineHeight = '1.6';
    document.body.appendChild(interactionUI);
    
    // Create scene switching UI
    sceneSwitchUI = document.createElement('div');
    sceneSwitchUI.style.position = 'fixed';
    sceneSwitchUI.style.bottom = '80px';
    sceneSwitchUI.style.left = '50%';
    sceneSwitchUI.style.transform = 'translateX(-50%)';
    sceneSwitchUI.style.color = '#FFFF88';
    sceneSwitchUI.style.fontFamily = 'monospace';
    sceneSwitchUI.style.fontSize = '14px';
    sceneSwitchUI.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    sceneSwitchUI.style.padding = '10px';
    sceneSwitchUI.style.borderRadius = '5px';
    sceneSwitchUI.style.display = 'none';
    sceneSwitchUI.style.zIndex = '1000';
    document.body.appendChild(sceneSwitchUI);
    
    // Create nearby item UI (matches sceneSwitchUI styling)
    nearbyItemUI = document.createElement('div');
    nearbyItemUI.style.position = 'fixed';
    nearbyItemUI.style.bottom = '80px';
    nearbyItemUI.style.left = '50%';
    nearbyItemUI.style.transform = 'translateX(-50%)';
    nearbyItemUI.style.color = '#FFFF88';
    nearbyItemUI.style.fontFamily = 'monospace';
    nearbyItemUI.style.fontSize = '14px';
    nearbyItemUI.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    nearbyItemUI.style.padding = '10px';
    nearbyItemUI.style.borderRadius = '5px';
    nearbyItemUI.style.display = 'none';
    nearbyItemUI.style.zIndex = '1000';
    document.body.appendChild(nearbyItemUI);
};

// Check for nearby NPCs
export const checkNearbyNPCs = (camera, npcs) => {
    // Store all NPCs globally for lookup by name
    if (npcs) {
        allNPCs = npcs;
    }
    
    const cameraPosition = camera.position;
    let closestNPC = null;
    let closestDistance = Infinity;
    
    if (npcs) {
        npcs.forEach(npc => {
            npc.getWorldPosition(NPC_WORLD_POSITION);
            const distance = cameraPosition.distanceTo(NPC_WORLD_POSITION);
            
            if (distance < 3 && distance < closestDistance) {
                closestNPC = npc;
                closestDistance = distance;
            }
        });
    }
    
    if (closestNPC !== nearbyNPC) {
        nearbyNPC = closestNPC;
        
        if (nearbyNPC) {
            // NPC interaction takes priority - hide item UI if showing
            if (showingItemFlavor) {
                showingItemFlavor = false;
                currentItemNewlyEncountered = false; // Reset flag
                nearbyItem = null;
            }
            // Hide nearby item UI when near NPC
            nearbyItemUI.style.display = 'none';
            
            const npcName = nearbyNPC.userData.name;
            const npcColor = nearbyNPC.userData.color || DEFAULT_NPC_COLOR;
            const npcColorCSS = hexToCSSColor(npcColor);
            
            // Show NPC name in top-left with their color
            nearbyItemUI.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px; color: ${npcColorCSS};">${npcName}</div>
            `;
            nearbyItemUI.style.display = 'block';
        } else {
            // Hide NPC name UI when not near NPC
            nearbyItemUI.style.display = 'none';
            // Only hide interactionUI if not showing item flavor text
            if (!showingItemFlavor) {
                interactionUI.style.display = 'none';
            }
        }
    }
};

// Get next scene in linear progression
const getNextScene = (currentScene) => {
    switch(currentScene) {
        case 'PLAZA': return { key: 'FOREST_SUBURBAN', name: 'The Suburbs' };
        case 'FOREST_SUBURBAN': return { key: 'POND', name: 'The Pond' };
        case 'POND': return { key: 'PLAZA', name: 'Downtown' };
        default: return { key: 'PLAZA', name: 'Downtown' };
    }
};

// Check for bus stop proximity
export const checkBusStopProximity = (camera, PLAZA_CONFIG, CURRENT_SCENE, streetElements) => {
    // Don't overwrite unlocked song display
    if (showingUnlockedSong) {
        return;
    }
    
    const playerPosition = camera.position;
    
    // If we're in an interior scene, check for exit portal first
    if (PLAZA_CONFIG.IS_INTERIOR && streetElements && streetElements.exitPortal) {
        const exitPortalPos = new THREE.Vector3();
        streetElements.exitPortal.getWorldPosition(exitPortalPos);
        const distanceToExit = playerPosition.distanceTo(exitPortalPos);
        
        if (distanceToExit < 3) {
            const previousScene = localStorage.getItem('previousExteriorScene') || 'PLAZA';
            sceneSwitchUI.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">🚪 Exit</div>
                <div style="font-size: 12px; margin-bottom: 5px;">Press Space to exit to:</div>
                <div style="color: #88FF88;">${SCENE_CONFIGS[previousScene]?.name || 'Street'}</div>
            `;
            sceneSwitchUI.style.display = 'block';
            return; // Exit portal takes priority in interior scenes
        }
    }
    
    // Don't check for bus stops or building portals in interior scenes (only exit portal)
    if (PLAZA_CONFIG.IS_INTERIOR) {
        sceneSwitchUI.style.display = 'none';
        return;
    }
    
    // Bus stop position (adjust for POND scene where it's on the side)
    const busStopX = PLAZA_CONFIG.ROAD_POSITION_X ? PLAZA_CONFIG.ROAD_POSITION_X + 3 : -15;
    const busStopPosition = new THREE.Vector3(busStopX, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
    const distanceToBusStop = playerPosition.distanceTo(busStopPosition);
    
    // First check if we're near a building door (building portals take priority)
    if (streetElements && streetElements.buildingPortals) {
        let nearestPortal = null;
        let nearestDistance = Infinity;
        
        streetElements.buildingPortals.forEach(portal => {
            const distance = playerPosition.distanceTo(portal.position);
            // Debug logging for front shops - check if player is near any shop portal
            if (portal.style === 'convenience' || portal.style === 'pizza' || portal.style === 'clothing' || 
                portal.style === 'drycleaner' || portal.style === 'coffee' || portal.style === 'flowers') {
                if (distance < 8) { // Log if within 8 units for debugging
                    console.log(`🏪 Portal ${portal.name} at (${portal.position.x.toFixed(1)}, ${portal.position.z.toFixed(1)}), player at (${playerPosition.x.toFixed(1)}, ${playerPosition.z.toFixed(1)}), distance: ${distance.toFixed(2)}`);
                }
            }
            // Use slightly larger detection radius for front shops (they're closer to player start)
            const detectionRadius = (portal.style === 'convenience' || portal.style === 'pizza' || portal.style === 'clothing' || 
                portal.style === 'drycleaner' || portal.style === 'coffee' || portal.style === 'flowers') ? 6 : 5;
            if (distance < detectionRadius && distance < nearestDistance) {
                nearestPortal = portal;
                nearestDistance = distance;
            }
        });
        
        if (nearestPortal) {
            // Show building door portal UI
            const targetScene = getBuildingPortalDestination(nearestPortal.style, CURRENT_SCENE);
            sceneSwitchUI.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">🚪 ${nearestPortal.name}</div>
                <div style="font-size: 12px; margin-bottom: 5px;">Press Space to enter:</div>
                <div style="color: #88FF88;">${targetScene.name}</div>
            `;
            sceneSwitchUI.style.display = 'block';
            return; // Building portal takes priority
        }
    }
    
    // Check bus stop if not near a building door
    if (distanceToBusStop < 5) {
        const nextScene = getNextScene(CURRENT_SCENE);
        sceneSwitchUI.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">🚌 Bus Stop</div>
            <div style="font-size: 12px; margin-bottom: 5px;">Press Space to travel to:</div>
            <div style="color: #88FF88;">${nextScene.name}</div>
        `;
        sceneSwitchUI.style.display = 'block';
    } else {
        sceneSwitchUI.style.display = 'none';
    }
};

// Get destination scene for building portal based on building style
const getBuildingPortalDestination = (buildingStyle, currentScene) => {
    // Map building styles to destination scenes
    // For now, we'll create a simple mapping
    // You can expand this to create specific interior scenes
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
        'convenience': { key: 'CUMBYS_INTERIOR', name: 'Grumby\'s' },
        'pizza': { key: 'GROHOS_INTERIOR', name: 'Grohos Pizza' },
        'clothing': { key: 'CLOTHING_STORE_INTERIOR', name: 'Clothing Store' },
        'drycleaner': { key: 'DRYCLEANER_INTERIOR', name: 'Dry Cleaners' },
        'coffee': { key: 'DUNKIN_INTERIOR', name: 'Donut Galaxy' },
        'flowers': { key: 'FLOWER_SHOP_INTERIOR', name: 'Flower Shop' }
    };
    
    return portalMap[buildingStyle] || { key: 'PLAZA', name: 'Downtown' };
};

// Export getNextScene for use in main.js
export const getNextSceneInfo = getNextScene;

// Initialize conversation interaction handlers
export const initializeConversationHandlers = (CURRENT_SCENE) => {
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            handleInteractionKey(CURRENT_SCENE);
        }
    });
};

// Handle interaction key
const handleInteractionKey = (CURRENT_SCENE) => {
    // Check if we walked away from the NPC we were talking to
    if (hasActiveConversation() && conversationNPC && nearbyNPC !== conversationNPC) {
        console.log('🚶 Walked away from', conversationNPC.userData.name, 'to', nearbyNPC?.userData.name || 'nobody');
        endConversation();
        conversationNPC = null;
        
        // Fade out dialogue UI
        interactionUI.style.transition = 'opacity 0.5s ease-out';
        interactionUI.style.opacity = '0';
        
        // Hide after fade completes
        conversationFadeTimeout = setTimeout(() => {
            interactionUI.style.display = 'none';
            interactionUI.style.opacity = '1';
            interactionUI.style.transition = '';
            conversationFadeTimeout = null;
            
            // If we're near a different NPC, show their name in top-left
            if (nearbyNPC) {
                const npcName = nearbyNPC.userData.name;
                const npcColor = nearbyNPC.userData.color || DEFAULT_NPC_COLOR;
                const npcColorCSS = hexToCSSColor(npcColor);
                nearbyItemUI.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px; color: ${npcColorCSS};">${npcName}</div>
                `;
                nearbyItemUI.style.display = 'block';
            } else {
                nearbyItemUI.style.display = 'none';
            }
        }, 500);
        
        return; // Don't process the Space key press this frame
    }
    
    if (hasActiveConversation()) {
        // Check if conversation is at the end waiting for final E pressa
        if (getConversationAtEnd()) {
            // Final E press - unlock song and end conversation
            // Determine artist name(s) - check if it's a group conversation
            let artistName = null;
            if (conversationNPC) {
                const npcName = conversationNPC.userData.name;
                // Check if this is part of a group conversation by looking for both NPCs
                if (npcName === 'Alex' || npcName === 'Sam') {
                    // Check if both Alex and Sam exist in the scene (group conversation)
                    const alexNPC = allNPCs.find(npc => npc.userData.name === 'Alex');
                    const samNPC = allNPCs.find(npc => npc.userData.name === 'Sam');
                    if (alexNPC && samNPC) {
                        // Both exist, so it's a group conversation
                        artistName = 'Alex & Sam';
                    } else {
                        // Only one exists, use single name
                        artistName = npcName;
                    }
                } else if (npcName === 'Jordan' || npcName === 'Riley') {
                    // Check if both Jordan and Riley exist in the scene (group conversation)
                    const jordanNPC = allNPCs.find(npc => npc.userData.name === 'Jordan');
                    const rileyNPC = allNPCs.find(npc => npc.userData.name === 'Riley');
                    if (jordanNPC && rileyNPC) {
                        // Both exist, so it's a group conversation
                        artistName = 'Jordan & Riley';
                    } else {
                        // Only one exists, use single name
                        artistName = npcName;
                    }
                } else {
                    // Single NPC conversation
                    artistName = npcName;
                }
            }
            
            // Pass NPC name to track who unlocked it
            const unlockResult = unlockCurrentSong(artistName);
            if (unlockResult && unlockResult.newlyUnlocked) {
                // Only show unlock UI if song was newly unlocked
                const unlockedSong = unlockResult.song;
                // Hide interactionUI and show unlocked song in sceneSwitchUI style
                interactionUI.style.display = 'none';
                showingUnlockedSong = true; // Set flag to prevent checkBusStopProximity from hiding it
                sceneSwitchUI.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px; text-align: center;">New Song</div>
                    <div style="font-size: 14px; margin-bottom: 5px; text-align: center;">
                        ${artistName ? artistName + ' - ' : ''}${unlockedSong.replace(/_/g, ' ')}
                    </div>
                `;
                sceneSwitchUI.style.display = 'block';
                
                setTimeout(() => {
                    const endConversationHandler = () => {
                        endConversation();
                        conversationNPC = null; // Clear the conversation NPC
                        showingUnlockedSong = false; // Clear flag
                        sceneSwitchUI.style.display = 'none';
                        
                        // Hide dialogue UI if still showing
                        if (conversationFadeTimeout) {
                            clearTimeout(conversationFadeTimeout);
                            conversationFadeTimeout = null;
                        }
                        interactionUI.style.display = 'none';
                        interactionUI.style.opacity = '1';
                        interactionUI.style.transition = '';
                        
                        // Show nearby NPC name in top-left if available
                        if (nearbyNPC) {
                            const npcName = nearbyNPC.userData.name;
                            const npcColor = nearbyNPC.userData.color || DEFAULT_NPC_COLOR;
                            const npcColorCSS = hexToCSSColor(npcColor);
                            nearbyItemUI.innerHTML = `
                                <div style="font-weight: bold; margin-bottom: 5px; color: ${npcColorCSS};">${npcName}</div>
                            `;
                            nearbyItemUI.style.display = 'block';
                        } else {
                            nearbyItemUI.style.display = 'none';
                        }
                        document.removeEventListener('keydown', endConversationHandler);
                    };
                    document.addEventListener('keydown', endConversationHandler);
                }, 100);
            } else {
                // No unlock, fade out dialogue UI
                endConversation();
                conversationNPC = null; // Clear the conversation NPC
                
                // Start fade out animation
                interactionUI.style.transition = 'opacity 0.5s ease-out';
                interactionUI.style.opacity = '0';
                
                // Hide after fade completes
                conversationFadeTimeout = setTimeout(() => {
                    interactionUI.style.display = 'none';
                    interactionUI.style.opacity = '1'; // Reset for next time
                    interactionUI.style.transition = ''; // Reset transition
                    conversationFadeTimeout = null;
                    
                    // Show nearby NPC name in top-left if available
                    if (nearbyNPC) {
                        const npcName = nearbyNPC.userData.name;
                        const npcColor = nearbyNPC.userData.color || DEFAULT_NPC_COLOR;
                        const npcColorCSS = hexToCSSColor(npcColor);
                        nearbyItemUI.innerHTML = `
                            <div style="font-weight: bold; margin-bottom: 5px; color: ${npcColorCSS};">${npcName}</div>
                        `;
                        nearbyItemUI.style.display = 'block';
                    } else {
                        nearbyItemUI.style.display = 'none';
                    }
                }, 500);
            }
        } else {
            // Continue ongoing conversation
            const dialogue = getCurrentDialogue();
            console.log('📖 Current dialogue:', dialogue);
            if (dialogue) {
                // Show current dialogue
                showDialogueStep(dialogue);
                
                // Advance to next line
                const stillActive = advanceConversation();
                console.log('➡️ Advanced conversation, still active:', stillActive);
                
                // Check if there are more lines
                const nextDialogue = getCurrentDialogue();
                console.log('👀 Next dialogue:', nextDialogue);
                if (!nextDialogue) {
                    // No more lines, set flag to wait for final E press
                    console.log('🏁 No more dialogue, setting conversationAtEnd');
                    setConversationAtEnd(true);
                }
            }
        }
    } else {
        // Check item interactions before NPC interactions (priority: conversation > item > NPC)
        handleItemInteractionKey();
        
        // Only check NPC if item interaction didn't handle it
        if (!showingItemFlavor && nearbyNPC) {
            // Start new conversation
            const npcName = nearbyNPC.userData.name;
            const sceneType = CURRENT_SCENE;
            
            // Hide NPC name UI when conversation starts
            nearbyItemUI.style.display = 'none';
            
            console.log('🎬 Starting conversation with:', npcName, 'in scene:', sceneType);
            if (startConversation(npcName, sceneType)) {
                conversationNPC = nearbyNPC; // Track which NPC we're talking to
                // Show the first line immediately
                const dialogue = getCurrentDialogue();
                console.log('📝 First dialogue:', dialogue);
                if (dialogue) {
                    showDialogueStep(dialogue);
                    advanceConversation();
                    console.log('✅ Conversation started and advanced');
                }
            }
        }
    }
};

// Helper function to convert hex color to CSS color string
const hexToCSSColor = (hex) => {
    return '#' + hex.toString(16).padStart(6, '0').toUpperCase();
};

// Show current dialogue step
const showDialogueStep = (dialogue) => {
    if (!dialogue) return;
    
    // Hide nearbyItemUI when showing dialogue (keep NPC name hidden during conversation)
    nearbyItemUI.style.display = 'none';
    
    // Get speaker color - use NPC color if available, otherwise default
    let speakerColor = '#88AAFF'; // Default player color
    let borderColor = '#88FFE6'; // Default border color (for flavor text)
    let boxShadowColor = 'rgba(136, 255, 230, 0.5)'; // Default box shadow
    
    if (dialogue.speaker !== 'Player') {
        // Look up the NPC by speaker name (for group conversations, this will find the correct NPC)
        const speakerNPC = allNPCs.find(npc => npc.userData.name === dialogue.speaker);
        
        if (speakerNPC && speakerNPC.userData.color) {
            const npcColor = speakerNPC.userData.color;
            speakerColor = hexToCSSColor(npcColor);
            borderColor = speakerColor;
            boxShadowColor = `rgba(${(npcColor >> 16) & 0xFF}, ${(npcColor >> 8) & 0xFF}, ${npcColor & 0xFF}, 0.5)`;
        } else if (conversationNPC && conversationNPC.userData.color) {
            // Fallback to conversationNPC if speaker not found (shouldn't happen, but safety)
            const npcColor = conversationNPC.userData.color;
            speakerColor = hexToCSSColor(npcColor);
            borderColor = speakerColor;
            boxShadowColor = `rgba(${(npcColor >> 16) & 0xFF}, ${(npcColor >> 8) & 0xFF}, ${npcColor & 0xFF}, 0.5)`;
        }
    } else if (dialogue.speaker === 'Player') {
        speakerColor = '#88AAFF'; // Player color
        borderColor = '#88FFE6'; // Keep default for player dialogue
    }
    
    // Update border and box shadow to match speaker color
    interactionUI.style.border = `2px solid ${borderColor}`;
    interactionUI.style.boxShadow = `0 0 10px ${boxShadowColor}`;
    interactionUI.style.color = '#88FFE6'; // Keep text color consistent
    
    // Cancel any ongoing fade
    if (conversationFadeTimeout) {
        clearTimeout(conversationFadeTimeout);
        conversationFadeTimeout = null;
        interactionUI.style.opacity = '1';
        interactionUI.style.transition = '';
    }
    
    interactionUI.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: ${speakerColor}; text-align: center;">
            ${dialogue.speaker}
        </div>
        <div style="margin-bottom: 15px;">${dialogue.text}</div>
        <div style="text-align: center; font-size: 12px; color: #CCCCCC;">
            
        </div>
    `;
    interactionUI.style.display = 'block';
    interactionUI.style.opacity = '1';
};

// Helper function to apply glow effect to an item
const applyItemGlow = (item) => {
    if (!item) return;
    
    // Traverse the item (could be a group or single mesh)
    item.traverse((object) => {
        if (object.isMesh && object.material) {
            // Store original material if not already stored
            if (!itemOriginalMaterials.has(object)) {
                itemOriginalMaterials.set(object, object.material);
            }
            
            // Get the original material to extract color
            const originalMaterial = itemOriginalMaterials.get(object);
            let baseColor = 0x88FFE6; // Default glow color (cyan to match UI)
            
            // Try to extract color from original material
            if (originalMaterial.color) {
                baseColor = originalMaterial.color.getHex();
            } else if (originalMaterial.uniforms && originalMaterial.uniforms.baseColor) {
                baseColor = originalMaterial.uniforms.baseColor.value.getHex();
            } else if (originalMaterial.isMeshBasicMaterial || originalMaterial.isMeshStandardMaterial) {
                // Try to get color from material properties
                if (originalMaterial.color) {
                    baseColor = originalMaterial.color.getHex();
                }
            }
            
            // Create glowing material with more noticeable intensity
            // Use a brighter cyan color for better visibility
            const glowColor = 0x88FFE6; // Bright cyan to match wireframe theme
            const glowMaterial = createGlowingWireframeMaterial(glowColor, 1.0, 0.8);
            object.material = glowMaterial;
        }
    });
};

// Helper function to remove glow effect from an item
const removeItemGlow = (item) => {
    if (!item) return;
    
    item.traverse((object) => {
        if (object.isMesh && itemOriginalMaterials.has(object)) {
            const originalMaterial = itemOriginalMaterials.get(object);
            object.material = originalMaterial;
            itemOriginalMaterials.delete(object);
        }
    });
};

// Check for nearby items
const ITEM_WORLD_POSITION = new THREE.Vector3();
export const checkNearbyItems = (camera, interactiveItems) => {
    // Don't check items if there's an active conversation or nearby NPC
    if (hasActiveConversation() || nearbyNPC) {
        if (nearbyItem) {
            // Remove glow when conversation/NPC takes priority
            removeItemGlow(nearbyItem);
            nearbyItem = null;
            if (!showingItemFlavor) {
                nearbyItemUI.style.display = 'none';
            }
        }
        return;
    }
    
    const cameraPosition = camera.position;
    let closestItem = null;
    let closestDistance = Infinity;
    
    if (interactiveItems && interactiveItems.length > 0) {
        interactiveItems.forEach(item => {
            item.getWorldPosition(ITEM_WORLD_POSITION);
            const distance = cameraPosition.distanceTo(ITEM_WORLD_POSITION);
            
            // Smaller detection radius for items (1.5 units) so it doesn't block other objects
            if (distance < 2.5 && distance < closestDistance) {
                closestItem = item;
                closestDistance = distance;
            }
        });
    }
    
    if (closestItem !== nearbyItem) {
        // Remove glow from previous item
        if (nearbyItem) {
            removeItemGlow(nearbyItem);
        }
        
        // If we were showing flavor text and moved away, fade it out
        if (showingItemFlavor && !closestItem) {
            // Remove glow from the item we moved away from
            if (nearbyItem) {
                removeItemGlow(nearbyItem);
            }
            
            // Clear any existing fade timeout
            if (flavorTextFadeTimeout) {
                clearTimeout(flavorTextFadeTimeout);
            }
            
            // Start fade out animation
            interactionUI.style.transition = 'opacity 0.5s ease-out';
            interactionUI.style.opacity = '0';
            
            // Hide after fade completes
            flavorTextFadeTimeout = setTimeout(() => {
                interactionUI.style.display = 'none';
                interactionUI.style.opacity = '1'; // Reset for next time
                interactionUI.style.transition = ''; // Reset transition
                showingItemFlavor = false;
                currentFlavorTextIndex = 0; // Reset index for next time
                currentItemNewlyEncountered = false; // Reset flag
                flavorTextFadeTimeout = null;
            }, 500);
        }
        
        nearbyItem = closestItem;
        
        // Apply glow and show subtle UI box when nearby
        if (nearbyItem && !showingItemFlavor) {
            applyItemGlow(nearbyItem);
            
            // Cancel any ongoing fade if we're near an item again
            if (flavorTextFadeTimeout) {
                clearTimeout(flavorTextFadeTimeout);
                flavorTextFadeTimeout = null;
                interactionUI.style.opacity = '1';
                interactionUI.style.transition = '';
            }
            
            // Reset flavor text index when approaching a new item
            currentFlavorTextIndex = 0;
            currentItemNewlyEncountered = false; // Reset flag
            
            // Show nearby item UI (matches sceneSwitchUI styling)
            const itemName = nearbyItem.userData.name;
            nearbyItemUI.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">${itemName}</div>
            `;
            nearbyItemUI.style.display = 'block';
        } else if (!nearbyItem && !showingItemFlavor) {
            // No nearby item and not showing flavor text - ensure UI is hidden
            nearbyItemUI.style.display = 'none';
        }
    }
};

// Handle item interaction key press
export const handleItemInteractionKey = () => {
    // Don't handle if there's an active conversation
    if (hasActiveConversation()) {
        return;
    }
    
    if (showingItemFlavor && nearbyItem) {
        // Cycle through flavor texts if multiple available
        const flavorTexts = nearbyItem.userData.flavorText;
        
        if (Array.isArray(flavorTexts) && flavorTexts.length > 1) {
            // Cycle to next flavor text
            const previousIndex = currentFlavorTextIndex;
            currentFlavorTextIndex = (currentFlavorTextIndex + 1) % flavorTexts.length;
            
            // If we've cycled back to the first text (index 0), hide the flavor text UI
            if (currentFlavorTextIndex === 0 && previousIndex === flavorTexts.length - 1) {
                // We've cycled through all texts, hide the UI
                showingItemFlavor = false;
                currentFlavorTextIndex = 0;
                currentItemNewlyEncountered = false; // Reset flag
                
                // Start fade out animation
                interactionUI.style.transition = 'opacity 0.5s ease-out';
                interactionUI.style.opacity = '0';
                
                // Hide after fade completes
                flavorTextFadeTimeout = setTimeout(() => {
                    interactionUI.style.display = 'none';
                    interactionUI.style.opacity = '1'; // Reset for next time
                    interactionUI.style.transition = ''; // Reset transition
                    flavorTextFadeTimeout = null;
                }, 500);
                return;
            }
            
            const flavorText = flavorTexts[currentFlavorTextIndex];
            const itemName = nearbyItem.userData.name;
            const itemToAdd = nearbyItem.userData.itemName || itemName;
            
            // Cancel any ongoing fade
            if (flavorTextFadeTimeout) {
                clearTimeout(flavorTextFadeTimeout);
                flavorTextFadeTimeout = null;
                interactionUI.style.opacity = '1';
                interactionUI.style.transition = '';
            }
            
            // Reset border and box shadow to default for flavor text
            interactionUI.style.border = '2px solid #88FFE6';
            interactionUI.style.boxShadow = '0 0 10px rgba(136, 255, 230, 0.5)';
            interactionUI.style.color = '#88FFE6';
            
            // Build the HTML with flavor text and "Got {item}" message if newly encountered
            let htmlContent = `
<!--                <div style="font-weight: bold; margin-bottom: 12px; color: #88FFE6; font-size: 16px; text-transform: uppercase; text-align: center; letter-spacing: 1px;">${itemName}</div> -->
                <div style="color: #CCFFFF; margin-bottom: 0px; line-height: 1.6;">${flavorText}</div>
                ${flavorTexts.length > 1 ? '' : ''}
            `;
            
            // Display "Got {item}" after flavor text if item was newly encountered
            if (currentItemNewlyEncountered) {
                htmlContent += `
                <div style="font-weight: bold; margin-top: 10px; text-align: center; color: #88FF88;">Got ${itemToAdd}</div>
            `;
            }
            
            interactionUI.innerHTML = htmlContent;
            interactionUI.style.opacity = '1';
        } else {
            // If only one flavor text, hide it after showing
            showingItemFlavor = false;
            currentFlavorTextIndex = 0;
            currentItemNewlyEncountered = false; // Reset flag
            
            // Start fade out animation
            interactionUI.style.transition = 'opacity 0.5s ease-out';
            interactionUI.style.opacity = '0';
            
            // Hide after fade completes
            flavorTextFadeTimeout = setTimeout(() => {
                interactionUI.style.display = 'none';
                interactionUI.style.opacity = '1'; // Reset for next time
                interactionUI.style.transition = ''; // Reset transition
                flavorTextFadeTimeout = null;
            }, 500);
        }
    } else if (nearbyItem && !showingItemFlavor) {
        // Show first flavor text - start at index 0
        showingItemFlavor = true;
        currentFlavorTextIndex = 0;
        
        // Hide nearby item UI when showing flavor text
        nearbyItemUI.style.display = 'none';
        
        const itemName = nearbyItem.userData.name;
        // Use itemName if specified, otherwise use the object name
        const itemToAdd = nearbyItem.userData.itemName || itemName;
        
        // Mark item as encountered when player views flavor text
        const encounterResult = markItemEncountered(itemToAdd);
        // Track if this item was newly encountered
        currentItemNewlyEncountered = encounterResult && encounterResult.newlyEncountered;
        
        let flavorText = "You examine the item closely.";
        
        if (nearbyItem.userData.flavorText) {
            if (Array.isArray(nearbyItem.userData.flavorText)) {
                const flavorTexts = nearbyItem.userData.flavorText;
                flavorText = flavorTexts[0]; // Start with first one
            } else {
                // Single string (backward compatibility)
                flavorText = nearbyItem.userData.flavorText;
            }
        }
        
        // Cancel any ongoing fade when showing flavor text
        if (flavorTextFadeTimeout) {
            clearTimeout(flavorTextFadeTimeout);
            flavorTextFadeTimeout = null;
            interactionUI.style.opacity = '1';
            interactionUI.style.transition = '';
        }
        
        const flavorTexts = nearbyItem.userData.flavorText;
        const hasMultipleTexts = Array.isArray(flavorTexts) && flavorTexts.length > 1;
        
        // Reset border and box shadow to default for flavor text
        interactionUI.style.border = '2px solid #88FFE6';
        interactionUI.style.boxShadow = '0 0 10px rgba(136, 255, 230, 0.5)';
        interactionUI.style.color = '#88FFE6';
        
        // Build the HTML with flavor text and "Got {item}" message if newly encountered
        let htmlContent = `
<!--            <div style="font-weight: bold; margin-bottom: 0px; color: #88FFE6; font-size: 16px; text-transform: uppercase; text-align: center; letter-spacing: 1px;">${itemName}</div> -->
            <div style="color: #CCFFFF; margin-bottom: 0px; line-height: 1.8;">${flavorText}</div>
        `;
        
        // Display "Got {item}" after flavor text if item was newly encountered
        if (encounterResult && encounterResult.newlyEncountered) {
            htmlContent += `
            <div style="font-weight: bold; margin-top: 10px; text-align: center; color: #88FF88;">Got ${itemToAdd}</div>
        `;
        }
        
        interactionUI.innerHTML = htmlContent;
        interactionUI.style.display = 'block';
        interactionUI.style.opacity = '1'; // Full opacity when showing flavor text
    }
};

// Export functions
export const getInteractionUI = () => interactionUI;
export const getNearbyNPC = () => nearbyNPC;
export const getNearbyItem = () => nearbyItem;
