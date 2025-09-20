// npcs.js - NPC creation and management
import * as THREE from 'three';
import { createWireframeMaterial } from './utils.js';
import { startConversation, getCurrentDialogue, advanceConversation, hasActiveConversation, endConversation } from './dialogue.js';

// Create NPCs for the scene
export const createNPCs = (PLAZA_CONFIG, CURRENT_SCENE, scene) => {
    const npcs = [];
    
    // Create wireframe people representation (using the style from the original)
    const createNPC = (name, x, z, color = 0xFF6B9D, y = 0) => {
        const npcGroup = new THREE.Group();
        
        // Simple wireframe figure representing a person (cylindrical body)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.6, 6);
        const bodyMaterial = createWireframeMaterial(color);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        npcGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 6, 4);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.85;
        npcGroup.add(head);
        
        // Add interaction area (completely invisible - no mesh needed)
        // Just store the interaction data on the NPC group itself
        npcGroup.userData.isInteractable = true;
        npcGroup.userData.npcName = name;
        npcGroup.userData.hasConversation = true;
        npcGroup.userData.interactionRadius = 2; // Store radius for distance checking
        
        npcGroup.position.set(x, y, z);
        npcGroup.userData.name = name;
        npcGroup.userData.isNPC = true;
        
        scene.add(npcGroup);
        return npcGroup;
    };
    
    if (CURRENT_SCENE === 'PLAZA') {
        // Massachusetts Plaza positioning
        npcs.push(createNPC('Maya', -20, PLAZA_CONFIG.NEAR_SIDEWALK_Z, 0xFF6B9D)); // Pink
        npcs.push(createNPC('Jake', 15, PLAZA_CONFIG.NEAR_SIDEWALK_Z, 0x9D6BFF)); // Purple
        
        // Pizza guy behind the counter (interior NPC)
        npcs.push(createNPC('Tony', 0, -13.5, 0xFF6B6B)); // Red
        
        // Group conversations - position NPCs close together
        npcs.push(createNPC('Alex', -10, PLAZA_CONFIG.PARKING_LOT_Z, 0x6BFF9D)); // Green
        npcs.push(createNPC('Sam', -8, PLAZA_CONFIG.PARKING_LOT_Z, 0x6BFFFF)); // Cyan
        
        npcs.push(createNPC('Jordan', 25, PLAZA_CONFIG.PARKING_LOT_Z - 5, 0xFFFF6B)); // Yellow
        npcs.push(createNPC('Riley', 27, PLAZA_CONFIG.PARKING_LOT_Z - 5, 0xFF9D6B)); // Orange
    } else {
        // Witchy guy in the gazebo
        npcs.push(createNPC('Morgan', 0, -26, 0x8B008B, .25)); // Dark purple guy, elevated on gazebo platform
        // Forest Suburban positioning
        npcs.push(createNPC('Maya', -25, PLAZA_CONFIG.NEAR_SIDEWALK_Z + 1, 0xFF6B9D)); // Pink
        npcs.push(createNPC('Jake', 20, PLAZA_CONFIG.NEAR_SIDEWALK_Z + 1, 0x9D6BFF)); // Purple
        
        // Group conversations - by the stone wall area
        const wallZ = (PLAZA_CONFIG.FAR_SIDEWALK_Z + PLAZA_CONFIG.FAR_BUILDINGS_Z) / 2;
        npcs.push(createNPC('Alex', -15, wallZ - 2, 0x6BFF9D)); // Green
        npcs.push(createNPC('Sam', -13, wallZ - 2, 0x6BFFFF)); // Cyan
        
        npcs.push(createNPC('Jordan', 10, wallZ + 2, 0xFFFF6B)); // Yellow
        npcs.push(createNPC('Riley', 12, wallZ + 2, 0xFF9D6B)); // Orange
    }
    
    return npcs;
};

// Global variables for NPC interaction
let nearbyNPC = null;
let interactionUI = null;

// Initialize interaction UI
export const initializeNPCInteraction = () => {
    // Create interaction UI
    interactionUI = document.createElement('div');
    interactionUI.style.position = 'fixed';
    interactionUI.style.top = '50%';
    interactionUI.style.left = '50%';
    interactionUI.style.transform = 'translate(-50%, -50%)';
    interactionUI.style.color = 'white';
    interactionUI.style.fontFamily = 'Arial, sans-serif';
    interactionUI.style.fontSize = '16px';
    interactionUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    interactionUI.style.padding = '20px';
    interactionUI.style.borderRadius = '10px';
    interactionUI.style.display = 'none';
    interactionUI.style.zIndex = '1000';
    interactionUI.style.maxWidth = '400px';
    interactionUI.style.textAlign = 'center';
    document.body.appendChild(interactionUI);
};

// Check for nearby NPCs
export const checkNearbyNPCs = (camera, npcs) => {
    const cameraPosition = camera.position;
    let closestNPC = null;
    let closestDistance = Infinity;
    
    if (npcs) {
        npcs.forEach(npc => {
            const npcPosition = npc.position;
            const distance = cameraPosition.distanceTo(npcPosition);
            
            if (distance < 3 && distance < closestDistance) { // Within 3 units
                closestNPC = npc;
                closestDistance = distance;
            }
        });
    }
    
    nearbyNPC = closestNPC;
    
    // Update UI
    if (nearbyNPC && !hasActiveConversation()) {
        interactionUI.innerHTML = `
            <div style="margin-bottom: 10px;">💬</div>
            <div style="font-weight: bold; margin-bottom: 10px;">${nearbyNPC.userData.name}</div>
            <div style="font-size: 14px;">Press 'E' to talk</div>
        `;
        interactionUI.style.display = 'block';
    } else if (!hasActiveConversation()) {
        interactionUI.style.display = 'none';
    }
};

// Handle conversation interaction
export const handleConversationInteraction = (CURRENT_SCENE) => {
    if (hasActiveConversation()) {
        // Continue ongoing conversation
        const stillActive = advanceConversation();
        if (stillActive) {
            showDialogueStep();
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
            showDialogueStep();
        }
    }
};

// Show current dialogue step
const showDialogueStep = () => {
    const currentLine = getCurrentDialogue();
    if (!currentLine) {
        interactionUI.style.display = 'none';
        return;
    }
    
    const isLastLine = !hasActiveConversation(); // This will be true after advancing if it was the last line
    
    interactionUI.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: ${currentLine.speaker === 'Player' ? '#88AAFF' : '#FFFFFF'};">
            ${currentLine.speaker}:
        </div>
        <div style="margin-bottom: 15px;">"${currentLine.text}"</div>
        <div style="font-size: 12px; color: #CCCCCC;">
            ${isLastLine ? 'Press E to finish...' : 'Press E to continue...'}
        </div>
    `;
    interactionUI.style.display = 'block';
};
