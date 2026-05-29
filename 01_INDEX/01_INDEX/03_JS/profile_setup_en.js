// =====================================================
// HEROES SCRIPTORIUM
// PROFILE SETUP / ONBOARDING
// Matches profile_setup_en.html and profile_setup_en.css
// =====================================================


// =====================================================
// GLOBAL STATE
// =====================================================

const state = {
  step: 1,

  path: null,

  identity: {
    avatar: "🧙",
    displayName: "",
    title: "",
    bio: "",
    pronouns: []
  },

  roles: ["Player"],

  preferences: {
    availability: [],
    comfort: {
      violence: "Medium",
      language: "Medium",
      matureThemes: "Medium",
      horror: "Medium",
      romance: "Medium",
      sensitiveTopics: "Medium"
    },
    theme: "Dark",
    visibility: "Public"
  }
};


// =====================================================
// STATIC DATA
// =====================================================

const STEPS = [
  {
    id: 1,
    label: "Path",
    icon: "✦",
    desc: "Choose your journey."
  },
  {
    id: 2,
    label: "Identity",
    icon: "👤",
    desc: "Tell the world who you are."
  },
  {
    id: 3,
    label: "Roles",
    icon: "⚔️",
    desc: "What will you bring to the table?"
  },
  {
    id: 4,
    label: "Preferences",
    icon: "⚙️",
    desc: "Set your personal defaults."
  },
  {
    id: 5,
    label: "Confirm",
    icon: "🛡️",
    desc: "Review and enter the Scriptorium."
  }
];


const PATHS = [
  {
    id: "adventurer",
    name: "The Adventurer",
    icon: "⚔️",
    bg: "🗡️",
    desc: "Seek quests, battle foes, and uncover treasures in a world of endless possibilities.",
    best: "Players who love exploration, combat, and epic stories.",
    highlights: [
      "Access to Quests & Adventures",
      "Combat & Exploration Tools",
      "Treasures & Rewards System",
      "Dynamic World Events"
    ],
    suggestedRole: "Player"
  },
  {
    id: "chronicler",
    name: "The Chronicler",
    icon: "📜",
    bg: "📖",
    desc: "Craft tales, build worlds, and weave legends that others will remember.",
    best: "Writers and world-builders who love storytelling and lore.",
    highlights: [
      "Lore Writing Tools",
      "World-Building Hub",
      "Story Archive",
      "Narrative Templates"
    ],
    suggestedRole: "Lorekeeper"
  },
  {
    id: "leader",
    name: "The Leader",
    icon: "👑",
    bg: "🏰",
    desc: "Gather companions, forge alliances, and lead your realm to greatness.",
    best: "Players who enjoy strategy, guilds, and guiding others.",
    highlights: [
      "Guild Management",
      "Campaign Organization",
      "Party Recruitment",
      "Community Events"
    ],
    suggestedRole: "Dungeon Master"
  },
  {
    id: "craftsman",
    name: "The Craftsman",
    icon: "🔨",
    bg: "⚒️",
    desc: "Create items, design challenges, and build tools for your adventures.",
    best: "Those who love creation, customization, and crafting.",
    highlights: [
      "Homebrew Workshop",
      "Custom Item Creator",
      "Module Designer",
      "Asset Library"
    ],
    suggestedRole: "World Builder"
  }
];


const ROLES = [
  {
    id: "Dungeon Master",
    icon: "🧙",
    desc: "Lead epic campaigns, craft unforgettable stories, and challenge your players.",
    for: "Storytellers · World Builders · Challenge Creators"
  },
  {
    id: "Player",
    icon: "⚔️",
    desc: "Join adventures, create heroes, and explore endless worlds.",
    for: "Adventurers · Role-players · Collaborators",
    locked: true
  },
  {
    id: "World Builder",
    icon: "🗺️",
    desc: "Design worlds, factions, and lore that inspire generations.",
    for: "Creators · Lorekeepers · Mapmakers"
  },
  {
    id: "Lorekeeper",
    icon: "📚",
    desc: "Preserve knowledge, chronicle history, and keep the lore alive.",
    for: "Historians · Archivists · Detail Lovers"
  }
];


