# Suburban Adventure — Refactor Plan & Suggestions

Goals: simpler structure, easier navigation, clearer separation of concerns, with room for richer features later.

---

## Summary of Issues

| Issue | Impact |
|-------|--------|
| main.js 3163 lines | Hard to navigate, changes are risky |
| createZoneScene ~2100 lines inline | Zone logic is opaque and hard to test |
| buildings.js 6056 lines | Interiors could be modular |
| streetElements god object | Unclear contract, 30+ properties |
| Portal mapping in main.js | Config scattered |
| roads.js unused | Dead code |
| 11 script tags in index.html | Fragile load order |
| Legacy files in root | Clutter |

---

## Completed Refactors (Feb 2026)

- **Portal map** — `BUILDING_PORTAL_MAP` and `getBuildingPortalDestination` moved to scenes.js
- **Single entry script** — index.html loads only main.js; dependencies via imports
- **Legacy files archived** — oldmain.js, main-refactored.js, main.js.old, REORGANIZATION_*.md, NEXT_STEPS.md → `archive/`
- **roads.js wired up** — `HORIZONTAL_BOUNDS`, `VERTICAL_BOUNDS`, `CONNECTOR_X` used in main.js and animation.js
- **Zone scene extraction** — `createZoneScene`, `createUnifiedMapGround`, `createConnectorRoads`, `createConnectorVehicles`, `createForestElements`, `createPondForestElements`, `createStoneWall`, `createSuburbanElements` moved to `world/zone-scene.js`; main.js imports and calls `createZoneScene(scene, config, offset, key)`
- **World constants** — `world/constants.js` with `GROUND_LAYERS`, `GROUND_COLORS`, `ZONE_SIZE`, street/connector road dimensions
- **Interior registry** — `INTERIOR_REGISTRY` in buildings.js maps scene keys to `{ create(scene), dimensions }`; main.js uses registry lookup instead of switch

---

## Phase 1: Quick Wins (Low Risk)

### 1.1 Consolidate portal mapping into scenes

**Current**: `getBuildingPortalDestination` inline in main.js (building style → interior key)

**Change**: Add to scenes.js:

```javascript
export const BUILDING_PORTAL_MAP = {
    groton_church: { key: 'CHURCH_INTERIOR', name: 'Church Interior' },
    // ... etc
};
```

**Benefit**: Single source of truth, easier to add buildings.

---

### 1.2 Single entry script

**Current**: index.html loads 11 modules; main.js must load last.

**Change**: One entry point:

```html
<script type="module" src="main.js"></script>
```

main.js imports all dependencies. Ensures correct load order.

---

### 1.3 Archive legacy files

**Change**: Move to `archive/`:

- oldmain.js
- main-refactored.js
- main.js.old
- REORGANIZATION_COMPLETE.md
- REORGANIZATION_STATUS.md
- NEXT_STEPS.md

**Benefit**: Cleaner root.

---

### 1.4 Wire up roads.js or remove

**Current**: ROAD_SEGMENTS exported but never imported.

**Options**:

- **A**: Use ROAD_SEGMENTS in animation.js and main.js for bounds/constants (replace magic numbers)
- **B**: Remove roads.js and keep constants where they’re used

**Recommendation**: A — centralize road definitions.

---

## Phase 2: Extract Zone Scene (Medium Risk)

### 2.1 New `world/zone-scene.js`

**Extract from main.js**:

- createZoneScene
- createUnifiedMapGround
- createConnectorRoads
- createConnectorVehicles
- createForestElements
- createPondForestElements
- createStoneWall
- createSuburbanElements
- GROUND_COLORS

**Exports**:

```javascript
export { createZoneScene, createUnifiedMapGround, createConnectorRoads, createConnectorVehicles };
```

**Dependencies**: three, utils, buildings, scenes. main.js calls these and wires results.

**Benefit**: main.js shrinks to ~1000 lines; zone logic is isolated.

---

### 2.2 New `world/constants.js`

**Move from main.js / zone-scene**:

- GROUND_COLORS
- Ground layer Y values (e.g. GROUND_LAYERS = { base: -0.25, concrete: -0.18, asphalt: -0.12, markings: -0.10 })
- Street/sidewalk dimensions (356, 12, 6, etc.)

**Benefit**: Shared constants, easier tuning.

---

## Phase 3: Simplify streetElements (Medium Risk)

### 3.1 Typed / documented structure

**Current**: Plain object with many ad-hoc properties.

