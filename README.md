# Suburban Adventure

A Three.js exploration game set in a plaza scheduled for demolition. The player reconnects with friends, collects sounds for a farewell album, and preserves community memories.

## Quick Start

```bash
# Serve locally (no build step)
python3 -m http.server 8080
# Open http://localhost:8080
```

## Project Structure

| Folder / File | Purpose |
|---------------|---------|
| `main.js` | Entry point, scene setup, orchestration |
| `docs/PROJECT_MAP.md` | Architecture map and module overview |
| `docs/REFACTOR_PLAN.md` | Refactor suggestions and roadmap |
| `archive/` | Legacy / superseded files |

**Modules**: `animation`, `buildings`, `controls`, `dialogue`, `npcs`, `nightsky`, `renderer`, `roads`, `scenes`, `skybox`, `utils`, `phone-ui`

## Story

See [STORY_OUTLINE.md](STORY_OUTLINE.md) for the narrative premise and act structure.

## Tech

- Three.js (ES modules, importmap in `index.html`)
- No bundler; single entry script loads dependencies via import graph
