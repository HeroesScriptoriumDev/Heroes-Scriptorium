/* =========================================================
   PRESENCE UTILITY
   FILE: 03_JS/presence.js

   Handles:
   - Status updates (online / away / busy / invisible)
   - Heartbeat (keeps last_seen fresh every 60s)
   - Away detection (mouse/keyboard idle > 5 min)
   - Offline on tab close / navigate away
   - Session token storage and forwarding
   ========================================================= */


/* =========================================================
   CONSTANTS
   ========================================================= */

const PRESENCE_HEARTBEAT_INTERVAL = 60 * 1000;       // 60 seconds
const PRESENCE_AWAY_THRESHOLD     =  5 * 60 * 1000;  // 5 minutes idle
const PRESENCE_STORAGE_KEY        = "userStatus";
const PRESENCE_SESSION_KEY        = "sessionToken";

const PRESENCE_STATUS_CONFIG = {
  online:    { label: "Online",    dotClass: "online"    },
  away:      { label: "Away",      dotClass: "away"      },
  busy:      { label: "Busy",      dotClass: "busy"      },
  invisible: { label: "Invisible", dotClass: "invisible" },
  offline:   { label: "Offline",   dotClass: "offline"   },
};


/* =========================================================
   STATE
   ========================================================= */

let presence_currentStatus    = "online";
let presence_heartbeatTimer   = null;
let presence_awayTimer        = null;
let presence_lastActivityTime = Date.now();
let presence_initialized      = false;


/* =========================================================
   INITIALIZE
   ---------------------------------------------------------
   Call once per page after DOM is ready.
   Restores saved status, starts heartbeat, wires idle
   detection and tab-close handler.
   ========================================================= */

function initializePresence() {

  if (presence_initialized) return;
  presence_initialized = true;

  /* Restore saved status — default online */
  const saved = localStorage.getItem(PRESENCE_STORAGE_KEY) || "online";
  presence_setStatusLocal(saved);

  /* Start heartbeat */
  presence_startHeartbeat();

  /* Wire idle detection */
  presence_startIdleDetection();

  /* Mark offline when tab closes or user navigates away */
  window.addEventListener("beforeunload", (e) => {
  presence_handleUnload(e);
});

  /* Mark online when tab regains focus */
  document.addEventListener("visibilitychange", presence_handleVisibilityChange);

}


/* =========================================================
   SET STATUS
   ---------------------------------------------------------
   Public function. Call this when the user picks a status.
   Saves to localStorage, updates the UI, hits the API.
   ========================================================= */

async function presence_setStatus(status) {

  if (!PRESENCE_STATUS_CONFIG[status]) return;

  /* Don't re-set identical status */
  if (status === presence_currentStatus) return;

  presence_setStatusLocal(status);

  localStorage.setItem(PRESENCE_STORAGE_KEY, status);

  await presence_apiSetStatus(status);

}


/* =========================================================
   SET STATUS LOCAL (UI only, no API call)
   ---------------------------------------------------------
   Updates every status dot + label on the current page
   without hitting the backend. Used for restoring saved
   state on page load.
   ========================================================= */

function presence_setStatusLocal(status) {

  if (!PRESENCE_STATUS_CONFIG[status]) return;

  presence_currentStatus = status;

  const config = PRESENCE_STATUS_CONFIG[status];

  /* Bottom bar pill */
  const pillDot  = document.getElementById("bottomStatusDot");
  const pillText = document.getElementById("bottomStatusText");
  if (pillDot)  pillDot.className    = `status-dot ${config.dotClass}`;
  if (pillText) pillText.textContent = config.label;

  /* Sidebar dot + text (profile page) */
  const sidebarDot  = document.getElementById("statusDot");
  const sidebarText = document.getElementById("profileStatusText");
  if (sidebarDot)  sidebarDot.className    = `status-dot ${config.dotClass}`;
  if (sidebarText) sidebarText.textContent = config.label;

  /* Mark active option in dropdown if it exists */
  document.querySelectorAll(".status-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.status === status);
  });

  /* Chevron aria state */
  const pill = document.getElementById("statusPill");
  if (pill) {
    const isOpen = pill.getAttribute("aria-expanded") === "true";
    pill.setAttribute("aria-expanded", String(isOpen));
  }

}


/* =========================================================
   API — SET STATUS
   ========================================================= */

async function presence_apiSetStatus(status) {

  try {

    const token = localStorage.getItem("token");
    if (!token) return;

    const response = await fetch("/api/presence/status", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        token: token
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      console.error("PRESENCE: failed to set status", await response.text());
    }

  } catch (err) {
    console.error("PRESENCE: status API error", err);
  }

}


/* =========================================================
   API — HEARTBEAT
   ---------------------------------------------------------
   Fires every 60 seconds to keep last_seen current and
   sessions alive. Skipped if user is invisible (we still
   ping so the session stays alive but we don't change
   their visible status).
   ========================================================= */

async function presence_sendHeartbeat() {

  try {

    const token        = localStorage.getItem("token");
    const sessionToken = localStorage.getItem(PRESENCE_SESSION_KEY);

    if (!token) return;

    const response = await fetch("/api/presence/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token
      },
      body: JSON.stringify({ sessionToken: sessionToken || "" })
    });

    if (!response.ok) {
      console.error("PRESENCE: heartbeat failed", await response.text());
    }

  } catch (err) {
    console.error("PRESENCE: heartbeat error", err);
  }

}