**Change**: Add a factory and JSDoc:

```javascript
// world/street-elements.js
/** @typedef {Object} StreetElements
 * @property {THREE.Group} zoneRootGroup
 * @property {THREE.Group} streetElementsGroup
 * @property {THREE.Mesh[]} cars
 * @property {THREE.Group[]} buses
 * @property {Object[]} buildingPortals
 * @property {Object[]} npcs
 * ... */

export function createStreetElements(initial = {}) {
    return { ...DEFAULTS, ...initial };
}
```

**Benefit**: Clear contract, fewer surprises.

---

### 3.2 Optional: Zone class

For future work, zones could be explicit:

```javascript
class Zone {
    constructor(config, offset, key) {
        this.config = config;
        this.offset = offset;
        this.key = key;
        this.root = new THREE.Group();
        this.streetElements = {};
    }
    build(scene) { /* createZoneScene logic */ }
}
```

**Benefit**: Encapsulation, easier to add per-zone behavior. Not required for Phase 3.

---

## Phase 4: Split buildings.js (Lower Priority)

### 4.1 Interior modules

**Current**: 10+ interiors in one file (createCumbysInterior, createChurchInterior, etc.).

**Change**: `buildings/interiors/`:

- `index.js` — re-exports, INTERIOR_TARGET_SIZE
- `cumbys.js`
- `church.js`
- `townhall.js`
- … etc.

`buildings.js` keeps facades, park, pond, createInteriorScene (delegates to interiors).

**Benefit**: Smaller files, easier to add new interiors.

---

### 4.2 Shared interior pieces

Extract common interior pieces:

- `createInteriorBounds`
- `createInteriorWalls`
- `createInteriorDoor`
- `compressInteriorToBounds`

**Benefit**: Less duplication, consistent behavior.

---

## Phase 5: Future Enhancements (Post-refactor)

### 5.1 Countdown system

From STORY_OUTLINE: “Track the demolition countdown in UI.”

- Add `gameState.daysRemaining` (or similar)
- Dialogue and UI read from gameState
- Optional: visual decay or UI countdown

---

### 5.2 Song / playlist system

- Central `songs.js` or `playlist.js` for unlocked songs
- Simple UI for “Last Night at the Plaza” playlist
- Hook into existing `unlockCurrentSong` / `getUnlockedSongs`

---

### 5.3 Scene / zone registry

Replace scattered switches with a registry:

```javascript
const INTERIOR_REGISTRY = {
    CUMBYS_INTERIOR: createCumbysInterior,
    CHURCH_INTERIOR: createChurchInterior,
    // ...
};
```

**Benefit**: Adding interiors = add one line.

---

### 5.4 Event bus (optional)

For loose coupling between NPCs, UI, and game state:

```javascript
events.on('songUnlocked', (song) => { /* update UI, trigger effects */ });
events.on('enteredZone', (zone) => { /* … */ });
```

**Benefit**: Easier to add features without threading state through many modules.

---

## Suggested Implementation Order

1. Phase 1.1 — Portal map in scenes.js
2. Phase 1.2 — Single entry script
3. Phase 1.3 — Archive legacy files
4. Phase 1.4 — Use roads.js for bounds
5. Phase 2.1 — Extract zone-scene.js
6. Phase 2.2 — world/constants.js
7. Phase 3.1 — Document streetElements (JSDoc / factory)
8. Phase 4 — Only if adding many interiors or touching buildings heavily

---

## File Layout (Proposed)

```
suburban-adventure/
├── index.html
├── main.js                 # Slim orchestrator
├── docs/
│   ├── PROJECT_MAP.md
│   └── REFACTOR_PLAN.md
├── world/
│   ├── constants.js        # Ground layers, dimensions
│   ├── zone-scene.js       # createZoneScene, ground, roads
│   └── (optional) street-elements.js
├── config/
│   └── (optional) portals.js
├── archive/                # Legacy files
├── buildings.js            # Or buildings/ if split
├── buildings/
│   └── interiors/         # If splitting interiors
├── animation.js
├── controls.js
├── dialogue.js
├── npcs.js
├── scenes.js
├── skybox.js
├── nightsky.js
├── renderer.js
├── phone-ui.js
├── utils.js
└── roads.js
```

---

## Checklist Before Refactoring

- [ ] Ensure all tests pass (if any)
- [ ] Manual smoke test: unified map, interiors, bus stop, portals
- [ ] Commit current state
- [ ] Apply changes in small commits per phase
