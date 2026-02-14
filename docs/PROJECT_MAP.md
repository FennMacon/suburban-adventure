# Suburban Adventure — Project Architecture Map

A Three.js exploration game where the player reconnects with friends, collects sounds for a farewell album, and preserves memories of a plaza scheduled for demolition.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          index.html (entry)                               │
│  Loads 11 modules in sequence; main.js bootstraps the app                │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  main.js (~3163 lines) — Orchestrator                                   │
│  • Scene setup, fog, debug overlay                                       │
│  • createUnifiedMapGround, createConnectorRoads, createConnectorVehicles  │
│  • createZoneScene (~2100 lines inline) — streets, sidewalks, buildings,  │
│    karaoke bar, bus, cars, forest, pond, park, far buildings             │
│  • Scene switch logic, portal handling, keydown handlers                  │
│  • Merges zone results for unified map                                    │
└─────────────────────────────────────────────────────────────────────────┘
        │                    │                    │                    │
        ▼                    ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  buildings   │  │  scenes      │  │  npcs        │  │  controls    │
│  6056 lines  │  │  332 lines   │  │  1045 lines  │  │  395 lines   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                    │                    │                    │
        ▼                    ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  animation   │  │  dialogue    │  │  skybox      │  │  nightsky    │
│  777 lines   │  │  580 lines   │  │  429 lines   │  │  400 lines   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                    │                    │                    │
        ▼                    ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  renderer    │  │  phone-ui    │  │  utils       │  │  roads       │
│  141 lines   │  │  397 lines   │  │  278 lines   │  │  46 lines    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Module Dependencies

| Module      | Imports From                         | Exports / Role                                      |
|------------|--------------------------------------|-----------------------------------------------------|
| main.js    | All modules                          | Bootstraps app, scene creation, event wiring        |
| buildings  | utils                                | Facades, interiors, park, pond, glowing materials   |
| scenes     | —                                    | SCENE_CONFIGS, UNIFIED_MAP, zones, switchScene      |
| npcs       | utils, buildings, dialogue, scenes   | createNPCs, checkNearby*, interaction, bus stop     |
| animation  | three, nightsky, skybox, utils       | animateCars, animateBus, clouds, campfire, loop     |
| dialogue   | —                                    | conversations, unlock songs, item encounters        |
| controls   | three                                | keyboard, mouse, touch, camera movement             |
| renderer   | three                                | WebGL, post-processing (pixelation)                  |
| skybox     | three                                | Gradient background, time-of-day for unified map     |
| nightsky   | three                                | Stars, moon, sun, daylight cycle                    |
| phone-ui   | dialogue                             | Debug phone overlay, keyboard toggle                |
| utils      | three                                | Wireframe material, createCar, createTree, createBush |
| roads      | —                                    | ROAD_SEGMENTS (not currently imported)              |

---

## Data Flow

### streetElements (God Object)

Passed to animation loop and many systems. Contains 30+ properties:

- **Zone structure**: zoneRootGroup, zoneKey, zoneConfig, zoneOffset
- **Groups**: frontShopsGroup, farBuildingsGroup, streetElementsGroup, nearSidewalkElementsGroup, farSidewalkElementsGroup, parkingElementsGroup
- **Surfaces**: street, nearSidewalk, farSidewalk, parkingLot, roadLines
- **Content**: cars, bus(es), buildingPortals, npcs, pondElements, campfire, pond, campsiteObjects
- **Unified map**: zoneRootGroups, connectorVehiclesGroup
- **Interior**: interiorGroup, exitPortal, interactiveItems
- **Misc**: karaokeSigns, streetLamps, walls, forestElements, parkElements

### Scene Modes

1. **UNIFIED_MAP** (current default): 1000×1000 map, 3 zones (PLAZA, FOREST_SUBURBAN, POND), connector roads at x=±170
2. **Single exterior**: One zone (PLAZA / FOREST / POND), bus stop triggers scene switch
3. **Interior**: Shop/building interior, exit portal returns to exterior

