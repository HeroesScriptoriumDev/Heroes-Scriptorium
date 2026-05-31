/* =====================================================
   DOM REFERENCES
   ===================================================== */

const profileDisplayName  = document.getElementById("profileDisplayName");
const profileTitle        = document.getElementById("profileTitle");
const profileBioText      = document.getElementById("profileBioText");
const profileLevel        = document.getElementById("profileLevel");
const profileStatusText   = document.getElementById("profileStatusText");
const statusDot           = document.getElementById("statusDot");
const profileReputation   = document.getElementById("profileReputation");
const profileMemberSince  = document.getElementById("profileMemberSince");
const profileCampaignCount  = document.getElementById("profileCampaignCount");
const profileCharacterCount = document.getElementById("profileCharacterCount");
const profileFriendCount    = document.getElementById("profileFriendCount");
const profileForumPostCount = document.getElementById("profileForumPostCount");
const favoriteEditions    = document.getElementById("favoriteEditions");
const profileRoles        = document.getElementById("profileRoles");


/* =========================================================
   APPLY MODE BACKGROUND
   ========================================================= */

function applyModeBackground() {
  const mode = localStorage.getItem("mode") || "player";
  document.body.classList.remove("mode-player", "mode-dm");
  document.body.classList.add(`mode-${mode}`);
}


/* =====================================================
   PAGE INITIALIZATION
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  applyModeBackground();
  initializeNavigation();
  initializeButtons();
  initializeHoverEffects();
  fetchProfileData();
  /* presence.js handles status init — do NOT call applyStatus here */
});


/* =========================================================
   NAVIGATION SYSTEM
   ========================================================= */

function navigate(destination) {
  switch (destination) {
    case "home":
      window.location.href =
        localStorage.getItem("mode") === "dm"
          ? "dm_home_en.html"
          : "home_en.html";
      break;
    case "player":
      if (localStorage.getItem("mode") === "dm") {
        localStorage.setItem("mode", "player");
      } else {
        localStorage.setItem("mode", "dm");
      }
      applyModeBackground();
      break;
    case "profile":
      window.location.href = "profile_en.html";
      break;
    case "settings":
      window.location.href = "settings_en.html";
      break;
    default:
      console.warn("Unknown destination:", destination);
  }
}


/* =====================================================
   NAVIGATION BUTTONS
   ===================================================== */

function initializeNavigation() {
  document.querySelectorAll(".navigation-btn").forEach((button) => {
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px) scale(1.05)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0px) scale(1)";
    });
  });
}


/* =====================================================
   BUTTON ACTIONS
   ===================================================== */

function initializeButtons() {
  document.querySelectorAll("button[disabled]").forEach((button) => {
    button.addEventListener("click", () => {
      showToast("Feature not yet implemented.");
    });
  });
}


/* =====================================================
   PANEL HOVER EFFECTS
   ===================================================== */

function initializeHoverEffects() {
  document.querySelectorAll(".p-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform   = "translateY(-4px)";
      card.style.borderColor = "rgba(255,196,92,0.45)";
      card.style.boxShadow   = "0 14px 40px rgba(0,0,0,0.55), 0 0 25px rgba(212,165,74,0.08)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform   = "translateY(0px)";
      card.style.borderColor = "rgba(184,134,52,0.25)";
      card.style.boxShadow   = "0 10px 30px rgba(0,0,0,0.45)";
    });
  });
}


/* =====================================================
   TOAST SYSTEM
   ===================================================== */

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent      = message;
  toast.style.display    = "block";
  toast.style.opacity    = "1";
  toast.style.transform  = "translateY(0px)";

  setTimeout(() => {
    toast.style.opacity   = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 2500);
}


/* =====================================================
   NOTIFICATION BADGE
   ===================================================== */

function updateNotificationBadge(count) {
  const notifBadge = document.getElementById("notifBadge");
  if (count <= 0) {
    notifBadge.style.display = "none";
    return;
  }
  notifBadge.style.display = "flex";
  notifBadge.textContent   = count;
}

updateNotificationBadge(3);


/* =====================================================
   EDITION BADGE & ANIMATION STYLES
   ===================================================== */

const style = document.createElement("style");
style.textContent = `
.editions-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.edition-badge {
  padding: 8px 14px; border-radius: 999px;
  background: rgba(70,40,20,0.85);
  border: 1px solid rgba(212,165,74,0.35);
  color: #f0d7a1; font-size: 0.9rem; transition: 0.25s ease;
}
.edition-badge:hover { transform: translateY(-2px); border-color: rgba(255,196,92,0.6); }
.role-tag {
  padding: 7px 12px; border-radius: 10px;
  background: rgba(30,20,12,0.95);
  border: 1px solid rgba(255,255,255,0.08); font-size: 0.85rem;
}
.roles-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.loaded .p-card, .loaded .hero-banner { animation: fadeUp 0.5s ease forwards; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0px); }
}
`;
document.head.appendChild(style);


/* =========================================================
   FETCH PROFILE DATA
   ========================================================= */

async function fetchProfileData() {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/profile", {
      headers: { token }
    });

    if (!response.ok) throw new Error("FAILED TO FETCH PROFILE");

    const data = await response.json();
    console.log("PROFILE DATA:", data.profile);
    populateProfile(data.profile);

  } catch (error) {
    console.error("PROFILE LOAD ERROR:", error);
  }
}


/* =========================================================
   POPULATE PROFILE UI
   ========================================================= */

function populateProfile(user) {

  profileDisplayName.textContent  = user.display_name || "Unknown User";
  profileTitle.textContent        = user.title        || "No Title";
  profileBioText.textContent      = user.bio          || "No bio written.";

  profileMemberSince.textContent  = user.created_at
    ? new Date(user.created_at).getFullYear()
    : "—";

  profileReputation.textContent   = "0";
  profileCampaignCount.textContent = "0";
  profileFriendCount.textContent  = "0";
  profileForumPostCount.textContent = "0";
  profileLevel.textContent        = "Lvl 1";

  fetchCharacterCount();

  document.body.classList.add("loaded");

  /* Status display is owned by presence.js — do not set it here */
}


/* =========================================================
   CHARACTER COUNT
   ========================================================= */

async function fetchCharacterCount() {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch("/api/characters", { headers: { token } });
    const data     = await response.json();
    const count    = data.characters ? data.characters.length : 0;

    profileCharacterCount.textContent = count;

    const vaultCharCount = document.getElementById("vaultCharCount");
    if (vaultCharCount) vaultCharCount.textContent = count;

  } catch (error) {
    console.error("Failed to load character count:", error);
    profileCharacterCount.textContent = "0";
  }
}
