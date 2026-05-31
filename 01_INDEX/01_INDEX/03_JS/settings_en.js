/* =========================================================
   GLOBAL USER PROFILE STATE
   ========================================================= */

const userProfile = {

  /* ACCOUNT */
  username: null,
  email: null,
  member_since: null,

  /* PROFILE */
  display_name: null,
  profile_title: null,
  pronouns: null,
  bio: null,
  avatar_url: null,

  /* SETTINGS */
  timezone: null,
  language: null,
  theme: null,

  /* STATUS */
  online_status: false,

  /* SOCIAL */
  roles: [],
  favorite_editions: [],

  /* STATS */
  campaign_count: null,
  character_count: null,
  friend_count: null,
  forum_post_count: null,
  reputation: null

};


/* =========================================================
   UNSAVED CHANGES TRACKER
   ========================================================= */

let hasUnsavedChanges = false;


/* =========================================================
   DOM REFERENCES
   ========================================================= */

const settingsNavItems =
  document.querySelectorAll(".s-nav-item");

const settingsSections =
  document.querySelectorAll(".s-section");

const toast =
  document.getElementById("toast");

const logoutBtn =
  document.getElementById("logoutBtn");

const logoutModal =
  document.getElementById("logoutModal");

const cancelLogout =
  document.getElementById("cancelLogout");

const deleteAccountBtn =
  document.getElementById("deleteAccountBtn");

const deleteModal =
  document.getElementById("deleteModal");

const cancelDelete =
  document.getElementById("cancelDelete");

const unsavedChangesModal =
  document.getElementById("unsavedChangesModal");

const stayOnPageBtn =
  document.getElementById("stayOnPageBtn");

const discardChangesBtn =
  document.getElementById("discardChangesBtn");

const confirmLogoutBtn =
  document.getElementById("confirmLogout");


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeSettingsPage
);

function applyModeBackground() {
  const mode = localStorage.getItem("mode") || "player";
  document.body.classList.remove("mode-player", "mode-dm");
  document.body.classList.add(`mode-${mode}`);
}


/* =========================================================
   INITIALIZE SETTINGS PAGE
   ========================================================= */

async function initializeSettingsPage() {

  applyModeBackground();

  initializeSettingsNavigation();

  initializeModals();

  initializeUnsavedChangesDetection();

  initializeHashRouting();

  initializeSaveButtons();

  await fetchProfileData();

  await fetchCharacterCount();

  await loadSettings();

}


/* =========================================================
   FETCH PROFILE DATA
   ========================================================= */

async function fetchProfileData() {

  try {

    console.log("FETCHING PROFILE...");

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/01_HTML/index_en.html";
      return;
    }

    const response = await fetch(
      "/api/profile",
      {
        headers: { token }
      }
    );

    if (!response.ok) {
      throw new Error("FAILED TO FETCH PROFILE");
    }

    const profileData = await response.json();

    console.log("PROFILE DATA:", profileData);

    Object.assign(userProfile, profileData.profile);

    userProfile.member_since = profileData.profile.created_at;

    hydrateProfileData();

  } catch (error) {

    console.error(error);
    showToast("FAILED TO LOAD PROFILE");

  }

}


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

async function loadSettings() {

  try {

    const token = localStorage.getItem("token");

    const response = await fetch(
      "/api/settings",
      {
        method: "GET",
        headers: { token }
      }
    );

    if (!response.ok) {
      throw new Error("FAILED TO LOAD SETTINGS");
    }

    const settings = await response.json();

    /* GENERAL */
    setSelectValue("languageSelect",    settings.language     || "");
    setSelectValue("timezoneSelect",    settings.timezone     || "");
    setSelectValue("dateFormatSelect",  settings.date_format  || "");
    setSelectValue("landingPageSelect", settings.landing_page || "");

    /* DISPLAY */
    setSelectValue("themeSelect", settings.theme || "");

    setCheckboxValue("compact-mode",         settings.compact_mode);
    setCheckboxValue("animated-backgrounds", settings.animated_backgrounds);

    /* ACCESSIBILITY */
    setCheckboxValue("reduced-motion", settings.reduced_motion);
    setCheckboxValue("high-contrast",  settings.high_contrast);
    setCheckboxValue("dyslexia-font",  settings.dyslexia_font);

    /* NOTIFICATIONS */
    setCheckboxValue("email_notifications", settings.email_notifications);

  } catch (error) {

    console.error("FAILED TO LOAD SETTINGS:", error);

  }

}


