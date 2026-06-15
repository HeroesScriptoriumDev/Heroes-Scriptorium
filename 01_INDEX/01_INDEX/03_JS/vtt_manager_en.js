// =====================================
// DATA
// =====================================

let vtts = [];

// =====================================
// MOCK DATA
// Used if backend returns nothing
// =====================================

// =====================================
// PAGE ELEMENTS
// =====================================

const vttGrid = document.getElementById("vttGrid");

const searchInput = document.getElementById("searchInput");

const filterSelect = document.getElementById("filterSelect");

// =====================================
// INITIALIZATION
// =====================================

initialize();

async function initialize() {
  await loadVTTs();
  renderVTTs();

  sessionData = buildSessionDataFromVTTs(vtts);
  renderNextSession();
  renderMiniCalendar();

  document
    .getElementById("miniCalPrev")
    ?.addEventListener("click", () => shiftMiniCalMonth(-1));
  document
    .getElementById("miniCalNext")
    ?.addEventListener("click", () => shiftMiniCalMonth(1));
}

// =====================================
// LOAD DATA
// =====================================

async function loadVTTs() {
  try {
    const response = await fetch("/api/campaigns/my-vtts", {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load VTTs (${response.status})`);
    }

    const data = await response.json();
    vtts = data.vtts || [];
  } catch (error) {
    console.error(error);
    vtts = [];
  }
}
// =====================================
// RENDER
// =====================================

function renderVTTs() {
  let filtered = [...vtts];

  //
  // FILTER
  //

  const selectedFilter = filterSelect.value;

  if (selectedFilter !== "all") {
    filtered = filtered.filter((vtt) => vtt.status === selectedFilter);
  }

  //
  // SEARCH
  //

  const search = searchInput.value.toLowerCase().trim();

  if (search !== "") {
    filtered = filtered.filter(
      (vtt) =>
        vtt.name.toLowerCase().includes(search) ||
        vtt.dm.toLowerCase().includes(search)
    );
  }

  //
  // EMPTY
  //

  if (filtered.length === 0) {
    vttGrid.innerHTML = `
        <div class="vtt-empty-state">

            <h3>
                No Campaigns Found
            </h3>

            <p>
                Create a campaign to begin.
            </p>

        </div>
        `;

    return;
  }

  //
  // BUILD HTML
  //

  vttGrid.innerHTML = "";

  filtered.forEach((vtt) => {
    vttGrid.innerHTML += createCard(vtt);
  });
}

// =====================================
// CARD TEMPLATE
// =====================================

function createCard(vtt) {
  return `

<div class="portrait-frame">

    <div class="portrait-image">

        <div class="portrait-corner tl"></div>
        <div class="portrait-corner tr"></div>
        <div class="portrait-corner bl"></div>
        <div class="portrait-corner br"></div>

        ${
          vtt.image
            ? `<img
                class="portrait-img"
                src="${vtt.image}"
            >`
            : `
            <div class="portrait-placeholder">

                <svg viewBox="0 0 80 80" fill="none">

                    <circle
                        cx="40"
                        cy="30"
                        r="18"
                        fill="#6b4e2a"/>

                    <ellipse
                        cx="40"
                        cy="68"
                        rx="26"
                        ry="18"
                        fill="#5a3e1b"/>

                    <text
                        x="40"
                        y="34"
                        text-anchor="middle"
                        fill="#c8a96e"
                        font-size="11"
                        font-family="serif">

                        VTT

                    </text>

                </svg>

            </div>
            `
        }

    </div>


    <div class="portrait-details">

        <div class="campaign-name">
            ${vtt.name}
        </div>

        <div class="campaign-info-row">
            <span class="info-label">
                DM:
            </span>

            ${vtt.dm}
        </div>

        <div class="campaign-info-row">
            <span class="info-label">
                Next Session:
            </span>

            ${vtt.nextSession}
        </div>

        <div class="campaign-info-row">
            <span class="info-label">
                Players:
            </span>

            ${vtt.playersCurrent}
            /
            ${vtt.playersMax}
        </div>

        <div class="campaign-bottom">

            <button
                class="launch-vtt-btn"
                onclick="launchVTT(${vtt.id})">

                Launch VTT

            </button>

        </div>

    </div>

</div>

`;
}

// =====================================
// SEARCH
// =====================================

searchInput.addEventListener("input", renderVTTs);

// =====================================
// FILTER
// =====================================

filterSelect.addEventListener("change", renderVTTs);

// =====================================
// LAUNCH
// =====================================

function launchVTT(id) {
  window.location.href = `vtt_en.html?campaign=${id}`;

  //
  // future
  //
  // window.location.href =
  // `/vtt/${id}`;
  //
}

// =====================================
// ADD CAMPAIGN
// =====================================

function addCampaign(campaign) {
  vtts.push(campaign);

  renderVTTs();
}

// =====================================
// REMOVE CAMPAIGN
// =====================================

function removeCampaign(id) {
  vtts = vtts.filter((vtt) => vtt.id !== id);

  renderVTTs();
}

const SESSION_YEAR = 2026;
 
const MONTH_NAME_TO_INDEX = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};
 
function buildSessionDataFromVTTs(sourceVTTs) {
  return sourceVTTs
    .filter(vtt => vtt.nextSession)
    .map(vtt => {
      const { date, time } = parseNextSessionString(vtt.nextSession);
      return {
        date,
        type: vtt.sessionType || (vtt.status === "inactive" ? "cancelled" : "dm"),
        campaign: vtt.name,
        dm: vtt.dm,
        time
      };
    });
}
 
function parseNextSessionString(str) {
  /* "June 18 • 7 PM" -> { date: "2026-06-18", time: "7:00 PM" } */
  const [datePart, timePart] = str.split("•").map(s => s.trim());
  const [monthName, dayStr]  = datePart.split(" ");
 
  const monthIndex = MONTH_NAME_TO_INDEX[monthName.toLowerCase()];
  const day         = parseInt(dayStr, 10);
 
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
 
  /* "7 PM" -> "7:00 PM" */
  const timeMatch = timePart.match(/^(\d{1,2})\s*(AM|PM)$/i);
  const time = timeMatch
    ? `${timeMatch[1]}:00 ${timeMatch[2].toUpperCase()}`
    : timePart;
 
  return {
    date: `${SESSION_YEAR}-${mm}-${dd}`,
    time
  };
}

/* =========================================================
   STATE
   ========================================================= */

let miniCal_viewDate = new Date(); // month currently displayed
let sessionData = [];

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderNextSession();
  renderMiniCalendar();

  document
    .getElementById("miniCalPrev")
    ?.addEventListener("click", () => shiftMiniCalMonth(-1));
  document
    .getElementById("miniCalNext")
    ?.addEventListener("click", () => shiftMiniCalMonth(1));
});

/* =========================================================
   NEXT SESSION SIDEBAR
   ========================================================= */

function renderNextSession() {
  const infoEl = document.getElementById("nextSessionInfo");
  const emptyEl = document.getElementById("nextSessionEmpty");

  const next = findNextSession();

  if (!next) {
    infoEl.style.display = "none";
    emptyEl.style.display = "flex";
    return;
  }

  infoEl.style.display = "flex";
  emptyEl.style.display = "none";

  document.getElementById("nsCampaignName").textContent = next.campaign;
  document.getElementById("nsDM").textContent = next.dm;
  document.getElementById("nsTime").textContent = next.time;

  const dateObj = parseSessionDate(next.date);
  document.getElementById(
    "nsDate"
  ).textContent = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  /* Type label + dot color */
  const typeLabels = {
    dm: "DM Session",
    player: "Player Session",
    oneshot: "One-Shot",
    roleplay: "Roleplay",
    cancelled: "Cancelled"
  };

  document.getElementById("nsSessionType").textContent =
    typeLabels[next.type] || next.type;

  const dot = document.getElementById("nsTypeDot");
  dot.className = `ns-dot ${next.type}`;

  /* Countdown */
  document.getElementById("nsCountdown").textContent = formatCountdown(dateObj);
}

/* =========================================================
   FIND NEXT SESSION
   ---------------------------------------------------------
   Returns the soonest session today or later, excluding
   cancelled sessions. Falls back to null if none found.
   ========================================================= */

function findNextSession() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    sessionData
      .filter((s) => s.type !== "cancelled")
      .map((s) => ({ ...s, _date: parseSessionDate(s.date) }))
      .filter((s) => s._date >= now)
      .sort((a, b) => a._date - b._date)[0] || null
  );
}

/* =========================================================
   COUNTDOWN FORMATTER
   ========================================================= */

function formatCountdown(dateObj) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(dateObj);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - now) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} days`;
}

/* =========================================================
   MINI CALENDAR — RENDER
   ========================================================= */

function renderMiniCalendar() {
  const grid = document.getElementById("miniCalGrid");
  const monthLabel = document.getElementById("miniCalMonthLabel");

  const year = miniCal_viewDate.getFullYear();
  const month = miniCal_viewDate.getMonth(); // 0-indexed

  monthLabel.textContent = miniCal_viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  /* First day of month + how many days it has */
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* Group session data by date string for quick lookup */
  const sessionsByDate = {};
  sessionData.forEach((s) => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  });

  let cellsHtml = "";

  /* Leading days from previous month */
  for (let i = startWeekday - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    cellsHtml += buildMiniCalCell(dayNum, true, null, []);
  }

  /* Days of current month */
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    const isToday = cellDate.getTime() === today.getTime();
    const dateKey = formatDateKey(year, month, day);
    const sessions = sessionsByDate[dateKey] || [];

    cellsHtml += buildMiniCalCell(day, false, isToday, sessions);
  }

  /* Trailing days from next month — fill to complete final week */
  const totalCells = startWeekday + daysInMonth;
  const trailingCells = (7 - (totalCells % 7)) % 7;
  for (let day = 1; day <= trailingCells; day++) {
    cellsHtml += buildMiniCalCell(day, true, null, []);
  }

  grid.innerHTML = cellsHtml;
}

/* =========================================================
   MINI CALENDAR — BUILD CELL
   ========================================================= */

function buildMiniCalCell(dayNum, isOutside, isToday, sessions) {
  const classes = ["mini-cal-day"];
  if (isOutside) classes.push("outside-month");
  if (isToday) classes.push("today");

  let dotsHtml = "";
  if (sessions.length > 0) {
    dotsHtml =
      `<div class="mini-cal-dots">` +
      sessions
        .map((s) => `<span class="mini-cal-dot ${s.type}"></span>`)
        .join("") +
      `</div>`;
  }

  return `
    <div class="${classes.join(" ")}">
      <span class="mini-cal-daynum">${dayNum}</span>
      ${dotsHtml}
    </div>`;
}

/* =========================================================
   MINI CALENDAR — MONTH NAVIGATION
   ========================================================= */

function shiftMiniCalMonth(delta) {
  miniCal_viewDate = new Date(
    miniCal_viewDate.getFullYear(),
    miniCal_viewDate.getMonth() + delta,
    1
  );
  renderMiniCalendar();
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function parseSessionDate(dateStr) {
  /* dateStr: "YYYY-MM-DD" — parse as local time, not UTC */
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* =========================================================
   NAVIGATION TO CALENDAR PAGE
   ========================================================= */

function goToCalendar() {
  window.location.href = "session_calendar_en.html";
}

// ── Navigation ────────────────────────────────────────────────────────────
function navigate(destination) {
  switch (destination) {
    case "home":
      window.location.href = "home_en.html";
      break;

    case "player":
      window.location.href = "home_en.html";
      break;

    case "profile":
      window.location.href = "profile_en.html";
      break;

    case "settings":
      window.location.href = "settings_en.html";
      break;
    }
}
