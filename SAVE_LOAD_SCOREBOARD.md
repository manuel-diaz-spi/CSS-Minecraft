# Save, Load & Scoreboard Feature

## Overview

CSS Minecraft now includes **Save**, **Load**, and **Scoreboard** buttons that allow players to persist their builds, reload them later, and view a ranked scoreboard of all published builds.

These buttons are located in the bottom controls bar alongside the existing block chooser and movement controls.

## Buttons

| Button | Icon | Description |
|--------|------|-------------|
| **Save** | 💾 | Captures the current build state and saves it to the server (and localStorage for demo purposes) |
| **Load** | 📂 | Retrieves a previously saved build from the server and applies it to the world |
| **Score** | 🏆 | Displays a scoreboard ranking all published builds by the number of blocks placed |

## How It Works

### Save Build

1. Player clicks the **Save** button.
2. The system scans every cube position in the 9×9×9 grid and records which block type is currently selected at each position.
3. The player is prompted to enter a name for their build.
4. The build data is serialized as JSON with the following structure:
   ```json
   {
     "id": "1700000000000",
     "name": "My Castle",
     "timestamp": "2026-01-15T12:00:00.000Z",
     "data": {
       "layers": 9,
       "rows": 9,
       "columns": 9,
       "blocks": [
         { "layer": 0, "row": 0, "column": 0, "block": "stone" },
         { "layer": 8, "row": 4, "column": 4, "block": "grass" }
       ]
     }
   }
   ```
5. The payload is sent via `POST /api/builds` to the server.
6. The build is also stored in `localStorage` under the key `css-minecraft-builds` for offline/demo use.
7. Console logs detail every step of the process.

### Load Build

1. Player clicks the **Load** button.
2. The system retrieves the list of saved builds (from localStorage in demo mode, or via `GET /api/builds` from the server).
3. The player is shown a numbered list of saved builds and prompted to select one.
4. The selected build's data is fetched (via `GET /api/builds/:id` from the server).
5. The build state is applied to the DOM by programmatically checking the correct radio button for each cube position.
6. Console logs show the full build data and restoration process.

### Scoreboard

1. Player clicks the **Score** button.
2. The system fetches scoreboard data (via `GET /api/scoreboard` from the server, or computed from localStorage in demo mode).
3. Builds are ranked by the number of **non-air blocks** placed (descending).
4. The scoreboard is displayed in an alert dialog and logged to the console in a formatted table:
   ```
   [Scoreboard] === BUILD SCOREBOARD ===
   [Scoreboard] Rank | Name         | Blocks | Date
   [Scoreboard] -----|--------------|--------|-----
   [Scoreboard] #1   | My Castle    | 142 blocks | 2026-01-15T12:00:00.000Z
   [Scoreboard] #2   | Tree House   | 87 blocks  | 2026-01-14T10:30:00.000Z
   [Scoreboard] === END SCOREBOARD ===
   ```

## Server API

The feature is designed to work with a REST API server. The following endpoints are expected:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/builds` | Save a new build. Body: `{ name, timestamp, data }` |
| `GET` | `/api/builds/:id` | Retrieve a specific build by its ID |
| `GET` | `/api/scoreboard` | Get the scoreboard (list of all builds ranked by block count) |

> **Note:** Currently, the buttons use `localStorage` as a fallback and output all server interactions as `console.log()` messages. To connect to a real server, replace the localStorage calls in `build-manager.js` with `fetch()` calls to your API server.

## Technical Details

### Build State Capture

The build state is captured by iterating over every cube position (`layer`, `row`, `column`) in the grid and checking which `input[type="radio"]` is currently selected. Each position's radio button name follows the pattern: `cube-layer-{L}-row-{R}-column-{C}`.

### Build State Restoration

When loading a build, the system sets `radio.checked = true` for the appropriate radio input at each cube position. The radio input IDs follow the pattern: `cube-layer-{L}-row-{R}-column-{C}-{blockType}`.

### File Structure

```
├── build-manager.js          # JavaScript module for save/load/scoreboard logic
├── icons.css                 # Updated with save, folder-open, leaderboard icons
├── index.html                # Updated with action buttons and script tag
├── index.pug                 # Updated Pug template with action buttons and script tag
├── main.scss                 # Updated with .action-buttons styling
├── main.css                  # Compiled CSS (auto-generated from main.scss)
└── SAVE_LOAD_SCOREBOARD.md   # This documentation file
```