/* =========================================================
   SAVE PROFILE SETTINGS
   ========================================================= */

async function saveProfileSettings() {

  try {

    const token = localStorage.getItem("token");

    const payload = {
      display_name: document.getElementById("displayNameInput")?.value  || "",
      bio:          document.getElementById("profileBioInput")?.value   || "",
      pronouns:     document.getElementById("pronounsInput")?.value     || "",
      title:        document.getElementById("profileTitleInput")?.value || "",
      timezone:     document.getElementById("timezoneSelect")?.value    || "",
      language:     document.getElementById("languageSelect")?.value    || "",
      theme:        document.getElementById("themeSelect")?.value       || ""
    };

    const response = await fetch(
      "/api/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error("FAILED TO SAVE PROFILE");
    }

    userProfile.display_name = payload.display_name;
    userProfile.title        = payload.title;
    userProfile.bio          = payload.bio;
    userProfile.pronouns     = payload.pronouns;

    hydrateProfileData();

    hasUnsavedChanges = false;

    showToast("PROFILE SAVED");

  } catch (error) {

    console.error(error);
    showToast("SAVE FAILED");

  }

}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

async function saveSettings() {

  try {

    const token = localStorage.getItem("token");

    const payload = {
      language:             getSelectValue("languageSelect"),
      timezone:             getSelectValue("timezoneSelect"),
      date_format:          getSelectValue("dateFormatSelect"),
      landing_page:         getSelectValue("landingPageSelect"),
      theme:                getSelectValue("themeSelect"),
      compact_mode:         getCheckboxValue("compact-mode"),
      animated_backgrounds: getCheckboxValue("animated-backgrounds"),
      reduced_motion:       getCheckboxValue("reduced-motion"),
      high_contrast:        getCheckboxValue("high-contrast"),
      dyslexia_font:        getCheckboxValue("dyslexia-font"),
      email_notifications:  getCheckboxValue("email_notifications")
    };

    const response = await fetch(
      "/api/settings",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error("FAILED TO SAVE SETTINGS");
    }

    hasUnsavedChanges = false;

    showToast("SETTINGS SAVED");

  } catch (error) {

    console.error(error);
    showToast("SAVE FAILED");

  }

}


/* =========================================================
   SAVE BUTTON INITIALIZATION
   ========================================================= */

function initializeSaveButtons() {

  document.querySelectorAll("[data-save-section]").forEach((button) => {

    button.addEventListener("click", () => {

      const section = button.dataset.saveSection;

      if (section === "profile") {
        saveProfileSettings();
      } else {
        saveSettings();
      }

    });

  });

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(dateString) {

  if (!dateString) return "Unknown";

  return new Date(dateString).toLocaleDateString(
    "en-US",
    {
      year:  "numeric",
      month: "long",
      day:   "numeric"
    }
  );

}


/* =========================================================
   SETTINGS NAVIGATION
   ========================================================= */

function initializeSettingsNavigation() {

  settingsNavItems.forEach((button) => {

    button.addEventListener("click", () => {

      const sectionName = button.dataset.section;

      if (!sectionName) return;

      showSection(sectionName);

    });

  });

}


/* =========================================================
   SHOW SECTION
   ========================================================= */

function showSection(sectionName) {

  settingsNavItems.forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.section === sectionName) {
      item.classList.add("active");
    }
  });

  settingsSections.forEach((section) => {
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(`sec-${sectionName}`);

  if (targetSection) {
    targetSection.classList.add("active");
  }

  window.location.hash = sectionName;

}


/* =========================================================
   HASH ROUTING
   ========================================================= */

function initializeHashRouting() {

  const hash = window.location.hash.replace("#", "");

  if (hash) {
    showSection(hash);
  }

}


/* =========================================================
   MODAL INITIALIZATION
   ========================================================= */

function initializeModals() {

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => openModal(logoutModal));
  }

  if (cancelLogout) {
    cancelLogout.addEventListener("click", () => closeModal(logoutModal));
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => openModal(deleteModal));
  }

  if (cancelDelete) {
    cancelDelete.addEventListener("click", () => closeModal(deleteModal));
  }

  /* CONFIRM LOGOUT — calls API before redirecting */
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  }

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeModal(overlay);
    });
  });

}