### Scene Switch Triggers

- **Building portal** (Space/F): Near door → enter interior
- **Exit portal** (Space/F): Near exit → return to previous exterior
- **Bus stop** (Space/F, non-UNIFIED_MAP only): Near bus stop → next zone

---

## Key Config Locations

| Config            | Location     | Notes                                              |
|-------------------|-------------|----------------------------------------------------|
| Zone offsets      | scenes.js   | UNIFIED_MAP_ZONE_OFFSETS                           |
| Scene params      | scenes.js   | SCENE_CONFIGS (FRONT_SHOPS_Z, STREET_Z, etc.)      |
| Portal → interior | main.js     | getBuildingPortalDestination (inline)              |
| Road segments     | roads.js    | ROAD_SEGMENTS (unused)                             |
| Ground Y layers   | main.js     | Hardcoded in createZoneScene, createUnifiedMapGround |
| Ground colors     | main.js     | GROUND_COLORS                                      |

---

## File Inventory

### Active

| File        | Lines | Purpose                              |
|-------------|-------|--------------------------------------|
| main.js     | 3163  | Orchestration, zone scene creation   |
| buildings.js| 6056  | All building types, interiors        |
| npcs.js     | 1045  | NPCs, interaction, bus stop          |
| animation.js| 777  | Cars, bus, clouds, effects, loop     |
| dialogue.js | 580   | Conversations, song unlocks          |
| controls.js | 395   | Input, camera                        |
| phone-ui.js | 397   | Debug phone UI                       |
| skybox.js   | 429   | Gradient sky, daylight              |
| nightsky.js | 400   | Stars, moon, sun                    |
| utils.js    | 278   | Materials, car, tree, bush           |
| scenes.js   | 332   | Configs, zone defs                   |
| renderer.js | 141   | WebGL, post-process                  |
| roads.js    | 46    | Road segment defs (unused)           |
| index.html  | 46    | Script loading                       |

### Legacy / Unused

| File                 | Notes                               |
|----------------------|-------------------------------------|
| oldmain.js           | 4642 lines, superseded by main.js   |
| main-refactored.js   | 240 lines, incomplete refactor      |
| main.js.old          | Backup                              |
| REORGANIZATION_*.md  | Old status docs                     |
| NEXT_STEPS.md        | Old plan                            |

---

## createZoneScene Breakdown (in main.js)

Responsible for building a single zone. Roughly:

1. Create zone root and row groups (front shops, far buildings, sidewalk, street, parking)
2. Street layout: geometry, sidewalks, parking lot, road lines, sidewalk lines
3. Bus and bus stop
4. Karaoke bar + front shops (PLAZA)
5. Park (FOREST) or pond (POND) or karaoke row
6. Far buildings (PLAZA, FOREST only)
7. Forest / suburban elements
8. Cars
9. NPCs

All inline in main.js — no separate module.

---

## Animation Loop Flow

Each frame:

1. updateCameraPosition
2. checkNearbyNPCs, checkNearbyItems, checkBusStopProximity
3. updateMobileActionButton
4. animateFloatingDonuts, animateRotatingHangerSystems, animateCounterFlowers
5. animateNeonSigns
6. animateCars, animateBus
7. animateCampfire, animatePondMist, animateCampsiteGlow
8. animateClouds
9. animateCoffeeSteam
10. updateNightSky, updateSkybox
11. render (with pixelation post-process)

---

## Suggested Reading Order

For understanding the codebase:

1. scenes.js — config and zone layout
2. main.js (lines 2908–2965) — scene initialization branching
3. main.js createZoneScene — how one zone is built
4. buildings.js createBuildingFacade, createInteriorScene — building system
5. npcs.js — interaction and portals
6. animation.js createAnimationLoop — frame lifecycle
