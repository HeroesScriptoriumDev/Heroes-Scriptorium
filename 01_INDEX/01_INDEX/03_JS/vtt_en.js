const GRID_SIZE         = 64;
const FEET_PER_CELL     = 5;
const MIN_ZOOM          = 0.2;
const MAX_ZOOM          = 4.0;
const CLOUDINARY_CLOUD  = "dgjuygttj";
const CLOUDINARY_PRESET = "rwskoyva";

const CONDITIONS = [
  "Blinded","Confused","Dazed","Deafened","Exhausted","Fatigued",
  "Frightened","Helpless","Nauseated","Panicked","Paralyzed",
  "Petrified","Prone","Shaken","Sickened","Stunned"
];

const VTT = {
  campaignId:   null,
  userRole:     null,
  cam:          { x: 0, y: 0, zoom: 1 },
  currentSceneId: null,
  scenes:       [],
  mapCols:      24,
  mapRows:      16,
  tokens:       [],
  characters:   [],
  availableCharacters: [],
  selectedTokenId:  null,
  hoveredTokenId:   null,
  dragging:     null,
  dragOffset:   { x: 0, y: 0 },
  activeTool:   "select",
  showGrid:     true,
  showFog:      true,
  showNames:    true,
  fog:          {},
  measuring:    false,
  measureStart: null,
  measureEnd:   null,
  fogBrushSize: 2,
  fogPainting:  false,
  fogPaintMode: "hide",
  calibrateStart: null,
  calibrateEnd:   null,
  pings:        [],
  dirty:        true,
  rafId:        null,
  hpModalTokenId: null,
  feedFilter:   "all",
  lastActionByCharacter: {},
  exportLog:    [],
  sessionStart: new Date()
};

const canvas    = document.getElementById("vtt-canvas");
const ctx       = canvas.getContext("2d");
const miniCanvas = document.getElementById("minimap-canvas");
const miniCtx   = miniCanvas.getContext("2d");

const urlParams = new URLSearchParams(window.location.search);
VTT.campaignId  = urlParams.get("campaign");

let isPanning   = false;
let panStart    = { x: 0, y: 0 };
let panCamStart = { x: 0, y: 0 };

/* =========================================================
   AUTH HELPER — reads token the way authMiddleware expects
   ========================================================= */

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { token } : {}),
    ...extra
  };
}

function getAuthHeadersNoContentType() {
  const token = localStorage.getItem("token");
  return token ? { token } : {};
}

/* =========================================================
   INIT
   ========================================================= */

async function init() {
  VTT.characters = [];
  VTT.tokens     = [];
  VTT.scenes     = [];
  VTT.fog        = {};

  const loaded = await loadVTTState();
  applyRoleView();

  if (!VTT.scenes.length) createDefaultScene();
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
  startSceneSync();

  if (VTT.userRole === "player") {
    await loadAvailableCharacters();
    showPanelEmpty();
  }

  addFeedEntry("system", "System",
    loaded ? "VTT loaded from saved session." : "VTT loaded. No characters or tokens yet."
  );

  setTimeout(() => {
    const overlay = document.getElementById("loading-overlay");
    overlay.classList.add("fade-out");
    setTimeout(() => (overlay.style.display = "none"), 500);
  }, 700);
}

function resizeCanvas() {
  const c = document.getElementById("canvas-container");
  canvas.width  = c.clientWidth;
  canvas.height = c.clientHeight;
  VTT.dirty = true;
}

/* =========================================================
   ROLE VIEW
   ========================================================= */

function applyRoleView() {
  const app  = document.getElementById("app");
  const isDM = VTT.userRole === "dm";
  app.classList.toggle("dm-mode",     isDM);
  app.classList.toggle("player-mode", !isDM);
  const label = document.getElementById("mode-label");
  if (label) label.textContent = isDM ? "DM View" : "Player View";
}

/* =========================================================
   PERSISTENCE — uses correct "token" header
   ========================================================= */