/* =========================================================
   LOGOUT HANDLER
   ---------------------------------------------------------
   Calls the API to mark offline + revoke session,
   then clears localStorage and redirects.
   ========================================================= */

async function handleLogout() {

  try {

    const token        = localStorage.getItem("token");
    const sessionToken = localStorage.getItem("sessionToken");

    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ sessionToken: sessionToken || "" })
      });
    }

  } catch (err) {
    console.error("LOGOUT ERROR:", err);

  } finally {

    /* Always clear and redirect even if API call fails */
    localStorage.removeItem("token");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("userStatus");

    window.location.href = "../01_HTML/index_en.html";

  }

}


/* =========================================================
   OPEN MODAL
   ========================================================= */

function openModal(modalElement) {

  if (!modalElement) return;

  modalElement.classList.add("active");
  modalElement.setAttribute("aria-hidden", "false");

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal(modalElement) {

  if (!modalElement) return;

  modalElement.classList.remove("active");
  modalElement.setAttribute("aria-hidden", "true");

}


/* =========================================================
   TOAST NOTIFICATIONS
   ========================================================= */

function showToast(message) {

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);

}


/* =========================================================
   HYDRATE PROFILE DATA
   ========================================================= */

function hydrateProfileData() {

  hydrateAvatar();
  hydrateLevel();
  hydrateDisplayName();
  hydrateProfileTitle();
  hydrateStatus();
  hydrateRoles();
  hydrateStats();
  hydrateFavoriteEditions();
  hydrateAccountFields();

}


/* =========================================================
   DISPLAY NAME
   ========================================================= */

function hydrateDisplayName() {

  const el = document.getElementById("profileDisplayName");
  if (!el) return;
  el.textContent = userProfile.display_name || "Unknown Adventurer";

}


/* =========================================================
   PROFILE TITLE
   ========================================================= */

function hydrateProfileTitle() {

  const el = document.getElementById("profileTitle");
  if (!el) return;
  el.textContent = userProfile.title || "Title Not Yet Set";

}


/* =========================================================
   STATUS
   ---------------------------------------------------------
   Defers to presence.js if loaded; falls back to basic
   online/offline from profile data.
   ========================================================= */

function hydrateStatus() {

  /* If presence.js is loaded it owns status display */
  if (typeof presence_setStatusLocal === "function") {
    const saved = localStorage.getItem("userStatus") || "online";
    presence_setStatusLocal(saved);
    return;
  }

  const statusText = document.getElementById("profileStatusText");
  const statusDot  = document.querySelector(".status-dot");

  if (!statusText || !statusDot) return;

  if (userProfile.online_status) {
    statusText.textContent = "Online";
    statusDot.classList.remove("offline");
    statusDot.classList.add("online");
  } else {
    statusText.textContent = "Offline";
  }

}


/* =========================================================
   ROLE HYDRATION
   ========================================================= */

function hydrateRoles() {

  const roleContainer = document.getElementById("profileRoles");

  if (!roleContainer) return;

  roleContainer.innerHTML = "";

  if (!userProfile.roles || userProfile.roles.length === 0) {
    roleContainer.innerHTML = `<span class="placeholder-text">No Roles Assigned</span>`;
    return;
  }

  userProfile.roles.forEach((role) => {
    const badge = document.createElement("span");
    badge.classList.add("role-badge");
    badge.textContent = role;
    roleContainer.appendChild(badge);
  });

}


