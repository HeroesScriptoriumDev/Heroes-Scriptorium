/* HEROES INSANITY VTT - COMPLETE JAVASCRIPT */

const GRID_SIZE = 64;
const FEET_PER_CELL = 5;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4.0;

const CONDITIONS = [
  "Blinded",
  "Confused",
  "Dazed",
  "Deafened",
  "Exhausted",
  "Fatigued",
  "Frightened",
  "Helpless",
  "Nauseated",
  "Panicked",
  "Paralyzed",
  "Petrified",
  "Prone",
  "Shaken",
  "Sickened",
  "Stunned"
];

const VTT = {
  campaignId: null,
  userRole: null,
  cam: { x: 0, y: 0, zoom: 1 },
  currentSceneId: null,
  scenes: [],
  mapCols: 24,
  mapRows: 16,
  tokens: [],
  characters: [],
  selectedTokenId: null,
  hoveredTokenId: null,
  dragging: null,
  dragOffset: { x: 0, y: 0 },
  activeTool: "select",
  showGrid: true,
  showFog: true,
  showNames: true,
  fog: {},
  measuring: false,
  measureStart: null,
  measureEnd: null,
  fogBrushSize: 2,
  fogPainting: false,
  fogPaintMode: "hide",
  pings: [],
  dirty: true,
  rafId: null,
  hpModalTokenId: null,
  feedFilter: "all",
  lastActionByCharacter: {}
};

const canvas = document.getElementById("vtt-canvas");
const ctx = canvas.getContext("2d");
const miniCanvas = document.getElementById("minimap-canvas");
const miniCtx = miniCanvas.getContext("2d");

const urlParams = new URLSearchParams(window.location.search);
VTT.campaignId = urlParams.get("campaign");

let isPanning = false;
let panStart = { x: 0, y: 0 };
let panCamStart = { x: 0, y: 0 };

/* =========================================================
   INIT
   ========================================================= */

async function init() {
  VTT.characters = [];
  VTT.tokens = [];
  VTT.scenes = [];
  VTT.fog = {};

  const loaded = await loadVTTState();
  applyRoleView();

  if (!VTT.scenes.length) {
    createDefaultScene();
  }

  if (!VTT.currentSceneId || !getSceneConfig(VTT.currentSceneId)) {
    VTT.currentSceneId = VTT.scenes[0].id;
  }

  renderSceneSelector();
  switchScene(VTT.currentSceneId);
  resizeCanvas();
  renderSidebar();
  attachEvents();
  centerCamera();
  startRenderLoop();
  startAutoSave();

  addFeedEntry(
    "system",
    "System",
    loaded ? "VTT loaded from saved session." : "VTT loaded. No characters or tokens yet."
  );

  setTimeout(() => {
    const overlay = document.getElementById("loading-overlay");
    overlay.classList.add("fade-out");
    setTimeout(() => (overlay.style.display = "none"), 500);
  }, 700);
}

function resizeCanvas() {
  const container = document.getElementById("canvas-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  VTT.dirty = true;
}

/* =========================================================
   ROLE-BASED VIEW
   ========================================================= */

function applyRoleView() {
  const app = document.getElementById("app");
  const isDM = VTT.userRole === "dm";

  app.classList.toggle("dm-mode", isDM);
  app.classList.toggle("player-mode", !isDM);

  const modeLabel = document.getElementById("mode-label");
  if (modeLabel) {
    modeLabel.textContent = isDM ? "DM View" : "Player View";
  }
}

/* =========================================================
   PERSISTENCE — LOAD / SAVE / AUTOSAVE
   ========================================================= */

async function loadVTTState() {
  if (!VTT.campaignId) {
    console.warn("No campaign ID in URL — running without a saved state.");
    return false;
  }

  try {
    const response = await fetch(`/api/campaigns/${VTT.campaignId}/vtt-state`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to load VTT state (${response.status})`);
    }

    const data = await response.json();
    console.log(data);
    console.log("Role:", data.role);
    VTT.userRole = data.role;
    const state = data.vtt_state;

    if (!state) return false;

    VTT.currentSceneId = state.currentSceneId || null;
    VTT.scenes = state.scenes || [];
    VTT.tokens = state.tokens || [];
    VTT.characters = state.characters || [];

    VTT.scenes.forEach((scene) => {
      VTT.fog[scene.id] =
        state.fog && state.fog[scene.id]
          ? new Uint8Array(state.fog[scene.id])
          : new Uint8Array(scene.cols * scene.rows);
    });

    return true;
  } catch (err) {
    console.error("Error loading VTT state:", err);
    return false;
  }
}

async function saveVTTState() {
  if (!VTT.campaignId) return;

  const state = {
    currentSceneId: VTT.currentSceneId,
    scenes: VTT.scenes,
    tokens: VTT.tokens,
    characters: VTT.characters,
    fog: {}
  };

  VTT.scenes.forEach((scene) => {
    state.fog[scene.id] = Array.from(VTT.fog[scene.id] || []);
  });

  try {
    const response = await fetch(`/api/campaigns/${VTT.campaignId}/vtt-state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ vtt_state: state })
    });

    if (!response.ok) {
      throw new Error(`Failed to save VTT state (${response.status})`);
    }
  } catch (err) {
    console.error("Error saving VTT state:", err);
  }
}

function startAutoSave() {
  setInterval(saveVTTState, 30000); // every 30 seconds
  window.addEventListener("beforeunload", saveVTTState);
}

/* =========================================================
   SCENES
   ========================================================= */

function getSceneConfig(sceneId) {
  return VTT.scenes.find((scene) => scene.id === sceneId);
}

function createDefaultScene() {
  const scene = {
    id: "scene_" + Date.now(),
    name: "The Tavern",
    cols: 24,
    rows: 16,
    bgColor: "#1a1008",
    gridColor: "rgba(201,168,76,0.12)"
  };

  VTT.scenes.push(scene);
  VTT.fog[scene.id] = new Uint8Array(scene.cols * scene.rows);
  revealFogCircle(scene.id, Math.floor(scene.cols / 2), Math.floor(scene.rows / 2), 7);
  VTT.currentSceneId = scene.id;
}

function switchScene(sceneId) {
  const cfg = getSceneConfig(sceneId);
  if (!cfg) return;

  VTT.currentSceneId = sceneId;
  VTT.mapCols = cfg.cols;
  VTT.mapRows = cfg.rows;

  const select = document.getElementById("toolbar-scene-select");
  if (select) select.value = sceneId;

  document.querySelectorAll(".scene-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.sceneId === sceneId);
  });

  centerCamera();
  updateSceneTokenList();
  VTT.dirty = true;
}

function getSceneTokens() {
  return VTT.tokens.filter((token) => token.sceneId === VTT.currentSceneId);
}

function renderScenesList() {
  const list = document.getElementById("scenes-list");
  if (!list) return;

  list.innerHTML = VTT.scenes
    .map(
      (scene) => `
      <button class="scene-card ${scene.id === VTT.currentSceneId ? "active" : ""}" data-scene-id="${scene.id}" onclick="switchScene('${scene.id}')">
        <span>🗺</span><strong>${scene.name}</strong>
      </button>
    `
    )
    .join("");
}

function renderSceneSelector() {
  const select = document.getElementById("toolbar-scene-select");
  if (!select) return;

  select.innerHTML = VTT.scenes
    .map((scene) => `<option value="${scene.id}">${scene.name}</option>`)
    .join("");
  select.value = VTT.currentSceneId;
}

function newScene() {
  document.getElementById("scene-modal-name").value = "";
  document.getElementById("scene-modal-cols").value = 24;
  document.getElementById("scene-modal-rows").value = 16;
  document.getElementById("scene-modal-bgcolor").value = "#1a1008";
  document.getElementById("scene-modal").classList.add("open");
}

function closeSceneModal() {
  document.getElementById("scene-modal").classList.remove("open");
}

function confirmNewScene() {
  const name = document.getElementById("scene-modal-name").value.trim() || "New Scene";
  const cols = Math.max(5, Math.min(60, parseInt(document.getElementById("scene-modal-cols").value, 10) || 24));
  const rows = Math.max(5, Math.min(60, parseInt(document.getElementById("scene-modal-rows").value, 10) || 16));
  const bgColor = document.getElementById("scene-modal-bgcolor").value || "#1a1008";

  const scene = {
    id: "scene_" + Date.now(),
    name,
    cols,
    rows,
    bgColor,
    gridColor: "rgba(201,168,76,0.12)"
  };

  VTT.scenes.push(scene);
  VTT.fog[scene.id] = new Uint8Array(cols * rows);
  revealFogCircle(scene.id, Math.floor(cols / 2), Math.floor(rows / 2), 7);

  renderScenesList();
  renderSceneSelector();
  switchScene(scene.id);

  closeSceneModal();
  addFeedEntry("system", "Scenes", `New scene created: ${name}.`);
}

/* =========================================================
   CAMERA
   ========================================================= */

function centerCamera() {
  const cfg = getSceneConfig(VTT.currentSceneId);
  if (!cfg) return;

  const mapW = cfg.cols * GRID_SIZE;
  const mapH = cfg.rows * GRID_SIZE;

  VTT.cam.x = mapW / 2;
  VTT.cam.y = mapH / 2;
  VTT.cam.zoom = Math.min(
    (canvas.width * 0.85) / mapW,
    (canvas.height * 0.85) / mapH,
    1
  );

  updateZoomDisplay();
  VTT.dirty = true;
}