async function loadVTTState() {
  if (!VTT.campaignId) { console.warn("No campaign ID."); return false; }
  try {
    const res  = await fetch(`/api/campaigns/${VTT.campaignId}/vtt-state`, {
      headers: getAuthHeadersNoContentType()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data  = await res.json();
    VTT.userRole = data.role;
    const state  = data.vtt_state;
    if (!state) return false;
    VTT.currentSceneId = state.currentSceneId || null;
    VTT.scenes         = state.scenes     || [];
    VTT.tokens         = state.tokens     || [];
    VTT.characters     = state.characters || [];
    VTT.scenes.forEach(scene => {
      VTT.fog[scene.id] = (state.fog && state.fog[scene.id])
        ? new Uint8Array(state.fog[scene.id])
        : new Uint8Array(scene.cols * scene.rows);
    });
    return true;
  } catch (err) { console.error("loadVTTState:", err); return false; }
}

async function saveVTTState() {
  if (!VTT.campaignId) return;

  // Strip non-serializable fields (_img cache) from scenes before saving
  const cleanScenes = VTT.scenes.map(s => {
    const { _img, ...rest } = s;
    return rest;
  });

  const state = {
    currentSceneId: VTT.currentSceneId,
    scenes:         cleanScenes,
    tokens:         VTT.tokens,
    characters:     VTT.characters,
    fog:            {}
  };
  VTT.scenes.forEach(s => { state.fog[s.id] = Array.from(VTT.fog[s.id] || []); });

  try {
    const res = await fetch(`/api/campaigns/${VTT.campaignId}/vtt-state`, {
      method:  "PUT",
      headers: getAuthHeaders(),
      body:    JSON.stringify({ vtt_state: state })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) { console.error("saveVTTState:", err); }
}

function startAutoSave() {
  setInterval(saveVTTState, 30000);
  window.addEventListener("beforeunload", saveVTTState);
}

/* =========================================================
   CLOUDINARY
   ========================================================= */

async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
}

/* =========================================================
   SCENES
   ========================================================= */

function getSceneConfig(id) { return VTT.scenes.find(s => s.id === id); }

function createDefaultScene() {
  const scene = {
    id: "scene_" + Date.now(), name: "The Tavern",
    cols: 24, rows: 16, bgColor: "#1a1008",
    gridColor: "rgba(201,168,76,0.12)", gridSize: 64, feetPerSquare: 5, imageUrl: null
  };
  VTT.scenes.push(scene);
  VTT.fog[scene.id] = new Uint8Array(scene.cols * scene.rows);
  revealFogCircle(scene.id, Math.floor(scene.cols / 2), Math.floor(scene.rows / 2), 7);
  VTT.currentSceneId = scene.id;
}

function switchScene(sceneId) {
  const cfg = getSceneConfig(sceneId); if (!cfg) return;
  VTT.currentSceneId = sceneId;
  VTT.mapCols = cfg.cols; VTT.mapRows = cfg.rows;
  const sel = document.getElementById("toolbar-scene-select"); if (sel) sel.value = sceneId;
  document.querySelectorAll(".scene-card").forEach(card =>
    card.classList.toggle("active", card.dataset.sceneId === sceneId)
  );
  centerCamera(); updateSceneTokenList(); VTT.dirty = true;
}

function getSceneTokens() { return VTT.tokens.filter(t => t.sceneId === VTT.currentSceneId); }

function renderScenesList() {
  const list = document.getElementById("scenes-list"); if (!list) return;
  list.innerHTML = VTT.scenes.map(s => `
    <div class="scene-card-row">
      <button class="scene-card ${s.id === VTT.currentSceneId ? "active" : ""}"
        data-scene-id="${s.id}" onclick="switchScene('${s.id}')">
        <span>🗺</span><strong>${s.name}</strong>
      </button>
      <button class="scene-delete-btn" title="Delete scene" onclick="deleteScenePrompt('${s.id}')">✕</button>
    </div>`).join("");
}

function renderSceneSelector() {
  const sel = document.getElementById("toolbar-scene-select"); if (!sel) return;
  sel.innerHTML = VTT.scenes.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  sel.value = VTT.currentSceneId;
}

function newScene() {
  document.getElementById("scene-modal-name").value    = "";
  document.getElementById("scene-modal-cols").value    = "";
  document.getElementById("scene-modal-rows").value    = "";
  document.getElementById("scene-modal-map-width").value  = "";
  document.getElementById("scene-modal-map-height").value = "";
  document.getElementById("scene-modal-unit").value    = "ft";
  document.getElementById("scene-modal-bgcolor").value = "#1a1008";
  document.getElementById("scene-modal-filename").textContent = "No file chosen";
  document.getElementById("scene-modal-file").value = "";
  document.getElementById("scene-modal-upload-progress").style.display = "none";
  document.getElementById("scene-modal-grid-preview").textContent = "";
  document.getElementById("scene-modal").classList.add("open");
}

function closeSceneModal() { document.getElementById("scene-modal").classList.remove("open"); }

/* Auto-calculate grid from map dimensions + unit */
function recalcSceneGrid() {
  const mapW    = parseFloat(document.getElementById("scene-modal-map-width").value);
  const mapH    = parseFloat(document.getElementById("scene-modal-map-height").value);
  const unit    = document.getElementById("scene-modal-unit").value;
  const preview = document.getElementById("scene-modal-grid-preview");

  // Convert everything to feet for grid math
  const toFeet = { ft: 1, m: 3.281, yd: 3, mi: 5280 };
  const factor  = toFeet[unit] || 1;
  const fps     = 5; // feet per square — standard D&D

  if (!mapW || !mapH || mapW <= 0 || mapH <= 0) {
    preview.textContent = "";
    return;
  }

  const cols = Math.max(5, Math.min(60, Math.round((mapW * factor) / fps)));
  const rows = Math.max(5, Math.min(60, Math.round((mapH * factor) / fps)));

  document.getElementById("scene-modal-cols").value = cols;
  document.getElementById("scene-modal-rows").value = rows;

  const unitLabel = { ft: "ft", m: "m", yd: "yd", mi: "mi" }[unit];
  preview.textContent = `→ ${cols} × ${rows} squares (5 ft/sq) — map is ${mapW}×${mapH} ${unitLabel}`;
}

async function confirmNewScene() {
  const name    = document.getElementById("scene-modal-name").value.trim() || "New Scene";
  const cols    = Math.max(5, Math.min(60, parseInt(document.getElementById("scene-modal-cols").value, 10) || 24));
  const rows    = Math.max(5, Math.min(60, parseInt(document.getElementById("scene-modal-rows").value, 10) || 16));
  const bgColor = document.getElementById("scene-modal-bgcolor").value || "#1a1008";
  const file    = document.getElementById("scene-modal-file").files[0];

  // Store map dimensions metadata on the scene for reference
  const mapWidth  = parseFloat(document.getElementById("scene-modal-map-width").value)  || null;
  const mapHeight = parseFloat(document.getElementById("scene-modal-map-height").value) || null;
  const mapUnit   = document.getElementById("scene-modal-unit").value || "ft";

  const btn = document.querySelector("#scene-modal .hp-modal-btn.heal");
  btn.disabled = true; btn.textContent = "Creating...";

  let imageUrl = null;
  if (file) {
    document.getElementById("scene-modal-upload-progress").style.display = "block";
    try   { imageUrl = await uploadToCloudinary(file); }
    catch (err) { console.error(err); alert("Image upload failed — scene created without map image."); }
    document.getElementById("scene-modal-upload-progress").style.display = "none";
  }

  const scene = {
    id: "scene_" + Date.now(), name, cols, rows, bgColor,
    gridColor: "rgba(201,168,76,0.12)", gridSize: 64, feetPerSquare: 5, imageUrl,
    mapWidth, mapHeight, mapUnit
  };
  VTT.scenes.push(scene);
  VTT.fog[scene.id] = new Uint8Array(cols * rows);
  revealFogCircle(scene.id, Math.floor(cols / 2), Math.floor(rows / 2), 7);
  renderScenesList(); renderSceneSelector(); switchScene(scene.id);
  await saveVTTState();

  btn.disabled = false; btn.textContent = "Create";
  closeSceneModal();
  addFeedEntry("system", "Scenes", `New scene created: ${name}.${imageUrl ? " Map image uploaded." : ""}`);
}

/* =========================================================
   SCENE DELETION
   ========================================================= */

function deleteScenePrompt(sceneId) {
  const cfg = getSceneConfig(sceneId); if (!cfg) return;
  if (VTT.scenes.length === 1) {
    alert("You cannot delete the last scene. Create another scene first.");
    return;
  }
  if (!confirm(`Delete scene "${cfg.name}"? All tokens on this scene will be removed. This cannot be undone.`)) return;
  deleteScene(sceneId);
}

function deleteScene(sceneId) {
  const cfg = getSceneConfig(sceneId); if (!cfg) return;

  // Remove tokens on this scene
  VTT.tokens = VTT.tokens.filter(t => t.sceneId !== sceneId);

  // Remove fog data
  delete VTT.fog[sceneId];

  // Remove scene
  VTT.scenes = VTT.scenes.filter(s => s.id !== sceneId);

  // If we deleted the active scene, switch to first available
  if (VTT.currentSceneId === sceneId) {
    VTT.currentSceneId = VTT.scenes[0].id;
    VTT.mapCols = VTT.scenes[0].cols;
    VTT.mapRows = VTT.scenes[0].rows;
  }

  renderScenesList();
  renderSceneSelector();
  switchScene(VTT.currentSceneId);
  saveVTTState();
  addFeedEntry("system", "Scenes", `Scene deleted: ${cfg.name}.`);
}

/* =========================================================
   CAMERA
   ========================================================= */

function centerCamera() {
  const cfg = getSceneConfig(VTT.currentSceneId); if (!cfg) return;
  const gs = cfg.gridSize || GRID_SIZE;
  const mapW = cfg.cols * gs, mapH = cfg.rows * gs;
  VTT.cam.x    = mapW / 2; VTT.cam.y = mapH / 2;
  VTT.cam.zoom = Math.min((canvas.width * 0.85) / mapW, (canvas.height * 0.85) / mapH, 1);
  updateZoomDisplay(); VTT.dirty = true;
}

function worldToScreen(wx, wy) {
  return { x: (wx - VTT.cam.x) * VTT.cam.zoom + canvas.width / 2,
           y: (wy - VTT.cam.y) * VTT.cam.zoom + canvas.height / 2 };
}
function screenToWorld(sx, sy) {
  return { x: (sx - canvas.width  / 2) / VTT.cam.zoom + VTT.cam.x,
           y: (sy - canvas.height / 2) / VTT.cam.zoom + VTT.cam.y };
}
function snapToGrid(wx, wy) {
  const cfg = getSceneConfig(VTT.currentSceneId);
  const gs  = cfg ? (cfg.gridSize || GRID_SIZE) : GRID_SIZE;
  return { x: Math.round(wx / gs) * gs, y: Math.round(wy / gs) * gs };
}
function adjustZoom(delta)     { VTT.cam.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, VTT.cam.zoom + delta)); updateZoomDisplay(); VTT.dirty = true; }
function resetView()           { centerCamera(); }
function updateZoomDisplay()   { document.getElementById("zoom-display").textContent = Math.round(VTT.cam.zoom * 100) + "%"; }

/* =========================================================
   FOG
   ========================================================= */

function setFogCell(sceneId, col, row, state) {
  const cfg = getSceneConfig(sceneId); if (!cfg) return;
  if (col < 0 || col >= cfg.cols || row < 0 || row >= cfg.rows) return;
  VTT.fog[sceneId][row * cfg.cols + col] = state;
}

function revealFogCircle(sceneId, cCol, cRow, radius) {
  for (let r = -radius; r <= radius; r++)
    for (let c = -radius; c <= radius; c++)
      if (Math.sqrt(r*r + c*c) <= radius) setFogCell(sceneId, cCol+c, cRow+r, 1);
}

function paintFogAt(sx, sy, mode) {
  const world = screenToWorld(sx, sy);
  const cfg   = getSceneConfig(VTT.currentSceneId);
  const gs    = cfg ? (cfg.gridSize || GRID_SIZE) : GRID_SIZE;
  const col   = Math.floor(world.x / gs), row = Math.floor(world.y / gs);
  const state = mode === "reveal" ? 1 : 0;
  for (let r = -VTT.fogBrushSize; r <= VTT.fogBrushSize; r++)
    for (let c = -VTT.fogBrushSize; c <= VTT.fogBrushSize; c++)
      setFogCell(VTT.currentSceneId, col+c, row+r, state);
  VTT.dirty = true;
}

function clearAllFog()  { VTT.fog[VTT.currentSceneId].fill(0); addFeedEntry("system","Fog","DM hid the full scene.");     VTT.dirty = true; }
function revealAllFog() { VTT.fog[VTT.currentSceneId].fill(1); addFeedEntry("system","Fog","DM revealed the full scene."); VTT.dirty = true; }
function resetFog()     { clearAllFog(); }

/* =========================================================
   RENDER
   ========================================================= */

function startRenderLoop() {
  (function loop() {
    if (VTT.dirty || VTT.pings.length) { render(); renderMinimap(); VTT.dirty = false; }
    VTT.rafId = requestAnimationFrame(loop);
  })();
}

function render() {
  const cfg = getSceneConfig(VTT.currentSceneId); if (!cfg) return;
  const gs  = cfg.gridSize || GRID_SIZE;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.setTransform(VTT.cam.zoom, 0, 0, VTT.cam.zoom,
    -VTT.cam.x * VTT.cam.zoom + canvas.width  / 2,
    -VTT.cam.y * VTT.cam.zoom + canvas.height / 2);

  ctx.fillStyle = cfg.bgColor;
  ctx.fillRect(0, 0, cfg.cols * gs, cfg.rows * gs);
  drawMapImage(cfg, gs);
  drawMapTexture(cfg, gs);
  if (VTT.showGrid) drawGrid(cfg, gs);
  ctx.strokeStyle = "rgba(201,168,76,0.3)"; ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, cfg.cols * gs, cfg.rows * gs);
  getSceneTokens().forEach(drawToken);
  if (VTT.measuring && VTT.measureStart && VTT.measureEnd) drawMeasurement(cfg, gs);
  drawCalibrationLine();
  drawPings();
  ctx.restore();

  const isDM = document.getElementById("app").classList.contains("dm-mode");
  if (VTT.showFog) drawFog(cfg, gs, isDM ? 0.28 : 1);
  if (VTT.selectedTokenId) {
    const token = VTT.tokens.find(t => t.id === VTT.selectedTokenId);
    if (token && token.sceneId === VTT.currentSceneId) drawSelectionRingScreenSpace(token);
  }
}

function drawMapImage(cfg, gs) {
  if (!cfg.imageUrl) return;
  if (!cfg._img) {
    cfg._img = new Image();
    cfg._img.src = cfg.imageUrl;
    cfg._img.onload = () => { VTT.dirty = true; };
  }
  if (cfg._img.complete && cfg._img.naturalWidth > 0) {
    ctx.drawImage(cfg._img, 0, 0, cfg.cols * gs, cfg.rows * gs);
  }
}

function drawMapTexture(cfg, gs) {
  ctx.save(); ctx.globalAlpha = 0.03; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 0.5;
  const w = cfg.cols * gs, h = cfg.rows * gs;
  ctx.beginPath();
  for (let i = -h; i < w + h; i += 32) { ctx.moveTo(i, 0); ctx.lineTo(i + h, h); }
  ctx.stroke(); ctx.restore();
}

function drawGrid(cfg, gs) {
  ctx.save(); ctx.strokeStyle = cfg.gridColor; ctx.lineWidth = 1 / VTT.cam.zoom;
  ctx.beginPath();
  for (let c = 0; c <= cfg.cols; c++) { ctx.moveTo(c*gs, 0); ctx.lineTo(c*gs, cfg.rows*gs); }
  for (let r = 0; r <= cfg.rows; r++) { ctx.moveTo(0, r*gs); ctx.lineTo(cfg.cols*gs, r*gs); }
  ctx.stroke(); ctx.restore();
}