/* =========================================================
   START / STOP HEARTBEAT
   ========================================================= */

function presence_startHeartbeat() {

  /* Fire immediately on page load */
  presence_sendHeartbeat();

  /* Then on interval */
  presence_heartbeatTimer = setInterval(
    presence_sendHeartbeat,
    PRESENCE_HEARTBEAT_INTERVAL
  );

}

function presence_stopHeartbeat() {

  if (presence_heartbeatTimer) {
    clearInterval(presence_heartbeatTimer);
    presence_heartbeatTimer = null;
  }

}


/* =========================================================
   IDLE / AWAY DETECTION
   ---------------------------------------------------------
   Resets a timer on any mouse move or keypress.
   If nothing happens for PRESENCE_AWAY_THRESHOLD ms and
   the user is currently online, auto-switches to away.
   Any activity while away switches back to online.
   Busy and invisible are never auto-changed.
   ========================================================= */

function presence_startIdleDetection() {

  const activityEvents = [
    "mousemove", "mousedown", "keydown", "touchstart", "scroll"
  ];

  activityEvents.forEach(evt => {
    window.addEventListener(evt, presence_onActivity, { passive: true });
  });

  presence_resetAwayTimer();

}

function presence_onActivity() {

  presence_lastActivityTime = Date.now();

  /* If we auto-set away and user is now active, restore online */
  if (presence_currentStatus === "away") {
    const saved = localStorage.getItem(PRESENCE_STORAGE_KEY);
    /* Only restore if the saved preference was online (not manually set away) */
    if (!saved || saved === "online") {
      presence_setStatus("online");
    }
  }

  presence_resetAwayTimer();

}

function presence_resetAwayTimer() {

  if (presence_awayTimer) clearTimeout(presence_awayTimer);

  presence_awayTimer = setTimeout(() => {

    /* Only auto-away if currently online */
    if (presence_currentStatus === "online") {
      presence_setStatusLocal("away");
      presence_apiSetStatus("away");
      /* Do NOT save "away" to localStorage — so next activity restores online */
    }

  }, PRESENCE_AWAY_THRESHOLD);

}


/* =========================================================
   TAB CLOSE / NAVIGATE AWAY
   ---------------------------------------------------------
   Uses sendBeacon so it fires even during page unload
   when fetch would be cancelled.
   ========================================================= */

function presence_handleUnload() {

  const token        = localStorage.getItem("token");
  const sessionToken = localStorage.getItem(PRESENCE_SESSION_KEY);

  if (!token) return;

  /* Invisible users stay invisible across sessions */
  if (presence_currentStatus === "invisible") return;

  const payload = JSON.stringify({
    status:       "offline",
    sessionToken: sessionToken || ""
  });

  navigator.sendBeacon(
    "/api/presence/status",
    new Blob([payload], { type: "application/json" })
  );

}


/* =========================================================
   VISIBILITY CHANGE
   ---------------------------------------------------------
   Tab hidden → start away timer immediately.
   Tab visible → treat as activity.
   ========================================================= */

function presence_handleVisibilityChange() {

  if (document.hidden) {

    /* Accelerate away timer when tab goes background */
    if (presence_awayTimer) clearTimeout(presence_awayTimer);

    presence_awayTimer = setTimeout(() => {
      if (presence_currentStatus === "online") {
        presence_setStatusLocal("away");
        presence_apiSetStatus("away");
      }
    }, 30 * 1000); // 30 seconds when hidden

  } else {

    /* Tab came back — treat as activity */
    presence_onActivity();

  }

}


/* =========================================================
   STATUS DROPDOWN WIRING
   ---------------------------------------------------------
   Wires the pill toggle and option buttons if they exist
   on the current page. Safe to call on pages that don't
   have the dropdown (just no-ops).
   ========================================================= */

function initializeStatusDropdown() {

  const statusPill     = document.getElementById("statusPill");
  const statusDropdown = document.getElementById("statusDropdown");

  if (!statusPill || !statusDropdown) return;

  let dropdownOpen = false;

  function openDropdown() {
    dropdownOpen = true;
    statusDropdown.classList.add("open");
    statusDropdown.setAttribute("aria-hidden", "false");
    statusPill.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    dropdownOpen = false;
    statusDropdown.classList.remove("open");
    statusDropdown.setAttribute("aria-hidden", "true");
    statusPill.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown() {
    dropdownOpen ? closeDropdown() : openDropdown();
  }

  statusPill.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  statusPill.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDropdown(); }
    if (e.key === "Escape") closeDropdown();
  });

  document.querySelectorAll(".status-option").forEach(btn => {
    btn.addEventListener("click", async () => {
      await presence_setStatus(btn.dataset.status);
      closeDropdown();
      if (typeof showToast === "function") {
        showToast(`Status set to ${PRESENCE_STATUS_CONFIG[btn.dataset.status].label}`);
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (dropdownOpen && !statusPill.contains(e.target) && !statusDropdown.contains(e.target)) {
      closeDropdown();
    }
  });

}


/* =========================================================
   AUTO-INIT ON DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializePresence();
  initializeStatusDropdown();
});
