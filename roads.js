// roads.js - Road network definitions for unified map
// Horizontal roads: move in X, z fixed per zone (extend to meet connector at x=±170)
// Vertical roads: move in Z, x = -170 or 170

// Shared bounds (street width 356 = ±178)
export const HORIZONTAL_BOUNDS = { xMin: -178, xMax: 178 };
export const VERTICAL_BOUNDS = { zMin: -450, zMax: 450 };
export const CONNECTOR_X = { LEFT: -170, RIGHT: 170 };

export const ROAD_SEGMENTS = {
    // Horizontal zone streets
    PLAZA_STREET: {
        id: 'PLAZA_STREET',
        type: 'horizontal',
        bounds: { xMin: -178, xMax: 178 },
        z: 11,
        zoneOffset: { x: 0, z: 0 },
        laneOffset: 2
    },
    FOREST_STREET: {
        id: 'FOREST_STREET',
        type: 'horizontal',
        bounds: { xMin: -178, xMax: 178 },
        z: 11,
        zoneOffset: { x: 0, z: 333 },
        laneOffset: 2
    },
    POND_STREET: {
        id: 'POND_STREET',
        type: 'horizontal',
        bounds: { xMin: -178, xMax: 178 },
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
