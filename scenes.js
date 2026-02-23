// scenes.js - Scene configuration and management

// Unified map mode: all three outdoor scenes in one continuous world
export const UNIFIED_MAP = true;

// Map mode: suburban (default) or city (Allston-style)
export const CURRENT_MAP_KEY = 'suburbanAdventureMap';
export const getCurrentMap = () => localStorage.getItem(CURRENT_MAP_KEY) || 'suburban';
export const setCurrentMap = (map) => {
    localStorage.setItem(CURRENT_MAP_KEY, map);
};

// Zone offsets for unified map (x, z) - 3x3 grid, 1000x1000 world
export const UNIFIED_MAP_ZONE_OFFSETS = {
    PLAZA: { x: 0, z: 0 },
    FOREST_SUBURBAN: { x: 0, z: 333 },
    POND: { x: 0, z: -333 }
};

// Get world position for arriving at a zone's bus stop (for unified map bus travel)
export const getBusStopArrivalPosition = (zoneKey) => {
    const config = SCENE_CONFIGS[zoneKey];
    const offset = CITY_MAP_ZONE_OFFSETS?.[zoneKey] ?? UNIFIED_MAP_ZONE_OFFSETS[zoneKey] ?? { x: 0, z: 0 };
    if (!config) return { x: 0, y: 2, z: 0 };
    const busStopX = config.ROAD_POSITION_X ? config.ROAD_POSITION_X + 3 : -15;
    return {
        x: offset.x + busStopX,
        y: 2,
        z: offset.z + config.NEAR_SIDEWALK_Z + 3  // A bit back from the bus stop
    };
};

// Fog presets for zones without SCENE_CONFIGS (CARNIVAL, MANSION, RIVER, FOREST_CLEARINGS)
export const FOG_PRESETS = {
    CARNIVAL: { color: 0x2a1a2e, near: 38, far: 250 },
    MANSION: { color: 0x1a2520, near: 32, far: 200 },
    RIVER: { color: 0x1a2230, near: 35, far: 240 },
    FOREST_CLEARINGS: { color: 0x1a2a1e, near: 35, far: 220 }
};

// 9-zone grid for 1000x1000 map - ground tiles + which zones have content
// Left column: Mansion (NW), Hill (W), Forest clearings (SW)
// Right column: River runs through NE, E, SE
export const UNIFIED_MAP_ZONES = [
    { key: 'ZONE_SW', x: -333, z: -333, groundType: 'grass', config: 'FOREST_CLEARINGS' },
    { key: 'PLAZA', x: 0, z: 0, groundType: 'concrete', config: 'PLAZA' },
    { key: 'ZONE_SE', x: 333, z: -333, groundType: 'grass', config: 'RIVER' },
    { key: 'ZONE_W', x: -333, z: 0, groundType: 'grass', config: 'CARNIVAL' },
    { key: 'FOREST_SUBURBAN', x: 0, z: 333, groundType: 'grass', config: 'FOREST_SUBURBAN' },
    { key: 'ZONE_E', x: 333, z: 0, groundType: 'grass', config: 'RIVER' },
    { key: 'ZONE_NW', x: -333, z: 333, groundType: 'grass', config: 'MANSION' },
    { key: 'POND', x: 0, z: -333, groundType: 'grass', config: 'POND' },
    { key: 'ZONE_NE', x: 333, z: 333, groundType: 'grass', config: 'RIVER' }
];

// 9-zone city map (Allston-style) - asphalt/concrete, no grass
export const CITY_MAP_ZONES = [
    { key: 'CITY_NW', x: -333, z: 333, groundType: 'concrete', config: 'TRIPLE_DECKERS' },
    { key: 'CITY_N', x: 0, z: 333, groundType: 'asphalt', config: 'CITY_COMM_AVE' },
    { key: 'CITY_NE', x: 333, z: 333, groundType: 'concrete', config: 'RECORD_STRIP' },
    { key: 'CITY_W', x: -333, z: 0, groundType: 'concrete', config: 'RESIDENTIAL' },
    { key: 'CITY_PLAZA', x: 0, z: 0, groundType: 'asphalt', config: 'CITY_PLAZA' },
    { key: 'CITY_E', x: 333, z: 0, groundType: 'concrete', config: 'FOOD_ROW' },
    { key: 'CITY_SW', x: -333, z: -333, groundType: 'concrete', config: 'URBAN_PARK' },
    { key: 'CITY_S', x: 0, z: -333, groundType: 'asphalt', config: 'CITY_BRIGHTON_AVE' },
    { key: 'CITY_SE', x: 333, z: -333, groundType: 'asphalt', config: 'SUBWAY_ENTRANCE' }
];

