/* =========================================================
   STATE
   ========================================================= */

let friends_currentTab     = "list";   
let friends_list           = [];
let friends_requests       = [];
let friends_statusCache    = {};     
let friends_pollTimer      = null;
const FRIENDS_POLL_INTERVAL = 30 * 1000; 


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeFriends() {

  const token = localStorage.getItem("token");
  if (!token) return;

  /* Friends button in bottom bar */
  document.getElementById("friendsBtn")
    ?.addEventListener("click", openFriendsModal);

  /* Modal close */
  document.getElementById("closeFriendsModal")
    ?.addEventListener("click", closeFriendsModal);

  /* Overlay click to close */
  document.getElementById("friendsModal")
    ?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("friendsModal")) closeFriendsModal();
    });

  /* Tab switching */
  document.getElementById("friendsTabList")
    ?.addEventListener("click", () => switchFriendsTab("list"));
  document.getElementById("friendsTabRequests")
    ?.addEventListener("click", () => switchFriendsTab("requests"));

  /* Escape key */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFriendsModal();
  });

  /* Friends search inside modal */
  document.getElementById("friendsSearchInput")
    ?.addEventListener("input", filterFriendsList);

  /* Load badge count immediately */
  loadFriendsCount();

}


/* =========================================================
   MODAL OPEN / CLOSE
   ========================================================= */

