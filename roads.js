// roads.js - Road network definitions for unified map
// Horizontal roads: move in X, z fixed per zone
// Vertical roads: move in Z, x = -170 or 170

// Zone street extent (PLAZA, FOREST, POND) - single source of truth for street length
// Edit these to change how far the streets extend in X
export const ZONE_STREET_X_MIN = -165// 150 + 15 for connector
export const ZONE_STREET_X_MAX = 165; // 150 + 15 for connector
export const ZONE_STREET_WIDTH = ZONE_STREET_X_MAX - ZONE_STREET_X_MIN;

export const HORIZONTAL_BOUNDS = { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX };
export const VERTICAL_BOUNDS = { zMin: -500, zMax: 500 };
export const CONNECTOR_X = { LEFT: -170, RIGHT: 170 };

export const ROAD_SEGMENTS = {
    // Horizontal zone streets
    PLAZA_STREET: {
        id: 'PLAZA_STREET',
        type: 'horizontal',
        bounds: { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX },
        z: 11,
        zoneOffset: { x: 0, z: 0 },
        laneOffset: 2
    },
    FOREST_STREET: {
        id: 'FOREST_STREET',
        type: 'horizontal',
        bounds: { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX },
        z: 11,
        zoneOffset: { x: 0, z: 333 },
        laneOffset: 2
    },
    POND_STREET: {
        id: 'POND_STREET',
        type: 'horizontal',
        bounds: { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX },
        z: 11,
        zoneOffset: { x: 0, z: -333 },
        laneOffset: 2
    },
    // Vertical connector roads
    LEFT_CONNECTOR: {
        id: 'LEFT_CONNECTOR',
        type: 'vertical',
        x: -170,
        bounds: { zMin: -450, zMax: 450 },
        laneOffset: 2
    },
    RIGHT_CONNECTOR: {
        id: 'RIGHT_CONNECTOR',
        type: 'vertical',
        x: 170,
        bounds: { zMin: -450, zMax: 450 },
        laneOffset: 2
    }
};