const AVATARS = [
  "🧙",
  "⚔️",
  "🏹",
  "🛡️",
  "🔮",
  "🐉",
  "🦅",
  "💀",
  "🌙",
  "⭐",
  "🔥",
  "🌊",
  "👑",
  "🗡️",
  "📜",
  "🦁"
];


const PRONOUNS = [
  "She / Her",
  "He / Him",
  "They / Them",
  "Xe / Xem",
  "Ze / Hir",
  "Prefer not to say"
];


const AVAILABILITY = [
  "Weekdays – Mornings",
  "Weekdays – Afternoons",
  "Weekdays – Evenings",
  "Weekends",
  "Late Nights",
  "Varies"
];


const COMFORT_CATEGORIES = [
  "violence",
  "language",
  "matureThemes",
  "horror",
  "romance",
  "sensitiveTopics"
];


const COMFORT_LABELS = {
  violence: "Violence / Gore",
  language: "Strong Language",
  matureThemes: "Mature Themes",
  horror: "Horror / Body Horror",
  romance: "Romance / Intimacy",
  sensitiveTopics: "Sensitive Topics"
};


// =====================================================
// DOM ELEMENTS
// =====================================================

const progressBar =
  document.getElementById("progressBar");

const sidebarSteps =
  document.getElementById("sidebarSteps");

const mainContent =
  document.getElementById("mainContent");

const previewPanel =
  document.getElementById("previewPanel");

const backToLogin =
  document.getElementById("backToLogin");


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  renderAll();

  if (backToLogin) {
    backToLogin.addEventListener("click", () => {
      if (confirm("Return to login? Your progress will be lost.")) {
        window.location.href = "/01_HTML/index_en.html";
      }
    });
  }
});


// =====================================================
// MASTER RENDER
// =====================================================

function renderAll() {
  renderProgress();
  renderSidebar();
  renderPreview();

  switch (state.step) {
    case 1:
      renderStep1();
      break;

    case 2:
      renderStep2();
      break;

    case 3:
      renderStep3();
      break;

    case 4:
      renderStep4();
      break;

    case 5:
      renderStep5();
      break;

    default:
      state.step = 1;
      renderStep1();
      break;
  }

  if (mainContent) {
    mainContent.scrollTop = 0;
  }
}


// =====================================================
// PROGRESS BAR
// =====================================================

function renderProgress() {
  if (!progressBar) {
    return;
  }

  progressBar.innerHTML = "";

  STEPS.forEach((step, index) => {
    const status =
      step.id < state.step
        ? "done"
        : step.id === state.step
        ? "active"
        : "";

    const dot =
      document.createElement("div");

    dot.className =
      "step-dot";

    dot.innerHTML = `
      <div class="step-circle ${status}">
        <span>${step.id}</span>
      </div>

      <div class="step-label ${status}">
        ${step.label}
      </div>
    `;

    progressBar.appendChild(dot);

    if (index < STEPS.length - 1) {
      const line =
        document.createElement("div");

      line.className =
        `progress-line${step.id < state.step ? " done" : ""}`;

      progressBar.appendChild(line);
    }
  });
}


// =====================================================
// SIDEBAR
// =====================================================

function renderSidebar() {
  if (!sidebarSteps) {
    return;
  }

  sidebarSteps.innerHTML = "";

  STEPS.forEach((step) => {
    const status =
      step.id < state.step
        ? "done"
        : step.id === state.step
        ? "active"
        : "";

    const div =
      document.createElement("div");

    div.className =
      `sidebar-step ${status}`;

    div.innerHTML = `
      <div class="sidebar-step-icon">
        ${step.icon}
      </div>

      <div class="sidebar-step-text">
        <strong>
          ${step.id}. ${step.label}
        </strong>

        <span>
          ${step.desc}
        </span>
      </div>

      ${step.id < state.step ? '<div class="sidebar-step-badge">✓</div>' : ""}
    `;

    sidebarSteps.appendChild(div);
  });
}


