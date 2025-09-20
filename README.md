# Suburban Massachusetts Plaza Experience

A Three.js application that creates an 8-bit wireframe aesthetic recreation of a suburban Massachusetts shopping plaza. Set in Groton, MA, this interactive experience lets you explore a nostalgic New England plaza complete with all the classic shops and that authentic small-town atmosphere.

## The Plaza

Inspired by the real shopping plazas found throughout suburban Massachusetts, this virtual environment captures the essence of those strip malls where teens hang out, locals grab their coffee, and community life happens. The plaza features:

1. Low-resolution rendering for that retro aesthetic
2. Wireframe rendering of all buildings and objects  
3. Expanded night sky with more stars
4. Large wrap-around parking lot (perfect for hanging out)

## Features

### Dual Scene System
- **Massachusetts Plaza** - The original urban plaza setting with all shops and buildings
- **Forest Suburban Plaza** - The same plaza surrounded by a dense forest with suburban elements
- **Scene Switching** - Press 'F' to toggle between environments and experience different vibes

### The Plaza Layout
- **Cumby's** - Red convenience store for snacks and drinks
- **Grohos (Groton House of Pizza)** - Green pizza place serving the community
- **Clothing Store** - Blue retail shop for fashion needs
- **Dry Cleaners** - Yellow storefront for cleaning services  
- **Dunkin Donuts** - Orange coffee shop (essential Massachusetts establishment)
- **Flower Shop** - Pink floral boutique
- **Karaoke Bar** - The original blue-glowing centerpiece (kept from the original design)
- **Background Buildings** - Randomly generated mix of modern, brick, industrial buildings, hospitals, and cemeteries

### Interactive Environment
- **Wrap-around parking lot** with painted lines and spaces
- **Extended plaza area** with proper sidewalks connecting all shops
- **Enhanced starry night sky** with 600+ stars for that suburban evening ambiance
- **Forest Environment** - Dense tree coverage surrounding the plaza in suburban mode
- **Suburban Elements** - Mailboxes, scattered trees, and bushes throughout the landscape
- **WASD/Arrow key movement controls** - walk around and explore the plaza
- **Mouse camera controls** - look around and take in the Massachusetts vibes

### Interactive Features
- **Character conversations** - Walk up to 5 NPCs around the plaza and press 'E' to chat
- **Song discovery system** - Each conversation unlocks a new song/story piece
- **Massachusetts locals** - Meet Maya (at Cumby's), Jake (at Dunkin), Alex (parking lot), Sam (behind shops), and Jordan (corner people-watcher)

### Future Features (Planned)
- **Audio playback** - Actually play the unlocked songs with your friends' voices
- **Interactive shop experiences** - Enter stores and interact with items
- **More NPCs and stories** - Expand the cast of characters and conversations

## How to Run

Simply open the `index.html` file in a web browser, or run a local web server:

```bash
# Using Python 3's built-in HTTP server (port 8080)
python3 -m http.server 8080

# Then visit http://localhost:8080 in your browser
```

## Controls

- **WASD Keys or Arrow Keys** - Move around the plaza (hold Shift to sprint)
- **Mouse** - Click and drag to rotate the camera view
- **Mouse Wheel** - Scroll to zoom in and out
- **E Key** - Talk to NPCs when nearby (unlocks songs and stories)
- **F Key** - Switch between Massachusetts Plaza and Forest Suburban scenes
- **Spacebar** - Toggle between exterior and interior scenes (karaoke bar)

## The Massachusetts Experience

This project captures the authentic feel of suburban Massachusetts life in two distinct environments:

### Urban Plaza Mode
The classic strip mall experience where you'd:
- Grab a coffee at Dunkin before school/work
- Meet friends in the parking lot after hours  
- Pick up pizza from the local House of Pizza
- Run errands at the convenience store
- Find teens hanging around back by the dumpsters

### Forest Suburban Mode
A more secluded, wooded setting that captures the New England suburban feel:
- Dense forest surroundings creating intimate plaza atmosphere
- Scattered trees and bushes throughout the landscape
- Mailboxes and suburban residential elements
- Perfect for that "hidden away in the woods" Massachusetts vibe

Both environments maintain that unique New England small-town community feel while offering different atmospheric experiences.

The goal is to create an interactive music/conversation experience where you can walk up to different people around the plaza and hear their stories, gradually unlocking songs and pieces of the larger narrative about growing up in suburban Massachusetts.

## Technology

- Three.js for 3D rendering
- WebGL shaders for post-processing effects
- Vanilla JavaScript for animation 