/* =========================================================
   LEVEL BADGE
   ========================================================= */

function hydrateLevel() {

  const el = document.getElementById("profileLevel");
  if (!el) return;

  el.textContent = `Lvl ${userProfile.level || 1}`;
  el.classList.remove("placeholder-text");

}


/* =========================================================
   AVATAR
   ========================================================= */

function hydrateAvatar() {

  const el = document.getElementById("profileAvatar");
  if (!el) return;
  el.textContent = "🧙";

}


/* =========================================================
   STATS
   ========================================================= */

function hydrateStats() {

  hydrateStat("profileCampaignCount",  userProfile.campaign_count,   "Campaign System Not Yet Implemented");
  hydrateStat("profileCharacterCount", userProfile.character_count,  "Character Vault Not Yet Implemented");
  hydrateStat("profileFriendCount",    userProfile.friend_count,     "Social System Not Yet Implemented");
  hydrateStat("profileForumPostCount", userProfile.forum_post_count, "Forum System Not Yet Implemented");
  hydrateStat("profileReputation",     userProfile.reputation,       "Reputation System Not Yet Implemented");

}


/* =========================================================
   GENERIC STAT HYDRATOR
   ========================================================= */

function hydrateStat(elementId, value, fallbackText) {

  const el = document.getElementById(elementId);
  if (!el) return;

  if (value === null || value === undefined) {
    el.textContent = fallbackText;
    el.classList.add("placeholder-text");
    return;
  }

  el.textContent = value;
  el.classList.remove("placeholder-text");

}


/* =========================================================
   FAVORITE EDITIONS
   ========================================================= */

function hydrateFavoriteEditions() {

  const container = document.getElementById("favoriteEditions");
  if (!container) return;

  container.innerHTML = "";

  if (!userProfile.favorite_editions || userProfile.favorite_editions.length === 0) {
    container.innerHTML = `<span class="placeholder-text">No Favorite Editions Selected</span>`;
    return;
  }

  userProfile.favorite_editions.forEach((edition) => {
    const el = document.createElement("div");
    el.classList.add("edition-icon");
    el.textContent = edition;
    container.appendChild(el);
  });

}


/* =========================================================
   ACCOUNT FIELD HYDRATION
   ========================================================= */

function hydrateAccountFields() {

  /* DISPLAY LABELS */
  setTextIfExists("accountUsername",    userProfile.username,                 "Unknown");
  setTextIfExists("accountEmail",       userProfile.email,                    "Unknown");
  setTextIfExists("accountMemberSince", formatDate(userProfile.member_since), "Unknown");
  setTextIfExists("profileMemberSince", formatDate(userProfile.member_since), "Unknown");

  /* INPUT FIELDS */
  setInputValue("displayNameInput",  userProfile.display_name);
  setInputValue("pronounsInput",     userProfile.pronouns);
  setInputValue("profileBioInput",   userProfile.bio);
  setInputValue("profileTitleInput", userProfile.title);

  /* SELECT FIELDS */
  setSelectValue("timezoneSelect", userProfile.timezone);
  setSelectValue("languageSelect", userProfile.language);
  setSelectValue("themeSelect",    userProfile.theme);

}


/* =========================================================
   UNSAVED CHANGES DETECTION
   ========================================================= */

function initializeUnsavedChangesDetection() {

  document.querySelectorAll("input, textarea, select").forEach((input) => {
    input.addEventListener("change", () => {
      hasUnsavedChanges = true;
    });
  });

}


/* =========================================================
   BEFORE UNLOAD WARNING
   ========================================================= */

window.addEventListener("beforeunload", (event) => {

  if (!hasUnsavedChanges) return;

  event.preventDefault();
  event.returnValue = "";

});


/* =========================================================
   UNSAVED CHANGES BUTTONS
   ========================================================= */

if (stayOnPageBtn) {
  stayOnPageBtn.addEventListener("click", () => {
    closeModal(unsavedChangesModal);
  });
}