function worldToScreen(wx, wy) {
  return {
    x: (wx - VTT.cam.x) * VTT.cam.zoom + canvas.width / 2,
    y: (wy - VTT.cam.y) * VTT.cam.zoom + canvas.height / 2
  };
}

function screenToWorld(sx, sy) {
  return {
    x: (sx - canvas.width / 2) / VTT.cam.zoom + VTT.cam.x,
    y: (sy - canvas.height / 2) / VTT.cam.zoom + VTT.cam.y
  };
}

function snapToGrid(wx, wy) {
  return {
    x: Math.round(wx / GRID_SIZE) * GRID_SIZE,
    y: Math.round(wy / GRID_SIZE) * GRID_SIZE
  };
}

function adjustZoom(delta, pivotSx, pivotSy) {
  VTT.cam.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, VTT.cam.zoom + delta));
  updateZoomDisplay();
  VTT.dirty = true;
}

function resetView() {
  centerCamera();
}

function updateZoomDisplay() {
  document.getElementById("zoom-display").textContent =
    Math.round(VTT.cam.zoom * 100) + "%";
}

/* =========================================================
   FOG
   ========================================================= */

function setFogCell(sceneId, col, row, state) {
  const cfg = getSceneConfig(sceneId);
  if (!cfg) return;
  if (col < 0 || col >= cfg.cols || row < 0 || row >= cfg.rows) return;
  VTT.fog[sceneId][row * cfg.cols + col] = state;
}

function getFogCell(sceneId, col, row) {
  const cfg = getSceneConfig(sceneId);
  if (!cfg) return 0;
  if (col < 0 || col >= cfg.cols || row < 0 || row >= cfg.rows) return 0;
  return VTT.fog[sceneId][row * cfg.cols + col];
}

function revealFogCircle(sceneId, centerCol, centerRow, radiusCells) {
  for (let row = -radiusCells; row <= radiusCells; row++) {
    for (let col = -radiusCells; col <= radiusCells; col++) {
      if (Math.sqrt(row * row + col * col) <= radiusCells) {
        setFogCell(sceneId, centerCol + col, centerRow + row, 1);
      }
    }
  }
}

function paintFogAt(sx, sy, mode) {
  const world = screenToWorld(sx, sy);
  const col = Math.floor(world.x / GRID_SIZE);
  const row = Math.floor(world.y / GRID_SIZE);
  const state = mode === "reveal" ? 1 : 0;
  const brush = VTT.fogBrushSize;

  for (let r = -brush; r <= brush; r++) {
    for (let c = -brush; c <= brush; c++) {
      setFogCell(VTT.currentSceneId, col + c, row + r, state);
    }
  }

  VTT.dirty = true;
}

function clearAllFog() {
  VTT.fog[VTT.currentSceneId].fill(0);
  addFeedEntry("system", "Fog", "DM hid the full scene.");
  VTT.dirty = true;
}

function revealAllFog() {
  VTT.fog[VTT.currentSceneId].fill(1);
  addFeedEntry("system", "Fog", "DM revealed the full scene.");
  VTT.dirty = true;
}

function resetFog() {
  clearAllFog();
}

/* =========================================================
   RENDER
   ========================================================= */

function startRenderLoop() {
  function loop() {
    if (VTT.dirty || VTT.pings.length) {
      render();
      renderMinimap();
      VTT.dirty = false;
    }
    VTT.rafId = requestAnimationFrame(loop);
  }
  loop();
}

function render() {
  const cfg = getSceneConfig(VTT.currentSceneId);
  if (!cfg) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.setTransform(
    VTT.cam.zoom,
    0,
    0,
    VTT.cam.zoom,
    -VTT.cam.x * VTT.cam.zoom + canvas.width / 2,
    -VTT.cam.y * VTT.cam.zoom + canvas.height / 2
  );

  ctx.fillStyle = cfg.bgColor;
  ctx.fillRect(0, 0, cfg.cols * GRID_SIZE, cfg.rows * GRID_SIZE);
  drawMapTexture(cfg);

  if (VTT.showGrid) drawGrid(cfg);

  ctx.strokeStyle = "rgba(201,168,76,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, cfg.cols * GRID_SIZE, cfg.rows * GRID_SIZE);

  getSceneTokens().forEach(drawToken);

  if (VTT.measuring && VTT.measureStart && VTT.measureEnd) drawMeasurement();
  drawPings();

  ctx.restore();

  if (VTT.showFog && document.getElementById("app").classList.contains("dm-mode")) {
    drawFog(cfg, 0.28);
  } else if (VTT.showFog) {
    drawFog(cfg, 1);
  }

  if (VTT.selectedTokenId) {
    const token = VTT.tokens.find((t) => t.id === VTT.selectedTokenId);
    if (token && token.sceneId === VTT.currentSceneId) drawSelectionRingScreenSpace(token);
  }
}

function drawMapTexture(cfg) {
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.5;

  const step = 32;
  const w = cfg.cols * GRID_SIZE;
  const h = cfg.rows * GRID_SIZE;

  ctx.beginPath();
  for (let i = -h; i < w + h; i += step) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
  }
  ctx.stroke();
  ctx.restore();
}

function drawGrid(cfg) {
  ctx.save();
  ctx.strokeStyle = cfg.gridColor;
  ctx.lineWidth = 1 / VTT.cam.zoom;
  ctx.beginPath();

  for (let col = 0; col <= cfg.cols; col++) {
    const x = col * GRID_SIZE;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cfg.rows * GRID_SIZE);
  }

  for (let row = 0; row <= cfg.rows; row++) {
    const y = row * GRID_SIZE;
    ctx.moveTo(0, y);
    ctx.lineTo(cfg.cols * GRID_SIZE, y);
  }

  ctx.stroke();
  ctx.restore();
}

