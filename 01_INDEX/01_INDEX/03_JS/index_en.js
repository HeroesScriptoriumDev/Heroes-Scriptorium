/* =======================================================
   HEROES SCRIPTORIUM
   FRONTEND AUTH SYSTEM
======================================================= */

/* =======================================================
   ELEMENT REFERENCES
======================================================= */

const loginTabButton =
document.getElementById(
  "login-tab-button"
);

const registerTabButton =
document.getElementById(
  "register-tab-button"
);

const loginForm =
document.getElementById(
  "login-form"
);

const registerForm =
document.getElementById(
  "register-form"
);

const launcherForm =
document.getElementById(
  "launcher-form"
);

const registerSubmitButton =
document.getElementById(
  "register-submit-button"
);

const passwordToggleButton =
document.getElementById(
  "password-toggle-button"
);

const passwordInput =
document.getElementById(
  "password-input"
);

const API_BASE = window.location.origin;

const MAX_UPDATES = 4;

/* =======================================================
   TAB SWITCHING
======================================================= */

function activateLoginTab() {

  loginTabButton.classList.add(
    "active-tab"
  );

  registerTabButton.classList.remove(
    "active-tab"
  );

  loginForm.classList.remove(
    "hidden-form"
  );

  registerForm.classList.add(
    "hidden-form"
  );

}

function activateRegisterTab() {

  registerTabButton.classList.add(
    "active-tab"
  );

  loginTabButton.classList.remove(
    "active-tab"
  );

  registerForm.classList.remove(
    "hidden-form"
  );

  loginForm.classList.add(
    "hidden-form"
  );

}

/* =======================================================
   TAB EVENTS
======================================================= */

loginTabButton.addEventListener(
  "click",
  activateLoginTab
);

registerTabButton.addEventListener(
  "click",
  activateRegisterTab
);

/* =======================================================
   PASSWORD TOGGLE
======================================================= */

passwordToggleButton.addEventListener(
  "click",
  () => {

    if (passwordInput.type === "password") {

      passwordInput.type = "text";

    }

    else {

      passwordInput.type = "password";

    }

  }
);

/* =======================================================
   LOGIN
======================================================= */

launcherForm.addEventListener(
  "submit",

  async (event) => {

    event.preventDefault();

    const username =
    document.getElementById(
      "username-input"
    ).value;

    const password =
    document.getElementById(
      "password-input"
    ).value;

    try {

      const response =
      await fetch(

        "/api/auth/login",

        {
          method: "POST",

          headers: {
            "Content-Type":
            "application/json"
          },

          body: JSON.stringify({
            username,
            password
          })
        }

      );

      const data =
      await response.json();

      if (response.ok) {

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        if (
  data.user.profile_setup_completed
) {

  window.location.href =
  "/01_HTML/home_en.html";

}

else {

  window.location.href =
  "/01_HTML/profile_setup_en.html";

}

      }

      else {

    console.log(data);

    alert(

      data.message ||
      data.error ||
      "Login failed."

    );

}

    }

    catch (error) {

      console.error(error);

      alert(
        "Server connection failed."
      );

    }

  }
);

/* =======================================================
   REGISTER
======================================================= */

registerSubmitButton.addEventListener(

  "click",

  async () => {

    const username =
    document.getElementById(
      "register-username"
    ).value;

    const email =
    document.getElementById(
      "register-email"
    ).value;

    const password =
    document.getElementById(
      "register-password"
    ).value;

    const confirmPassword =
    document.getElementById(
      "register-confirm-password"
    ).value;

    if (password !== confirmPassword) {

      alert(
        "Passwords do not match."
      );

      return;

    }

    try {

      const response =
      await fetch(
        "/api/auth/register",

        {
          method: "POST",

          headers: {
            "Content-Type":
            "application/json"
          },

          body: JSON.stringify({
            username,
            email,
            password
          })
        }

      );

      const data =
      await response.json();

      if (response.ok) {

  alert(
    "Account created successfully!"
  );

  // =====================================
  // AUTO LOGIN AFTER REGISTRATION
  // =====================================

  const loginResponse =
  await fetch(

    "http://localhost:3000/api/auth/login",

    {
      method: "POST",

      headers: {
        "Content-Type":
        "application/json"
      },

      body: JSON.stringify({
        username,
        password
      })
    }

  );

  const loginData =
  await loginResponse.json();

  // =====================================
  // SAVE LOGIN SESSION
  // =====================================

  localStorage.setItem(
    "token",
    loginData.token
  );

  localStorage.setItem(
    "user",
    JSON.stringify(loginData.user)
  );

  // =====================================
  // REDIRECT TO PROFILE SETUP
  // =====================================

  window.location.href =
  "/01_HTML/profile_setup_en.html";

}

      else {

        alert(
          data.error
        );

      }

    }

    catch (error) {

      console.error(error);

      alert(
        "Server connection failed."
      );

    }

  }
);

async function loadUpdates() {

  try {

    const response = await fetch(

      "/api/updates"

    );

    const updates =
    await response.json();


    // ===========================================
    // GET NEWS CONTAINER
    // ===========================================

    const updatesContainer =
    document.getElementById(
      "news-content"
    );


    // ===========================================
    // CLEAR EXISTING CONTENT
    // ===========================================

    updatesContainer.innerHTML = "";


    // ===========================================
    // LOOP THROUGH UPDATES
    // ===========================================

    updates.slice(0, MAX_UPDATES).forEach((update) => {

      const updateCard =
      document.createElement("div");

      updateCard.classList.add(
        "update-card"
      );


      // =========================================
      // ICON SELECTION
      // =========================================

      let icon = "📜";

      if (update.icon === "trophy") {

        icon = "🏆";

      }

      else if (
        update.icon === "chest"
      ) {

        icon = "🧰";

      }

      else if (
        update.icon === "scroll"
      ) {

        icon = "📜";

      }


      // =========================================
      // BUILD UPDATE CARD
      // =========================================

      updateCard.innerHTML = `

        <div class="update-header">

          <div class="update-icon">

            ${icon}

          </div>

          <div class="update-title-group">

            <div class="update-title">

              ${update.title}

            </div>

            <div class="update-date">

              ${new Date(
                update.created_at
              ).toLocaleDateString()}

            </div>

          </div>

        </div>

        <div class="update-content">

          ${update.content}

        </div>

      `;


      // =========================================
      // ADD TO PAGE
      // =========================================

      updatesContainer.appendChild(
        updateCard
      );

    });

  }

  catch (error) {

    console.error(

      "FAILED TO LOAD UPDATES",

      error

    );

  }

}


loadUpdates();

/* =======================================================
   INITIALIZE
======================================================= */

activateLoginTab();

console.log(
  "Heroes Scriptorium Initialized"
);