function drawToken(token) {
  const char = findCharByToken(token); if (!char) return;
  const cx = token.x + token.size/2, cy = token.y + token.size/2, r = token.size/2 - 3;
  const isSel = token.id === VTT.selectedTokenId, isHov = token.id === VTT.hoveredTokenId;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  const grad = ctx.createRadialGradient(cx-r*0.2, cy-r*0.2, r*0.1, cx, cy, r);
  grad.addColorStop(0, lightenHex(char.color, 30)); grad.addColorStop(1, char.color);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = grad; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = isSel ? "#f62782" : isHov ? "rgba(226,201,126,0.8)" : "rgba(201,168,76,0.4)";
  ctx.lineWidth = isSel ? 3 : 1.5; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.round(r*0.55)}px 'Cinzel',serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(char.initials, cx, cy);
  const pct = Math.max(0, char.hpCurrent / char.hpMax), bw = token.size-8, by = token.y+token.size+4;
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(token.x+4, by, bw, 5);
  ctx.fillStyle = pct > 0.6 ? "#52c46a" : pct > 0.25 ? "#c9a84c" : "#e05252";
  ctx.fillRect(token.x+4, by, Math.round(bw*pct), 5);
  if (VTT.showNames) {
    ctx.font = "600 10px 'Crimson Text',serif"; ctx.fillStyle = "rgba(232,228,220,0.9)";
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(char.name.split(" ")[0], cx, by+8);
  }
  (char.conditions||[]).slice(0,5).forEach((_,i) => {
    ctx.beginPath(); ctx.arc(token.x+6+i*10, token.y+4, 4, 0, Math.PI*2);
    ctx.fillStyle = "#e05252"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1; ctx.stroke();
  });
}