function openFriendsModal() {
  const modal = document.getElementById("friendsModal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  switchFriendsTab(friends_currentTab);
  startFriendsPoll();
}

function closeFriendsModal() {
  const modal = document.getElementById("friendsModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  stopFriendsPoll();
}


/* =========================================================
   TAB SWITCHING
   ========================================================= */

function switchFriendsTab(tab) {
  friends_currentTab = tab;

  const tabList     = document.getElementById("friendsTabList");
  const tabRequests = document.getElementById("friendsTabRequests");
  const panelList   = document.getElementById("friendsPanelList");
  const panelReqs   = document.getElementById("friendsPanelRequests");

  if (tab === "list") {
    tabList?.classList.add("active");
    tabRequests?.classList.remove("active");
    if (panelList)   panelList.hidden   = false;
    if (panelReqs)   panelReqs.hidden   = true;
    loadFriendsList();
  } else {
    tabList?.classList.remove("active");
    tabRequests?.classList.add("active");
    if (panelList)   panelList.hidden   = true;
    if (panelReqs)   panelReqs.hidden   = false;
    loadFriendRequests();
  }
}


/* =========================================================
   LOAD FRIENDS LIST
   ========================================================= */

async function loadFriendsList() {
  const container = document.getElementById("friendsListWrap");
  if (!container) return;

  container.innerHTML = renderFriendsLoading();

  try {
    const token    = localStorage.getItem("token");
    const response = await fetch("/api/friends", { headers: { token } });
    if (!response.ok) throw new Error("Failed");
    const data = await response.json();
    friends_list = data.friends || [];
    renderFriendsList();
    updateFriendsBadge(friends_list.length);
  } catch (err) {
    console.error("LOAD FRIENDS ERROR:", err);
    container.innerHTML = renderFriendsError("Failed to load friends.");
  }
}


/* =========================================================
   RENDER FRIENDS LIST
   ========================================================= */

function renderFriendsList() {
  const container = document.getElementById("friendsListWrap");
  if (!container) return;

  const query    = (document.getElementById("friendsSearchInput")?.value || "").toLowerCase();
  const filtered = query
    ? friends_list.filter(f =>
        (f.display_name || f.username).toLowerCase().includes(query)
      )
    : friends_list;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="friends-empty-state">
        <div class="friends-empty-icon">⚔️</div>
        <div class="friends-empty-text">${query ? "No friends match your search." : "No friends yet. Search for adventurers to connect!"}</div>
      </div>`;
    return;
  }

  /* Sort: online first, then alphabetical */
  const sorted = [...filtered].sort((a, b) => {
    const aOnline = a.online_status === "online" ? 0 : 1;
    const bOnline = b.online_status === "online" ? 0 : 1;
    if (aOnline !== bOnline) return aOnline - bOnline;
    return (a.display_name || a.username).localeCompare(b.display_name || b.username);
  });

  container.innerHTML = sorted.map(f => {
    const name = f.display_name || f.username;
    const statusCls = presenceClass(f.online_status);
    const statusLabel = presenceLabel(f.online_status);

    return `
      <div class="friends-row" data-user-id="${f.id}">
        <div class="friends-avatar" style="position:relative;">
          🧙
          <span style="position:absolute;bottom:0;right:0;width:8px;height:8px;border-radius:50%;background:${presenceColor(f.online_status)};border:1px solid #0f0c0a;"></span>
        </div>
        <div class="friends-info">
          <div class="friends-name">${escFrHtml(name)}</div>
          <div class="friends-status-text ${statusCls}">${statusLabel}</div>
        </div>
        <div class="friends-actions">
          <button class="friends-action-btn btn-msg-friend"
            title="Message"
            onclick="friendStartDM(${f.id}, '${escFrHtml(name)}')">✉</button>
          <button class="friends-action-btn btn-remove-friend"
            title="Remove Friend"
            onclick="friendRemove(${f.id}, '${escFrHtml(name)}', this)">✕</button>
        </div>
      </div>`;
  }).join("");
}

function filterFriendsList() {
  renderFriendsList();
}


/* =========================================================
   LOAD FRIEND REQUESTS
   ========================================================= */

async function loadFriendRequests() {
  const container = document.getElementById("friendsRequestsWrap");
  if (!container) return;

  container.innerHTML = renderFriendsLoading();

  try {
    const token    = localStorage.getItem("token");
    const response = await fetch("/api/friends/requests", { headers: { token } });
    if (!response.ok) throw new Error("Failed");
    const data = await response.json();
    friends_requests = data.requests || [];
    renderFriendRequests();
    updateRequestsBadge(friends_requests.length);
  } catch (err) {
    console.error("LOAD REQUESTS ERROR:", err);
    container.innerHTML = renderFriendsError("Failed to load requests.");
  }
}


/* =========================================================
   RENDER FRIEND REQUESTS
   ========================================================= */

function renderFriendRequests() {
  const container = document.getElementById("friendsRequestsWrap");
  if (!container) return;

  if (friends_requests.length === 0) {
    container.innerHTML = `
      <div class="friends-empty-state">
        <div class="friends-empty-icon">📭</div>
        <div class="friends-empty-text">No pending friend requests.</div>
      </div>`;
    return;
  }

  container.innerHTML = friends_requests.map(r => {
    const name = r.display_name || r.username;

    return `
      <div class="friends-request-row" id="req-row-${r.id}">
        <div class="friends-avatar">🧙</div>
        <div class="friends-info">
          <div class="friends-name">${escFrHtml(name)}</div>
          <div class="friends-status-text">Wants to be friends</div>
        </div>
        <div class="friends-request-actions">
          <button class="friends-req-btn btn-accept"
            onclick="friendAccept(${r.id}, '${escFrHtml(name)}', '${r.request_id}')">✔ Accept</button>
          <button class="friends-req-btn btn-decline"
            onclick="friendDecline(${r.id}, '${r.request_id}')">✕ Decline</button>
        </div>
      </div>`;
  }).join("");
}


/* =========================================================
   FRIEND ACTIONS — ACCEPT / DECLINE / REMOVE / BLOCK
   ========================================================= */

async function friendAccept(userId, name, requestId) {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/friends/accept/${userId}`, {
      method: "PATCH",
      headers: { token }
    });
    if (!response.ok) throw new Error("Failed");

    /* Remove from requests list */
    friends_requests = friends_requests.filter(r => r.id !== userId);
    renderFriendRequests();
    updateRequestsBadge(friends_requests.length);

    /* Update cache */
    friends_statusCache[userId] = "accepted";
    refreshSearchCardButton(userId);

    if (typeof showToast === "function") showToast(`Now friends with ${name}!`);

    /* Reload friends list if on that tab */
    if (friends_currentTab === "list") loadFriendsList();

  } catch (err) {
    console.error("FRIEND ACCEPT ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to accept request.");
  }
}

async function friendDecline(userId, requestId) {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/friends/decline/${userId}`, {
      method: "PATCH",
      headers: { token }
    });
    if (!response.ok) throw new Error("Failed");

    friends_requests = friends_requests.filter(r => r.id !== userId);
    renderFriendRequests();
    updateRequestsBadge(friends_requests.length);

    friends_statusCache[userId] = null;
    refreshSearchCardButton(userId);

  } catch (err) {
    console.error("FRIEND DECLINE ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to decline request.");
  }
}

async function friendRemove(userId, name, btnEl) {
  if (!confirm(`Remove ${name} from your friends?`)) return;

  try {
    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/friends/${userId}`, {
      method: "DELETE",
      headers: { token }
    });
    if (!response.ok) throw new Error("Failed");

    friends_list = friends_list.filter(f => f.id !== userId);
    renderFriendsList();
    updateFriendsBadge(friends_list.length);

    friends_statusCache[userId] = null;
    refreshSearchCardButton(userId);

    if (typeof showToast === "function") showToast(`${name} removed from friends.`);

  } catch (err) {
    console.error("FRIEND REMOVE ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to remove friend.");
  }
}

