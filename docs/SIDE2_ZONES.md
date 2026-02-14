# Side 2 Zones - Content Brainstorm

The six placeholder zones in the 3x3 unified map (ZONE_SW, ZONE_SE, ZONE_W, ZONE_E, ZONE_NW, ZONE_NE) are currently grass-only. This document captures possible themes and content for each before implementation.

## Zone Layout (3x3 Grid)

```
        z=333
   [ZONE_NW]  [FOREST_SUBURBAN]  [ZONE_NE]
   forest     forest suburban     MANSION
   clearings
        z=0
   [ZONE_W]   [PLAZA]            [ZONE_E]
        z=-333
   [ZONE_SW]  [POND]             [ZONE_SE]
                             HILL / mountain
   x=-333     0                  333
```

## Zone Themes (implemented)

| Zone | Location | Theme | Notes |
|------|----------|-------|-------|
| ZONE_NW | Above PLAZA, left | Forest clearings | Path, abandoned props, interactive items |
| ZONE_NE | Above PLAZA, right | Mansion compound | Main mansion, gate, walls, driveway, garage |
| ZONE_SE | Below PLAZA, right | Hill / mountain | Big hill with rocks, rural landmark |
| ZONE_W | Left of PLAZA | — | Grass only |
| ZONE_E | Right of PLAZA | — | Grass only |
| ZONE_SW | Below PLAZA, left | — | Grass only |

## Story Alignment (STORY_OUTLINE.md)

- **Act I** – Reconnections in plaza, forest, pond. Side zones can extend these (e.g. trail to pond, bus stop near commercial).
- **Countdown** – NPCs and props can reference 90-day demolition.
- **Sound as Memory** – Ambient elements (machines, birds, traffic) per zone theme.

## Implementation Approach (future phase)

1. Add `content` or `theme` field to each zone in `UNIFIED_MAP_ZONES`.
2. Create `createZoneContent(scene, zone)` or extend `createZoneScene` for placeholder zones.
3. Reuse: `createTree`, `createBush`, `createParkElements`, `createPondElements`.

## Props by Theme (draft)

- **Residential**: Sparse trees, mailboxes, fences, low-detail houses
- **Commercial**: Parking lines, dumpsters, delivery bays, signs
- **Nature/trailhead**: Dense trees, benches, path markers
- **Farm/open**: Sparse trees, fence posts, hay bales
