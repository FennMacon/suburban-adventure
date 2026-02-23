# City Map (Allston-style)

**Source of truth:** `roads.js` (CITY_CONNECTOR_X, CITY_HORIZONTAL_Z), `scenes.js` (CITY_MAP_ZONES, CITY_MAP_ZONE_OFFSETS), `world/zone-scene.js` (createCityMapGround, createCityConnectorRoads)

**Last verified against:** 2025-02-23

---

## ASCII Map

North (+Z) is up. X increases eastward. Four vertical connectors at x = -255, -85, 85, 255. Zone streets at z = 11, 344, -322; cross-streets at z = 166, -166. Full grid, streets span x = ±500.

```
                    N (z=333)
    ┌─────────────────┬─────────────────┬─────────────────┐
    │   TRIPLE        │  COMMONWEALTH   │    RECORD       │
    │   DECKERS       │      AVE        │     STRIP       │
    │   (CITY_NW)     │   (CITY_N)      │   (CITY_NE)     │
    ├═══════╪═════════┼═══════╪═════════┼═══════╪═════════┤
    │   #   #    #    │  =============  │   #   #    #    │  Connectors
    ├───────┴─────────┼─────────────────┼───────┴─────────┤  x: -255,-85,85,255
    │   RESIDENTIAL   │   HARVARD AVE   │    FOOD ROW     │  z=11 zone street
    │   (CITY_W)      │   (CITY_PLAZA) │   (CITY_E)      │
    ├═══════╪═════════┼═══════╪═════════┼═══════╪═════════┤
    │   #   #    #    │  =============  │   #   #    #    │  z=166 cross-street
    ├─────────────────┼─────────────────┼─────────────────┤
    │   URBAN PARK    │   BRIGHTON AVE  │  SUBWAY *       │  z=-166 cross-street
    │   (CITY_SW)     │   (CITY_S)      │  (CITY_SE)      │  z=-322 zone street
    └─────────────────┴─────────────────┴─────────────────┘
   x=-333                0                      333    S (z=-333)

   # = vertical connector (4 roads)    = = horizontal zone street
   * = subway stop (333, -290)
```

---

## Streets

| Street | Position | Description |
|--------|----------|-------------|
| **Harvard Ave (CITY_PLAZA)** | z = 11 | Main east–west through center plaza. Karaoke, Bodega, Pho House, Tattoo Parlor, Vinyl & Coffee, Nail Salon, Barber Shop. |
| **Commonwealth Ave (CITY_N)** | z = 344 | North street. Dive bar, Record Store, Laundromat, Corner Cafe, Bookshop, Thrift Store, Pizza Slice. |
| **Brighton Ave (CITY_S)** | z = -322 | South street. Arcade bar, Sushi Spot, Vintage Threads, Bubble Tea, Smoke Shop, Comic Shop, Ramen Spot. |
| **Harvard Ave East (CITY_E)** | z = 11 | Food row east. Dumpling House, Liquor Store, Halal Grill, Smoothie Bar, Mobile Repair. |
| **Harvard Ave West (CITY_W)** | z = 11 | Residential west. Shoe Cobbler, Deli, Hardware Store, Print Shop, Craft Beer. |
| **Cross-streets** | z = 166, z = -166 | Horizontal roads between main zone streets. Full corridor (sidewalk \| road \| sidewalk). |
| **Vertical connectors** | x = -255, -85, 85, 255 | Four north–south roads connecting all rows. Higher density than suburban (2 connectors). |

---

## Areas / Zones

- **CITY_PLAZA** (0, 0): Harvard Ave. Main crossroads. Karaoke bar center, urban shopfronts, dense buildings.

- **CITY_N** (0, 333): Commonwealth Ave. Record strip vibe—Record Store, Laundromat, dive bar, bookshop, thrift, pizza.

- **CITY_S** (0, -333): Brighton Ave. Arcade bar, sushi, vintage clothing, bubble tea, smoke shop, comic shop, ramen.

- **CITY_E** (333, 0): Harvard Ave East. Food row—dumplings, halal, smoothies, liquor store, mobile repair.

- **CITY_W** (-333, 0): Harvard Ave West. Residential corridor—cobbler, deli, hardware, print shop, craft beer.

- **CITY_NW** (-333, 333): Triple deckers. Dense residential buildings, classic Boston housing.

- **CITY_NE** (333, 333): Record strip. Music and record-shop themed corner.

- **CITY_SW** (-333, -333): Urban park. Benches, sparse trees, open green space in the city.

- **CITY_SE** (333, -333): Subway entrance. Transit hub at world position (333, -290). Connects suburban and city maps.
