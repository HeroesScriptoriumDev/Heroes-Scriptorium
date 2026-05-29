

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
      () => {

        const tooltipText =
          tooltipMap[button.id];

        if(!tooltipText){
          return;
        }

        showTooltip(tooltipText);

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

function showTooltip(message){

  if(!tooltip){
    return;
  }

  tooltip.textContent = message;

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
        localStorage.setItem("mode", "dm");
        window.location.href = "dm_home_en.html";
    break;


    /* =====================================================
       DM
       ===================================================== */

    case "dm":
        localStorage.setItem("mode", "player");
        window.location.href = "home_en.html";
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


    /* =====================================================
       LIBRARY
       ===================================================== */

    case "library":

      showTemporaryMessage(
        "Library system not yet implemented."
      );

      break;


    /* =====================================================
       TAVERN
       ===================================================== */

    case "tavern":

      showTemporaryMessage(
        "Tavern hub not yet implemented."
      );

      break;


    /* =====================================================
       CHARACTER VAULT
       ===================================================== */

    case "character":

      windows.location.href =
      "edition_en.html";

      break;


    /* =====================================================
       VTT
       ===================================================== */

    case "vtt":

      showTemporaryMessage(
        "Virtual Tabletop not yet implemented."
      );

      break;


    /* =====================================================
       MARKETPLACE
       ===================================================== */

    case "marketplace":

      showTemporaryMessage(
        "Marketplace not yet implemented."
      );

      break;


    /* =====================================================
       COMMUNITY
       ===================================================== */

    case "community":

      showTemporaryMessage(
        "Community systems not yet implemented."
      );

      break;


    /* =====================================================
       FALLBACK
       ===================================================== */

    default:

      console.warn(
        `Unknown destination: ${destination}`
      );

      showTemporaryMessage(
        "Unknown destination."
      );

      break;

  }

}


/* =========================================================
   TEMPORARY MESSAGE SYSTEM
   ========================================================= */

function showTemporaryMessage(message){

  if(!tooltip){
    return;
  }

  tooltip.textContent = message;

  tooltip.classList.add("visible");

  clearTimeout(
    tooltip.hideTimeout
  );

  tooltip.hideTimeout =
    setTimeout(() => {

      tooltip.classList.remove(
        "visible"
      );

    }, 2500);

}
