const tooltip =
  document.getElementById("tooltip");


const tooltipMap = {



  /* HUB BUTTONS */
  "library-btn":
    "Browse Rules, Lore, and Archives",

  "tavern-btn":
    "Gather With the Community",

  "characters-btn":
    "Access Your Character Vault",

  "vtt-btn":
    "Launch the Virtual Tabletop",

  "marketplace-btn":
    "Browse Community Creations",

  "community-btn":
    "Visit Forums & Community Spaces"

};


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeHomePage
);


/* =========================================================
   INITIALIZE HOME PAGE
   ========================================================= */

function initializeHomePage(){

  initializeTooltips();

}


/* =========================================================
   TOOLTIP INITIALIZATION
   ========================================================= */

function initializeTooltips(){

  const buttons =
    document.querySelectorAll(
      ".navigation-btn, .hub-btn"
    );

  buttons.forEach((button) => {

    /* ===============================================
       SHOW TOOLTIP
       =============================================== */

button.addEventListener(
  "mouseenter",
  (event) => {

    const tooltipText =
      tooltipMap[button.id];

    if(!tooltipText){
      return;
    }

    showTooltip(
      tooltipText,
      event.target
    );

  }
);


    /* ===============================================
       HIDE TOOLTIP
       =============================================== */

    button.addEventListener(
      "mouseleave",
      hideTooltip
    );

  });

}


/* =========================================================
   SHOW TOOLTIP
   ========================================================= */

function showTooltip(message, targetButton){

  if(!tooltip){
    return;
  }

  tooltip.textContent = message;

  /* =========================================
     GET BUTTON POSITION
     ========================================= */

  const rect =
    targetButton.getBoundingClientRect();

  /* =========================================
     POSITION TOOLTIP
     ========================================= */

  tooltip.style.left =
    `${rect.left + (rect.width / 2)}px`;

  tooltip.style.top =
    `${rect.top -50}px`;

  /* =========================================
     CENTER TOOLTIP
     ========================================= */

  tooltip.style.transform =
    "translateX(-50%)";

  tooltip.classList.add("visible");

}


/* =========================================================
   HIDE TOOLTIP
   ========================================================= */

function hideTooltip(){

  if(!tooltip){
    return;
  }

  tooltip.classList.remove("visible");

}


/* =========================================================
   NAVIGATION SYSTEM
   ========================================================= */

function navigate(destination){

  switch(destination){

    /* =====================================================
       HOME
       ===================================================== */

    case "home":
      window.location.href = "home_en.html";
    break;


    /* =====================================================
       PLAYER MODE
       ===================================================== */


        // Not Toggleable during Player Character Viewing


    /* =====================================================
       PROFILE
       ===================================================== */

    case "profile":

      window.location.href =
        "profile_en.html";

      break;


    /* =====================================================
       SETTINGS
       ===================================================== */

    case "settings":

      window.location.href =
        "settings_en.html";

      break;
  }

  
}


async function loadCharacters() {

    try {

        const response =
            await fetch(
                "/api/characters",
                {
                    headers: {
                        token:
                            localStorage.getItem(
                                "token"
                            )
                    }
                }
            );

        const data =
            await response.json();

        console.log(data);

        renderCharacters(
            data.characters
        );

    }

    catch(error) {

        console.error(error);

    }

}

function renderCharacters(
    characters
) {

    const container =
        document.getElementById(
            "characterRows"
        );

    container.innerHTML = "";

    characters.forEach(
        character => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "character-card";

            card.innerHTML = `
                <h3>
                    ${character.character_name}
                </h3>

                <p>
                    ${character.player_name || ""}
                </p>

                <button
                    onclick="
                        openCharacter(
                            ${character.id}
                        )
                    "
                >
                    Open Character
                </button>
            `;

            container.appendChild(
                card
            );

        }
    );

}

function openCharacter(
    characterId
) {

    window.location.href =
        `new_character_35e_en.html?id=${characterId}`;

}


async function createNewCharacter() {

    try {

        const response = await fetch(
            "/api/characters",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: localStorage.getItem("token")
                },
                body: JSON.stringify({
                    edition: "3.5e",
                    character_name: "Unnamed Character",
                    player_name: "",
                    sheet_data: {}
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Failed to create character.");
            return;
        }

        window.location.href =
            `/01_HTML/new_character_35e_en.html?id=${data.character.id}`;

    }

    catch (error) {

        console.error(error);

        alert("Failed to create character.");

    }

}

loadCharacters();