if (discardChangesBtn) {
  discardChangesBtn.addEventListener("click", () => {
    hasUnsavedChanges = false;
    closeModal(unsavedChangesModal);
    showToast("Changes discarded.");
  });
}


/* =========================================================
   ESCAPE KEY SUPPORT
   ========================================================= */

document.addEventListener("keydown", (event) => {

  if (event.key !== "Escape") return;

  document.querySelectorAll(".modal-overlay.active").forEach((modal) => {
    closeModal(modal);
  });

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


/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}


/* =========================================================
   HELPER — SET TEXT
   ========================================================= */

function setTextIfExists(elementId, value, fallback) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = value ?? fallback;
}


/* =========================================================
   HELPER — SET INPUT VALUE
   ========================================================= */

function setInputValue(elementId, value) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.value = value || "";
}


/* =========================================================
   HELPER — SET SELECT VALUE
   ========================================================= */

function setSelectValue(elementId, value) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.value = value || "";
}


/* =========================================================
   HELPER — GET SELECT VALUE
   ========================================================= */

function getSelectValue(elementId) {
  return document.getElementById(elementId)?.value || "";
}


/* =========================================================
   HELPER — SET CHECKBOX VALUE
   ========================================================= */

function setCheckboxValue(elementId, value) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.checked = !!value;
}


/* =========================================================
   HELPER — GET CHECKBOX VALUE
   ========================================================= */

function getCheckboxValue(elementId) {
  return document.getElementById(elementId)?.checked || false;
}


/* =========================================================
   LIVE CHARACTER COUNT
   ========================================================= */

async function fetchCharacterCount() {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch("/api/characters", { headers: { token } });
    const data     = await response.json();
    const count    = data.characters ? data.characters.length : 0;

    userProfile.character_count = count;
    hydrateStat("profileCharacterCount", count, "Character Vault Not Yet Implemented");

  } catch (error) {
    console.error("Failed to load character count:", error);
  }
}


/* =========================================================
   PASSWORD MODAL — DOM REFS
   ========================================================= */

const passwordModal       = document.getElementById("passwordModal");
const changePasswordBtn   = document.getElementById("changePasswordBtn");
const cancelPasswordModal = document.getElementById("cancelPasswordModal");
const cancelPasswordForm  = document.getElementById("cancelPasswordForm");
const confirmPasswordBtn  = document.getElementById("confirmPasswordBtn");
const pwSuccessDone       = document.getElementById("pwSuccessDone");

const pwCurrent       = document.getElementById("pwCurrent");
const pwNew           = document.getElementById("pwNew");
const pwConfirm       = document.getElementById("pwConfirm");
const pwMismatch      = document.getElementById("pwMismatch");
const pwErrorBanner   = document.getElementById("pwErrorBanner");
const pwStrengthWrap  = document.getElementById("pwStrengthWrap");
const pwStrengthLabel = document.getElementById("pwStrengthLabel");
const pwFormState     = document.getElementById("pwFormState");
const pwSuccessState  = document.getElementById("pwSuccessState");

const PW_STRENGTH_COLORS = ["", "#c0392b", "#e67e22", "#f1c40f", "#4caf50", "#d4af37"];
const PW_STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Ironclad"];


/* =========================================================
   PASSWORD MODAL — OPEN / CLOSE
   ========================================================= */

function openPasswordModal() {
  resetPasswordModal();
  openModal(passwordModal);
}

function closePasswordModal() {
  closeModal(passwordModal);
}

function resetPasswordModal() {
  pwCurrent.value  = "";
  pwNew.value      = "";
  pwConfirm.value  = "";
  pwMismatch.textContent    = "";
  pwErrorBanner.textContent = "";
  pwErrorBanner.classList.remove("visible");
  confirmPasswordBtn.disabled = true;
  pwFormState.hidden    = false;
  pwSuccessState.hidden = true;
  pwStrengthWrap.setAttribute("aria-hidden", "true");
  updateStrengthMeter("");
  document.querySelectorAll(".pw-rule").forEach(r => r.classList.remove("pass"));
  document.querySelectorAll(".pw-bar").forEach(b => {
    b.style.backgroundColor = "";
    b.style.boxShadow       = "";
  });
}


