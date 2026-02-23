// fog.js - PS2-style zone-based area fog
import * as THREE from 'three';
import { SCENE_CONFIGS, FOG_PRESETS, UNIFIED_MAP_ZONES, UNIFIED_MAP, getCurrentMap, CITY_MAP_ZONES } from './scenes.js';

const BLEND_RADIUS = 90; // Distance within which to blend between zones

/** Urban fog preset for city zones without SCENE_CONFIGS */
const CITY_FOG_PRESETS = {
    TRIPLE_DECKERS: { color: 0x1a1a28, near: 32, far: 200 },
    RECORD_STRIP: { color: 0x1a1a28, near: 30, far: 210 },
    RESIDENTIAL: { color: 0x1a1a28, near: 32, far: 200 },
    FOOD_ROW: { color: 0x1a1a28, near: 30, far: 210 },
    URBAN_PARK: { color: 0x1a1a2a, near: 35, far: 220 },
    SUBWAY_ENTRANCE: { color: 0x1a1a28, near: 30, far: 200 }
};

/** Get fog config for a zone. Uses SCENE_CONFIGS.FOG for populated zones, FOG_PRESETS for others. */
export const getFogConfigForZone = (zoneKey, configKey) => {
    const sceneConfig = SCENE_CONFIGS[zoneKey];
    if (sceneConfig?.FOG) return sceneConfig.FOG;
    const preset = FOG_PRESETS[configKey] ?? CITY_FOG_PRESETS?.[configKey];
    if (preset) return preset;
    return SCENE_CONFIGS.PLAZA.FOG;
};

/** Blend two fog configs by weight t (0 = a, 1 = b) */
const blendFogConfigs = (a, b, t) => {
    const tr = Math.max(0, Math.min(1, t));
    const rA = (a.color >> 16) & 255;
    const gA = (a.color >> 8) & 255;
    const bA = a.color & 255;
    const rB = (b.color >> 16) & 255;
    const gB = (b.color >> 8) & 255;
    const bB = b.color & 255;
    return {
        color: (Math.round(rA + (rB - rA) * tr) << 16) |
               (Math.round(gA + (gB - gA) * tr) << 8) |
               Math.round(bA + (bB - bA) * tr),
        near: a.near + (b.near - a.near) * tr,
        far: a.far + (b.far - a.far) * tr
    };
};

/** Update scene fog based on camera position (unified map only). Blends between nearest zones. */
export const updateZoneFog = (scene, camera, streetElements, isInterior) => {
    if (isInterior || !streetElements?.zoneRootGroups) return;
    const isCity = getCurrentMap() === 'city';
    if (!UNIFIED_MAP && !isCity) return;
    if (!scene.fog) scene.fog = new THREE.Fog(0x1a1a2e, 40, 280);

    const camX = camera.position.x;
    const camZ = camera.position.z;
    const zones = isCity ? CITY_MAP_ZONES : UNIFIED_MAP_ZONES;

    // Build list of zones with world positions
    const zonesWithDist = zones.map((zone) => {
        const dx = camX - zone.x;
        const dz = camZ - zone.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return { ...zone, dist };
    }).sort((a, b) => a.dist - b.dist);

    const nearest = zonesWithDist[0];
    const second = zonesWithDist[1];
    const d1 = nearest.dist;
    const d2 = second?.dist ?? d1 + 1;

    const cfg1 = getFogConfigForZone(nearest.key, nearest.config);
    let targetConfig = cfg1;

    // Blend with second zone when within BLEND_RADIUS of boundary (50/50 at edge)
    if (second && d1 < BLEND_RADIUS) {
        const cfg2 = getFogConfigForZone(second.key, second.config);
        const blendT = 0.5 * (d1 / BLEND_RADIUS);
        targetConfig = blendFogConfigs(cfg1, cfg2, blendT);
    }

    scene.fog.color.setHex(targetConfig.color);
    scene.fog.near = targetConfig.near;
    scene.fog.far = targetConfig.far;
};

/** Sync ground fog plane color to current scene fog. */
export const updateGroundFog = (scene) => {
    const fogPlane = scene.getObjectByName('GroundFog');
    if (!fogPlane?.material || !scene.fog) return;
    const fogColor = scene.fog.color.getHex();
    fogPlane.material.color.setHex(fogColor);
};