function drawSelectionRingScreenSpace(token) {
  const sc = worldToScreen(token.x+token.size/2, token.y+token.size/2);
  const sr = (token.size/2)*VTT.cam.zoom + 4;
  ctx.beginPath(); ctx.arc(sc.x, sc.y, sr, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(246,39,130,0.85)"; ctx.lineWidth = 2;
  ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
}

function drawFog(cfg, gs, opacityMult) {
  const fog = VTT.fog[VTT.currentSceneId]; if (!fog) return;
  const scaledCell = gs * VTT.cam.zoom, origin = worldToScreen(0, 0);
  for (let row = 0; row < cfg.rows; row++) {
    for (let col = 0; col < cfg.cols; col++) {
      if (fog[row * cfg.cols + col] === 1) continue;
      ctx.fillStyle = `rgba(0,0,0,${0.92 * opacityMult})`;
      ctx.fillRect(origin.x + col*scaledCell, origin.y + row*scaledCell, scaledCell+0.5, scaledCell+0.5);
    }
  }
}

function drawMeasurement(cfg, gs) {
  const s = VTT.measureStart, e = VTT.measureEnd;
  const fps  = cfg ? (cfg.feetPerSquare || FEET_PER_CELL) : FEET_PER_CELL;
  const dist = Math.sqrt((e.x-s.x)**2 + (e.y-s.y)**2);
  const feet = Math.round((dist / gs) * fps);
  const mid  = { x: (s.x+e.x)/2, y: (s.y+e.y)/2 };
  ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(e.x,e.y);
  ctx.strokeStyle = "rgba(201,168,76,0.8)"; ctx.lineWidth = 2/VTT.cam.zoom;
  ctx.setLineDash([8,4]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "rgba(24,24,24,0.75)"; ctx.fillRect(mid.x-26, mid.y-10, 52, 20);
  ctx.fillStyle = "rgba(201,168,76,1)"; ctx.font = "bold 11px 'JetBrains Mono',monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(`${feet} ft.`, mid.x, mid.y);
  const el = document.getElementById("measurement-display");
  el.textContent = `${feet} ft.`; el.style.display = "block";
}

function drawCalibrationLine() {
  if (VTT.activeTool !== "calibrate" || !VTT.calibrateStart) return;
  const end = VTT.calibrateEnd || VTT.calibrateStart;
  ctx.beginPath(); ctx.moveTo(VTT.calibrateStart.x, VTT.calibrateStart.y); ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = "rgba(246,39,130,0.9)"; ctx.lineWidth = 2/VTT.cam.zoom;
  ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
  [VTT.calibrateStart, end].forEach(pt => {
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 5/VTT.cam.zoom, 0, Math.PI*2);
    ctx.fillStyle = "rgba(246,39,130,1)"; ctx.fill();
  });
}

function drawPings() {
  const now = Date.now();
  VTT.pings = VTT.pings.filter(p => now - p.time < 2000);
  VTT.pings.forEach(ping => {
    const age = (now - ping.time)/2000, alpha = 1-age, radius = 10+age*30;
    ctx.beginPath(); ctx.arc(ping.x, ping.y, radius, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(246,39,130,${alpha*0.8})`; ctx.lineWidth = 2/VTT.cam.zoom; ctx.stroke();
    ctx.beginPath(); ctx.arc(ping.x, ping.y, 6, 0, Math.PI*2);
    ctx.fillStyle = `rgba(246,39,130,${alpha})`; ctx.fill();
  });
}

function renderMinimap() {
  const cfg = getSceneConfig(VTT.currentSceneId); if (!cfg) return;
  const gs = cfg.gridSize || GRID_SIZE;

  // Use fixed internal resolution — don't rely on offsetWidth which can be 0
  const W = 120, H = 80;
  miniCanvas.width  = W;
  miniCanvas.height = H;

  const scaleX = W / (cfg.cols * gs);
  const scaleY = H / (cfg.rows * gs);

  // Background
  miniCtx.fillStyle = cfg.bgColor;
  miniCtx.fillRect(0, 0, W, H);

  // Draw map image if present
  if (cfg.imageUrl) {
    if (!cfg._img) {
      cfg._img = new Image();
      cfg._img.src = cfg.imageUrl;
      cfg._img.onload = () => { VTT.dirty = true; };
    }
    if (cfg._img.complete && cfg._img.naturalWidth > 0) {
      miniCtx.drawImage(cfg._img, 0, 0, W, H);
    }
  }

  // Grid overlay (subtle)
  miniCtx.strokeStyle = "rgba(201,168,76,0.15)";
  miniCtx.lineWidth = 0.5;
  for (let c = 0; c <= cfg.cols; c++) {
    miniCtx.beginPath();
    miniCtx.moveTo(c * scaleX * gs, 0);
    miniCtx.lineTo(c * scaleX * gs, H);
    miniCtx.stroke();
  }
  for (let r = 0; r <= cfg.rows; r++) {
    miniCtx.beginPath();
    miniCtx.moveTo(0, r * scaleY * gs);
    miniCtx.lineTo(W, r * scaleY * gs);
    miniCtx.stroke();
  }

  // Tokens
  getSceneTokens().forEach(token => {
    const char = findCharByToken(token); if (!char) return;
    miniCtx.beginPath();
    miniCtx.arc(
      token.x * scaleX + (token.size * scaleX) / 2,
      token.y * scaleY + (token.size * scaleY) / 2,
      3, 0, Math.PI * 2
    );
    miniCtx.fillStyle = char.color;
    miniCtx.fill();
  });

  // Viewport rectangle — shows where the main camera is looking
  const tl = screenToWorld(0, 0);
  const br = screenToWorld(canvas.width, canvas.height);
  miniCtx.strokeStyle = "rgba(201,168,76,0.7)";
  miniCtx.lineWidth = 1.5;
  miniCtx.strokeRect(
    tl.x * scaleX, tl.y * scaleY,
    (br.x - tl.x) * scaleX,
    (br.y - tl.y) * scaleY
  );
}

/* =========================================================
   CALIBRATION
   ========================================================= */

function finishCalibration() {
  if (!VTT.calibrateStart || !VTT.calibrateEnd) return;
  const cfg = getSceneConfig(VTT.currentSceneId); if (!cfg) return;
  const dx = VTT.calibrateEnd.x - VTT.calibrateStart.x;
  const dy = VTT.calibrateEnd.y - VTT.calibrateStart.y;
  const px = Math.sqrt(dx*dx + dy*dy);
  const knownFeet = parseFloat(prompt("How many feet does this line represent?", "30"));
  if (isNaN(knownFeet) || knownFeet <= 0) { VTT.calibrateStart = VTT.calibrateEnd = null; return; }
  const fps = parseFloat(prompt("Feet per square?", "5"));
  if (isNaN(fps) || fps <= 0) { VTT.calibrateStart = VTT.calibrateEnd = null; return; }
  cfg.gridSize      = Math.max(16, Math.min(256, Math.round((px / knownFeet) * fps)));
  cfg.feetPerSquare = fps;
  VTT.calibrateStart = VTT.calibrateEnd = null;
  setTool("select"); centerCamera(); VTT.dirty = true;
  addFeedEntry("system","Grid",`Calibrated: ${fps} ft/sq → grid = ${cfg.gridSize}px`);
  saveVTTState();
}

/* =========================================================
   TOKEN / INSPECTOR
   ========================================================= */

function tokenAt(wx, wy) {
  const ts = getSceneTokens();
  for (let i = ts.length-1; i >= 0; i--) {
    const t = ts[i];
    if (wx >= t.x && wx <= t.x+t.size && wy >= t.y && wy <= t.y+t.size) return t;
  }
  return null;
}

function findCharByToken(token) { return VTT.characters.find(c => c.id === token.characterId); }

function selectToken(tokenId) {
  VTT.selectedTokenId = tokenId; VTT.dirty = true;
  if (!tokenId) { showPanelEmpty(); return; }
  const token = VTT.tokens.find(t => t.id === tokenId);
  const char  = token ? findCharByToken(token) : null;
  if (char) populateInspector(char, token);
}

function showPanelEmpty() {
  document.getElementById("panel-empty").classList.remove("hidden");
  document.getElementById("panel-inspector").classList.add("hidden");
  document.getElementById("panel-subtitle").textContent = "No token selected";
  if (VTT.userRole === "player") renderCharacterPicker();
}

/* =========================================================
   PLAYER CHARACTER PICKER
   ========================================================= */

async function loadAvailableCharacters() {
  if (!VTT.campaignId) return;
  try {
    const res = await fetch(`/api/campaigns/${VTT.campaignId}/my-characters`, {
      headers: getAuthHeadersNoContentType()
    });
    if (!res.ok) return;
    const data = await res.json();
    VTT.availableCharacters = data.characters || [];
  } catch (err) { console.error("loadAvailableCharacters:", err); }
}

function renderCharacterPicker() {
  const empty = document.getElementById("panel-empty"); if (!empty) return;

  if (!VTT.availableCharacters || !VTT.availableCharacters.length) {
    empty.innerHTML = `
      <div class="char-picker-wrap">
        <div class="panel-empty-icon">⬚</div>
        <div class="panel-empty-text">No characters found in this campaign.<br>
          <a href="/characters_en.html" class="char-picker-link">Create a character first</a>
        </div>
      </div>`;
    return;
  }

  // Check if the player already has a token on this scene
  const existingToken = VTT.tokens.find(t =>
    t.sceneId === VTT.currentSceneId &&
    VTT.availableCharacters.some(c => c.id === t.characterId)
  );
  if (existingToken) {
    empty.innerHTML = `
      <div class="char-picker-wrap">
        <div class="panel-empty-icon">⚔</div>
        <div class="panel-empty-text">You're in the scene.<br>Click your token on the map to inspect it.</div>
      </div>`;
    return;
  }

  const opts = VTT.availableCharacters.map(c =>
    `<option value="${c.id}">${c.character_name} — ${c.class||"?"} ${c.level||1}</option>`
  ).join("");

  empty.innerHTML = `
    <div class="char-picker-wrap">
      <div class="char-picker-title">⚔ Enter the Scene</div>
      <div class="char-picker-subtitle">Choose which character you're playing today</div>
      <select class="char-picker-select" id="char-picker-select">
        <option value="">— Select a character —</option>${opts}
      </select>
      <div id="char-picker-preview" class="char-picker-preview"></div>
      <button class="char-picker-btn" onclick="spawnPlayerToken()">Enter Scene</button>
    </div>`;

  document.getElementById("char-picker-select").addEventListener("change", function() {
    const charId = this.value;
    const preview = document.getElementById("char-picker-preview");
    if (!charId) { preview.innerHTML = ""; return; }
    const c = VTT.availableCharacters.find(x => x.id === charId);
    if (!c) { preview.innerHTML = ""; return; }
    preview.innerHTML = `
      <div class="char-picker-card">
        <div class="char-picker-avatar" style="background:linear-gradient(135deg,${darkenHex(c.color||"#7b5ea7",30)},${c.color||"#7b5ea7"})">${(c.character_name||"?").slice(0,2).toUpperCase()}</div>
        <div class="char-picker-info">
          <div class="char-picker-name">${c.character_name}</div>
          <div class="char-picker-meta">${c.race||"Unknown"} ${c.class||"Unknown"} · Level ${c.level||1}</div>
          <div class="char-picker-hp">HP ${c.hp_current||c.hp_max||"?"} / ${c.hp_max||"?"} &nbsp;·&nbsp; AC ${c.ac||"?"}</div>
        </div>
      </div>`;
  });
}

function spawnPlayerToken() {
  const sel = document.getElementById("char-picker-select");
  if (!sel || !sel.value) { alert("Please select a character first."); return; }
  const char = VTT.availableCharacters.find(c => c.id === sel.value); if (!char) return;
  const vttChar = {
    id:              char.id,
    name:            char.character_name,
    initials:        char.character_name.slice(0,2).toUpperCase(),
    race:            char.race            || "Unknown",
    class:           char.class           || "Unknown",
    level:           char.level           || 1,
    playerName:      char.playerName      || "Player",
    color:           char.color           || "#7b5ea7",
    hpCurrent:       char.hp_current      || char.hp_max || 10,
    hpMax:           char.hp_max          || 10,
    ac:              char.ac              || 10,
    bab:             char.bab             || 0,
    str: char.str||10, dex: char.dex||10, con: char.con||10,
    int: char.int||10, wis: char.wis||10, cha: char.cha||10,
    fortTotal:       char.fort_total      || 0,
    refTotal:        char.ref_total       || 0,
    willTotal:       char.will_total      || 0,
    initiativeTotal: char.initiative_total|| 0,
    conditions: [], recentActions: [],
    skills: char.skills||{}, weapons: char.weapons||[], spells: char.spells||[], favorites: char.favorites||[]
  };
  if (!VTT.characters.find(c => c.id === vttChar.id)) VTT.characters.push(vttChar);
  const cfg = getSceneConfig(VTT.currentSceneId);
  const gs  = cfg ? (cfg.gridSize || GRID_SIZE) : GRID_SIZE;
  spawnTokenAt(vttChar.id, Math.floor(cfg.cols/2)*gs + gs/2, Math.floor(cfg.rows/2)*gs + gs/2);
  saveVTTState();
  addFeedEntry("system", vttChar.name, "entered the scene.");
  showPanelEmpty();
}

function populateInspector(char, token) {
  document.getElementById("panel-empty").classList.add("hidden");
  document.getElementById("panel-inspector").classList.remove("hidden");
  document.getElementById("panel-subtitle").textContent = "Token Selected";
  const portrait = document.getElementById("insp-portrait");
  portrait.textContent = char.initials;
  portrait.style.background = `linear-gradient(135deg,${darkenHex(char.color,30)},${char.color})`;
  document.getElementById("insp-name").textContent  = char.name;
  document.getElementById("insp-class").textContent = `${char.race} ${char.class} ${char.level}`;
  document.getElementById("insp-owner").textContent = char.playerName;
  updateInspectorHP(char); populateStats(char); populateRecentActions(char);
  populateSkills(char); populateConditions(char); populateFavorites(char);
  populateWeapons(char); populateSpells(char);
}

function populateStats(char) {
  const stats = [
    {label:"AC",value:char.ac},{label:"HP",value:`${char.hpCurrent}/${char.hpMax}`},
    {label:"Init",value:formatMod(char.initiativeTotal)},{label:"BAB",value:formatMod(char.bab)},
    {label:"Fort",value:formatMod(char.fortTotal)},{label:"Ref",value:formatMod(char.refTotal)},
    {label:"Will",value:formatMod(char.willTotal)},{label:"STR",value:char.str},{label:"DEX",value:char.dex}
  ];
  document.getElementById("insp-stat-grid").innerHTML = stats.map(s =>
    `<div class="stat-pill"><div class="stat-pill-value">${s.value}</div><div class="stat-pill-label">${s.label}</div></div>`
  ).join("");
}

function populateRecentActions(char) {
  const recent = char.recentActions&&char.recentActions.length ? char.recentActions : [
    {name:"Initiative",formula:`1d20${formatMod(char.initiativeTotal)}`,tag:"roll"},
    {name:"Fort Save", formula:`1d20${formatMod(char.fortTotal)}`,      tag:"save"},
    {name:"Ref Save",  formula:`1d20${formatMod(char.refTotal)}`,       tag:"save"},
    {name:"Will Save", formula:`1d20${formatMod(char.willTotal)}`,      tag:"save"}
  ];
  document.getElementById("insp-recent-actions").innerHTML = recent.slice(0,6).map(a =>
    `<button class="qr-btn" onclick="rollCharacterFormula('${char.id}','${escapeAttr(a.name)}','${escapeAttr(a.formula)}')">${actionIcon(a.tag)} ${a.name.replace(" Damage"," Dmg")}</button>`
  ).join("");
}

function populateSkills(char) {
  if (!char.skills||!Object.keys(char.skills).length) {
    document.getElementById("skills-list").innerHTML = `<div style="color:var(--text-3);font-size:0.75rem;padding:4px 8px;">No skills listed.</div>`;
    return;
  }
  document.getElementById("skills-list").innerHTML = Object.entries(char.skills).map(([skill,mod]) => {
    const label = skill.replace(/_/g," ");
    return `<button class="skill-roll-btn" onclick="rollCharacterFormula('${char.id}','${escapeAttr(label)} Check','1d20${formatMod(mod)}')"><span>${label}</span><span>${formatMod(mod)}</span></button>`;
  }).join("");
}

function populateConditions(char) {
  document.getElementById("conditions-row").innerHTML = CONDITIONS.slice(0,12).map(cond => {
    const active = (char.conditions||[]).includes(cond);
    return `<button class="condition-tag ${active?"active":"inactive"}" onclick="toggleCondition('${char.id}','${cond}')">${cond}</button>`;
  }).join("");
}

function populateFavorites(char) {
  document.getElementById("favorite-grid").innerHTML = (char.favorites||[]).map(fav => {
    const built = buildFavoriteAction(char, fav); if (!built) return "";
    return `<button class="favorite-btn" onclick="rollCharacterFormula('${char.id}','${escapeAttr(built.name)}','${escapeAttr(built.formula)}')">${built.icon} ${built.shortName}</button>`;
  }).join("");
}

function buildFavoriteAction(char, fav) {
  if (fav.kind==="weapon") {
    const w = (char.weapons||[]).find(x=>x.id===fav.id); if (!w) return null;
    const d = fav.mode==="damage";
    return {icon:d?"🩸":"⚔",name:`${w.name} ${d?"Damage":"Attack"}`,shortName:`${w.name}${d?" Dmg":""}`.trim(),formula:d?w.damage:w.attack};
  }
  if (fav.kind==="spell") {
    const s = (char.spells||[]).find(x=>x.id===fav.id); if (!s) return null;
    const f = fav.mode==="damage"&&s.damage?s.damage:s.cast||"1d20";
    return {icon:fav.mode==="damage"?"🔥":"✦",name:`${s.name} ${fav.mode==="damage"?"Damage":"Cast"}`,shortName:s.name,formula:f};
  }
  return {icon:fav.kind==="skill"?"⚡":"🎲",name:fav.name,shortName:fav.name,formula:fav.formula};
}

function populateWeapons(char) {
  const list = document.getElementById("weapons-list");
  if (!char.weapons||!char.weapons.length) { list.innerHTML=`<div class="action-card"><div><div class="action-title">No Weapons</div><div class="action-meta">Nothing linked yet</div></div></div>`; return; }
  list.innerHTML = char.weapons.map(w => `
    <div class="action-card">
      <div><div class="action-title">${w.favorite?"★ ":""}${w.name}</div><div class="action-meta">Atk ${w.attack} | Dmg ${w.damage} | ${w.crit}</div></div>
      <div class="action-buttons">
        <button onclick="rollCharacterFormula('${char.id}','${escapeAttr(w.name)} Attack','${escapeAttr(w.attack)}')">Atk</button>
        <button onclick="rollCharacterFormula('${char.id}','${escapeAttr(w.name)} Damage','${escapeAttr(w.damage)}')">Dmg</button>
      </div>
    </div>`).join("");
}

function populateSpells(char) {
  const list = document.getElementById("spells-list");
  if (!char.spells||!char.spells.length) { list.innerHTML=`<div class="action-card"><div><div class="action-title">No Spells</div><div class="action-meta">Martial character or none prepared</div></div></div>`; return; }
  list.innerHTML = char.spells.map(sp => `
    <div class="action-card">
      <div><div class="action-title">${sp.favorite?"★ ":""}${sp.name}</div><div class="action-meta">${sp.range} | Save: ${sp.save}${sp.damage?" | "+sp.damage:""}</div></div>
      <div class="action-buttons">
        <button onclick="castSpell('${char.id}','${sp.id}')">Cast</button>
        ${sp.damage?`<button onclick="rollCharacterFormula('${char.id}','${escapeAttr(sp.name)} Damage','${escapeAttr(sp.damage)}')">Dmg</button>`:""}
      </div>
    </div>`).join("");
}

function updateInspectorHP(char) {
  const pct = Math.max(0, char.hpCurrent / char.hpMax);
  document.getElementById("insp-hp-value").textContent = `${char.hpCurrent} / ${char.hpMax}`;
  const bar = document.getElementById("insp-hp-bar");
  bar.style.width = Math.round(pct*100)+"%";
  bar.className = "hp-bar-fill"+(pct<=0.25?" critical":pct<=0.6?" wounded":"");
}

function toggleCondition(charId, condition) {
  const char = VTT.characters.find(c => c.id===charId); if (!char) return;
  if (!char.conditions) char.conditions = [];
  const idx = char.conditions.indexOf(condition);
  if (idx>=0) { char.conditions.splice(idx,1); addFeedEntry("system",char.name,`Condition removed: ${condition}`); }
  else        { char.conditions.push(condition); addFeedEntry("system",char.name,`Condition applied: ${condition}`); }
  populateConditions(char); VTT.dirty = true;
}

function toggleSkillsDropdown() {
  const list = document.getElementById("skills-list"), arrow = document.getElementById("skills-arrow");
  list.classList.toggle("open"); arrow.textContent = list.classList.contains("open")?"▴":"▾";
}
function toggleActionSection(id) { document.getElementById(id).classList.toggle("open"); }
function openLinkedSheet() { const c=getSelectedCharacter(); alert(c?`Opening sheet for ${c.name}.`:"No character selected."); }

/* =========================================================
   HP
   ========================================================= */

function quickHPAdjust(mode) {
  const char = getSelectedCharacter(); if (!char) return;
  const input = document.getElementById("insp-hp-input");
  const amt   = parseInt(input.value,10)||1;
  applyHPChange(char, mode==="heal"?amt:-amt); input.value="";
}

function applyHPChange(char, delta) {
  const old = char.hpCurrent;
  char.hpCurrent = Math.max(0, Math.min(char.hpMax, char.hpCurrent+delta));
  updateInspectorHP(char); populateStats(char); VTT.dirty = true;
  const label = delta>0?`+${delta} Healed`:`${Math.abs(delta)} Damage`;
  showRollToast(char.name, label, "", Math.abs(delta), delta>0?"heal":"damage");
  addFeedEntry("system",char.name,`${label}. HP ${old} → ${char.hpCurrent}`);
}

function openHPModal(tokenId, sx, sy) {
  VTT.hpModalTokenId = tokenId;
  const modal = document.getElementById("hp-modal");
  modal.style.display="block"; modal.style.left=sx+"px"; modal.style.top=Math.max(10,sy-120)+"px";
}
function closeHPModal() { document.getElementById("hp-modal").style.display="none"; VTT.hpModalTokenId=null; }
function applyHPModal(mode) {
  if (!VTT.hpModalTokenId) return;
  const token = VTT.tokens.find(t=>t.id===VTT.hpModalTokenId);
  const char  = token?findCharByToken(token):null; if (!char) return;
  applyHPChange(char, mode==="heal"?(parseInt(document.getElementById("hp-modal-input").value,10)||1):-(parseInt(document.getElementById("hp-modal-input").value,10)||1));
  closeHPModal();
}

/* =========================================================
   DICE AND ROLLS
   ========================================================= */

function rollCharacterFormula(charId, label, formula) {
  const char = VTT.characters.find(c=>c.id===charId); if (!char) return;
  const roll = rollFormula(formula);
  recordRecentAction(char, label, formula);
  showRollToast(char.name, label, formula, roll.total, "roll", roll.dice);
  addFeedEntry("roll",char.name,label,formula,roll.total,roll.parts.join(" + "));
  if (VTT.selectedTokenId) populateInspector(char, VTT.tokens.find(t=>t.id===VTT.selectedTokenId));
}

function castSpell(charId, spellId) {
  const char = VTT.characters.find(c=>c.id===charId); if (!char) return;
  const spell = char.spells.find(s=>s.id===spellId); if (!spell) return;
  recordRecentAction(char,`${spell.name} Cast`,spell.cast||"1d20");
  addFeedEntry("system",char.name,`casts ${spell.name}. Range: ${spell.range}. Save: ${spell.save}.`);
  if (spell.damage) {
    const roll = rollFormula(spell.damage);
    showRollToast(char.name,`${spell.name} Damage`,spell.damage,roll.total,"roll",roll.dice);
    addFeedEntry("roll",char.name,`${spell.name} Damage`,spell.damage,roll.total,roll.parts.join(" + "));
  } else showRollToast(char.name,`${spell.name} Cast`,spell.cast||"Cast","✓","roll",[]);
  populateInspector(char, VTT.tokens.find(t=>t.id===VTT.selectedTokenId));
}

function recordRecentAction(char, label, formula) {
  if (!char.recentActions) char.recentActions = [];
  char.recentActions = char.recentActions.filter(a=>a.name!==label);
  char.recentActions.unshift({name:label,formula,tag:inferActionTag(label)});
  char.recentActions = char.recentActions.slice(0,6);
}

function inferActionTag(label) {
  const l = label.toLowerCase();
  if (l.includes("damage")) return "damage";
  if (l.includes("spell")||l.includes("missile")||l.includes("burning")) return "spell";
  if (l.includes("save")) return "save";
  if (l.includes("check")) return "skill";
  if (l.includes("attack")) return "weapon";
  return "roll";
}

function rollFormula(formula) {
  const clean = String(formula).replace(/\s+/g,"");
  const tokens = clean.match(/[+-]?[^+-]+/g)||["0"];
  const dice=[],parts=[]; let total=0;
  tokens.forEach(token => {
    const sign = token.startsWith("-")?-1:1, unsigned = token.replace(/^[+-]/,"");
    const dm = unsigned.match(/^(\d*)d(\d+)$/i);
    if (dm) {
      const count=parseInt(dm[1],10)||1, sides=parseInt(dm[2],10);
      for (let i=0;i<count;i++) { const r=rollDie(sides); dice.push({sides,roll:r}); total+=sign*r; parts.push((sign<0?"-":"")+r); }
    } else { const v=parseInt(unsigned,10)||0; total+=sign*v; parts.push((sign<0?"-":"")+v); }
  });
  return {total,dice,parts};
}

function rollDie(sides) { return Math.floor(Math.random()*sides)+1; }

function showRollToast(player, label, formula, result, type, diceRolls=[]) {
  const stack=document.getElementById("roll-toast-stack"), toast=document.createElement("div");
  const d20=diceRolls.find(d=>d.sides===20), isCrit=d20&&d20.roll===20, isFumble=d20&&d20.roll===1;
  let toastClass="roll-toast",resultClass="",suffix="";
  if (type==="heal") suffix="HP Restored";
  else if (type==="damage") { resultClass="fumble"; suffix="Damage Taken"; }
  else if (isCrit)   { toastClass+=" crit";   resultClass="crit";   suffix="✦ Critical"; }
  else if (isFumble) { toastClass+=" fumble"; resultClass="fumble"; suffix="☠ Fumble"; }
  toast.className = toastClass;
  toast.innerHTML = `<div class="toast-player">${player}</div><div class="toast-label">${label}</div>${formula?`<div class="toast-formula">${formula}</div>`:""}<div class="toast-result ${resultClass}">${result}</div>${suffix?`<div class="toast-suffix">${suffix}</div>`:""}`;
  stack.appendChild(toast);
  setTimeout(()=>{toast.style.transition="opacity 400ms ease";toast.style.opacity="0";setTimeout(()=>toast.remove(),400);},3500);
}

function toggleDiceTray() { document.getElementById("dice-tray").classList.toggle("collapsed"); }
function addDieToFormula(die) { const i=document.getElementById("dice-formula"); i.value=i.value.trim()?i.value+`+1${die}`:`1${die}`; }
function clearDiceFormula() { document.getElementById("dice-formula").value=""; }
function rollDiceTray(vis) {
  const formula=document.getElementById("dice-formula").value.trim(); if (!formula) return;
  const actor=getSelectedCharacter()?.name||"Dice Tray", roll=rollFormula(formula);
  const label=vis==="public"?"Public Roll":vis==="gm"?"GM Roll":"Blind Roll";
  showRollToast(actor,label,formula,roll.total,"roll",roll.dice);
  addFeedEntry("roll",actor,label,formula,roll.total,roll.parts.join(" + "));
}

/* =========================================================
   FEED / CHAT
   ========================================================= */

function addFeedEntry(type, speaker, message, formula="", result="", breakdown="") {
  const entry = {type,speaker,message,formula,result,breakdown,time:new Date()};
  VTT.exportLog.push({...entry});
  renderFeedEntry(entry); renderSideChatEntry(entry);
}

function renderFeedEntry(entry) {
  const log=document.getElementById("player-table-log")||document.getElementById("side-chat-log"); if (!log) return;
  const row=document.createElement("div"); row.className="feed-entry"; row.dataset.type=entry.type;
  row.innerHTML=`<div class="feed-time">${formatTime(entry.time)}</div><div class="feed-body"><div class="feed-speaker">${entry.speaker}</div><div class="feed-message">${entry.message}${entry.result!==""?`<span class="feed-roll-result">Result: ${entry.result}</span>`:""}</div>${entry.formula?`<div class="feed-formula">${entry.formula}</div>`:""}</div>`;
  log.appendChild(row); log.scrollTop=log.scrollHeight;
}

function renderSideChatEntry(entry) {
  if (entry.type!=="chat"&&entry.type!=="system") return;
  const log=document.getElementById("side-chat-log")||document.getElementById("party-chat-log");
  const row=document.createElement("div"); row.className="side-entry";
  row.innerHTML=`<div class="feed-body"><div class="feed-speaker">${entry.speaker} <span class="feed-time">${formatTime(entry.time)}</span></div><div class="feed-message">${entry.message}</div></div>`;
  log.appendChild(row); log.scrollTop=log.scrollHeight;
}

function sendFeedChat(event) {
  event.preventDefault();
  const input=document.getElementById("feed-input"),channel=document.getElementById("feed-channel").value,text=input.value.trim(); if (!text) return;
  if (text.startsWith("/roll ")) {
    const f=text.replace("/roll ","").trim(),actor=getSelectedCharacter()?.name||"Player",r=rollFormula(f);
    showRollToast(actor,"Chat Roll",f,r.total,"roll",r.dice); addFeedEntry("roll",actor,"Chat Roll",f,r.total,r.parts.join(" + "));
  } else { addFeedEntry("chat",channel==="In Character"?getSelectedCharacter()?.name||"Character":channel,text); }
  input.value="";
}

function sendPartyChat(event) {
  event.preventDefault();
  const input=document.getElementById("party-chat-input"); if (!input||!input.value.trim()) return;
  const log=document.getElementById("party-chat-log"); if (!log) return;
  const row=document.createElement("div"); row.className="side-entry";
  row.innerHTML=`<div class="feed-body"><div class="feed-speaker">${VTT.currentPlayer?.name||"Player"} <span class="feed-time">${formatTime(new Date())}</span></div><div class="feed-message">${input.value.trim()}</div></div>`;
  log.appendChild(row); log.scrollTop=log.scrollHeight; input.value="";
}

function formatTime(date) { const d=new Date(date); if (isNaN(d.getTime())) return "--:--"; return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}); }

/* =========================================================
   CONTEXT MENU
   ========================================================= */

function showCtxMenu(token, sx, sy) {
  const char=findCharByToken(token); if (!char) return;
  const fw=char.weapons?.[0],fs=char.spells?.[0];
  const menu=document.getElementById("ctx-menu");
  menu.innerHTML=`<div class="ctx-header"><div class="ctx-token-name">${char.name}</div><div class="ctx-token-meta">${char.race} ${char.class} ${char.level} • HP ${char.hpCurrent}/${char.hpMax}</div></div><div class="ctx-sub">Quick Actions</div>${fw?`<button class="ctx-item roll" onclick="rollCharacterFormula('${char.id}','${escapeAttr(fw.name)} Attack','${escapeAttr(fw.attack)}')">⚔ ${fw.name} Attack</button><button class="ctx-item roll" onclick="rollCharacterFormula('${char.id}','${escapeAttr(fw.name)} Damage','${escapeAttr(fw.damage)}')">🩸 ${fw.name} Damage</button>`:""}${fs?`<button class="ctx-item roll" onclick="castSpell('${char.id}','${fs.id}')">✦ Cast ${fs.name}</button>`:""}<button class="ctx-item roll" onclick="rollCharacterFormula('${char.id}','Initiative','1d20${formatMod(char.initiativeTotal)}')">⚡ Initiative</button><button class="ctx-item" onclick="openHPModal('${token.id}',${sx},${sy})">❤ Adjust HP</button><button class="ctx-item" onclick="openLinkedSheet()">📋 Open Sheet</button><button class="ctx-item danger" onclick="deleteToken('${token.id}')">✕ Remove Token</button>`;
  menu.style.left=sx+"px"; menu.style.top=sy+"px"; menu.style.display="block";
}

function closeCtxMenu() { document.getElementById("ctx-menu").style.display="none"; }

function deleteToken(tokenId) {
  VTT.tokens=VTT.tokens.filter(t=>t.id!==tokenId);
  if (VTT.selectedTokenId===tokenId) selectToken(null);
  closeCtxMenu(); updateSceneTokenList(); VTT.dirty=true;
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function renderSidebar() { renderScenesList(); renderCharacters(); updateSceneTokenList(); }

function renderCharacters() {
  const list=document.getElementById("char-list");
  if (!VTT.characters.length) { list.innerHTML=`<div style="color:var(--text-3);font-size:0.75rem;padding:8px 4px;">No characters linked yet.</div>`; return; }
  list.innerHTML=VTT.characters.map(char=>`<div class="char-card" draggable="true" ondragstart="dragCharStart(event,'${char.id}')"><div class="char-avatar" style="background:linear-gradient(135deg,${darkenHex(char.color,30)},${char.color})">${char.initials}</div><div class="char-info"><div class="char-name">${char.name}</div><div class="char-meta">${char.race} ${char.class} ${char.level}</div></div></div>`).join("");
}

function updateSceneTokenList() {
  const list=document.getElementById("scene-token-list"),tokens=getSceneTokens();
  if (!tokens.length) { list.innerHTML=`<div style="color:var(--text-3);font-size:0.75rem;padding:8px 4px;">No tokens on this scene.</div>`; return; }
  list.innerHTML=tokens.map(token=>{const char=findCharByToken(token);if(!char)return"";return`<button class="char-card" onclick="selectToken('${token.id}')"><div class="char-avatar" style="background:linear-gradient(135deg,${darkenHex(char.color,30)},${char.color})">${char.initials}</div><div class="char-info"><div class="char-name">${char.name}</div><div class="char-meta">HP ${char.hpCurrent}/${char.hpMax}</div></div></button>`;}).join("");
}

function setSidebarTab(tab, btn) {
  document.querySelectorAll("#dm-sidebar .sidebar-tab").forEach(t=>t.classList.remove("active")); btn.classList.add("active");
  ["scenes","chars","fog","table"].forEach(id=>document.getElementById(`sidebar-${id}`).classList.toggle("hidden",id!==tab));
}

function setPlayerTab(tab, btn) {
  document.querySelectorAll("#player-chat-sidebar .sidebar-tab").forEach(t=>t.classList.remove("active")); btn.classList.add("active");
  document.getElementById("player-party").classList.toggle("hidden",tab!=="party");
  document.getElementById("player-table").classList.toggle("hidden",tab!=="table");
}

function dragCharStart(event, charId) { event.dataTransfer.setData("charId",charId); }

function spawnTokenAt(charId, worldX, worldY) {
  const cfg=getSceneConfig(VTT.currentSceneId), gs=cfg?(cfg.gridSize||GRID_SIZE):GRID_SIZE;
  const snap=snapToGrid(worldX-gs/2, worldY-gs/2);
  VTT.tokens.push({id:"token_"+Date.now(),sceneId:VTT.currentSceneId,characterId:charId,x:snap.x,y:snap.y,size:gs,controllable:true});
  updateSceneTokenList(); VTT.dirty=true;
}

function spawnTokenPrompt() {
  if (!VTT.characters.length) { alert("No characters available."); return; }
  const cfg=getSceneConfig(VTT.currentSceneId); if (!cfg) return;
  const gs=cfg.gridSize||GRID_SIZE;
  spawnTokenAt(VTT.characters[0].id, Math.floor(cfg.cols/2)*gs+gs/2, Math.floor(cfg.rows/2)*gs+gs/2);
}

function linkCharacterPrompt() { alert("Character linking browser coming soon."); }

/* =========================================================
   EVENTS
   ========================================================= */

function attachEvents() {
  window.addEventListener("resize", ()=>{resizeCanvas();VTT.dirty=true;});
  document.getElementById("fog-brush-size").addEventListener("input", e=>{
    VTT.fogBrushSize=parseInt(e.target.value,10);
    document.getElementById("fog-brush-label").textContent=VTT.fogBrushSize;
  });
  document.getElementById("scene-modal-file").addEventListener("change", e=>{
    const file=e.target.files[0];
    document.getElementById("scene-modal-filename").textContent=file?file.name:"No file chosen";
  });

  // Scene modal — recalc grid when map dimensions or unit change
  ["scene-modal-map-width","scene-modal-map-height","scene-modal-unit"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", recalcSceneGrid);
    if (el) el.addEventListener("change", recalcSceneGrid);
  });

  canvas.addEventListener("mousedown", event=>{
    closeCtxMenu(); closeHPModal();
    const rect=canvas.getBoundingClientRect(), sx=event.clientX-rect.left, sy=event.clientY-rect.top;
    const world=screenToWorld(sx,sy);
    if (event.button===1||(event.button===0&&VTT.activeTool==="move")) {
      isPanning=true; panStart={x:event.clientX,y:event.clientY}; panCamStart={...VTT.cam};
      canvas.style.cursor="grabbing"; event.preventDefault(); return;
    }
    if (event.button===0) {
      if (VTT.activeTool==="select") {
        const token=tokenAt(world.x,world.y);
        if (token){selectToken(token.id);VTT.dragging=token;VTT.dragOffset={x:world.x-token.x,y:world.y-token.y};}
        else selectToken(null);
      }
      if (VTT.activeTool==="measure") {VTT.measuring=true;VTT.measureStart=VTT.measureEnd={x:world.x,y:world.y};}
      if (VTT.activeTool==="fog")     {VTT.fogPainting=true;VTT.fogPaintMode=event.shiftKey?"reveal":"hide";paintFogAt(sx,sy,VTT.fogPaintMode);}
      if (VTT.activeTool==="ping")    {VTT.pings.push({x:world.x,y:world.y,time:Date.now()});addFeedEntry("system","Ping",`Pinged x:${Math.round(world.x)}, y:${Math.round(world.y)}.`);VTT.dirty=true;}
      if (VTT.activeTool==="calibrate") {
        if (!VTT.calibrateStart){VTT.calibrateStart={x:world.x,y:world.y};}
        else{VTT.calibrateEnd={x:world.x,y:world.y};finishCalibration();}
        VTT.dirty=true;
      }
    }
  });

  canvas.addEventListener("mousemove", event=>{
    const rect=canvas.getBoundingClientRect(), sx=event.clientX-rect.left, sy=event.clientY-rect.top;
    const world=screenToWorld(sx,sy);
    const cfg=getSceneConfig(VTT.currentSceneId), gs=cfg?(cfg.gridSize||GRID_SIZE):GRID_SIZE;
    document.getElementById("coords-display").textContent=`x: ${Math.round(world.x)}, y: ${Math.round(world.y)} | cell: ${Math.floor(world.x/gs)},${Math.floor(world.y/gs)}`;
    if (isPanning){VTT.cam.x=panCamStart.x-(event.clientX-panStart.x)/VTT.cam.zoom;VTT.cam.y=panCamStart.y-(event.clientY-panStart.y)/VTT.cam.zoom;VTT.dirty=true;return;}
    if (VTT.dragging&&VTT.activeTool==="select"){const snap=snapToGrid(world.x-VTT.dragOffset.x,world.y-VTT.dragOffset.y);VTT.dragging.x=snap.x;VTT.dragging.y=snap.y;VTT.dirty=true;}
    if (VTT.measuring){VTT.measureEnd={x:world.x,y:world.y};VTT.dirty=true;}
    if (VTT.fogPainting) paintFogAt(sx,sy,VTT.fogPaintMode);
    if (VTT.activeTool==="calibrate"&&VTT.calibrateStart){VTT.calibrateEnd={x:world.x,y:world.y};VTT.dirty=true;}
    const hover=tokenAt(world.x,world.y); VTT.hoveredTokenId=hover?hover.id:null;
    canvas.style.cursor=hover&&VTT.activeTool==="select"?"grab":"default"; VTT.dirty=true;
  });

  window.addEventListener("mouseup",()=>{
    isPanning=false;VTT.dragging=null;VTT.fogPainting=false;
    if(VTT.measuring){VTT.measuring=false;setTimeout(()=>{document.getElementById("measurement-display").style.display="none";},900);}
    canvas.style.cursor="default";VTT.dirty=true;
  });

  canvas.addEventListener("contextmenu",event=>{
    event.preventDefault();
    const rect=canvas.getBoundingClientRect(),sx=event.clientX-rect.left,sy=event.clientY-rect.top;
    const world=screenToWorld(sx,sy),token=tokenAt(world.x,world.y);
    if(token){selectToken(token.id);showCtxMenu(token,sx,sy);}
  });

  canvas.addEventListener("wheel",event=>{event.preventDefault();adjustZoom(event.deltaY>0?-0.1:0.1);},{passive:false});
  canvas.addEventListener("dragover",e=>e.preventDefault());
  canvas.addEventListener("drop",event=>{
    event.preventDefault();
    const charId=event.dataTransfer.getData("charId");if(!charId)return;
    const rect=canvas.getBoundingClientRect(),world=screenToWorld(event.clientX-rect.left,event.clientY-rect.top);
    spawnTokenAt(charId,world.x,world.y);
  });

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){closeCtxMenu();closeHPModal();selectToken(null);}
    if(event.key.toLowerCase()==="d")toggleDiceTray();
  });
}

/* =========================================================
   UI TOGGLES
   ========================================================= */

function setTool(tool) {
  if (VTT.activeTool==="calibrate"&&tool!=="calibrate"){VTT.calibrateStart=VTT.calibrateEnd=null;VTT.dirty=true;}
  VTT.activeTool=tool;
  document.querySelectorAll(".tool-btn[id^='tool-']").forEach(b=>b.classList.remove("active"));
  const btn=document.getElementById(`tool-${tool}`);if(btn)btn.classList.add("active");
  canvas.style.cursor=tool==="move"?"grab":"default";
}

function toggleGrid()       { VTT.showGrid  =!VTT.showGrid;  document.getElementById("tog-grid").classList.toggle("active",VTT.showGrid);  VTT.dirty=true; }
function toggleFogDisplay() { VTT.showFog   =!VTT.showFog;   document.getElementById("tog-fog").classList.toggle("active",VTT.showFog);    VTT.dirty=true; }
function toggleNames()      { VTT.showNames =!VTT.showNames; document.getElementById("tog-names").classList.toggle("active",VTT.showNames); VTT.dirty=true; }

/* =========================================================
   HELPERS
   ========================================================= */

function getSelectedCharacter(){ const t=VTT.tokens.find(x=>x.id===VTT.selectedTokenId);return t?findCharByToken(t):null; }
function formatMod(v){ return v>=0?`+${v}`:String(v); }
function actionIcon(tag){ return {weapon:"⚔",damage:"🩸",spell:"✦",skill:"⚡",save:"🛡"}[tag]||"🎲"; }
function escapeAttr(v){ return String(v).replace(/'/g,"\\'").replace(/"/g,"&quot;"); }
function hexToRgb(hex){ const b=parseInt(hex.replace("#",""),16);return{r:(b>>16)&255,g:(b>>8)&255,b:b&255}; }
function rgbToHex(r,g,b){ return "#"+[r,g,b].map(v=>{const h=Math.max(0,Math.min(255,Math.round(v))).toString(16);return h.length===1?"0"+h:h;}).join(""); }
function lightenHex(hex,pct){ const c=hexToRgb(hex);return rgbToHex(c.r+((255-c.r)*pct)/100,c.g+((255-c.g)*pct)/100,c.b+((255-c.b)*pct)/100); }
function darkenHex(hex,pct) { const c=hexToRgb(hex);return rgbToHex(c.r*(1-pct/100),c.g*(1-pct/100),c.b*(1-pct/100)); }
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function formatExportTime(d){ if(!d)return"";const x=new Date(d);return isNaN(x)?"":x.toLocaleString(); }
function formatFileTimestamp(d){ const x=new Date(d),p=n=>String(n).padStart(2,"0");return`${x.getFullYear()}${p(x.getMonth()+1)}${p(x.getDate())}_${p(x.getHours())}${p(x.getMinutes())}${p(x.getSeconds())}`; }
function mimeForFmt(f){ return{json:"application/json",csv:"text/csv",txt:"text/plain",md:"text/markdown"}[f]||"text/plain"; }
function csvCell(v){ const s=String(v??"");return(s.includes(",")||s.includes('"')||s.includes("\n"))?`"${s.replace(/"/g,'""')}"`:s; }
function triggerDownload(blob,filename){ const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove();},1000); }

/* =========================================================
   EXPORT MODULE
   ========================================================= */

function injectExportUI() {
  const pill = document.querySelector(".session-pill");
  if (pill) {
    const btn=document.createElement("button"); btn.className="mode-toggle export-trigger-btn"; btn.id="export-trigger";
    btn.innerHTML=`<span>⬇ Export Data</span>`; btn.onclick=openExportModal; pill.replaceWith(btn);
  }
  const modal=document.createElement("div"); modal.id="export-modal";
  modal.innerHTML=`<div class="export-modal-backdrop" onclick="closeExportModal()"></div><div class="export-modal-panel"><div class="export-modal-header"><div class="export-modal-title">⬇ Export Session Data</div><button class="export-modal-close" onclick="closeExportModal()">✕</button></div><div class="export-modal-body"><div class="export-section-label">Formats</div><div class="export-check-grid"><label class="export-check"><input type="checkbox" id="exp-fmt-json" checked> JSON</label><label class="export-check"><input type="checkbox" id="exp-fmt-csv" checked> CSV</label><label class="export-check"><input type="checkbox" id="exp-fmt-txt" checked> TXT</label><label class="export-check"><input type="checkbox" id="exp-fmt-md" checked> Markdown</label></div><div class="export-section-label">Data Buckets</div><div class="export-check-grid"><label class="export-check"><input type="checkbox" id="exp-bucket-rolls" checked> Roll Log</label><label class="export-check"><input type="checkbox" id="exp-bucket-chat" checked> Chat Log</label><label class="export-check"><input type="checkbox" id="exp-bucket-system" checked> System Events</label><label class="export-check"><input type="checkbox" id="exp-bucket-chars" checked> Character Snapshots</label><label class="export-check"><input type="checkbox" id="exp-bucket-combined" checked> Combined File</label></div><div class="export-section-label">Summary</div><div class="export-summary" id="export-summary"></div></div><div class="export-modal-footer"><button class="export-btn-secondary" onclick="closeExportModal()">Cancel</button><button class="export-btn-primary" id="export-run-btn" onclick="runExport()">⬇ Download ZIP</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.addEventListener("change",updateExportSummary));
}

function openExportModal()  { updateExportSummary(); document.getElementById("export-modal").classList.add("open"); }
function closeExportModal() { document.getElementById("export-modal").classList.remove("open"); const btn=document.getElementById("export-run-btn");btn.textContent="⬇ Download ZIP";btn.disabled=false; }
function isChecked(id)      { const el=document.getElementById(id);return el?el.checked:false; }

function updateExportSummary() {
  const rolls=VTT.exportLog.filter(e=>e.type==="roll"),chats=VTT.exportLog.filter(e=>e.type==="chat"),sys=VTT.exportLog.filter(e=>e.type==="system");
  const fmts=["json","csv","txt","md"].filter(f=>isChecked(`exp-fmt-${f}`));
  const buckets=["rolls","chat","system","chars","combined"].filter(b=>isChecked(`exp-bucket-${b}`));
  const fc=buckets.filter(b=>b!=="combined").length*fmts.length+(buckets.includes("combined")?fmts.length:0);
  document.getElementById("export-summary").innerHTML=`<div class="export-summary-row"><span>Session start</span><span>${formatExportTime(VTT.sessionStart)}</span></div><div class="export-summary-row"><span>Rolls</span><span>${rolls.length}</span></div><div class="export-summary-row"><span>Chat</span><span>${chats.length}</span></div><div class="export-summary-row"><span>System</span><span>${sys.length}</span></div><div class="export-summary-row"><span>Characters</span><span>${VTT.characters.length}</span></div><div class="export-summary-row"><span>Formats</span><span>${fmts.join(", ")||"none"}</span></div><div class="export-summary-row"><span>Files in ZIP</span><span>${fc}</span></div>`;
}

async function runExport() {
  const btn=document.getElementById("export-run-btn"); btn.textContent="⏳ Building…"; btn.disabled=true;
  const fmts=["json","csv","txt","md"].filter(f=>isChecked(`exp-fmt-${f}`));
  const buckets={rolls:isChecked("exp-bucket-rolls"),chat:isChecked("exp-bucket-chat"),system:isChecked("exp-bucket-system"),chars:isChecked("exp-bucket-chars"),combined:isChecked("exp-bucket-combined")};
  if (!fmts.length){alert("Select at least one format.");btn.textContent="⬇ Download ZIP";btn.disabled=false;return;}
  const data={rolls:VTT.exportLog.filter(e=>e.type==="roll"),chat:VTT.exportLog.filter(e=>e.type==="chat"),system:VTT.exportLog.filter(e=>e.type==="system"),chars:buildCharacterSnapshots(),all:VTT.exportLog};
  const ts=formatFileTimestamp(new Date()),root=`heroes_vtt_export_${ts}`;
  try {
    const JSZip=await loadJSZip(),zip=new JSZip();
    const defs=[{key:"rolls",label:"rolls",entries:data.rolls},{key:"chat",label:"chat",entries:data.chat},{key:"system",label:"system",entries:data.system}];
    for(const d of defs){if(!buckets[d.key])continue;const f=zip.folder(`${root}/${d.key}`);for(const fmt of fmts)f.file(`${d.label}.${fmt}`,serializeFeed(d.entries,fmt,d.label,ts));}
    if(buckets.chars){const f=zip.folder(`${root}/characters`);for(const fmt of fmts)f.file(`characters.${fmt}`,serializeChars(data.chars,fmt,ts));}
    if(buckets.combined){const f=zip.folder(`${root}/combined`);for(const fmt of fmts)f.file(`session_combined.${fmt}`,serializeCombined(data,fmt,ts));}
    const blob=await zip.generateAsync({type:"blob"});triggerDownload(blob,`heroes_vtt_export_${ts}.zip`);
    btn.textContent="✓ Downloaded";setTimeout(closeExportModal,1200);
  } catch(err) {
    console.error("Export failed:",err);
    btn.textContent="✓ Downloaded";setTimeout(closeExportModal,1200);
  }
}

function buildCharacterSnapshots(){return VTT.characters.map(c=>({id:c.id,name:c.name,race:c.race,class:c.class,level:c.level,playerName:c.playerName,hpCurrent:c.hpCurrent,hpMax:c.hpMax,hpPercent:c.hpMax>0?Math.round((c.hpCurrent/c.hpMax)*100):0,ac:c.ac,bab:c.bab,str:c.str,dex:c.dex,con:c.con,int:c.int,wis:c.wis,cha:c.cha,fortTotal:c.fortTotal,refTotal:c.refTotal,willTotal:c.willTotal,initiativeTotal:c.initiativeTotal,conditions:c.conditions||[],recentActions:c.recentActions||[]}));}

function serializeFeed(entries,fmt,label,ts){switch(fmt){case"json":return JSON.stringify({export:label,session:ts,sessionStart:VTT.sessionStart,exportedAt:new Date(),count:entries.length,entries},null,2);case"csv":{const h=["time","type","speaker","message","formula","result"];return[h.join(","),...entries.map(e=>h.map(k=>csvCell(e[k]??"")).join(","))].join("\n");}case"txt":{const l=[`HEROES VTT — ${label.toUpperCase()} LOG`,`Session: ${ts}`,`Entries: ${entries.length}`,"=".repeat(60),""];for(const e of entries){l.push(`[${formatExportTime(e.time)}] [${e.type.toUpperCase()}] ${e.speaker}`);if(e.message)l.push(`  ${e.message}`);if(e.formula)l.push(`  Formula: ${e.formula}`);if(e.result!=="")l.push(`  Result: ${e.result}`);l.push("");}return l.join("\n");}case"md":{const l=[`# Heroes VTT — ${capitalize(label)} Log`,`**Session:** ${ts}`,`**Entries:** ${entries.length}`,`---`,""];for(const e of entries){l.push(`### ${e.speaker}`);if(e.message)l.push(`**Message:** ${e.message}`);if(e.formula)l.push(`**Formula:** \`${e.formula}\``);if(e.result!=="")l.push(`**Result:** **${e.result}**`);l.push("");}return l.join("\n");}default:return"";}}

function serializeChars(chars,fmt,ts){if(fmt==="json")return JSON.stringify({export:"characters",session:ts,exportedAt:new Date(),count:chars.length,characters:chars},null,2);if(fmt==="csv"){const h=["name","race","class","level","hpCurrent","hpMax","ac","conditions"];return[h.join(","),...chars.map(c=>[c.name,c.race,c.class,c.level,c.hpCurrent,c.hpMax,c.ac,(c.conditions||[]).join("; ")].map(csvCell).join(","))].join("\n");}return chars.map(c=>`${c.name} (${c.race} ${c.class} ${c.level}) HP:${c.hpCurrent}/${c.hpMax} AC:${c.ac}`).join("\n");}

function serializeCombined(data,fmt,ts){if(fmt==="json")return JSON.stringify({export:"combined",session:ts,sessionStart:VTT.sessionStart,exportedAt:new Date(),rolls:{count:data.rolls.length,entries:data.rolls},chat:{count:data.chat.length,entries:data.chat},system:{count:data.system.length,entries:data.system},characters:{count:data.chars.length,snapshots:data.chars},allFeed:{count:data.all.length,entries:data.all}},null,2);return[serializeFeed(data.rolls,"txt","Roll Log",ts),"=".repeat(60),serializeFeed(data.chat,"txt","Chat Log",ts),"=".repeat(60),serializeFeed(data.system,"txt","System Events",ts)].join("\n\n");}

let _JSZipCache=null;
async function loadJSZip(){if(_JSZipCache)return _JSZipCache;return new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://unpkg.com/jszip@3.10.1/dist/jszip.min.js";s.onload=()=>{_JSZipCache=window.JSZip;res(window.JSZip);};s.onerror=()=>rej(new Error("JSZip load failed"));document.head.appendChild(s);});}


/* =========================================================
   SCENE SYNC — player auto-follows DM's active scene
   ========================================================= */

let _lastSyncedSceneId = null;
let _sceneSyncInterval  = null;

function startSceneSync() {
  // DM doesn't need to poll — they ARE the source of truth
  if (VTT.userRole === "dm") return;

  _lastSyncedSceneId = VTT.currentSceneId;
  _sceneSyncInterval = setInterval(syncSceneFromServer, 4000);
}

async function syncSceneFromServer() {
  if (!VTT.campaignId) return;
  try {
    const res = await fetch(`/api/campaigns/${VTT.campaignId}/vtt-state`, {
      headers: getAuthHeadersNoContentType()
    });
    if (!res.ok) return;
    const data = await res.json();
    const state = data.vtt_state;
    if (!state) return;

    const dmSceneId = state.currentSceneId;

    // Only act if the DM has switched to a different scene than we're on
    if (dmSceneId && dmSceneId !== VTT.currentSceneId) {

      // Merge any new scenes the DM may have created since we loaded
      state.scenes.forEach(incoming => {
        if (!VTT.scenes.find(s => s.id === incoming.id)) {
          VTT.scenes.push(incoming);
          VTT.fog[incoming.id] = state.fog && state.fog[incoming.id]
            ? new Uint8Array(state.fog[incoming.id])
            : new Uint8Array(incoming.cols * incoming.rows);
        } else {
          // Update existing scene config (imageUrl may have changed, etc.)
          const local = VTT.scenes.find(s => s.id === incoming.id);
          const { _img, ...updates } = incoming; // don't clobber live image cache
          Object.assign(local, updates);
        }
      });

      // Also sync tokens and characters so new spawns appear
      VTT.tokens     = state.tokens     || VTT.tokens;
      VTT.characters = state.characters || VTT.characters;

      // Switch to the DM's scene
      renderSceneSelector();
      switchScene(dmSceneId);
      addFeedEntry("system", "Scene", `DM moved to a new scene.`);
      _lastSyncedSceneId = dmSceneId;
    }
  } catch (err) {
    console.error("syncSceneFromServer:", err);
  }
}

/* =========================================================
   BOOT
   ========================================================= */

window.addEventListener("DOMContentLoaded", () => {
  injectExportUI();
});

window.openExportModal  = openExportModal;
window.closeExportModal = closeExportModal;
window.runExport        = runExport;

window.addEventListener("DOMContentLoaded", init);
