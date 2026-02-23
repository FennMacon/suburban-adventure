# Suburban Map

**Source of truth:** `roads.js` (CONNECTOR_X, SUBURBAN_ZONE_STREET_X_MAX, ZONE_STREET_X_MIN), `scenes.js` (UNIFIED_MAP_ZONES, UNIFIED_MAP_ZONE_OFFSETS), `world/zone-scene.js` (createUnifiedMapGround, createConnectorRoads)

**Last verified against:** 2025-02-23

---

## ASCII Map

North (+Z) is up. X increases eastward. Streets extend from x=-500 to ~165 (river side); connector roads at x=±170.

```
                    N (z=333)
    ┌─────────────────┬─────────────────┬─────────────────┐
    │     MANSION     │  FOREST         │      RIVER      │
    │     (ZONE_NW)   │  SUBURBAN       │   ~~~~~~~~~~~~   │
    │                 │   [FRST]        │   (ZONE_NE)     │
    ├═════════╪═══════┼═════════╪═══════┼─────────────────┤
    │   ####  #       │   ####  #       │   ####  #       │
    │   CONN  -170    │   STREET z=11   │   CONN  +170    │
    ├─────────┼───────┼─────────┼───────┼─────────┼───────┤
    │ CARNIVAL│       │  PLAZA  │       │  RIVER  │       │
    │ (ZONE_W)│       │  [PLZ]  │       │ ~~~~~~~ │       │
    │         │       │         │       │(ZONE_E) │       │
    ├═════════╪═══════┼═════════╪═══════┼─────────┼───────┤
    │   ####  #       │   ####  #       │   ####  #       │
    │   CONN  -170    │   STREET z=11   │   CONN  +170    │
    ├─────────────────┼─────────────────┼─────────────────┤
    │  FOREST         │      POND       │      RIVER      │
    │  CLEARINGS      │      [PND]      │   ~~~~~~~~~~~~   │
    │   (ZONE_SW)     │                 │   *SUB* (ZONE_SE)│
    └─────────────────┴─────────────────┴─────────────────┘
   x=-333                0                          333    S (z=-333)

   # = connector road (vertical)    = = horizontal zone street
   ~ = river                       * = subway stop (290, -333)
```

---

## Streets

| Street | Position | Description |
|--------|----------|-------------|
| **PLAZA Street** | z = 11 (local to each zone) | Main horizontal road through PLAZA, runs x = -500 to 165 |
| **FOREST Street** | z = 344 (11 + 333) | Horizontal road through Forest Suburban zone |
| **POND Street** | z = -322 (11 - 333) | Horizontal road through Pond zone; offset left (ROAD_POSITION_X = -100) |
| **Left Connector** | x = -170 | Vertical road connecting all three rows, z ≈ -450 to 450 |
| **Right Connector** | x = 170 | Vertical road; streets meet it at 90° corners before river |

---

## Areas / Zones

- **PLAZA** (0, 0): Massachusetts Plaza. Main downtown with karaoke bar, front shops (Grumby's, Grohos Pizza, Clothing Store, Dry Cleaners, Donut Galaxy, Flower Shop), near sidewalk, street, far sidewalk, parking lot, far buildings.

- **FOREST_SUBURBAN** (0, 333): Forest Suburban Plaza. Park in front, stone wall, gazebo, suburban elements, fewer far buildings. Warmer forest atmosphere.

- **POND** (0, -333): Deep Woods Pond. Campfire, pond, haunted atmosphere. Road runs on left side (ROAD_POSITION_X = -100). No far buildings; forest dominates.

- **ZONE_NW** (-333, 333): Mansion compound. Main mansion, gate, walls, driveway, garage. Grass ground.

- **ZONE_W** (-333, 0): Carnival. Rides, food stalls (cotton candy, fried dough, lemonade, funnel cake), ring toss, balloon darts, bottle knockdown. Street passes through at z = 11.

- **ZONE_SW** (-333, -333): Forest clearings. Path connecting interactive props: empty chair, street lamp, stone circle, odd patch, empty table, traffic cone, shopping cart.

- **ZONE_NE, ZONE_E, ZONE_SE** (right column): River. Water runs north–south through all three zones at x ≈ 333.

- **Subway stop**: World position (290, -333), in ZONE_SE near the river. Transit between suburban and city maps.