// =====================================================
// PREVIEW PANEL
// =====================================================

function renderPreview() {
  if (!previewPanel) {
    return;
  }

  const chosenPath =
    PATHS.find((path) => path.id === state.path);

  const name =
    state.identity.displayName || "Hero";

  const title =
    state.identity.title || (chosenPath ? chosenPath.name : "Path Preview");

  let html = `
    <div class="preview-title">
      ✦ Your Preview ✦
    </div>

    <div class="preview-avatar-wrap">
      <div class="preview-avatar-outer">
        ${state.identity.avatar}
        <div class="preview-level">1</div>
      </div>
    </div>

    <div class="preview-name">
      ${escapeHtml(name)}
    </div>

    <div class="preview-title-text">
      ${escapeHtml(title)}
      <span style="color:var(--gold-dim)">✍</span>
    </div>

    <div class="preview-divider"></div>
  `;

  if (state.step === 1 && chosenPath) {
    html += `
      <div class="preview-section-label">
        Path Highlights
      </div>
    `;

    html += chosenPath.highlights
      .map((highlight) => {
        return `
          <div class="preview-item">
            <span class="preview-item-icon">✦</span>
            ${escapeHtml(highlight)}
          </div>
        `;
      })
      .join("");
  }

  if (state.step >= 2) {
    html += `
      <div class="preview-section-label">
        Roles
      </div>
    `;

    html += state.roles
      .map((roleName) => {
        const role =
          ROLES.find((item) => item.id === roleName);

        return `
          <div class="preview-item">
            <span class="preview-item-icon">
              ${role ? role.icon : "⚔️"}
            </span>
            ${escapeHtml(roleName)}
          </div>
        `;
      })
      .join("");
  }

  html += `
    <div class="preview-divider"></div>
  `;

  [
    {
      label: "Member Since",
      value: new Date().toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric"
        }
      )
    },
    {
      label: "Edition",
      value: "Not set yet"
    },
    {
      label: "Timezone",
      value: "Not set"
    },
    {
      label: "Theme",
      value: state.preferences.theme || "Not set"
    }
  ].forEach((stat) => {
    html += `
      <div class="preview-stat">
        <span class="preview-stat-label">
          ${stat.label}
        </span>

        <span>
          ${stat.value}
        </span>
      </div>
    `;
  });

  previewPanel.innerHTML =
    html;
}


// =====================================================
// STEP NAVIGATION
// =====================================================

function goToStep(stepNumber) {
  state.step = stepNumber;
  renderAll();
}


// =====================================================
// STEP 1 - PATH
// =====================================================

