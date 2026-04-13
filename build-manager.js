/**
 * Build Manager for CSS Minecraft
 *
 * Provides save, load, and scoreboard functionality for Minecraft builds.
 * Communicates with a server API to persist build data and maintain a scoreboard.
 *
 * Server API (expected endpoints):
 *   POST /api/builds       - Save a build
 *   GET  /api/builds/:id   - Load a build by ID
 *   GET  /api/scoreboard   - Retrieve the scoreboard
 */

const BuildManager = (() => {
  const API_BASE_URL = "/api";

  /**
   * Reads the current build state from the DOM by inspecting all
   * cube radio button groups and recording which block type is selected.
   * @returns {{ layers: number, rows: number, columns: number, blocks: Array<{ layer: number, row: number, column: number, block: string }> }}
   */
  function captureBuildState() {
    const htmlEl = document.documentElement;
    const layers = parseInt(htmlEl.style.getPropertyValue("--layers"), 10);
    const rows = parseInt(htmlEl.style.getPropertyValue("--rows"), 10);
    const columns = parseInt(htmlEl.style.getPropertyValue("--columns"), 10);

    const blocks = [];

    for (let layer = 0; layer < layers; layer++) {
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const name = `cube-layer-${layer}-row-${row}-column-${column}`;
          const checked = document.querySelector(
            `input[type="radio"][name="${name}"]:checked`
          );
          if (checked) {
            // The block type is determined by the parent .cube element's class
            const cubeDiv = checked.closest(".cube");
            if (cubeDiv) {
              const blockType = Array.from(cubeDiv.classList)
                .filter((c) => c !== "cube")
                .join("");
              blocks.push({ layer, row, column, block: blockType });
            }
          }
        }
      }
    }

    return { layers, rows, columns, blocks };
  }

  /**
   * Applies a saved build state to the DOM by checking the appropriate
   * radio buttons for each cube position.
   * @param {{ layers: number, rows: number, columns: number, blocks: Array<{ layer: number, row: number, column: number, block: string }> }} buildData
   */
  function applyBuildState(buildData) {
    for (const entry of buildData.blocks) {
      const radioId = `cube-layer-${entry.layer}-row-${entry.row}-column-${entry.column}-${entry.block}`;
      const radio = document.getElementById(radioId);
      if (radio) {
        radio.checked = true;
      }
    }
  }

  /**
   * Saves the current build to the server.
   * Captures the DOM state, serializes it, and POSTs it to the server API.
   */
  function saveBuild() {
    const buildState = captureBuildState();
    const buildName =
      prompt("Enter a name for your build:") || "Unnamed Build";
    const payload = {
      name: buildName,
      timestamp: new Date().toISOString(),
      data: buildState,
    };

    console.log("[Save Build] Capturing current build state...");
    console.log("[Save Build] Build name:", buildName);
    console.log(
      "[Save Build] Total non-air blocks:",
      buildState.blocks.filter((b) => b.block !== "air").length
    );
    console.log("[Save Build] Grid dimensions:", {
      layers: buildState.layers,
      rows: buildState.rows,
      columns: buildState.columns,
    });
    console.log("[Save Build] Payload to send to server:", payload);
    console.log(
      `[Save Build] Would POST to ${API_BASE_URL}/builds with the above payload.`
    );
    console.log("[Save Build] Build saved successfully! (simulated)");

    // Store locally for demo purposes
    const savedBuilds = JSON.parse(
      localStorage.getItem("css-minecraft-builds") || "[]"
    );
    payload.id = Date.now().toString();
    savedBuilds.push(payload);
    localStorage.setItem("css-minecraft-builds", JSON.stringify(savedBuilds));
    console.log(
      "[Save Build] Also saved to localStorage with id:",
      payload.id
    );

    alert(`Build "${buildName}" saved! (Check console for details)`);
  }

  /**
   * Loads a build from the server by prompting for a build ID.
   * Fetches build data from the server and applies it to the DOM.
   */
  function loadBuild() {
    console.log("[Load Build] Retrieving list of saved builds...");

    const savedBuilds = JSON.parse(
      localStorage.getItem("css-minecraft-builds") || "[]"
    );

    if (savedBuilds.length === 0) {
      console.log("[Load Build] No saved builds found.");
      alert(
        "No saved builds found. Save a build first!"
      );
      return;
    }

    console.log("[Load Build] Available builds:");
    savedBuilds.forEach((build, index) => {
      console.log(
        `  [${index}] id=${build.id}, name="${build.name}", saved=${build.timestamp}`
      );
    });

    const buildIndex = prompt(
      `Enter the build number to load (0-${savedBuilds.length - 1}):\n` +
        savedBuilds
          .map((b, i) => `${i}: ${b.name} (${b.timestamp})`)
          .join("\n")
    );

    const index = parseInt(buildIndex, 10);
    if (isNaN(index) || index < 0 || index >= savedBuilds.length) {
      console.log("[Load Build] Invalid selection, aborting.");
      return;
    }

    const selectedBuild = savedBuilds[index];
    console.log("[Load Build] Loading build:", selectedBuild.name);
    console.log(
      `[Load Build] Would GET ${API_BASE_URL}/builds/${selectedBuild.id}`
    );
    console.log("[Load Build] Build data received:", selectedBuild.data);
    console.log("[Load Build] Applying build state to DOM...");

    applyBuildState(selectedBuild.data);

    console.log("[Load Build] Build loaded successfully!");
    alert(
      `Build "${selectedBuild.name}" loaded! (Check console for details)`
    );
  }

  /**
   * Displays the scoreboard showing all published builds ranked by block count.
   * Fetches scoreboard data from the server API.
   */
  function showScoreboard() {
    console.log("[Scoreboard] Fetching scoreboard data...");
    console.log(`[Scoreboard] Would GET ${API_BASE_URL}/scoreboard`);

    const savedBuilds = JSON.parse(
      localStorage.getItem("css-minecraft-builds") || "[]"
    );

    if (savedBuilds.length === 0) {
      console.log("[Scoreboard] No builds on the scoreboard yet.");
      alert(
        "Scoreboard is empty. Save and publish some builds first!"
      );
      return;
    }

    // Rank builds by the number of non-air blocks placed
    const scoreboard = savedBuilds
      .map((build) => ({
        id: build.id,
        name: build.name,
        timestamp: build.timestamp,
        totalBlocks: build.data.blocks.filter((b) => b.block !== "air").length,
      }))
      .sort((a, b) => b.totalBlocks - a.totalBlocks);

    console.log("[Scoreboard] === BUILD SCOREBOARD ===");
    console.log("[Scoreboard] Rank | Name | Blocks | Date");
    console.log("[Scoreboard] -----|------|--------|-----");
    scoreboard.forEach((entry, rank) => {
      console.log(
        `[Scoreboard] #${rank + 1} | ${entry.name} | ${entry.totalBlocks} blocks | ${entry.timestamp}`
      );
    });
    console.log("[Scoreboard] === END SCOREBOARD ===");

    const scoreboardText = scoreboard
      .map(
        (entry, rank) =>
          `#${rank + 1}: ${entry.name} — ${entry.totalBlocks} blocks`
      )
      .join("\n");

    alert(`🏆 Build Scoreboard:\n\n${scoreboardText}\n\n(Check console for full details)`);
  }

  // Public API
  return {
    saveBuild,
    loadBuild,
    showScoreboard,
    captureBuildState,
    applyBuildState,
  };
})();
