Editing Dialogue and Flavor Text
===============================

You can edit dialogue and flavor text here without changing any code.
Changes are loaded when the game runs (no rebuild needed).

DIALOGUE (content/dialogue/)
----------------------------
Each NPC has a .txt file (e.g. Maya.txt, Jake.txt).
Scenes are marked with: === SCENE_NAME ===
Use UNLOCKS: scene_name to gate later dialogue.
Format: Speaker: Their line of dialogue

Example:
  === INTRO ===
  Maya: Hey, nice to see you!
  UNLOCKS: CHAT
  Player: Thanks!

  === CHAT ===
  Maya: So, what brings you here?

FLAVOR TEXT (content/flavor/)
-----------------------------
Each file groups related descriptions (e.g. grumby.txt, donut.txt).
Each entry: === ID ===
Then: NAME: Display name
Optional: ITEM: Item the player gets from this object
Then write paragraphs. Each paragraph = one random flavor variant shown when the player inspects the object.

Example:
  === GRUMBY_SHELF ===
  NAME: Store Shelf
  ITEM: Snack

  A sturdy wooden shelf lined with products. Price tags hang from the front.

  This shelf holds convenience store essentials. Popular items are at eye level.

See content/IDS.md for a list of all IDs and where they appear.
