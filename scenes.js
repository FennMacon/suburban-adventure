// scenes.js - Scene configuration and management

// Scene configurations for different environments
export const SCENE_CONFIGS = {
    // Original plaza scene (current saved state)
    PLAZA: {
        name: "Massachusetts Plaza",
        FRONT_SHOPS_Z: -1,
        NEAR_SIDEWALK_Z: 2,
        STREET_Z: 11,
        FAR_SIDEWALK_Z: 20,
        FAR_BUILDINGS_Z: 24,
        PARKING_LOT_Z: 53,
        CAMERA_START_Z: 21,
        CAMERA_TARGET_Z: 11,
        SHOP_ROW_START_X: -60,
        KARAOKE_BAR_X: 0,
        SHOP_HEIGHT: 4.5,
        SHOP_DEPTH: 12,
        NEAR_SIDEWALK_ELEMENTS: true,
        STREET_ELEMENTS: true,
        FAR_SIDEWALK_ELEMENTS: true,
        FOREST_ELEMENTS: false,
        SUBURBAN_ELEMENTS: false,
        FEWER_BUILDINGS: false,
        STONE_WALL: false,
        FRONT_IS_PARK: false
    },

    // Forest-surrounded suburban scene
    FOREST_SUBURBAN: {
        name: "Forest Suburban Plaza",
        FRONT_SHOPS_Z: -4,
        NEAR_SIDEWALK_Z: 2,
        STREET_Z: 11,
        FAR_SIDEWALK_Z: 20,
        FAR_BUILDINGS_Z: 35,
        PARKING_LOT_Z: 65,
        CAMERA_START_Z: 30,
        CAMERA_TARGET_Z: 11,
        SHOP_ROW_START_X: -60,
        KARAOKE_BAR_X: 0,
        SHOP_HEIGHT: 4.5,
        SHOP_DEPTH: 12,
        NEAR_SIDEWALK_ELEMENTS: true,
        STREET_ELEMENTS: true,
        FAR_SIDEWALK_ELEMENTS: true,
        FOREST_ELEMENTS: true,
        SUBURBAN_ELEMENTS: true,
        FEWER_BUILDINGS: true,
        STONE_WALL: true,
        FRONT_IS_PARK: true
    },

    // Deep woods pond scene - post-party campfire vibes
    POND: {
        name: "Deep Woods Pond",
        FRONT_SHOPS_Z: -50,
        NEAR_SIDEWALK_Z: 2,
        STREET_Z: 11,
        FAR_SIDEWALK_Z: 20,
        FAR_BUILDINGS_Z: -80,
        PARKING_LOT_Z: 65,
        CAMERA_START_Z: 30,
        CAMERA_TARGET_Z: -20,
        SHOP_ROW_START_X: -60,
        KARAOKE_BAR_X: 0,
        SHOP_HEIGHT: 4.5,
        SHOP_DEPTH: 12,
        ROAD_POSITION_X: -100,      // Move road to left side
        NEAR_SIDEWALK_ELEMENTS: false,
        STREET_ELEMENTS: true,
        FAR_SIDEWALK_ELEMENTS: false,
        FOREST_ELEMENTS: true,
        SUBURBAN_ELEMENTS: false,
        FEWER_BUILDINGS: false,
        STONE_WALL: false,
        FRONT_IS_PARK: false,
        FRONT_IS_POND: true,        // Pond scene specific
        CAMPFIRE_ELEMENTS: true,
        POND_ELEMENTS: true,
        HAUNTED_ATMOSPHERE: true
    },

    // Interior scenes - shop interiors
    CUMBYS_INTERIOR: {
        name: "Grumby's",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'convenience',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    GROHOS_INTERIOR: {
        name: "Grohos Pizza",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'pizza',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    CLOTHING_STORE_INTERIOR: {
        name: "Clothing Store",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'clothing',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    DRYCLEANER_INTERIOR: {
        name: "Dry Cleaners",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'drycleaner',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    DUNKIN_INTERIOR: {
        name: "Donut Galaxy",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'coffee',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    FLOWER_SHOP_INTERIOR: {
        name: "Flower Shop",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'flowers',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },

    // Interior scenes - far building interiors
    CHURCH_INTERIOR: {
        name: "Church Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'groton_church',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    TOWNHALL_INTERIOR: {
        name: "Town Hall Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'groton_townhall',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    HOUSE_INTERIOR: {
        name: "Colonial House Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'groton_colonial',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    GRAVEYARD_INTERIOR: {
        name: "Graveyard",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'graveyard',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    HOSPITAL_INTERIOR: {
        name: "Hospital Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'hospital',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    MODERN_INTERIOR: {
        name: "Modern Building Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'modern',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    BRICK_INTERIOR: {
        name: "Brick Building Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'brick',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    SHOP_INTERIOR: {
        name: "Shop Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'shop',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    },
    INDUSTRIAL_INTERIOR: {
        name: "Industrial Building Interior",
        IS_INTERIOR: true,
        INTERIOR_TYPE: 'industrial',
        CAMERA_START_Z: 0,
        CAMERA_TARGET_Z: 0,
        EXIT_PORTAL_POSITION: { x: 0, z: 0 }
    }
};

// Function to switch scenes
export const switchScene = (sceneName, camera, yaw) => {
    if (SCENE_CONFIGS[sceneName]) {
        const CURRENT_SCENE = sceneName;
        const PLAZA_CONFIG = SCENE_CONFIGS[sceneName];
        
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

// Function to get current scene from localStorage
export const getCurrentScene = () => {
    return localStorage.getItem('suburbanAdventureScene') || 'PLAZA';
};

// Function to get plaza config for current scene
export const getPlazaConfig = (sceneName) => {
    return SCENE_CONFIGS[sceneName] || SCENE_CONFIGS.PLAZA;
};

// Function to check if camera should rotate 180° on scene load
export const shouldRotate180OnLoad = () => {
    const savedBusStopPosition = localStorage.getItem('busStopCameraPosition');
    if (savedBusStopPosition) {
        localStorage.removeItem('busStopCameraPosition');
        return true;
    }
    return false;
};

// Tree types for forest scenes
export const NEW_ENGLAND_TREES = {
    EASTERN_WHITE_PINE: {
        trunkColor: 0x8B4513,
        foliageColor: 0x228B22, 
        heightMultiplier: 1.4,
        widthMultiplier: 0.7,
        layerCount: 5,
        shape: 'conical'
    },
    RED_MAPLE: {
        trunkColor: 0x696969,
        foliageColor: 0xFF4500,
        heightMultiplier: 1.1,
        widthMultiplier: 1.2,
        layerCount: 3,
        shape: 'rounded'
    },
    NORTHERN_RED_OAK: {
        trunkColor: 0x654321,
        foliageColor: 0x8B4513,
        heightMultiplier: 1.3,
        widthMultiplier: 1.3,
        layerCount: 4,
        shape: 'broad'
    },
    EASTERN_HEMLOCK: {
        trunkColor: 0x8B4513,
        foliageColor: 0x2F4F4F,
        heightMultiplier: 1.2,
        widthMultiplier: 0.8,
        layerCount: 6,
        shape: 'drooping'
    },
    RED_PINE: {
        trunkColor: 0xA0522D,
        foliageColor: 0x228B22,
        heightMultiplier: 1.3,
        widthMultiplier: 0.6,
        layerCount: 4,
        shape: 'tall_conical'
    },
    AMERICAN_BEECH: {
        trunkColor: 0xD2B48C,
        foliageColor: 0xDAA520,
        heightMultiplier: 1.0,
        widthMultiplier: 1.4,
        layerCount: 3,
        shape: 'dome'
    }
};

// Function to select random tree type
export const selectTreeType = () => {
    const treeTypes = Object.keys(NEW_ENGLAND_TREES);
    return treeTypes[Math.floor(Math.random() * treeTypes.length)];
};
