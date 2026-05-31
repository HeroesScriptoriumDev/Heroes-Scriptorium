
/* =====================================================
   DOM REFERENCES
   ===================================================== */

const profileDisplayName =
    document.getElementById(
        "profileDisplayName"
    );

const profileTitle =
    document.getElementById(
        "profileTitle"
    );

const profileBioText =
    document.getElementById(
        "profileBioText"
    );

const profileLevel =
    document.getElementById(
        "profileLevel"
    );

const profileStatusText =
    document.getElementById(
        "profileStatusText"
    );

const statusDot =
    document.getElementById(
        "statusDot"
    );

const profileReputation =
    document.getElementById(
        "profileReputation"
    );

const profileMemberSince =
    document.getElementById(
        "profileMemberSince"
    );

const profileCampaignCount =
    document.getElementById(
        "profileCampaignCount"
    );

const profileCharacterCount =
    document.getElementById(
        "profileCharacterCount"
    );

const profileFriendCount =
    document.getElementById(
        "profileFriendCount"
    );

const profileForumPostCount =
    document.getElementById(
        "profileForumPostCount"
    );

const favoriteEditions =
    document.getElementById(
        "favoriteEditions"
    );

const profileRoles =
    document.getElementById(
        "profileRoles"
    );


/* =========================================================
   APPLY MODE BACKGROUND
   ========================================================= */

function applyModeBackground() {

  const mode =
    localStorage.getItem("mode") || "player";

  document.body.classList.remove(
    "mode-player",
    "mode-dm"
  );

  document.body.classList.add(
    `mode-${mode}`
  );

}


/* =====================================================
   PAGE INITIALIZATION
   ===================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        applyModeBackground();

        initializeNavigation();

        initializeButtons();

        initializeHoverEffects();

        fetchProfileData();

    }

);

/* =========================================================
   NAVIGATION SYSTEM
   ========================================================= */

function navigate(destination) {

  switch (destination) {

    case "home":
      if (localStorage.getItem("mode") === "dm") {
        window.location.href = "dm_home_en.html";
      } else {
        window.location.href = "home_en.html";
      }
      break;

    case "player":
  if (localStorage.getItem("mode") === "dm") {
    localStorage.setItem("mode", "player");
    applyModeBackground();
  } else {
    localStorage.setItem("mode", "dm");
    applyModeBackground();
  }
  break;

    case "profile":
      window.location.href = "profile_en.html";
      break;

    case "settings":
      window.location.href = "settings_en.html";
      break;

    default:
      console.warn(
        "Unknown destination:",
        destination
      );

  }

}

/* =====================================================
   NAVIGATION BUTTONS
   ===================================================== */

function initializeNavigation() {

    const navigationButtons =
        document.querySelectorAll(
            ".navigation-btn"
        );

    navigationButtons.forEach(

        (button) => {

            button.addEventListener(

                "mouseenter",

                () => {

                    button.style.transform =
                        "translateY(-2px) scale(1.05)";

                }

            );

            button.addEventListener(

                "mouseleave",

                () => {

                    button.style.transform =
                        "translateY(0px) scale(1)";

                }

            );

        }

    );

}

/* =====================================================
   BUTTON ACTIONS
   ===================================================== */

function initializeButtons() {

    const disabledButtons =
        document.querySelectorAll(
            "button[disabled]"
        );

    disabledButtons.forEach(

        (button) => {

            button.addEventListener(

                "click",

                () => {

                    showToast(
                        "Feature not yet implemented."
                    );

                }

            );

        }

    );

}

/* =====================================================
   PANEL HOVER EFFECTS
   ===================================================== */

function initializeHoverEffects() {

    const cards =
        document.querySelectorAll(
            ".p-card"
        );

    cards.forEach(

        (card) => {

            card.addEventListener(

                "mouseenter",

                () => {

                    card.style.transform =
                        "translateY(-4px)";

                    card.style.borderColor =
                        "rgba(255,196,92,0.45)";

                    card.style.boxShadow =
                        `
                        0 14px 40px rgba(0,0,0,0.55),
                        0 0 25px rgba(212,165,74,0.08)
                        `;

                }

            );

            card.addEventListener(

                "mouseleave",

                () => {

                    card.style.transform =
                        "translateY(0px)";

                    card.style.borderColor =
                        "rgba(184,134,52,0.25)";

                    card.style.boxShadow =
                        `
                        0 10px 30px rgba(0,0,0,0.45)
                        `;

                }

            );

        }

    );

}

/* =====================================================
   TOAST SYSTEM
   ===================================================== */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    toast.textContent =
        message;

    toast.style.display =
        "block";

    toast.style.opacity =
        "1";

    toast.style.transform =
        "translateY(0px)";

    setTimeout(

        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(10px)";

            setTimeout(

                () => {

                    toast.style.display =
                        "none";

                },

                300

            );

        },

        2500

    );

}

/* =====================================================
   MOCK NOTIFICATION COUNTER
   ===================================================== */

function updateNotificationBadge(
    count
) {

    const notifBadge =
        document.getElementById(
            "notifBadge"
        );

    if (count <= 0) {

        notifBadge.style.display =
            "none";

        return;
    }

    notifBadge.style.display =
        "flex";

    notifBadge.textContent =
        count;

}

/* =====================================================
   INITIAL NOTIFICATIONS
   ===================================================== */

updateNotificationBadge(3);

/* =====================================================
   EDITION BADGE STYLING
   ===================================================== */

const style =
document.createElement("style");