function renderStep1() {
  if (!mainContent) {
    return;
  }

  mainContent.innerHTML = `
    <div class="step-section">
      <h2 class="section-title">
        1. Choose Your Path
      </h2>

      <p class="section-subtitle">
        Every hero's journey begins with a choice. Which path calls to you?
      </p>

      <div class="path-grid">
        ${PATHS.map((path) => {
          return `
            <div
              class="path-card ${state.path === path.id ? "selected" : ""}"
              data-path="${path.id}"
            >
              <div class="path-card-img">
                <div class="path-card-img-bg">
                  ${path.bg}
                </div>

                <div class="path-card-icon">
                  ${path.icon}
                </div>
              </div>

              <div class="path-card-check">
                ✓
              </div>

              <div class="path-card-name">
                ${escapeHtml(path.name)}
              </div>

              <div class="path-card-desc">
                ${escapeHtml(path.desc)}
              </div>

              <div class="path-card-best">
                <strong>Best for:</strong>
                ${escapeHtml(path.best)}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="hs-note">
        <span class="hs-note-icon">
          ✦
        </span>

        <span>
          You can explore all features regardless of your path. This choice simply helps us personalize your experience.
        </span>
      </div>

      <div class="hs-actions">
        <button
          class="btn-back"
          id="btnBack"
        >
          ← Back
        </button>

        <button
          class="btn-continue"
          id="btnContinue"
        >
          Continue →
        </button>
      </div>
    </div>
  `;

  document
    .querySelectorAll(".path-card")
    .forEach((card) => {
      card.addEventListener("click", () => {
        const pathId =
          card.dataset.path;

        const path =
          PATHS.find((item) => item.id === pathId);

        state.path =
          pathId;

        if (
          path &&
          path.suggestedRole &&
          !state.roles.includes(path.suggestedRole)
        ) {
          state.roles.push(path.suggestedRole);
        }

        renderAll();
      });
    });

  document
    .getElementById("btnContinue")
    .addEventListener("click", () => {
      if (!state.path) {
        alert("Please choose a path to continue.");
        return;
      }

      goToStep(2);
    });

  document
    .getElementById("btnBack")
    .addEventListener("click", () => {
      window.location.href = "/01_HTML/index_en.html";
    });
}


// =====================================================
// STEP 2 - IDENTITY
// =====================================================

function renderStep2() {
  if (!mainContent) {
    return;
  }

  mainContent.innerHTML = `
    <div class="step-section">
      <h2 class="section-title">
        2. Your Identity
      </h2>

      <p class="section-subtitle">
        Tell us about yourself. This is how you'll appear across the Scriptorium.
      </p>

      <div class="identity-grid">
        <div class="avatar-section">
          <div class="avatar-label">
            Avatar
          </div>

          <div
            class="avatar-ring"
            id="avatarDisplay"
          >
            ${state.identity.avatar}
            <div class="avatar-edit-btn">
              ✎
            </div>
          </div>

          <button
            class="btn-choose-avatar"
            id="btnChooseAvatar"
          >
            Choose Avatar
          </button>
        </div>

        <div class="form-fields">
          <div class="form-group">
            <label class="form-label">
              Display Name <span>*</span>
            </label>

            <input
              class="form-input"
              id="inputDisplayName"
              type="text"
              maxlength="30"
              placeholder="Enter your name..."
              value="${escapeAttribute(state.identity.displayName)}"
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              Title <span style="color:var(--text-dim)">(Optional)</span>
            </label>

            <input
              class="form-input"
              id="inputTitle"
              type="text"
              maxlength="40"
              placeholder="e.g. The Chronicler..."
              value="${escapeAttribute(state.identity.title)}"
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              Bio <span style="color:var(--text-dim)">(Optional)</span>
            </label>

            <textarea
              class="form-textarea"
              id="inputBio"
              maxlength="160"
              rows="3"
              placeholder="Tell your story in a few words..."
            >${escapeHtml(state.identity.bio)}</textarea>

            <div class="form-char-count">
              <span id="bioCount">
                ${state.identity.bio.length}
              </span>/160
            </div>
          </div>
        </div>
      </div>

      <div class="hs-divider"></div>

      <div class="form-group">
        <label
          class="form-label"
          style="margin-bottom:7px;"
        >
          Pronouns <span style="color:var(--text-dim)">(Optional)</span>
        </label>

        <div class="pronoun-grid">
          ${PRONOUNS.map((pronoun) => {
            return `
              <div
                class="pronoun-btn ${state.identity.pronouns.includes(pronoun) ? "selected" : ""}"
                data-pronoun="${escapeAttribute(pronoun)}"
              >
                ${escapeHtml(pronoun)}
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div
        id="avatarPicker"
        style="display:none;"
      >
        <div class="hs-divider"></div>

        <div
          class="form-label"
          style="margin-bottom:8px;"
        >
          Choose Your Avatar
        </div>

        <div class="avatar-grid">
          ${AVATARS.map((avatar) => {
            return `
              <div
                class="avatar-option"
                data-avatar="${escapeAttribute(avatar)}"
              >
                ${avatar}
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="hs-actions">
        <button
          class="btn-back"
          id="btnBack"
        >
          ← Back
        </button>

        <button
          class="btn-continue"
          id="btnContinue"
        >
          Continue →
        </button>
      </div>
    </div>
  `;

  const displayNameInput =
    document.getElementById("inputDisplayName");

  const titleInput =
    document.getElementById("inputTitle");

  const bioInput =
    document.getElementById("inputBio");

  const bioCount =
    document.getElementById("bioCount");

  displayNameInput.addEventListener("input", (event) => {
    state.identity.displayName =
      event.target.value;

    renderPreview();
  });

  titleInput.addEventListener("input", (event) => {
    state.identity.title =
      event.target.value;

    renderPreview();
  });

  bioInput.addEventListener("input", (event) => {
    state.identity.bio =
      event.target.value;

    bioCount.textContent =
      event.target.value.length;

    renderPreview();
  });

  document
    .querySelectorAll(".pronoun-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const pronoun =
          button.dataset.pronoun;

        if (state.identity.pronouns.includes(pronoun)) {
          state.identity.pronouns =
            state.identity.pronouns.filter((item) => item !== pronoun);
        } else {
          state.identity.pronouns.push(pronoun);
        }

        renderAll();
      });
    });

  const avatarPicker =
    document.getElementById("avatarPicker");

  document
    .getElementById("btnChooseAvatar")
    .addEventListener("click", () => {
      avatarPicker.style.display =
        avatarPicker.style.display === "none"
          ? "block"
          : "none";
    });

  document
    .getElementById("avatarDisplay")
    .addEventListener("click", () => {
      avatarPicker.style.display =
        avatarPicker.style.display === "none"
          ? "block"
          : "none";
    });

  document
    .querySelectorAll(".avatar-option")
    .forEach((option) => {
      option.addEventListener("click", () => {
        state.identity.avatar =
          option.dataset.avatar;

        avatarPicker.style.display =
          "none";

        renderAll();
      });
    });

  document
    .getElementById("btnContinue")
    .addEventListener("click", () => {
      state.identity.displayName =
        displayNameInput.value.trim();

      state.identity.title =
        titleInput.value.trim();

      state.identity.bio =
        bioInput.value.trim();

      if (!state.identity.displayName) {
        alert("Please enter a display name.");
        return;
      }

      goToStep(3);
    });

  document
    .getElementById("btnBack")
    .addEventListener("click", () => {
      goToStep(1);
    });
}


// =====================================================
// STEP 3 - ROLES
// =====================================================

function renderStep3() {
  if (!mainContent) {
    return;
  }

  mainContent.innerHTML = `
    <div class="step-section">
      <h2 class="section-title">
        3. Your Roles
      </h2>

      <p class="section-subtitle">
        Every hero has many sides. Select the roles that fit you.
      </p>

      <div class="roles-grid">
        ${ROLES.map((role) => {
          return `
            <div
              class="role-card ${state.roles.includes(role.id) ? "selected" : ""} ${role.locked ? "locked" : ""}"
              data-role="${escapeAttribute(role.id)}"
            >
              <div class="role-check">
                ✓
              </div>

              <span class="role-card-icon">
                ${role.icon}
              </span>

              <div class="role-card-name">
                ${escapeHtml(role.id)}
              </div>

              <div class="role-card-desc">
                ${escapeHtml(role.desc)}
              </div>

              <div class="role-card-for">
                <strong>
                  Great for:
                </strong>
                ${escapeHtml(role.for)}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="hs-note">
        <span class="hs-note-icon">
          ⚔️
        </span>

        <span>
          All heroes start as Players. You can change your roles anytime from your profile.
        </span>
      </div>

      <div class="hs-actions">
        <button
          class="btn-back"
          id="btnBack"
        >
          ← Back
        </button>

        <button
          class="btn-continue"
          id="btnContinue"
        >
          Continue →
        </button>
      </div>
    </div>
  `;

  document
    .querySelectorAll(".role-card")
    .forEach((card) => {
      card.addEventListener("click", () => {
        const role =
          card.dataset.role;

        if (card.classList.contains("locked")) {
          return;
        }

        if (state.roles.includes(role)) {
          state.roles =
            state.roles.filter((item) => item !== role);
        } else {
          state.roles.push(role);
        }

        renderAll();
      });
    });

  document
    .getElementById("btnContinue")
    .addEventListener("click", () => {
      goToStep(4);
    });

  document
    .getElementById("btnBack")
    .addEventListener("click", () => {
      goToStep(2);
    });
}


// =====================================================
// STEP 4 - PREFERENCES
// =====================================================

function renderStep4() {
  if (!mainContent) {
    return;
  }

  mainContent.innerHTML = `
    <div class="step-section">
      <h2 class="section-title">
        4. Your Preferences
      </h2>

      <p class="section-subtitle">
        Set your personal defaults. You can change these anytime.
      </p>

      <div class="prefs-grid">
        <div class="pref-section">
          <div class="pref-section-title">
            🕐 Availability
          </div>

          ${AVAILABILITY.map((availability) => {
            return `
              <div
                class="pref-option ${state.preferences.availability.includes(availability) ? "checked" : ""}"
                data-availability="${escapeAttribute(availability)}"
              >
                <div class="pref-checkbox">
                  ${state.preferences.availability.includes(availability) ? "✓" : ""}
                </div>

                <span>
                  ${escapeHtml(availability)}
                </span>
              </div>
            `;
          }).join("")}
        </div>

        <div class="pref-section">
          <div class="pref-section-title">
            🛡️ Content Comfort
          </div>

          ${COMFORT_CATEGORIES.map((category) => {
            return `
              <div class="comfort-row">
                <span>
                  ${COMFORT_LABELS[category]}
                </span>

                <div class="comfort-options">
                  ${["Low", "Medium", "High"].map((level) => {
                    return `
                      <button
                        class="comfort-btn ${state.preferences.comfort[category] === level ? "selected" : ""}"
                        data-category="${category}"
                        data-level="${level}"
                      >
                        ${level}
                      </button>
                    `;
                  }).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="pref-section">
          <div class="pref-section-title">
            🎨 Theme
          </div>

          <div class="theme-options">
            ${["Dark", "Sepia", "Light"].map((theme) => {
              return `
                <button
                  class="theme-btn ${state.preferences.theme === theme ? "selected" : ""}"
                  data-theme="${theme}"
                >
                  ${theme}
                </button>
              `;
            }).join("")}
          </div>
        </div>

        <div class="pref-section">
          <div class="pref-section-title">
            👤 Profile Visibility
          </div>

          ${["Public", "Friends Only", "Private"].map((visibility) => {
            return `
              <div
                class="pref-option ${state.preferences.visibility === visibility ? "selected" : ""}"
                data-visibility="${visibility}"
              >
                <div class="pref-radio">
                  <div class="pref-radio-inner"></div>
                </div>

                <span>
                  ${visibility}
                </span>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="hs-actions">
        <button
          class="btn-back"
          id="btnBack"
        >
          ← Back
        </button>

        <button
          class="btn-continue"
          id="btnContinue"
        >
          Continue →
        </button>
      </div>
    </div>
  `;

  document
    .querySelectorAll("[data-availability]")
    .forEach((option) => {
      option.addEventListener("click", () => {
        const availability =
          option.dataset.availability;

        if (state.preferences.availability.includes(availability)) {
          state.preferences.availability =
            state.preferences.availability.filter((item) => item !== availability);
        } else {
          state.preferences.availability.push(availability);
        }

        renderAll();
      });
    });

  document
    .querySelectorAll(".comfort-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const category =
          button.dataset.category;

        const level =
          button.dataset.level;

        state.preferences.comfort[category] =
          level;

        renderAll();
      });
    });

  document
    .querySelectorAll(".theme-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        state.preferences.theme =
          button.dataset.theme;

        renderAll();
      });
    });

  document
    .querySelectorAll("[data-visibility]")
    .forEach((option) => {
      option.addEventListener("click", () => {
        state.preferences.visibility =
          option.dataset.visibility;

        renderAll();
      });
    });

  document
    .getElementById("btnContinue")
    .addEventListener("click", () => {
      goToStep(5);
    });

  document
    .getElementById("btnBack")
    .addEventListener("click", () => {
      goToStep(3);
    });
}


// =====================================================
// STEP 5 - CONFIRM
// =====================================================

function renderStep5() {
  if (!mainContent) {
    return;
  }

  const path =
    PATHS.find((item) => item.id === state.path);

  const pronouns =
    state.identity.pronouns.length
      ? state.identity.pronouns.join(", ")
      : "—";

  const availability =
    state.preferences.availability.length
      ? state.preferences.availability.join(", ")
      : "—";

  const comfort =
    COMFORT_CATEGORIES
      .map((category) => {
        return `${COMFORT_LABELS[category]}: ${state.preferences.comfort[category]}`;
      })
      .join(" · ");

  mainContent.innerHTML = `
    <div class="step-section">
      <h2 class="section-title">
        5. Confirm & Begin
      </h2>

      <p class="section-subtitle">
        Review your selections. You can go back to make changes if needed.
      </p>

      <div class="confirm-grid">
        <div class="confirm-card">
          <div class="confirm-card-header">
            <div class="confirm-card-title">
              ✦ Path
            </div>

            <button
              class="confirm-edit-btn"
              data-goto="1"
            >
              Edit ✎
            </button>
          </div>

          ${
            path
              ? `
                <div class="confirm-path-display">
                  <div class="confirm-path-icon">
                    ${path.icon}
                  </div>

                  <div>
                    <div class="confirm-path-name">
                      ${escapeHtml(path.name)}
                    </div>

                    <div class="confirm-path-desc">
                      ${escapeHtml(path.desc)}
                    </div>
                  </div>
                </div>
              `
              : `<div style="color:var(--text-dim);font-size:12px;">Not selected</div>`
          }
        </div>

        <div class="confirm-card">
          <div class="confirm-card-header">
            <div class="confirm-card-title">
              👤 Identity
            </div>

            <button
              class="confirm-edit-btn"
              data-goto="2"
            >
              Edit ✎
            </button>
          </div>

          <div class="confirm-item">
            <span class="confirm-item-label">Name</span>
            <span class="confirm-item-value">${escapeHtml(state.identity.displayName || "—")}</span>
          </div>

          <div class="confirm-item">
            <span class="confirm-item-label">Title</span>
            <span class="confirm-item-value">${escapeHtml(state.identity.title || "—")}</span>
          </div>

          <div class="confirm-item">
            <span class="confirm-item-label">Bio</span>
            <span class="confirm-item-value">${escapeHtml(state.identity.bio || "—")}</span>
          </div>

          <div class="confirm-item">
            <span class="confirm-item-label">Pronouns</span>
            <span class="confirm-item-value">${escapeHtml(pronouns)}</span>
          </div>
        </div>

        <div class="confirm-card">
          <div class="confirm-card-header">
            <div class="confirm-card-title">
              ⚔️ Roles
            </div>

            <button
              class="confirm-edit-btn"
              data-goto="3"
            >
              Edit ✎
            </button>
          </div>

          ${state.roles.map((roleName) => {
            const role =
              ROLES.find((item) => item.id === roleName);

            return `
              <div class="confirm-item">
                <span style="font-size:13px;margin-right:5px;">
                  ${role ? role.icon : ""}
                </span>

                <span class="confirm-item-value">
                  ${escapeHtml(roleName)}
                </span>
              </div>
            `;
          }).join("")}
        </div>

        <div class="confirm-card">
          <div class="confirm-card-header">
            <div class="confirm-card-title">
              ⚙️ Preferences
            </div>

            <button
              class="confirm-edit-btn"
              data-goto="4"
            >
              Edit ✎
            </button>
          </div>

          <div class="confirm-item">
            <span class="confirm-item-label">Theme</span>
            <span class="confirm-item-value">${escapeHtml(state.preferences.theme)}</span>
          </div>

          <div class="confirm-item">
            <span class="confirm-item-label">Privacy</span>
            <span class="confirm-item-value">${escapeHtml(state.preferences.visibility)}</span>
          </div>

          <div class="confirm-item">
            <span class="confirm-item-label">Available</span>
            <span class="confirm-item-value">${escapeHtml(availability)}</span>
          </div>

          <div
            class="confirm-item"
            style="flex-direction:column;gap:2px;"
          >
            <span
              class="confirm-item-label"
              style="min-width:unset;"
            >
              Content Comfort
            </span>

            <span
              style="font-size:10.5px;color:var(--text-dim);line-height:1.6;"
            >
              ${escapeHtml(comfort)}
            </span>
          </div>
        </div>
      </div>

      <div class="confirm-legal">
        <span>
          🛡️
        </span>

        <span>
          By continuing, you agree to our
          <a>Community Guidelines</a>
          and
          <a>Privacy Policy</a>.
          You can update your profile and preferences at any time.
        </span>
      </div>

      <div class="hs-actions">
        <button
          class="btn-back"
          id="btnBack"
        >
          ← Back
        </button>

        <button
          class="btn-enter"
          id="btnEnter"
        >
          Enter the Scriptorium →
        </button>
      </div>
    </div>
  `;

  document
    .querySelectorAll(".confirm-edit-btn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        goToStep(
          Number(button.dataset.goto)
        );
      });
    });

  document
    .getElementById("btnBack")
    .addEventListener("click", () => {
      goToStep(4);
    });

  document
    .getElementById("btnEnter")
    .addEventListener("click", submitProfileSetup);
}