export const CITY_MAP_ZONE_OFFSETS = {
    CITY_PLAZA: { x: 0, z: 0 },
    CITY_N: { x: 0, z: 333 },
    CITY_S: { x: 0, z: -333 },
    CITY_SE: { x: 333, z: -333 }
};

// Subway stop positions (world x, z) - used for interaction and arrival spawn
export const SUBWAY_POSITIONS = {
    suburban: { x: 290, z: -333 },
    city: { x: 333, z: -290 }
};

export const getSubwayArrivalPosition = (map) =>
    map === 'city'
        ? { x: SUBWAY_POSITIONS.city.x, y: 2, z: SUBWAY_POSITIONS.city.z + 5 }
        : { x: SUBWAY_POSITIONS.suburban.x, y: 2, z: SUBWAY_POSITIONS.suburban.z + 5 };

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
        PARKING_LOT_Z: 57,  // FAR_SIDEWALK_Z + 3 + 30 + PARKING_BUFFER to avoid overlap
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
        FRONT_IS_PARK: false,
        FOG: { color: 0x1a1a2e, near: 40, far: 280 }
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
        FRONT_IS_PARK: true,
        FOG: { color: 0x1a2a1e, near: 35, far: 220 }
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
        HAUNTED_ATMOSPHERE: true,
        FOG: { color: 0x1a1f2e, near: 25, far: 180 }
    },

    // City map zones (Allston-style)
    CITY_PLAZA: {
        name: "Harvard Ave",
        FRONT_SHOPS_Z: -1,
        NEAR_SIDEWALK_Z: 2,
        STREET_Z: 11,
        FAR_SIDEWALK_Z: 20,
        FAR_BUILDINGS_Z: 24,
        PARKING_LOT_Z: 57,
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
        FRONT_IS_PARK: false,
        URBAN_DENSE: true,
        FOG: { color: 0x1a1a28, near: 30, far: 220 }
    },
    CITY_N: {
        name: "Commonwealth Ave",
        FRONT_SHOPS_Z: -1,
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
        FOREST_ELEMENTS: false,
        SUBURBAN_ELEMENTS: false,
        FEWER_BUILDINGS: false,
        STONE_WALL: false,
        FRONT_IS_PARK: false,
        URBAN_DENSE: true,
        FOG: { color: 0x1a1a28, near: 32, far: 200 }
    },
    CITY_S: {
        name: "Brighton Ave",
        FRONT_SHOPS_Z: -1,
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
        FOREST_ELEMENTS: false,
        SUBURBAN_ELEMENTS: false,
        FEWER_BUILDINGS: false,
        STONE_WALL: false,
        FRONT_IS_PARK: false,
        URBAN_DENSE: true,
        FOG: { color: 0x1a1a28, near: 32, far: 200 }
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

    // City map interiors (zone-specific)
    BODEGA_INTERIOR: { name: "Bodega", IS_INTERIOR: true, INTERIOR_TYPE: 'bodega', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    PHO_INTERIOR: { name: "Pho House", IS_INTERIOR: true, INTERIOR_TYPE: 'pho', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    TATTOO_INTERIOR: { name: "Tattoo Parlor", IS_INTERIOR: true, INTERIOR_TYPE: 'tattoo', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    VINYL_COFFEE_INTERIOR: { name: "Vinyl & Coffee", IS_INTERIOR: true, INTERIOR_TYPE: 'vinyl_coffee', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    DIVE_BAR_INTERIOR: { name: "Dive Bar", IS_INTERIOR: true, INTERIOR_TYPE: 'dive_bar', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    RECORD_STORE_INTERIOR: { name: "Record Store", IS_INTERIOR: true, INTERIOR_TYPE: 'record_store', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    LAUNDROMAT_INTERIOR: { name: "Laundromat", IS_INTERIOR: true, INTERIOR_TYPE: 'laundromat', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    CORNER_CAFE_INTERIOR: { name: "Corner Cafe", IS_INTERIOR: true, INTERIOR_TYPE: 'corner_cafe', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    BOOKSHOP_INTERIOR: { name: "Bookshop", IS_INTERIOR: true, INTERIOR_TYPE: 'bookshop', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    ARCADE_BAR_INTERIOR: { name: "Arcade Bar", IS_INTERIOR: true, INTERIOR_TYPE: 'arcade_bar', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    SUSHI_INTERIOR: { name: "Sushi Spot", IS_INTERIOR: true, INTERIOR_TYPE: 'sushi', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    VINTAGE_INTERIOR: { name: "Vintage Threads", IS_INTERIOR: true, INTERIOR_TYPE: 'vintage', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    BUBBLE_TEA_INTERIOR: { name: "Bubble Tea", IS_INTERIOR: true, INTERIOR_TYPE: 'bubble_tea', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },
    SMOKE_SHOP_INTERIOR: { name: "Smoke Shop", IS_INTERIOR: true, INTERIOR_TYPE: 'smoke_shop', CAMERA_START_Z: 0, CAMERA_TARGET_Z: 0, EXIT_PORTAL_POSITION: { x: 0, z: 0 } },

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

// Building style -> interior scene mapping (used when entering doors)
export const BUILDING_PORTAL_MAP = {
    groton_church: { key: 'CHURCH_INTERIOR', name: 'Church Interior' },
    groton_townhall: { key: 'TOWNHALL_INTERIOR', name: 'Town Hall Interior' },
    groton_colonial: { key: 'HOUSE_INTERIOR', name: 'Colonial House Interior' },
    graveyard: { key: 'GRAVEYARD_INTERIOR', name: 'Graveyard' },
    hospital: { key: 'HOSPITAL_INTERIOR', name: 'Hospital Interior' },
    modern: { key: 'MODERN_INTERIOR', name: 'Modern Building Interior' },
    brick: { key: 'BRICK_INTERIOR', name: 'Brick Building Interior' },
    shop: { key: 'SHOP_INTERIOR', name: 'Shop Interior' },
    industrial: { key: 'INDUSTRIAL_INTERIOR', name: 'Industrial Building Interior' },
    convenience: { key: 'CUMBYS_INTERIOR', name: "Grumby's Store" },
    pizza: { key: 'GROHOS_INTERIOR', name: 'Grohos Pizza' },
    clothing: { key: 'CLOTHING_STORE_INTERIOR', name: 'Clothing Store' },
    drycleaner: { key: 'DRYCLEANER_INTERIOR', name: 'Dry Cleaners' },
    coffee: { key: 'DUNKIN_INTERIOR', name: 'Donut Galaxy' },
    flowers: { key: 'FLOWER_SHOP_INTERIOR', name: 'Flower Shop' },
    // City map shops
    bodega: { key: 'BODEGA_INTERIOR', name: 'Bodega' },
    pho: { key: 'PHO_INTERIOR', name: 'Pho House' },
    tattoo: { key: 'TATTOO_INTERIOR', name: 'Tattoo Parlor' },
    vinyl_coffee: { key: 'VINYL_COFFEE_INTERIOR', name: 'Vinyl & Coffee' },
    dive_bar: { key: 'DIVE_BAR_INTERIOR', name: 'Dive Bar' },
    record_store: { key: 'RECORD_STORE_INTERIOR', name: 'Record Store' },
    laundromat: { key: 'LAUNDROMAT_INTERIOR', name: 'Laundromat' },
    corner_cafe: { key: 'CORNER_CAFE_INTERIOR', name: 'Corner Cafe' },
    bookshop: { key: 'BOOKSHOP_INTERIOR', name: 'Bookshop' },
    arcade_bar: { key: 'ARCADE_BAR_INTERIOR', name: 'Arcade Bar' },
    sushi: { key: 'SUSHI_INTERIOR', name: 'Sushi Spot' },
    vintage: { key: 'VINTAGE_INTERIOR', name: 'Vintage Threads' },
    bubble_tea: { key: 'BUBBLE_TEA_INTERIOR', name: 'Bubble Tea' },
    smoke_shop: { key: 'SMOKE_SHOP_INTERIOR', name: 'Smoke Shop' }
};

export const getBuildingPortalDestination = (buildingStyle) =>
    BUILDING_PORTAL_MAP[buildingStyle] || { key: 'PLAZA', name: 'Downtown' };

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