async function friendCancel(userId, btnEl) {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/friends/cancel/${userId}`, {
      method: "DELETE",
      headers: { token }
    });
    if (!response.ok) throw new Error("Failed");

    friends_statusCache[userId] = null;
    refreshSearchCardButton(userId);

    if (typeof showToast === "function") showToast("Friend request cancelled.");

  } catch (err) {
    console.error("FRIEND CANCEL ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to cancel request.");
  }
}

async function friendBlock(userId, name) {
  if (!confirm(`Block ${name}? They won't be able to message or find you.`)) return;

  try {
    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/friends/block/${userId}`, {
      method: "POST",
      headers: { token }
    });
    if (!response.ok) throw new Error("Failed");

    /* Remove from friends list if present */
    friends_list = friends_list.filter(f => f.id !== userId);
    renderFriendsList();
    updateFriendsBadge(friends_list.length);

    friends_statusCache[userId] = "blocked_by_me";
    refreshSearchCardButton(userId);

    if (typeof showToast === "function") showToast(`${name} has been blocked.`);

  } catch (err) {
    console.error("FRIEND BLOCK ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to block user.");
  }
}

async function friendUnblock(userId, name) {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/friends/unblock/${userId}`, {
      method: "POST",
      headers: { token }
    });
    if (!response.ok) throw new Error("Failed");

    friends_statusCache[userId] = null;
    refreshSearchCardButton(userId);

    if (typeof showToast === "function") showToast(`${name} unblocked.`);

  } catch (err) {
    console.error("FRIEND UNBLOCK ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to unblock user.");
  }
}

