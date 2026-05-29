const tooltip =
  document.getElementById("tooltip");


const tooltipMap = {

  /* TOP NAVIGATION */
  "home-btn":
    "Return to the Scriptorium Home",

  "player-switch-btn":
    "Switch Player / Dungeon Master Perspective",

  "profile-btn":
    "View Your Public Profile",

  "settings-btn":
    "Manage Account & Platform Settings",


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
  initializeEditionPage
);


/* =========================================================
   INITIALIZE HOME PAGE
   ========================================================= */

function initializeEditionPage(){

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
    `${rect.bottom + 12}px`;

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
      window.location.href = 
      "home_en.html";
    break;

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

function selectEdition(edition){

  switch(edition){

    case "35e":
      window.location.href =
        "characters_35e_home_en.html";
      break;

  }

}