// =====================================================
// SUBMIT PROFILE SETUP
// =====================================================

async function submitProfileSetup() {
  const token =
    localStorage.getItem("token");

  if (!token) {
    alert("You are not logged in. Please log in again.");
    window.location.href = "/01_HTML/index_en.html";
    return;
  }

  const payload = {
    display_name: state.identity.displayName,
    title: state.identity.title,
    bio: state.identity.bio,
    pronouns: state.identity.pronouns.join(", "),
    avatar_url: state.identity.avatar,
    timezone: state.preferences.timezone,
    language: state.preferences.language,
    theme: state.preferences.theme
  };

  try {
    const response =
      await fetch(
        "/api/profile/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token
          },
          body: JSON.stringify(payload)
        }
      );

    const result =
      await response.json();

    console.log(result);
    console.log("Setup response:", result);
    console.log("HTTP status:", response.status);

    if (!response.ok) {
      alert(
        result.error ||
        "Failed to save profile."
      );

      return;
    }

    mainContent.innerHTML = `
      <div
        class="step-section"
        style="
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          min-height:380px;
          text-align:center;
          gap:14px;
        "
      >
        <div style="font-size:60px;">
          ${state.identity.avatar}
        </div>

        <p
          style="
            font-family:'Cinzel Decorative',serif;
            font-size:16px;
            color:var(--gold-light);
            text-shadow:0 0 30px rgba(201,168,76,0.4);
          "
        >
          The gates await you,
        </p>

        <h1
          style="
            font-family:'Cinzel Decorative',serif;
            font-size:26px;
            color:var(--gold-light);
            text-shadow:0 0 40px rgba(201,168,76,0.5);
          "
        >
          ${escapeHtml(state.identity.displayName)}
        </h1>

        <p
          style="
            font-style:italic;
            color:var(--parchment-dim);
            font-size:14px;
          "
        >
          Your legend is ready to be written.
        </p>

        <div
          style="
            width:100px;
            height:1px;
            background:linear-gradient(90deg,transparent,var(--gold),transparent);
            margin:6px 0;
          "
        ></div>

        <p
          style="
            font-size:12px;
            color:var(--text-dim);
          "
        >
          Entering the Scriptorium...
        </p>
      </div>
    `;
    setTimeout(() => {
      window.location.href =
        "/01_HTML/home_en.html";
    }, 1600);
  } catch (error) {
    console.error(error);
    alert("Connection error. Please try again.");
  }
}


// =====================================================
// ESCAPE HELPERS
// =====================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
  return escapeHtml(value);
}