async function friendSendRequest(userId, name, btnEl) {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/friends/request/${userId}`, {
      method: "POST",
      headers: { token }
    });
    const data = await response.json();

    if (!response.ok) {
      if (typeof showToast === "function") showToast(data.error || "Failed to send request.");
      return;
    }

    friends_statusCache[userId] = data.status;
    refreshSearchCardButton(userId);

    if (typeof showToast === "function") {
      showToast(data.status === "accepted"
        ? `Now friends with ${name}!`
        : `Friend request sent to ${name}.`);
    }

  } catch (err) {
    console.error("FRIEND REQUEST ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to send request.");
  }
}


/* =========================================================
   SEARCH CARD INTEGRATION
   ---------------------------------------------------------
   Called by messaging.js renderSearchResults — replaces the
   plain "Message" button area with a full friend-state row.
   ========================================================= */

/**
 * Build the friend action button HTML for a search result card.
 * Checks the cache first; fetches from API if not cached.
 */
async function buildFriendButton(userId, name) {
  /* Check cache */
  let status = friends_statusCache[userId];

  if (status === undefined) {
    try {
      const token    = localStorage.getItem("token");
      const response = await fetch(`/api/friends/status/${userId}`, {
        headers: { token }
      });
      const data = await response.json();
      status = data.status || null;
      friends_statusCache[userId] = status;
    } catch {
      status = null;
    }
  }

  return renderFriendButtonHtml(userId, name, status);
}

function renderFriendButtonHtml(userId, name, status) {
  const safeName = escFrHtml(name);

  switch (status) {
    case "accepted":
      return `
        <button class="fr-btn fr-btn-friends" disabled>✔ Friends</button>
        <button class="fr-btn fr-btn-remove"
          onclick="friendRemove(${userId}, '${safeName}', this)">Unfriend</button>
        <button class="fr-btn fr-btn-block"
          onclick="friendBlock(${userId}, '${safeName}')">Block</button>`;

    case "pending_sent":
      return `
        <button class="fr-btn fr-btn-pending" disabled>⏳ Pending</button>
        <button class="fr-btn fr-btn-cancel"
          onclick="friendCancel(${userId}, this)">Cancel</button>`;

    case "pending_received":
      return `
        <button class="fr-btn fr-btn-accept"
          onclick="friendAccept(${userId}, '${safeName}', null)">✔ Accept</button>
        <button class="fr-btn fr-btn-decline"
          onclick="friendDecline(${userId}, null)">✕ Decline</button>`;

    case "blocked_by_me":
      return `
        <button class="fr-btn fr-btn-blocked" disabled>🚫 Blocked</button>
        <button class="fr-btn fr-btn-unblock"
          onclick="friendUnblock(${userId}, '${safeName}')">Unblock</button>`;

    case "blocked_by_them":
      return `<button class="fr-btn fr-btn-blocked" disabled>Unavailable</button>`;

    default:
      return `
        <button class="fr-btn fr-btn-add"
          onclick="friendSendRequest(${userId}, '${safeName}', this)">+ Add Friend</button>
        <button class="fr-btn fr-btn-block"
          onclick="friendBlock(${userId}, '${safeName}')">Block</button>`;
  }
}

/**
 * After any status change, refresh the button area in any
 * currently-visible search card for this user.
 */
function refreshSearchCardButton(userId) {
  const container = document.querySelector(
    `.search-result-card[data-user-id="${userId}"] .search-result-friend-actions`
  );
  if (!container) return;

  const name   = container.closest(".search-result-card")
    ?.querySelector(".search-result-name")?.textContent || "";
  const status = friends_statusCache[userId] || null;
  container.innerHTML = renderFriendButtonHtml(userId, name, status);
}
async function augmentSearchCardWithFriendBtn(userId, name) {
  const card = document.querySelector(
    `.search-result-card[data-user-id="${userId}"] .search-result-friend-actions`
  );
  if (!card) return;
  card.innerHTML = await buildFriendButton(userId, name);
}


/* =========================================================
   LOAD FRIENDS COUNT (for badge on page load)
   ========================================================= */

async function loadFriendsCount() {
  try {
    const token    = localStorage.getItem("token");
    const response = await fetch("/api/friends", { headers: { token } });
    if (!response.ok) return;
    const data = await response.json();
    friends_list = data.friends || [];
    updateFriendsBadge(friends_list.length);

    /* Load request count too */
    const reqRes  = await fetch("/api/friends/requests", { headers: { token } });
    const reqData = await reqRes.json();
    friends_requests = reqData.requests || [];
    updateRequestsBadge(friends_requests.length);

  } catch (err) {
    /* Silently fail — badge just stays empty */
  }
}


/* =========================================================
   FRIEND — START DM
   ========================================================= */

function friendStartDM(userId, name) {
  closeFriendsModal();
  /* Delegate to messaging.js */
  if (typeof startDMFromSearch === "function") {
    startDMFromSearch(userId, name);
  }
}


/* =========================================================
   BADGE UPDATES
   ========================================================= */

function updateFriendsBadge(count) {
  const btn = document.getElementById("friendsBtn");
  if (!btn) return;

  let badge = btn.querySelector(".friends-count-badge");
  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "notif-badge friends-count-badge";
      btn.style.position = "relative";
      btn.appendChild(badge);
    }
    badge.textContent    = count > 99 ? "99+" : count;
    badge.style.display  = "flex";
  } else if (badge) {
    badge.style.display = "none";
  }
}

function updateRequestsBadge(count) {
  const tab = document.getElementById("friendsTabRequests");
  if (!tab) return;

  let badge = tab.querySelector(".req-count-badge");
  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className    = "req-count-badge";
      badge.style.cssText = `
        display:inline-flex;align-items:center;justify-content:center;
        min-width:16px;height:16px;border-radius:999px;
        background:var(--gold-primary);color:#1b140d;
        font-size:0.62rem;font-weight:700;padding:0 3px;margin-left:6px;
      `;
      tab.appendChild(badge);
    }
    badge.textContent   = count;
    badge.style.display = "inline-flex";
  } else if (badge) {
    badge.style.display = "none";
  }
}


/* =========================================================
   POLLING
   ========================================================= */

function startFriendsPoll() {
  stopFriendsPoll();
  friends_pollTimer = setInterval(() => {
    if (friends_currentTab === "requests") loadFriendRequests();
    else loadFriendsList();
  }, FRIENDS_POLL_INTERVAL);
}

function stopFriendsPoll() {
  if (friends_pollTimer) {
    clearInterval(friends_pollTimer);
    friends_pollTimer = null;
  }
}


/* =========================================================
   HELPERS
   ========================================================= */

function presenceClass(status) {
  return status === "online" ? "online"
       : status === "away"   ? "away"
       : status === "busy"   ? "busy"
       : "offline";
}

function presenceLabel(status) {
  return status === "online"    ? "Online"
       : status === "away"      ? "Away"
       : status === "busy"      ? "Busy"
       : status === "invisible" ? "Invisible"
       : "Offline";
}

function presenceColor(status) {
  return status === "online" ? "#4caf50"
       : status === "away"   ? "#e8a020"
       : status === "busy"   ? "#c0392b"
       : "#555";
}

function escFrHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderFriendsLoading() {
  return `<div class="friends-loading">Loading...</div>`;
}

function renderFriendsError(msg) {
  return `<div class="friends-loading" style="color:var(--danger);">${msg}</div>`;
}


/* =========================================================
   AUTO-INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", initializeFriends);
