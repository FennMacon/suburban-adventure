// world/constants.js - Ground layers, dimensions, and shared world config

/**
 * Ground layer Y positions (top-down: higher Y = closer to camera when looking down).
 * Gaps of 0.03-0.06 prevent z-fighting.
 */
export const GROUND_LAYERS = {
    base: -0.25,      // Grass/concrete base
    concrete: -0.18,  // Sidewalks
    asphalt: -0.12,   // Streets, connector roads
    parking: -0.15,   // Parking lot
    markings: -0.10,  // Road lines (yellow/white)
    sidewalkLines: -0.17,
    parkingLines: -0.14
};

/** Ground colors by type for 1000x1000 unified map */
export const GROUND_COLORS = {
    concrete: 0x555555,
    grass: 0x2a5a2a,
    grass_forest: 0x228B22,
    grass_pond: 0x1B4D3E,
    grass_mansion: 0x2d6b2d,
    grass_hill: 0x225522
};

/** Zone tile size for unified map */
export const ZONE_SIZE = 340;

/** Street and road dimensions */
export const STREET_WIDTH = 356;   // Extends to ±178 to meet connector roads
export const STREET_DEPTH = 12;
export const SIDEWALK_WIDTH = 356;
export const SIDEWALK_DEPTH = 6;
export const PARKING_WIDTH = 356;
export const PARKING_DEPTH = 60;
/** Gap between far sidewalk and parking lot to prevent overlap/z-fighting */
export const PARKING_BUFFER = 4;

/** Connector road dimensions */
export const CONNECTOR_ROAD_WIDTH = 12;
export const CONNECTOR_ROAD_LENGTH = 1000;
export const CONNECTOR_SIDEWALK_DEPTH = 6;  // Matches zone sidewalk depth
export const CONNECTOR_CORRIDOR_WIDTH = 24;  // 6 + 12 + 6 (sidewalk | road | sidewalk)
export const JUNCTION_WIDTH = 24;
export const JUNCTION_DEPTH = 24;  // 24x24 for proper intersection fill