function drawToken(token) {
  const char = findCharByToken(token);
  if (!char) return;

  const cx = token.x + token.size / 2;
  const cy = token.y + token.size / 2;
  const r = token.size / 2 - 3;
  const isSelected = token.id === VTT.selectedTokenId;
  const isHovered = token.id === VTT.hoveredTokenId;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
  grad.addColorStop(0, lightenHex(char.color, 30));
  grad.addColorStop(1, char.color);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = isSelected
    ? "#f62782"
    : isHovered
    ? "rgba(226,201,126,0.8)"
    : "rgba(201,168,76,0.4)";
  ctx.lineWidth = isSelected ? 3 : 1.5;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.round(r * 0.55)}px 'Cinzel', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char.initials, cx, cy);

  const hpPct = Math.max(0, char.hpCurrent / char.hpMax);
  const barW = token.size - 8;
  const barY = token.y + token.size + 4;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(token.x + 4, barY, barW, 5);

  ctx.fillStyle = hpPct > 0.6 ? "#52c46a" : hpPct > 0.25 ? "#c9a84c" : "#e05252";
  ctx.fillRect(token.x + 4, barY, Math.round(barW * hpPct), 5);

  if (VTT.showNames) {
    ctx.font = "600 10px 'Crimson Text', serif";
    ctx.fillStyle = "rgba(232,228,220,0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(char.name.split(" ")[0], cx, barY + 8);
  }

  if (char.conditions && char.conditions.length > 0) {
    char.conditions.slice(0, 5).forEach((cond, i) => {
      ctx.beginPath();
      ctx.arc(token.x + 6 + i * 10, token.y + 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#e05252";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}

function drawSelectionRingScreenSpace(token) {
  const sc = worldToScreen(token.x + token.size / 2, token.y + token.size / 2);
  const screenR = (token.size / 2) * VTT.cam.zoom + 4;

  ctx.beginPath();
  ctx.arc(sc.x, sc.y, screenR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(246,39,130,0.85)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawFog(cfg, opacityMultiplier) {
  const fog = VTT.fog[VTT.currentSceneId];
  if (!fog) return;

  const scaledCell = GRID_SIZE * VTT.cam.zoom;
  const originSc = worldToScreen(0, 0);

  for (let row = 0; row < cfg.rows; row++) {
    for (let col = 0; col < cfg.cols; col++) {
      const state = fog[row * cfg.cols + col];
      if (state === 1) continue;

      const sx = originSc.x + col * scaledCell;
      const sy = originSc.y + row * scaledCell;

      ctx.fillStyle = `rgba(0,0,0,${0.92 * opacityMultiplier})`;
      ctx.fillRect(sx, sy, scaledCell + 0.5, scaledCell + 0.5);
    }
  }
}

function drawMeasurement() {
  const start = VTT.measureStart;
  const end = VTT.measureEnd;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const feet = Math.round((dist / GRID_SIZE) * FEET_PER_CELL);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = "rgba(201,168,76,0.8)";
  ctx.lineWidth = 2 / VTT.cam.zoom;
  ctx.setLineDash([8, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(24,24,24,0.75)";
  ctx.fillRect(midX - 26, midY - 10, 52, 20);

  ctx.fillStyle = "rgba(201,168,76,1)";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${feet} ft.`, midX, midY);

  const el = document.getElementById("measurement-display");
  el.textContent = `${feet} ft.`;
  el.style.display = "block";
}

function drawPings() {
  const now = Date.now();
  VTT.pings = VTT.pings.filter((ping) => now - ping.time < 2000);

  VTT.pings.forEach((ping) => {
    const age = (now - ping.time) / 2000;
    const alpha = 1 - age;
    const radius = 10 + age * 30;

    ctx.beginPath();
    ctx.arc(ping.x, ping.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(246,39,130,${alpha * 0.8})`;
    ctx.lineWidth = 2 / VTT.cam.zoom;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ping.x, ping.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(246,39,130,${alpha})`;
    ctx.fill();
  });
}

function renderMinimap() {
  const cfg = getSceneConfig(VTT.currentSceneId);
  if (!cfg) return;

  const width = (miniCanvas.width = miniCanvas.offsetWidth);
  const height = (miniCanvas.height = miniCanvas.offsetHeight);
  const scaleX = width / (cfg.cols * GRID_SIZE);
  const scaleY = height / (cfg.rows * GRID_SIZE);

  miniCtx.clearRect(0, 0, width, height);
  miniCtx.fillStyle = cfg.bgColor;
  miniCtx.fillRect(0, 0, width, height);

  getSceneTokens().forEach((token) => {
    const char = findCharByToken(token);
    if (!char) return;

    const mx = token.x * scaleX + (token.size * scaleX) / 2;
    const my = token.y * scaleY + (token.size * scaleY) / 2;

    miniCtx.beginPath();
    miniCtx.arc(mx, my, 3, 0, Math.PI * 2);
    miniCtx.fillStyle = char.color;
    miniCtx.fill();
  });

  const topLeft = screenToWorld(0, 0);
  const bottomRight = screenToWorld(canvas.width, canvas.height);

  miniCtx.strokeStyle = "rgba(201,168,76,0.6)";
  miniCtx.lineWidth = 1;
  miniCtx.strokeRect(
    topLeft.x * scaleX,
    topLeft.y * scaleY,
    (bottomRight.x - topLeft.x) * scaleX,
    (bottomRight.y - topLeft.y) * scaleY
  );
}

/* =========================================================
   TOKEN / INSPECTOR
   ========================================================= */

function tokenAt(worldX, worldY) {
  const sceneTokens = getSceneTokens();

  for (let i = sceneTokens.length - 1; i >= 0; i--) {
    const token = sceneTokens[i];
    if (
      worldX >= token.x &&
      worldX <= token.x + token.size &&
      worldY >= token.y &&
      worldY <= token.y + token.size
    ) {
      return token;
    }
  }

  return null;
}

function findCharByToken(token) {
  return VTT.characters.find((char) => char.id === token.characterId);
}

function selectToken(tokenId) {
  VTT.selectedTokenId = tokenId;
  VTT.dirty = true;

  if (!tokenId) {
    showPanelEmpty();
    return;
  }

  const token = VTT.tokens.find((item) => item.id === tokenId);
  const char = token ? findCharByToken(token) : null;

  if (char) populateInspector(char, token);
}

function showPanelEmpty() {
  document.getElementById("panel-empty").classList.remove("hidden");
  document.getElementById("panel-inspector").classList.add("hidden");
  document.getElementById("panel-subtitle").textContent = "No token selected";
}

function populateInspector(char, token) {
  document.getElementById("panel-empty").classList.add("hidden");
  document.getElementById("panel-inspector").classList.remove("hidden");
  document.getElementById("panel-subtitle").textContent = "Token Selected";

  const portrait = document.getElementById("insp-portrait");
  portrait.textContent = char.initials;
  portrait.style.background = `linear-gradient(135deg, ${darkenHex(char.color, 30)}, ${char.color})`;

  document.getElementById("insp-name").textContent = char.name;
  document.getElementById("insp-class").textContent = `${char.race} ${char.class} ${char.level}`;
  document.getElementById("insp-owner").textContent = char.playerName;

  updateInspectorHP(char);
  populateStats(char);
  populateRecentActions(char);
  populateSkills(char);
  populateConditions(char);
  populateFavorites(char);
  populateWeapons(char);
  populateSpells(char);
}

function populateStats(char) {
  const stats = [
    { label: "AC", value: char.ac },
    { label: "HP", value: `${char.hpCurrent}/${char.hpMax}` },
    { label: "Init", value: formatMod(char.initiativeTotal) },
    { label: "BAB", value: formatMod(char.bab) },
    { label: "Fort", value: formatMod(char.fortTotal) },
    { label: "Ref", value: formatMod(char.refTotal) },
    { label: "Will", value: formatMod(char.willTotal) },
    { label: "STR", value: char.str },
    { label: "DEX", value: char.dex }
  ];

  document.getElementById("insp-stat-grid").innerHTML = stats
    .map(
      (stat) => `
    <div class="stat-pill">
      <div class="stat-pill-value">${stat.value}</div>
      <div class="stat-pill-label">${stat.label}</div>
    </div>
  `
    )
    .join("");
}

function populateRecentActions(char) {
  const recent =
    char.recentActions && char.recentActions.length
      ? char.recentActions
      : [
          { name: "Initiative", formula: `1d20${formatMod(char.initiativeTotal)}`, tag: "roll" },
          { name: "Fort Save", formula: `1d20${formatMod(char.fortTotal)}`, tag: "save" },
          { name: "Ref Save", formula: `1d20${formatMod(char.refTotal)}`, tag: "save" },
          { name: "Will Save", formula: `1d20${formatMod(char.willTotal)}`, tag: "save" }
        ];

  document.getElementById("insp-recent-actions").innerHTML = recent
    .slice(0, 6)
    .map(
      (action) => `
    <button class="qr-btn" onclick="rollCharacterFormula('${char.id}', '${escapeAttr(action.name)}', '${escapeAttr(action.formula)}')">
      ${actionIcon(action.tag)} ${action.name.replace(" Damage", " Dmg")}
    </button>
  `
    )
    .join("");
}

function populateSkills(char) {
  if (!char.skills || !Object.keys(char.skills).length) {
    document.getElementById("skills-list").innerHTML =
      `<div style="color:var(--text-3);font-size:0.75rem;padding:4px 8px;">No skills listed.</div>`;
    return;
  }

  document.getElementById("skills-list").innerHTML = Object.entries(char.skills)
    .map(([skill, mod]) => {
      const label = skill.replace(/_/g, " ");
      return `
      <button class="skill-roll-btn" onclick="rollCharacterFormula('${char.id}', '${escapeAttr(label)} Check', '1d20${formatMod(mod)}')">
        <span>${label}</span>
        <span>${formatMod(mod)}</span>
      </button>
    `;
    })
    .join("");
}

function populateConditions(char) {
  document.getElementById("conditions-row").innerHTML = CONDITIONS.slice(0, 12)
    .map((condition) => {
      const active = char.conditions && char.conditions.includes(condition);
      return `
      <button class="condition-tag ${active ? "active" : "inactive"}" onclick="toggleCondition('${char.id}', '${condition}')">
        ${condition}
      </button>
    `;
    })
    .join("");
}

function populateFavorites(char) {
  const favorites = char.favorites || [];

  document.getElementById("favorite-grid").innerHTML = favorites
    .map((fav) => {
      const built = buildFavoriteAction(char, fav);
      if (!built) return "";
      return `
      <button class="favorite-btn" onclick="rollCharacterFormula('${char.id}', '${escapeAttr(built.name)}', '${escapeAttr(built.formula)}')">
        ${built.icon} ${built.shortName}
      </button>
    `;
    })
    .join("");
}

function buildFavoriteAction(char, fav) {
  if (fav.kind === "weapon") {
    const weapon = (char.weapons || []).find((item) => item.id === fav.id);
    if (!weapon) return null;
    const isDamage = fav.mode === "damage";
    return {
      icon: isDamage ? "🩸" : "⚔",
      name: `${weapon.name} ${isDamage ? "Damage" : "Attack"}`,
      shortName: `${weapon.name} ${isDamage ? "Dmg" : ""}`.trim(),
      formula: isDamage ? weapon.damage : weapon.attack
    };
  }

  if (fav.kind === "spell") {
    const spell = (char.spells || []).find((item) => item.id === fav.id);
    if (!spell) return null;
    const formula = fav.mode === "damage" && spell.damage ? spell.damage : spell.cast || "1d20";
    return {
      icon: fav.mode === "damage" ? "🔥" : "✦",
      name: `${spell.name} ${fav.mode === "damage" ? "Damage" : "Cast"}`,
      shortName: spell.name,
      formula
    };
  }

  return {
    icon: fav.kind === "skill" ? "⚡" : "🎲",
    name: fav.name,
    shortName: fav.name,
    formula: fav.formula
  };
}

function populateWeapons(char) {
  const list = document.getElementById("weapons-list");

  if (!char.weapons || !char.weapons.length) {
    list.innerHTML = `<div class="action-card"><div><div class="action-title">No Weapons</div><div class="action-meta">Nothing linked yet</div></div></div>`;
    return;
  }

  list.innerHTML = char.weapons
    .map(
      (weapon) => `
    <div class="action-card">
      <div>
        <div class="action-title">${weapon.favorite ? "★ " : ""}${weapon.name}</div>
        <div class="action-meta">Atk ${weapon.attack} | Dmg ${weapon.damage} | ${weapon.crit}</div>
      </div>
      <div class="action-buttons">
        <button onclick="rollCharacterFormula('${char.id}', '${escapeAttr(weapon.name)} Attack', '${escapeAttr(weapon.attack)}')">Atk</button>
        <button onclick="rollCharacterFormula('${char.id}', '${escapeAttr(weapon.name)} Damage', '${escapeAttr(weapon.damage)}')">Dmg</button>
      </div>
    </div>
  `
    )
    .join("");
}

function populateSpells(char) {
  const list = document.getElementById("spells-list");

  if (!char.spells || !char.spells.length) {
    list.innerHTML = `<div class="action-card"><div><div class="action-title">No Spells</div><div class="action-meta">Martial character or none prepared</div></div></div>`;
    return;
  }

  list.innerHTML = char.spells
    .map(
      (spell) => `
    <div class="action-card">
      <div>
        <div class="action-title">${spell.favorite ? "★ " : ""}${spell.name}</div>
        <div class="action-meta">${spell.range} | Save: ${spell.save}${spell.damage ? " | " + spell.damage : ""}</div>
      </div>
      <div class="action-buttons">
        <button onclick="castSpell('${char.id}', '${spell.id}')">Cast</button>
        ${
          spell.damage
            ? `<button onclick="rollCharacterFormula('${char.id}', '${escapeAttr(spell.name)} Damage', '${escapeAttr(spell.damage)}')">Dmg</button>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");
}

function updateInspectorHP(char) {
  const pct = Math.max(0, char.hpCurrent / char.hpMax);
  document.getElementById("insp-hp-value").textContent = `${char.hpCurrent} / ${char.hpMax}`;

  const bar = document.getElementById("insp-hp-bar");
  bar.style.width = Math.round(pct * 100) + "%";
  bar.className = "hp-bar-fill" + (pct <= 0.25 ? " critical" : pct <= 0.6 ? " wounded" : "");
}

function toggleCondition(charId, condition) {
  const char = VTT.characters.find((item) => item.id === charId);
  if (!char) return;

  if (!char.conditions) char.conditions = [];
  const index = char.conditions.indexOf(condition);

  if (index >= 0) {
    char.conditions.splice(index, 1);
    addFeedEntry("system", char.name, `Condition removed: ${condition}`);
  } else {
    char.conditions.push(condition);
    addFeedEntry("system", char.name, `Condition applied: ${condition}`);
  }

  populateConditions(char);
  VTT.dirty = true;
}

function toggleSkillsDropdown() {
  const list = document.getElementById("skills-list");
  const arrow = document.getElementById("skills-arrow");
  list.classList.toggle("open");
  arrow.textContent = list.classList.contains("open") ? "▴" : "▾";
}

function toggleActionSection(id) {
  document.getElementById(id).classList.toggle("open");
}

function openLinkedSheet() {
  const char = getSelectedCharacter();
  alert(char ? `Opening linked sheet for ${char.name}.` : "No character selected.");
}

/* =========================================================
   HP
   ========================================================= */

function quickHPAdjust(mode) {
  const char = getSelectedCharacter();
  if (!char) return;

  const input = document.getElementById("insp-hp-input");
  const amount = parseInt(input.value, 10) || 1;
  applyHPChange(char, mode === "heal" ? amount : -amount);
  input.value = "";
}

function applyHPChange(char, delta) {
  const oldHP = char.hpCurrent;
  char.hpCurrent = Math.max(0, Math.min(char.hpMax, char.hpCurrent + delta));

  updateInspectorHP(char);
  populateStats(char);
  VTT.dirty = true;

  const label = delta > 0 ? `+${delta} Healed` : `${Math.abs(delta)} Damage`;
  showRollToast(char.name, label, "", Math.abs(delta), delta > 0 ? "heal" : "damage");
  addFeedEntry("system", char.name, `${label}. HP ${oldHP} → ${char.hpCurrent}`);
}

function openHPModal(tokenId, screenX, screenY) {
  VTT.hpModalTokenId = tokenId;
  const modal = document.getElementById("hp-modal");
  modal.style.display = "block";
  modal.style.left = screenX + "px";
  modal.style.top = Math.max(10, screenY - 120) + "px";
}

function closeHPModal() {
  document.getElementById("hp-modal").style.display = "none";
  VTT.hpModalTokenId = null;
}

function applyHPModal(mode) {
  if (!VTT.hpModalTokenId) return;

  const token = VTT.tokens.find((item) => item.id === VTT.hpModalTokenId);
  const char = token ? findCharByToken(token) : null;
  if (!char) return;

  const amount = parseInt(document.getElementById("hp-modal-input").value, 10) || 1;
  applyHPChange(char, mode === "heal" ? amount : -amount);
  closeHPModal();
}

/* =========================================================
   DICE AND ROLLS
   ========================================================= */

function rollCharacterFormula(charId, label, formula) {
  const char = VTT.characters.find((item) => item.id === charId);
  if (!char) return;

  const roll = rollFormula(formula);
  recordRecentAction(char, label, formula);
  showRollToast(char.name, label, formula, roll.total, "roll", roll.dice);
  addFeedEntry("roll", char.name, label, formula, roll.total, roll.parts.join(" + "));

  if (VTT.selectedTokenId) {
    populateInspector(char, VTT.tokens.find((t) => t.id === VTT.selectedTokenId));
  }
}

function castSpell(charId, spellId) {
  const char = VTT.characters.find((item) => item.id === charId);
  if (!char) return;

  const spell = char.spells.find((item) => item.id === spellId);
  if (!spell) return;

  recordRecentAction(char, `${spell.name} Cast`, spell.cast || "1d20");
  addFeedEntry("system", char.name, `casts ${spell.name}. Range: ${spell.range}. Save: ${spell.save}.`);

  if (spell.damage) {
    const roll = rollFormula(spell.damage);
    showRollToast(char.name, `${spell.name} Damage`, spell.damage, roll.total, "roll", roll.dice);
    addFeedEntry("roll", char.name, `${spell.name} Damage`, spell.damage, roll.total, roll.parts.join(" + "));
  } else {
    showRollToast(char.name, `${spell.name} Cast`, spell.cast || "Cast", "✓", "roll", []);
  }

  populateInspector(char, VTT.tokens.find((t) => t.id === VTT.selectedTokenId));
}

function recordRecentAction(char, label, formula) {
  if (!char.recentActions) char.recentActions = [];

  char.recentActions = char.recentActions.filter((action) => action.name !== label);
  char.recentActions.unshift({ name: label, formula, tag: inferActionTag(label) });
  char.recentActions = char.recentActions.slice(0, 6);
}

function inferActionTag(label) {
  const lower = label.toLowerCase();
  if (lower.includes("damage")) return "damage";
  if (lower.includes("spell") || lower.includes("missile") || lower.includes("burning")) return "spell";
  if (lower.includes("save")) return "save";
  if (lower.includes("check")) return "skill";
  if (lower.includes("attack")) return "weapon";
  return "roll";
}

function vttRoll(playerName, label, formula, modifier = 0) {
  const fullFormula = normalizeFormulaWithModifier(formula, modifier);
  const roll = rollFormula(fullFormula);
  showRollToast(playerName, label, fullFormula, roll.total, "roll", roll.dice);
  addFeedEntry("roll", playerName, label, fullFormula, roll.total, roll.parts.join(" + "));
  closeCtxMenu();
}

function normalizeFormulaWithModifier(formula, modifier) {
  if (!modifier) return formula;
  return `${formula}${modifier >= 0 ? "+" : ""}${modifier}`;
}

function rollFormula(formula) {
  const clean = String(formula).replace(/\s+/g, "");
  const tokens = clean.match(/[+-]?[^+-]+/g) || ["0"];
  const dice = [];
  const parts = [];
  let total = 0;

  tokens.forEach((token) => {
    const sign = token.startsWith("-") ? -1 : 1;
    const unsigned = token.replace(/^[+-]/, "");
    const diceMatch = unsigned.match(/^(\d*)d(\d+)$/i);

    if (diceMatch) {
      const count = parseInt(diceMatch[1], 10) || 1;
      const sides = parseInt(diceMatch[2], 10);

      for (let i = 0; i < count; i++) {
        const roll = rollDie(sides);
        dice.push({ sides, roll });
        total += sign * roll;
        parts.push((sign < 0 ? "-" : "") + roll);
      }
    } else {
      const value = parseInt(unsigned, 10) || 0;
      total += sign * value;
      parts.push((sign < 0 ? "-" : "") + value);
    }
  });

  return { total, dice, parts };
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function showRollToast(player, label, formula, result, type, diceRolls = []) {
  const stack = document.getElementById("roll-toast-stack");
  const toast = document.createElement("div");

  const d20Roll = diceRolls.find((die) => die.sides === 20);
  const isCrit = d20Roll && d20Roll.roll === 20;
  const isFumble = d20Roll && d20Roll.roll === 1;

  let toastClass = "roll-toast";
  let resultClass = "";
  let suffix = "";

  if (type === "heal") suffix = "HP Restored";
  else if (type === "damage") {
    resultClass = "fumble";
    suffix = "Damage Taken";
  } else if (isCrit) {
    toastClass += " crit";
    resultClass = "crit";
    suffix = "✦ Critical";
  } else if (isFumble) {
    toastClass += " fumble";
    resultClass = "fumble";
    suffix = "☠ Fumble";
  }

  toast.className = toastClass;
  toast.innerHTML = `
    <div class="toast-player">${player}</div>
    <div class="toast-label">${label}</div>
    ${formula ? `<div class="toast-formula">${formula}</div>` : ""}
    <div class="toast-result ${resultClass}">${result}</div>
    ${suffix ? `<div class="toast-suffix">${suffix}</div>` : ""}
  `;

  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 400ms ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* =========================================================
   DICE TRAY
   ========================================================= */

function toggleDiceTray() {
  document.getElementById("dice-tray").classList.toggle("collapsed");
}

function addDieToFormula(die) {
  const input = document.getElementById("dice-formula");

  if (!input.value.trim()) {
    input.value = `1${die}`;
    return;
  }

  input.value += `+1${die}`;
}

function clearDiceFormula() {
  document.getElementById("dice-formula").value = "";
}

function rollDiceTray(visibility) {
  const formula = document.getElementById("dice-formula").value.trim();
  if (!formula) return;

  const actor = getSelectedCharacter()?.name || "Dice Tray";
  const roll = rollFormula(formula);
  const label = visibility === "public" ? "Public Roll" : visibility === "gm" ? "GM Roll" : "Blind Roll";

  showRollToast(actor, label, formula, roll.total, "roll", roll.dice);
  addFeedEntry("roll", actor, label, formula, roll.total, roll.parts.join(" + "));
}

/* =========================================================
   FEED / CHAT
   ========================================================= */

function addFeedEntry(type, speaker, message, formula = "", result = "", breakdown = "") {
  const entry = { type, speaker, message, formula, result, breakdown, time: new Date() };

  renderFeedEntry(entry);
  renderSideChatEntry(entry);
}

function renderFeedEntry(entry) {
  const log = document.getElementById("player-table-log") || document.getElementById("side-chat-log");

  if (!log) return;

  const row = document.createElement("div");
  row.className = "feed-entry";
  row.dataset.type = entry.type;

  row.innerHTML = `
    <div class="feed-time">${formatTime(entry.time)}</div>
    <div class="feed-body">
      <div class="feed-speaker">${entry.speaker}</div>
      <div class="feed-message">
        ${entry.message}
        ${entry.result !== "" ? `<span class="feed-roll-result">Result: ${entry.result}</span>` : ""}
      </div>
      ${entry.formula ? `<div class="feed-formula">${entry.formula}</div>` : ""}
    </div>
  `;

  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

function renderSideChatEntry(entry) {
  if (entry.type !== "chat" && entry.type !== "system") return;

  const log = document.getElementById("side-chat-log") || document.getElementById("party-chat-log");
  const row = document.createElement("div");
  row.className = "side-entry";

  row.innerHTML = `
    <div class="feed-body">
      <div class="feed-speaker">${entry.speaker} <span class="feed-time">${formatTime(entry.time)}</span></div>
      <div class="feed-message">${entry.message}</div>
    </div>
  `;

  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

function sendFeedChat(event) {
  event.preventDefault();

  const input = document.getElementById("feed-input");
  const channel = document.getElementById("feed-channel").value;
  const text = input.value.trim();

  if (!text) return;

  if (text.startsWith("/roll ")) {
    const formula = text.replace("/roll ", "").trim();
    const actor = getSelectedCharacter()?.name || "Player";
    const roll = rollFormula(formula);
    showRollToast(actor, "Chat Roll", formula, roll.total, "roll", roll.dice);
    addFeedEntry("roll", actor, "Chat Roll", formula, roll.total, roll.parts.join(" + "));
  } else {
    const actor = channel === "In Character" ? getSelectedCharacter()?.name || "Character" : channel;
    addFeedEntry("chat", actor, text);
  }

  input.value = "";
}

function sendSideChat(event) {
  event.preventDefault();

  const input = document.getElementById("side-chat-input");
  const speaker = document.getElementById("side-chat-speaker").value;
  const text = input.value.trim();

  if (!text) return;

  addFeedEntry("chat", speaker, text);
  input.value = "";
}

function setFeedFilter(filter, button) {
  VTT.feedFilter = filter;

  document.querySelectorAll(".feed-tab").forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");

  document.getElementById("feed-log").innerHTML = "";
  addFeedEntry("system", "System", `Feed filter changed to ${filter}.`);
}

function formatTime(date) {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "--:--";
  }

  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* =========================================================
   CONTEXT MENU
   ========================================================= */

function showCtxMenu(token, sx, sy) {
  const char = findCharByToken(token);
  if (!char) return;

  const firstWeapon = char.weapons?.[0];
  const firstSpell = char.spells?.[0];

  const menu = document.getElementById("ctx-menu");
  menu.innerHTML = `
    <div class="ctx-header">
      <div class="ctx-token-name">${char.name}</div>
      <div class="ctx-token-meta">${char.race} ${char.class} ${char.level} • HP ${char.hpCurrent}/${char.hpMax}</div>
    </div>
    <div class="ctx-sub">Quick Actions</div>
    ${
      firstWeapon
        ? `
      <button class="ctx-item roll" onclick="rollCharacterFormula('${char.id}', '${escapeAttr(firstWeapon.name)} Attack', '${escapeAttr(firstWeapon.attack)}')">⚔ ${firstWeapon.name} Attack</button>
      <button class="ctx-item roll" onclick="rollCharacterFormula('${char.id}', '${escapeAttr(firstWeapon.name)} Damage', '${escapeAttr(firstWeapon.damage)}')">🩸 ${firstWeapon.name} Damage</button>
    `
        : ""
    }
    ${
      firstSpell
        ? `<button class="ctx-item roll" onclick="castSpell('${char.id}', '${firstSpell.id}')">✦ Cast ${firstSpell.name}</button>`
        : ""
    }
    <button class="ctx-item roll" onclick="rollCharacterFormula('${char.id}', 'Initiative', '1d20${formatMod(char.initiativeTotal)}')">⚡ Initiative</button>
    <button class="ctx-item" onclick="openHPModal('${token.id}', ${sx}, ${sy})">❤ Adjust HP</button>
    <button class="ctx-item" onclick="openLinkedSheet()">📋 Open Sheet</button>
    <button class="ctx-item danger" onclick="deleteToken('${token.id}')">✕ Remove Token</button>
  `;

  menu.style.left = sx + "px";
  menu.style.top = sy + "px";
  menu.style.display = "block";
}

function closeCtxMenu() {
  document.getElementById("ctx-menu").style.display = "none";
}

function deleteToken(tokenId) {
  VTT.tokens = VTT.tokens.filter((token) => token.id !== tokenId);

  if (VTT.selectedTokenId === tokenId) selectToken(null);

  closeCtxMenu();
  updateSceneTokenList();
  VTT.dirty = true;
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function renderSidebar() {
  renderScenesList();
  renderCharacters();
  updateSceneTokenList();
}

function renderCharacters() {
  const list = document.getElementById("char-list");

  if (!VTT.characters.length) {
    list.innerHTML = `<div style="color:var(--text-3);font-size:0.75rem;padding:8px 4px;">No characters linked yet.</div>`;
    return;
  }

  list.innerHTML = VTT.characters
    .map(
      (char) => `
    <div class="char-card" draggable="true" ondragstart="dragCharStart(event, '${char.id}')">
      <div class="char-avatar" style="background:linear-gradient(135deg, ${darkenHex(char.color, 30)}, ${char.color})">${char.initials}</div>
      <div class="char-info">
        <div class="char-name">${char.name}</div>
        <div class="char-meta">${char.race} ${char.class} ${char.level}</div>
      </div>
    </div>
  `
    )
    .join("");
}

function updateSceneTokenList() {
  const list = document.getElementById("scene-token-list");
  const tokens = getSceneTokens();

  if (!tokens.length) {
    list.innerHTML = `<div style="color:var(--text-3);font-size:0.75rem;padding:8px 4px;">No tokens on this scene.</div>`;
    return;
  }

  list.innerHTML = tokens
    .map((token) => {
      const char = findCharByToken(token);
      if (!char) return "";

      return `
      <button class="char-card" onclick="selectToken('${token.id}')">
        <div class="char-avatar" style="background:linear-gradient(135deg, ${darkenHex(char.color, 30)}, ${char.color})">${char.initials}</div>
        <div class="char-info">
          <div class="char-name">${char.name}</div>
          <div class="char-meta">HP ${char.hpCurrent}/${char.hpMax}</div>
        </div>
      </button>
    `;
    })
    .join("");
}

function setSidebarTab(tab, button) {
  document.querySelectorAll("#dm-sidebar .sidebar-tab").forEach((t) => t.classList.remove("active"));

  button.classList.add("active");

  document.getElementById("sidebar-scenes").classList.toggle("hidden", tab !== "scenes");
  document.getElementById("sidebar-chars").classList.toggle("hidden", tab !== "chars");
  document.getElementById("sidebar-fog").classList.toggle("hidden", tab !== "fog");
  document.getElementById("sidebar-table").classList.toggle("hidden", tab !== "table");
}

function dragCharStart(event, charId) {
  event.dataTransfer.setData("charId", charId);
}

function spawnTokenAt(charId, worldX, worldY) {
  const snap = snapToGrid(worldX - GRID_SIZE / 2, worldY - GRID_SIZE / 2);

  VTT.tokens.push({
    id: "token_" + Date.now(),
    sceneId: VTT.currentSceneId,
    characterId: charId,
    x: snap.x,
    y: snap.y,
    size: GRID_SIZE,
    controllable: true
  });

  updateSceneTokenList();
  VTT.dirty = true;
}

function spawnTokenPrompt() {
  if (!VTT.characters.length) {
    alert("No characters available to spawn. Link a character first.");
    return;
  }

  const char = VTT.characters[0];
  const cfg = getSceneConfig(VTT.currentSceneId);
  if (!cfg) return;

  spawnTokenAt(
    char.id,
    Math.floor(cfg.cols / 2) * GRID_SIZE + GRID_SIZE / 2,
    Math.floor(cfg.rows / 2) * GRID_SIZE + GRID_SIZE / 2
  );
}

function linkCharacterPrompt() {
  alert("This would open your campaign character browser.");
}

/* =========================================================
   EVENTS
   ========================================================= */

function attachEvents() {
  window.addEventListener("resize", () => {
    resizeCanvas();
    VTT.dirty = true;
  });

  document.getElementById("fog-brush-size").addEventListener("input", (event) => {
    VTT.fogBrushSize = parseInt(event.target.value, 10);
    document.getElementById("fog-brush-label").textContent = VTT.fogBrushSize;
  });

  canvas.addEventListener("mousedown", (event) => {
    closeCtxMenu();
    closeHPModal();

    const rect = canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (event.button === 1 || (event.button === 0 && VTT.activeTool === "move")) {
      isPanning = true;
      panStart = { x: event.clientX, y: event.clientY };
      panCamStart = { ...VTT.cam };
      canvas.style.cursor = "grabbing";
      event.preventDefault();
      return;
    }

    if (event.button === 0) {
      if (VTT.activeTool === "select") {
        const token = tokenAt(world.x, world.y);

        if (token) {
          selectToken(token.id);
          VTT.dragging = token;
          VTT.dragOffset = { x: world.x - token.x, y: world.y - token.y };
        } else {
          selectToken(null);
        }
      }

      if (VTT.activeTool === "measure") {
        VTT.measuring = true;
        VTT.measureStart = { x: world.x, y: world.y };
        VTT.measureEnd = { x: world.x, y: world.y };
      }

      if (VTT.activeTool === "fog") {
        VTT.fogPainting = true;
        VTT.fogPaintMode = event.shiftKey ? "reveal" : "hide";
        paintFogAt(sx, sy, VTT.fogPaintMode);
      }

      if (VTT.activeTool === "ping") {
        VTT.pings.push({ x: world.x, y: world.y, time: Date.now() });
        addFeedEntry("system", "Ping", `Pinged x:${Math.round(world.x)}, y:${Math.round(world.y)}.`);
        VTT.dirty = true;
      }
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    const col = Math.floor(world.x / GRID_SIZE);
    const row = Math.floor(world.y / GRID_SIZE);
    document.getElementById("coords-display").textContent = `x: ${Math.round(world.x)}, y: ${Math.round(world.y)} | cell: ${col},${row}`;

    if (isPanning) {
      VTT.cam.x = panCamStart.x - (event.clientX - panStart.x) / VTT.cam.zoom;
      VTT.cam.y = panCamStart.y - (event.clientY - panStart.y) / VTT.cam.zoom;
      VTT.dirty = true;
      return;
    }

    if (VTT.dragging && VTT.activeTool === "select") {
      const snap = snapToGrid(world.x - VTT.dragOffset.x, world.y - VTT.dragOffset.y);
      VTT.dragging.x = snap.x;
      VTT.dragging.y = snap.y;
      VTT.dirty = true;
    }

    if (VTT.measuring) {
      VTT.measureEnd = { x: world.x, y: world.y };
      VTT.dirty = true;
    }

    if (VTT.fogPainting) {
      paintFogAt(sx, sy, VTT.fogPaintMode);
    }

    const hover = tokenAt(world.x, world.y);
    VTT.hoveredTokenId = hover ? hover.id : null;
    canvas.style.cursor = hover && VTT.activeTool === "select" ? "grab" : "default";
    VTT.dirty = true;
  });

  window.addEventListener("mouseup", () => {
    isPanning = false;
    VTT.dragging = null;
    VTT.fogPainting = false;

    if (VTT.measuring) {
      VTT.measuring = false;
      setTimeout(() => {
        document.getElementById("measurement-display").style.display = "none";
      }, 900);
    }

    canvas.style.cursor = "default";
    VTT.dirty = true;
  });

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const token = tokenAt(world.x, world.y);

    if (token) {
      selectToken(token.id);
      showCtxMenu(token, sx, sy);
    }
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      adjustZoom(delta, event.offsetX, event.offsetY);
    },
    { passive: false }
  );

  canvas.addEventListener("dragover", (event) => event.preventDefault());

  canvas.addEventListener("drop", (event) => {
    event.preventDefault();

    const charId = event.dataTransfer.getData("charId");
    if (!charId) return;

    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
    spawnTokenAt(charId, world.x, world.y);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCtxMenu();
      closeHPModal();
      selectToken(null);
    }

    if (event.key.toLowerCase() === "d") toggleDiceTray();
  });
}

/* =========================================================
   UI TOGGLES
   ========================================================= */

function setTool(tool) {
  VTT.activeTool = tool;

  document.querySelectorAll(".tool-btn[id^='tool-']").forEach((button) => button.classList.remove("active"));
  const activeButton = document.getElementById(`tool-${tool}`);
  if (activeButton) activeButton.classList.add("active");

  canvas.style.cursor = tool === "move" ? "grab" : "default";
}

function toggleGrid() {
  VTT.showGrid = !VTT.showGrid;
  document.getElementById("tog-grid").classList.toggle("active", VTT.showGrid);
  VTT.dirty = true;
}

function toggleFogDisplay() {
  VTT.showFog = !VTT.showFog;
  document.getElementById("tog-fog").classList.toggle("active", VTT.showFog);
  VTT.dirty = true;
}

function toggleNames() {
  VTT.showNames = !VTT.showNames;
  document.getElementById("tog-names").classList.toggle("active", VTT.showNames);
  VTT.dirty = true;
}

/* =========================================================
   HELPERS
   ========================================================= */

function getSelectedCharacter() {
  const token = VTT.tokens.find((item) => item.id === VTT.selectedTokenId);
  return token ? findCharByToken(token) : null;
}

function formatMod(value) {
  return value >= 0 ? `+${value}` : String(value);
}

function actionIcon(tag) {
  switch (tag) {
    case "weapon": return "⚔";
    case "damage": return "🩸";
    case "spell": return "✦";
    case "skill": return "⚡";
    case "save": return "🛡";
    default: return "🎲";
  }
}

function escapeAttr(value) {
  return String(value).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((value) => {
        const hex = Math.max(0, Math.min(255, Math.round(value))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function lightenHex(hex, percent) {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    rgb.r + ((255 - rgb.r) * percent) / 100,
    rgb.g + ((255 - rgb.g) * percent) / 100,
    rgb.b + ((255 - rgb.b) * percent) / 100
  );
}

function darkenHex(hex, percent) {
  const rgb = hexToRgb(hex);
  return rgbToHex(rgb.r * (1 - percent / 100), rgb.g * (1 - percent / 100), rgb.b * (1 - percent / 100));
}

/* =========================================================
   PLAYER CHAT
   ========================================================= */

function setPlayerTab(tab, button) {
  document.querySelectorAll("#player-chat-sidebar .sidebar-tab").forEach((t) => t.classList.remove("active"));

  button.classList.add("active");

  document.getElementById("player-party").classList.toggle("hidden", tab !== "party");
  document.getElementById("player-table").classList.toggle("hidden", tab !== "table");
}

function sendPartyChat(event) {
  event.preventDefault();

  const input = document.getElementById("party-chat-input");
  if (!input || !input.value.trim()) return;

  const entry = {
    type: "chat",
    speaker: VTT.currentPlayer?.name || "Player",
    message: input.value.trim(),
    time: Date.now()
  };

  renderPartyChatEntry(entry);
  input.value = "";
}

function renderPartyChatEntry(entry) {
  const log = document.getElementById("party-chat-log");
  if (!log) return;

  const row = document.createElement("div");
  row.className = "side-entry";
  row.innerHTML = `
    <div class="feed-body">
      <div class="feed-speaker">${entry.speaker} <span class="feed-time">${formatTime(entry.time)}</span></div>
      <div class="feed-message">${entry.message}</div>
    </div>
  `;

  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

/* ============================================================
   HEROES INSANITY VTT — EXPORT MODULE
   Registers itself onto the VTT object and wires up the
   Export Data button / modal.
   ============================================================ */

VTT.exportLog = []; // { type, speaker, message, formula, result, breakdown, time }
VTT.sessionStart = new Date();

(function patchFeedEntry() {
  const _orig = window.addFeedEntry;
  window.addFeedEntry = function (type, speaker, message, formula = "", result = "", breakdown = "") {
    VTT.exportLog.push({ type, speaker, message, formula, result, breakdown, time: new Date() });
    _orig(type, speaker, message, formula, result, breakdown);
  };
})();

function injectExportUI() {
  const pill = document.querySelector(".session-pill");
  if (pill) {
    const btn = document.createElement("button");
    btn.className = "mode-toggle export-trigger-btn";
    btn.id = "export-trigger";
    btn.innerHTML = `<span>⬇ Export Data</span>`;
    btn.onclick = openExportModal;
    pill.replaceWith(btn);
  }

  const modal = document.createElement("div");
  modal.id = "export-modal";
  modal.innerHTML = `
    <div class="export-modal-backdrop" onclick="closeExportModal()"></div>
    <div class="export-modal-panel">
      <div class="export-modal-header">
        <div class="export-modal-title">⬇ Export Session Data</div>
        <button class="export-modal-close" onclick="closeExportModal()">✕</button>
      </div>

      <div class="export-modal-body">
        <div class="export-section-label">Formats</div>
        <div class="export-check-grid">
          <label class="export-check"><input type="checkbox" id="exp-fmt-json" checked> JSON</label>
          <label class="export-check"><input type="checkbox" id="exp-fmt-csv" checked> CSV</label>
          <label class="export-check"><input type="checkbox" id="exp-fmt-txt" checked> TXT</label>
          <label class="export-check"><input type="checkbox" id="exp-fmt-md" checked> Markdown</label>
        </div>

        <div class="export-section-label">Data Buckets</div>
        <div class="export-check-grid">
          <label class="export-check"><input type="checkbox" id="exp-bucket-rolls" checked> Roll Log</label>
          <label class="export-check"><input type="checkbox" id="exp-bucket-chat" checked> Chat Log</label>
          <label class="export-check"><input type="checkbox" id="exp-bucket-system" checked> System Events</label>
          <label class="export-check"><input type="checkbox" id="exp-bucket-chars" checked> Character Snapshots</label>
          <label class="export-check"><input type="checkbox" id="exp-bucket-combined" checked> Combined File</label>
        </div>

        <div class="export-section-label">Summary</div>
        <div class="export-summary" id="export-summary"></div>
      </div>

      <div class="export-modal-footer">
        <button class="export-btn-secondary" onclick="closeExportModal()">Cancel</button>
        <button class="export-btn-primary" id="export-run-btn" onclick="runExport()">
          ⬇ Download ZIP
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", updateExportSummary);
  });
}

function openExportModal() {
  updateExportSummary();
  document.getElementById("export-modal").classList.add("open");
}

function closeExportModal() {
  document.getElementById("export-modal").classList.remove("open");
  const btn = document.getElementById("export-run-btn");
  btn.textContent = "⬇ Download ZIP";
  btn.disabled = false;
}

function updateExportSummary() {
  const rolls = VTT.exportLog.filter((e) => e.type === "roll");
  const chats = VTT.exportLog.filter((e) => e.type === "chat");
  const system = VTT.exportLog.filter((e) => e.type === "system");
  const chars = VTT.characters;

  const fmts = ["json", "csv", "txt", "md"].filter((f) => isChecked(`exp-fmt-${f}`));
  const buckets = ["rolls", "chat", "system", "chars", "combined"].filter((b) => isChecked(`exp-bucket-${b}`));

  const fileCount = buckets.filter((b) => b !== "combined").length * fmts.length + (buckets.includes("combined") ? fmts.length : 0);

  document.getElementById("export-summary").innerHTML = `
    <div class="export-summary-row"><span>Session start</span><span>${formatExportTime(VTT.sessionStart)}</span></div>
    <div class="export-summary-row"><span>Rolls logged</span><span>${rolls.length}</span></div>
    <div class="export-summary-row"><span>Chat messages</span><span>${chats.length}</span></div>
    <div class="export-summary-row"><span>System events</span><span>${system.length}</span></div>
    <div class="export-summary-row"><span>Characters</span><span>${chars.length}</span></div>
    <div class="export-summary-row"><span>Formats selected</span><span>${fmts.join(", ") || "none"}</span></div>
    <div class="export-summary-row"><span>Files in ZIP</span><span>${fileCount}</span></div>
  `;
}

function isChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

async function runExport() {
  const btn = document.getElementById("export-run-btn");
  btn.textContent = "⏳ Building…";
  btn.disabled = true;

  const fmts = ["json", "csv", "txt", "md"].filter((f) => isChecked(`exp-fmt-${f}`));
  const buckets = {
    rolls: isChecked("exp-bucket-rolls"),
    chat: isChecked("exp-bucket-chat"),
    system: isChecked("exp-bucket-system"),
    chars: isChecked("exp-bucket-chars"),
    combined: isChecked("exp-bucket-combined")
  };

  if (!fmts.length) {
    alert("Please select at least one format.");
    btn.textContent = "⬇ Download ZIP";
    btn.disabled = false;
    return;
  }

  const data = {
    rolls: VTT.exportLog.filter((e) => e.type === "roll"),
    chat: VTT.exportLog.filter((e) => e.type === "chat"),
    system: VTT.exportLog.filter((e) => e.type === "system"),
    chars: buildCharacterSnapshots(),
    all: VTT.exportLog
  };

  const ts = formatFileTimestamp(new Date());
  const folderRoot = `heroes_vtt_export_${ts}`;

  try {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    const bucketDefs = [
      { key: "rolls", label: "rolls", data: data.rolls, folder: "rolls" },
      { key: "chat", label: "chat", data: data.chat, folder: "chat" },
      { key: "system", label: "system", data: data.system, folder: "system" },
      { key: "chars", label: "characters", data: data.chars, folder: "characters", isChars: true }
    ];

    for (const bucket of bucketDefs) {
      if (!buckets[bucket.key]) continue;
      const folder = zip.folder(`${folderRoot}/${bucket.folder}`);

      for (const fmt of fmts) {
        const content = bucket.isChars ? serializeChars(data.chars, fmt, ts) : serializeFeed(bucket.data, fmt, bucket.label, ts);
        folder.file(`${bucket.label}.${fmt}`, content);
      }
    }

    if (buckets.combined) {
      const folder = zip.folder(`${folderRoot}/combined`);
      for (const fmt of fmts) {
        const content = serializeCombined(data, fmt, ts);
        folder.file(`session_combined.${fmt}`, content);
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, `heroes_vtt_export_${ts}.zip`, "application/zip");

    btn.textContent = "✓ Downloaded";
    setTimeout(closeExportModal, 1200);
  } catch (err) {
    console.error("ZIP export failed, falling back to individual downloads:", err);
    fallbackDownload(data, fmts, buckets, ts);
    btn.textContent = "✓ Downloaded";
    setTimeout(closeExportModal, 1200);
  }
}

function serializeFeed(entries, fmt, label, ts) {
  switch (fmt) {
    case "json": return serializeFeedJSON(entries, label, ts);
    case "csv": return serializeFeedCSV(entries);
    case "txt": return serializeFeedTXT(entries, label, ts);
    case "md": return serializeFeedMD(entries, label, ts);
    default: return "";
  }
}

function serializeFeedJSON(entries, label, ts) {
  return JSON.stringify(
    { export: label, session: ts, sessionStart: VTT.sessionStart, exportedAt: new Date(), count: entries.length, entries },
    null,
    2
  );
}

function serializeFeedCSV(entries) {
  const headers = ["time", "type", "speaker", "message", "formula", "result", "breakdown"];
  const rows = entries.map((e) => headers.map((h) => csvCell(e[h] ?? "")).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function serializeFeedTXT(entries, label, ts) {
  const lines = [
    `HEROES VTT — ${label.toUpperCase()} LOG`,
    `Session: ${ts}`,
    `Exported: ${formatExportTime(new Date())}`,
    `Entries: ${entries.length}`,
    "=".repeat(60),
    ""
  ];
  for (const e of entries) {
    lines.push(`[${formatExportTime(e.time)}] [${e.type.toUpperCase()}] ${e.speaker}`);
    if (e.message) lines.push(`  ${e.message}`);
    if (e.formula) lines.push(`  Formula: ${e.formula}`);
    if (e.result !== "") lines.push(`  Result: ${e.result}`);
    if (e.breakdown) lines.push(`  Breakdown: ${e.breakdown}`);
    lines.push("");
  }
  return lines.join("\n");
}

function serializeFeedMD(entries, label, ts) {
  const lines = [
    `# Heroes VTT — ${capitalize(label)} Log`,
    ``,
    `**Session:** ${ts}  `,
    `**Exported:** ${formatExportTime(new Date())}  `,
    `**Entries:** ${entries.length}`,
    ``,
    `---`,
    ``
  ];
  for (const e of entries) {
    lines.push(`### \`[${formatExportTime(e.time)}]\` ${e.speaker}`);
    lines.push(`**Type:** ${e.type}`);
    if (e.message) lines.push(`**Message:** ${e.message}`);
    if (e.formula) lines.push(`**Formula:** \`${e.formula}\``);
    if (e.result !== "") lines.push(`**Result:** **${e.result}**`);
    if (e.breakdown) lines.push(`**Breakdown:** ${e.breakdown}`);
    lines.push(``);
  }
  return lines.join("\n");
}

function buildCharacterSnapshots() {
  return VTT.characters.map((char) => ({
    id: char.id,
    name: char.name,
    race: char.race,
    class: char.class,
    level: char.level,
    playerName: char.playerName,
    hpCurrent: char.hpCurrent,
    hpMax: char.hpMax,
    hpPercent: char.hpMax > 0 ? Math.round((char.hpCurrent / char.hpMax) * 100) : 0,
    ac: char.ac,
    bab: char.bab,
    str: char.str,
    dex: char.dex,
    con: char.con,
    int: char.int,
    wis: char.wis,
    cha: char.cha,
    fortTotal: char.fortTotal,
    refTotal: char.refTotal,
    willTotal: char.willTotal,
    initiativeTotal: char.initiativeTotal,
    conditions: char.conditions || [],
    recentActions: char.recentActions || []
  }));
}

function serializeChars(chars, fmt, ts) {
  switch (fmt) {
    case "json":
      return JSON.stringify({ export: "characters", session: ts, exportedAt: new Date(), count: chars.length, characters: chars }, null, 2);

    case "csv": {
      const headers = [
        "name", "race", "class", "level", "playerName",
        "hpCurrent", "hpMax", "hpPercent", "ac", "bab",
        "str", "dex", "con", "int", "wis", "cha",
        "fort", "ref", "will", "initiative", "conditions"
      ];
      const rows = chars.map((c) =>
        [
          c.name, c.race, c.class, c.level, c.playerName,
          c.hpCurrent, c.hpMax, c.hpPercent, c.ac, c.bab,
          c.str, c.dex, c.con, c.int, c.wis, c.cha,
          c.fortTotal, c.refTotal, c.willTotal, c.initiativeTotal,
          c.conditions.join("; ")
        ].map(csvCell).join(",")
      );
      return [headers.join(","), ...rows].join("\n");
    }

    case "txt": {
      const lines = ["HEROES VTT — CHARACTER SNAPSHOTS", `Session: ${ts}`, `Exported: ${formatExportTime(new Date())}`, "=".repeat(60), ""];
      for (const c of chars) {
        lines.push(`${c.name} (${c.race} ${c.class} ${c.level}) — ${c.playerName}`);
        lines.push(`  HP: ${c.hpCurrent}/${c.hpMax} (${c.hpPercent}%)  AC: ${c.ac}  BAB: +${c.bab}`);
        lines.push(`  STR ${c.str}  DEX ${c.dex}  CON ${c.con}  INT ${c.int}  WIS ${c.wis}  CHA ${c.cha}`);
        lines.push(`  Fort +${c.fortTotal}  Ref +${c.refTotal}  Will +${c.willTotal}  Init +${c.initiativeTotal}`);
        if (c.conditions.length) lines.push(`  Conditions: ${c.conditions.join(", ")}`);
        lines.push("");
      }
      return lines.join("\n");
    }

    case "md": {
      const lines = [`# Heroes VTT — Character Snapshots`, ``, `**Session:** ${ts}  `, `**Exported:** ${formatExportTime(new Date())}`, ``];
      for (const c of chars) {
        lines.push(`## ${c.name}`);
        lines.push(`**${c.race} ${c.class} ${c.level}** — *${c.playerName}*`);
        lines.push(``);
        lines.push(`| Stat | Value |`);
        lines.push(`|------|-------|`);
        lines.push(`| HP | ${c.hpCurrent} / ${c.hpMax} (${c.hpPercent}%) |`);
        lines.push(`| AC | ${c.ac} |`);
        lines.push(`| BAB | +${c.bab} |`);
        lines.push(`| STR / DEX / CON | ${c.str} / ${c.dex} / ${c.con} |`);
        lines.push(`| INT / WIS / CHA | ${c.int} / ${c.wis} / ${c.cha} |`);
        lines.push(`| Fort / Ref / Will | +${c.fortTotal} / +${c.refTotal} / +${c.willTotal} |`);
        lines.push(`| Initiative | +${c.initiativeTotal} |`);
        if (c.conditions.length) lines.push(`| Conditions | ${c.conditions.join(", ")} |`);
        lines.push(``);
      }
      return lines.join("\n");
    }

    default:
      return "";
  }
}

function serializeCombined(data, fmt, ts) {
  switch (fmt) {
    case "json":
      return JSON.stringify(
        {
          export: "combined",
          session: ts,
          sessionStart: VTT.sessionStart,
          exportedAt: new Date(),
          rolls: { count: data.rolls.length, entries: data.rolls },
          chat: { count: data.chat.length, entries: data.chat },
          system: { count: data.system.length, entries: data.system },
          characters: { count: data.chars.length, snapshots: data.chars },
          allFeed: { count: data.all.length, entries: data.all }
        },
        null,
        2
      );

    case "csv": {
      const feedHeaders = ["time", "type", "speaker", "message", "formula", "result", "breakdown"];
      const feedRows = data.all.map((e) => feedHeaders.map((h) => csvCell(e[h] ?? "")).join(","));

      const charHeaders = ["name", "race", "class", "level", "playerName", "hpCurrent", "hpMax", "ac", "conditions"];
      const charRows = data.chars.map((c) =>
        [c.name, c.race, c.class, c.level, c.playerName, c.hpCurrent, c.hpMax, c.ac, c.conditions.join("; ")].map(csvCell).join(",")
      );

      return [`# Session Feed`, feedHeaders.join(","), ...feedRows, ``, `# Character Snapshots`, charHeaders.join(","), ...charRows].join("\n");
    }

    case "txt": {
      const sep = "=".repeat(60);
      return [
        serializeFeedTXT(data.rolls, "Roll Log", ts),
        sep,
        serializeFeedTXT(data.chat, "Chat Log", ts),
        sep,
        serializeFeedTXT(data.system, "System Events", ts),
        sep,
        serializeChars(data.chars, "txt", ts)
      ].join("\n\n");
    }

    case "md": {
      return [
        `# Heroes VTT — Full Session Export`,
        ``,
        `**Session:** ${ts}  `,
        `**Exported:** ${formatExportTime(new Date())}`,
        ``,
        `---`,
        ``,
        serializeFeedMD(data.rolls, "Roll Log", ts),
        `---`,
        ``,
        serializeFeedMD(data.chat, "Chat Log", ts),
        `---`,
        ``,
        serializeFeedMD(data.system, "System Events", ts),
        `---`,
        ``,
        serializeChars(data.chars, "md", ts)
      ].join("\n");
    }

    default:
      return "";
  }
}

let _JSZipCache = null;

async function loadJSZip() {
  if (_JSZipCache) return _JSZipCache;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js";
    script.onload = () => {
      _JSZipCache = window.JSZip;
      resolve(window.JSZip);
    };
    script.onerror = () => reject(new Error("JSZip failed to load"));
    document.head.appendChild(script);
  });
}

function fallbackDownload(data, fmts, buckets, ts) {
  const bucketDefs = [
    { key: "rolls", label: "rolls", entries: data.rolls },
    { key: "chat", label: "chat", entries: data.chat },
    { key: "system", label: "system", entries: data.system }
  ];

  for (const bucket of bucketDefs) {
    if (!buckets[bucket.key]) continue;
    for (const fmt of fmts) {
      const content = serializeFeed(bucket.entries, fmt, bucket.label, ts);
      const mime = mimeForFmt(fmt);
      triggerDownload(new Blob([content], { type: mime }), `${bucket.label}_${ts}.${fmt}`, mime);
    }
  }

  if (buckets.chars) {
    const snaps = buildCharacterSnapshots();
    for (const fmt of fmts) {
      const content = serializeChars(snaps, fmt, ts);
      const mime = mimeForFmt(fmt);
      triggerDownload(new Blob([content], { type: mime }), `characters_${ts}.${fmt}`, mime);
    }
  }

  if (buckets.combined) {
    for (const fmt of fmts) {
      const content = serializeCombined(data, fmt, ts);
      const mime = mimeForFmt(fmt);
      triggerDownload(new Blob([content], { type: mime }), `session_combined_${ts}.${fmt}`, mime);
    }
  }
}

function triggerDownload(blob, filename, mime) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

function csvCell(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatExportTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d) ? "" : d.toLocaleString();
}

function formatFileTimestamp(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function mimeForFmt(fmt) {
  return { json: "application/json", csv: "text/csv", txt: "text/plain", md: "text/markdown" }[fmt] || "text/plain";
}

function injectExportStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .export-trigger-btn {
      color: var(--gold-2) !important;
      border-color: rgba(201,168,76,0.24) !important;
      cursor: pointer;
    }

    #export-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9000;
      align-items: center;
      justify-content: center;
    }

    #export-modal.open {
      display: flex;
    }

    .export-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(3px);
    }

    .export-modal-panel {
      position: relative;
      z-index: 1;
      width: 420px;
      max-width: 95vw;
      background: var(--bg-3);
      border: 1px solid rgba(201,168,76,0.3);
      border-radius: var(--radius-lg);
      box-shadow: 0 24px 64px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .export-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px 12px;
      background: linear-gradient(135deg, #1a0a2e, #2d1060);
      border-bottom: 1px solid rgba(201,168,76,0.2);
    }

    .export-modal-title {
      color: var(--gold-2);
      font-family: "Cinzel", serif;
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .export-modal-close {
      background: transparent;
      border: 0;
      color: var(--text-3);
      font-size: 1rem;
      cursor: pointer;
      padding: 2px 6px;
    }

    .export-modal-close:hover { color: var(--accent); }

    .export-modal-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      max-height: 60vh;
    }

    .export-section-label {
      color: var(--text-3);
      font-family: "Cinzel", serif;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border);
    }

    .export-check-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .export-check {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 6px 10px;
      background: var(--bg-4);
      border: 1px solid var(--border-2);
      border-radius: var(--radius);
      color: var(--text-2);
      font-size: 0.78rem;
      cursor: pointer;
      user-select: none;
      transition: all 140ms ease;
    }

    .export-check:hover {
      border-color: rgba(201,168,76,0.3);
      color: var(--text);
    }

    .export-check input[type=checkbox] {
      accent-color: var(--gold);
      width: 14px;
      height: 14px;
      cursor: pointer;
    }

    .export-summary {
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .export-summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .export-summary-row span:first-child { color: var(--text-3); }
    .export-summary-row span:last-child  { color: var(--text);   font-family: "JetBrains Mono", monospace; }

    .export-modal-footer {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      background: var(--bg-2);
    }

    .export-btn-secondary {
      flex: 0 0 auto;
      padding: 8px 16px;
      border: 1px solid var(--border-2);
      border-radius: var(--radius);
      background: var(--bg-4);
      color: var(--text-2);
      font-family: "Cinzel", serif;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .export-btn-primary {
      flex: 1;
      padding: 9px 16px;
      border: 1px solid rgba(201,168,76,0.4);
      border-radius: var(--radius);
      background: linear-gradient(135deg, #2a1a40, #44236e);
      color: var(--gold-2);
      font-family: "Cinzel", serif;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      transition: all 150ms ease;
    }

    .export-btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #3a2a50, #54337e);
      border-color: var(--gold);
    }

    .export-btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

/* =========================================================
   BOOT
   ========================================================= */

window.addEventListener("DOMContentLoaded", () => {
  injectExportStyles();
  injectExportUI();
});

window.openExportModal = openExportModal;
window.closeExportModal = closeExportModal;
window.runExport = runExport;

window.addEventListener("DOMContentLoaded", init);