/* =========================================================
   PASSWORD STRENGTH
   ========================================================= */

function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)          score++;
  if (password.length >= 12)         score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 5);
}

function updateStrengthMeter(password) {
  const strength = getPasswordStrength(password);
  const bars     = document.querySelectorAll(".pw-bar");
  const color    = PW_STRENGTH_COLORS[strength];

  bars.forEach((bar, i) => {
    if (i < strength) {
      bar.style.backgroundColor = color;
      bar.style.boxShadow       = `0 0 6px ${color}55`;
    } else {
      bar.style.backgroundColor = "rgba(255,255,255,0.08)";
      bar.style.boxShadow       = "none";
    }
  });

  pwStrengthLabel.textContent = password ? PW_STRENGTH_LABELS[strength] : "";
  pwStrengthLabel.style.color = color;
}

function updateRules(password) {
  const rules = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  Object.entries(rules).forEach(([key, pass]) => {
    const el = document.getElementById(`rule-${key}`);
    if (!el) return;
    el.classList.toggle("pass", pass);
    el.textContent = (pass ? "✓ " : "✗ ") + el.textContent.slice(2);
  });
}


/* =========================================================
   PASSWORD VALIDATION — LIVE
   ========================================================= */

function validatePasswordForm() {
  const current  = pwCurrent.value.trim();
  const newPw    = pwNew.value;
  const confirm  = pwConfirm.value;
  const strength = getPasswordStrength(newPw);
  const mismatch = confirm.length > 0 && newPw !== confirm;

  pwMismatch.textContent = mismatch ? "Passwords do not match." : "";

  confirmPasswordBtn.disabled = !(
    current.length > 0 &&
    newPw.length   > 0 &&
    confirm.length > 0 &&
    !mismatch &&
    strength >= 2
  );
}


/* =========================================================
   EYE TOGGLE
   ========================================================= */

document.querySelectorAll(".pw-eye-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type      = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "👁" : "🙈";
  });
});


/* =========================================================
   NEW PASSWORD — LIVE FEEDBACK
   ========================================================= */

pwNew?.addEventListener("input", () => {
  const val = pwNew.value;
  pwStrengthWrap.setAttribute("aria-hidden", val.length === 0 ? "true" : "false");
  updateStrengthMeter(val);
  updateRules(val);
  validatePasswordForm();
});

pwCurrent?.addEventListener("input", validatePasswordForm);
pwConfirm?.addEventListener("input", validatePasswordForm);


/* =========================================================
   SUBMIT — CHANGE PASSWORD
   ========================================================= */

confirmPasswordBtn?.addEventListener("click", async () => {
  pwErrorBanner.classList.remove("visible");
  pwErrorBanner.textContent       = "";
  confirmPasswordBtn.disabled     = true;
  confirmPasswordBtn.textContent  = "Updating…";

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token
      },
      body: JSON.stringify({
        current_password: pwCurrent.value,
        new_password:     pwNew.value
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to update password.");
    }

    pwFormState.hidden    = true;
    pwSuccessState.hidden = false;

  } catch (err) {
    pwErrorBanner.textContent = err.message;
    pwErrorBanner.classList.add("visible");
    confirmPasswordBtn.disabled    = false;
    confirmPasswordBtn.textContent = "Update Password";
  }
});


/* =========================================================
   PASSWORD MODAL — EVENT LISTENERS
   ========================================================= */

changePasswordBtn?.addEventListener("click",   openPasswordModal);
cancelPasswordModal?.addEventListener("click", closePasswordModal);
cancelPasswordForm?.addEventListener("click",  closePasswordModal);
pwSuccessDone?.addEventListener("click",       closePasswordModal);

passwordModal?.addEventListener("click", (e) => {
  if (e.target === passwordModal) closePasswordModal();
});