style.textContent = `

.editions-grid {

    display: flex;

    flex-wrap: wrap;

    gap: 10px;
}

.edition-badge {

    padding:
        8px 14px;

    border-radius:
        999px;

    background:
        rgba(70,40,20,0.85);

    border:
        1px solid rgba(212,165,74,0.35);

    color:
        #f0d7a1;

    font-size:
        0.9rem;

    transition:
        0.25s ease;
}

.edition-badge:hover {

    transform:
        translateY(-2px);

    border-color:
        rgba(255,196,92,0.6);
}

.role-tag {

    padding:
        7px 12px;

    border-radius:
        10px;

    background:
        rgba(30,20,12,0.95);

    border:
        1px solid rgba(255,255,255,0.08);

    font-size:
        0.85rem;
}

.roles-row {

    display: flex;

    flex-wrap: wrap;

    justify-content: center;

    gap: 8px;
}

.loaded .p-card,
.loaded .hero-banner {

    animation:
        fadeUp 0.5s ease forwards;
}

@keyframes fadeUp {

    from {

        opacity: 0;

        transform:
            translateY(10px);
    }

    to {

        opacity: 1;

        transform:
            translateY(0px);
    }
}

`;

document.head.appendChild(style);

/* =========================================================
   LOAD PROFILE DATA
   ========================================================= */

async function fetchProfileData(){

  try{

    const token =
      localStorage.getItem("token");

    const response = await fetch(
      "/api/profile",
      {
        headers: {
          token
        }
      }
    );

    if(!response.ok){

      throw new Error(
        "FAILED TO FETCH PROFILE"
      );

    }

    const data =
      await response.json();

    const user =
      data.profile;

    console.log(
      "PROFILE DATA:",
      user
    );

    populateProfile(user);

  }

  catch(error){

    console.error(
      "PROFILE LOAD ERROR:",
      error
    );

  }

}

/* =========================================================
   POPULATE PROFILE UI
   ========================================================= */

function populateProfile(user){

  console.log(
    "PROFILE DATA:",
    user
  );

  profileDisplayName.textContent =
    user.display_name || "Unknown User";

  profileTitle.textContent =
    user.title || "No Title";

  profileBioText.textContent =
    user.bio || "No bio written.";

  profileMemberSince.textContent =
    user.created_at
      ? new Date(user.created_at)
          .getFullYear()
      : "—";

  profileReputation.textContent = "0";

  profileCampaignCount.textContent = "0";

  fetchCharacterCount();

  profileFriendCount.textContent = "0";

  profileForumPostCount.textContent = "0";

  profileLevel.textContent = "Lvl 1";

  profileStatusText.textContent = "Online";

  statusDot.classList.remove(
    "offline"
  );

  statusDot.classList.add(
    "online"
  );

  document.body.classList.add(
    "loaded"
  );

}

async function fetchCharacterCount() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/characters", {
      headers: { token }
    });
    const data = await response.json();
    const count = data.characters ? data.characters.length : 0;

    // Update sidebar stat
    profileCharacterCount.textContent = count;

    // Update vault card big number
    const vaultCharCount = document.getElementById("vaultCharCount");
    if (vaultCharCount) vaultCharCount.textContent = count;

  } catch (error) {
    console.error("Failed to load character count:", error);
    profileCharacterCount.textContent = "0";
  }
}

/* =========================================================
   STATUS PICKER
   ========================================================= */

const STATUS_CONFIG = {
  online:    { label: "Online",    dotClass: "online"    },
  away:      { label: "Away",      dotClass: "away"      },
  busy:      { label: "Busy",      dotClass: "busy"      },
  invisible: { label: "Invisible", dotClass: "invisible" },
};

let currentStatus = "online";
let statusDropdownOpen = false;

const statusPill     = document.getElementById("statusPill");
const statusDropdown = document.getElementById("statusDropdown");

function openStatusDropdown() {
  statusDropdownOpen = true;
  statusDropdown.classList.add("open");
  statusDropdown.setAttribute("aria-hidden", "false");
  statusPill.setAttribute("aria-expanded", "true");
}

function closeStatusDropdown() {
  statusDropdownOpen = false;
  statusDropdown.classList.remove("open");
  statusDropdown.setAttribute("aria-hidden", "true");
  statusPill.setAttribute("aria-expanded", "false");
}

function toggleStatusDropdown() {
  statusDropdownOpen ? closeStatusDropdown() : openStatusDropdown();
}

function applyStatus(status) {
  const config = STATUS_CONFIG[status];
  if (!config) return;

  currentStatus = status;

  /* Update pill dot */
  const pillDot = document.getElementById("bottomStatusDot");
  pillDot.className = `status-dot ${config.dotClass}`;

  /* Update pill text */
  document.getElementById("bottomStatusText").textContent = config.label;

  /* Update sidebar dot + text */
  const sidebarDot  = document.getElementById("statusDot");
  const sidebarText = document.getElementById("profileStatusText");
  if (sidebarDot)  sidebarDot.className  = `status-dot ${config.dotClass}`;
  if (sidebarText) sidebarText.textContent = config.label;

  /* Mark active option */
  document.querySelectorAll(".status-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.status === status);
  });

  closeStatusDropdown();
  showToast(`Status set to ${config.label}`);
}

/* Toggle on pill click */
statusPill?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleStatusDropdown();
});

/* Keyboard: Enter/Space opens, Escape closes */
statusPill?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleStatusDropdown(); }
  if (e.key === "Escape") closeStatusDropdown();
});

/* Option clicks */
document.querySelectorAll(".status-option").forEach(btn => {
  btn.addEventListener("click", () => applyStatus(btn.dataset.status));
});

/* Click outside to close */
document.addEventListener("click", (e) => {
  if (statusDropdownOpen && !statusPill.contains(e.target) && !statusDropdown.contains(e.target)) {
    closeStatusDropdown();
  }
});

/* Set initial active state */
applyStatus("online");
