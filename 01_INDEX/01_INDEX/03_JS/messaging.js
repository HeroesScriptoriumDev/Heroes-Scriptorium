/* =========================================================
   STATE
   ========================================================= */

let msg_currentThreadId   = null;
let msg_currentUserId     = null;
let msg_pollTimer         = null;
let msg_selectedRecipients = [];
let msg_searchDebounce    = null;
let msg_recipientDebounce = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeMessaging() {

  const token = localStorage.getItem("token");
  if (!token) return;

  /* Decode userId from JWT */
  try {
    const payload  = JSON.parse(atob(token.split(".")[1]));
    msg_currentUserId = payload.user?.id || null;
  } catch { msg_currentUserId = null; }

  /* MAIL BUTTON → open messages */
  document.getElementById("mailBtn")
    ?.addEventListener("click", openMessagesModal);

  /* CLOSE BUTTONS */
  document.getElementById("closeMessagesModal")
    ?.addEventListener("click", closeMessagesModal);
  document.getElementById("closeMessagesConvo")
    ?.addEventListener("click", closeMessagesModal);
  document.getElementById("closeMessagesNew")
    ?.addEventListener("click", closeMessagesModal);

  /* BACK BUTTONS */
  document.getElementById("msgBackBtn")
    ?.addEventListener("click", showThreadsPanel);
  document.getElementById("msgNewBackBtn")
    ?.addEventListener("click", showThreadsPanel);

  /* NEW MESSAGE BUTTON */
  document.getElementById("msgNewBtn")
    ?.addEventListener("click", showNewPanel);

  /* SEND IN CONVERSATION */
  document.getElementById("msgSendBtn")
    ?.addEventListener("click", sendMessage);

  /* SEND NEW THREAD */
  document.getElementById("msgSendNewBtn")
    ?.addEventListener("click", sendNewThread);

  /* COMPOSE — send on Ctrl/Cmd+Enter */
  document.getElementById("msgComposeInput")
    ?.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") sendMessage();
    });

  /* THREAD SEARCH FILTER */
  document.getElementById("msgThreadSearch")
    ?.addEventListener("input", filterThreadList);

  /* RECIPIENT SEARCH */
  document.getElementById("msgRecipientSearch")
    ?.addEventListener("input", (e) => {
      clearTimeout(msg_recipientDebounce);
      msg_recipientDebounce = setTimeout(
        () => searchRecipients(e.target.value),
        300
      );
    });

  /* SEARCH MODAL */
  document.getElementById("closeSearchModal")
    ?.addEventListener("click", closeSearchModal);

  document.getElementById("searchInput")
    ?.addEventListener("input", (e) => {
      clearTimeout(msg_searchDebounce);
      msg_searchDebounce = setTimeout(
        () => runUserSearch(e.target.value),
        350
      );
    });

  document.getElementById("searchRoleFilter")
    ?.addEventListener("change", () => {
      runUserSearch(document.getElementById("searchInput")?.value || "");
    });

  /* OVERLAY CLICK TO CLOSE */
  document.getElementById("messagesModal")
    ?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("messagesModal")) closeMessagesModal();
    });

  document.getElementById("searchModal")
    ?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("searchModal")) closeSearchModal();
    });

  /* ESCAPE KEY */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeMessagesModal();
    closeSearchModal();
  });

}


/* =========================================================
   MESSAGES MODAL — OPEN / CLOSE
   ========================================================= */

function openMessagesModal() {
  const modal = document.getElementById("messagesModal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  showThreadsPanel();
  loadThreads();
}

function closeMessagesModal() {
  const modal = document.getElementById("messagesModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  stopMessagePolling();
}


/* =========================================================
   SEARCH MODAL — OPEN / CLOSE
   ========================================================= */

function openSearchModal() {
  const modal = document.getElementById("searchModal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => document.getElementById("searchInput")?.focus(), 100);
}

function closeSearchModal() {
  const modal = document.getElementById("searchModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  const input = document.getElementById("searchInput");
  if (input) input.value = "";
  renderSearchEmpty("Enter a name to begin your search.");
}


/* =========================================================
   PANEL SWITCHING
   ========================================================= */

function showThreadsPanel() {
  document.getElementById("msgThreadsPanel").hidden = false;
  document.getElementById("msgConvoPanel").hidden   = true;
  document.getElementById("msgNewPanel").hidden     = true;
  stopMessagePolling();
  msg_currentThreadId = null;
}

function showConvoPanel() {
  document.getElementById("msgThreadsPanel").hidden = true;
  document.getElementById("msgConvoPanel").hidden   = false;
  document.getElementById("msgNewPanel").hidden     = true;
}

function showNewPanel() {
  document.getElementById("msgThreadsPanel").hidden = true;
  document.getElementById("msgConvoPanel").hidden   = true;
  document.getElementById("msgNewPanel").hidden     = false;
  msg_selectedRecipients = [];
  renderSelectedRecipients();
  document.getElementById("msgRecipientSearch").value = "";
  document.getElementById("msgRecipientResults").innerHTML = "";
  document.getElementById("msgNewContent").value = "";
  document.getElementById("msgGroupNameField").style.display = "none";
  document.getElementById("msgSendNewBtn").disabled = true;
}


/* =========================================================
   LOAD THREADS
   ========================================================= */

async function loadThreads() {
  try {

    const token    = localStorage.getItem("token");
    const response = await fetch("/api/messages/threads", {
      headers: { token }
    });

    if (!response.ok) throw new Error("Failed to load threads");

    const data = await response.json();
    renderThreadList(data.threads);

    /* Update unread badge on mail button */
    const totalUnread = data.threads.reduce(
      (sum, t) => sum + parseInt(t.unread_count || 0, 10), 0
    );
    updateMailBadge(totalUnread);

  } catch (err) {
    console.error("LOAD THREADS ERROR:", err);
  }
}


/* =========================================================
   RENDER THREAD LIST
   ========================================================= */

function renderThreadList(threads) {

  const container = document.getElementById("msgThreadsList");
  if (!container) return;

  if (!threads || threads.length === 0) {
    container.innerHTML = `
      <div class="msg-empty-state">
        <div class="msg-empty-icon">✉️</div>
        <div class="msg-empty-text">No messages yet.</div>
      </div>`;
    return;
  }

  container.innerHTML = threads.map(t => {

    const name    = t.is_group
      ? (t.name || "Group Thread")
      : (t.other_display_name || t.other_username || "Unknown");

    const preview  = t.last_message
      ? (t.last_sender === "you" ? `You: ${t.last_message}` : t.last_message)
      : "No messages yet.";

    const unread   = parseInt(t.unread_count || 0, 10);
    const timeStr  = t.last_message_at
      ? formatMsgTime(new Date(t.last_message_at))
      : "";

    const statusClass = t.other_status === "online"  ? "online"
                      : t.other_status === "away"    ? "away"
                      : t.other_status === "busy"    ? "busy"
                      : "offline";

    return `
      <div class="msg-thread-item" data-thread-id="${t.id}" onclick="openThread(${t.id}, '${escHtml(name)}')">
        <div class="msg-thread-avatar" style="position:relative;">
          ${t.is_group ? "👥" : "🧙"}
          ${!t.is_group ? `<span style="position:absolute;bottom:0;right:0;width:8px;height:8px;border-radius:50%;background:${statusColor(statusClass)};border:1px solid #0f0c0a;"></span>` : ""}
        </div>
        <div class="msg-thread-info">
          <div class="msg-thread-name">${escHtml(name)}</div>
          <div class="msg-thread-preview">${escHtml(preview.slice(0, 60))}</div>
        </div>
        <div class="msg-thread-meta">
          <span class="msg-thread-time">${timeStr}</span>
          ${unread > 0 ? `<span class="msg-unread-badge">${unread}</span>` : ""}
        </div>
      </div>`;

  }).join("");

}


/* =========================================================
   FILTER THREAD LIST (client-side search)
   ========================================================= */

function filterThreadList() {
  const q = (document.getElementById("msgThreadSearch")?.value || "").toLowerCase();
  document.querySelectorAll(".msg-thread-item").forEach(item => {
    const name = item.querySelector(".msg-thread-name")?.textContent.toLowerCase() || "";
    item.style.display = name.includes(q) ? "" : "none";
  });
}


/* =========================================================
   OPEN THREAD
   ========================================================= */

async function openThread(threadId, title) {

  msg_currentThreadId = threadId;

  document.getElementById("msgConvoTitle").textContent = title;
  document.getElementById("msgMessagesWrap").innerHTML =
    `<div class="msg-loading">Loading messages...</div>`;

  showConvoPanel();

  await loadMessages(threadId);
  markThreadRead(threadId);
  startMessagePolling(threadId);

}


/* =========================================================
   LOAD MESSAGES
   ========================================================= */

async function loadMessages(threadId) {
  try {

    const token    = localStorage.getItem("token");
    const response = await fetch(`/api/messages/threads/${threadId}`, {
      headers: { token }
    });

    if (!response.ok) throw new Error("Failed to load messages");

    const data = await response.json();
    renderMessages(data.messages);

  } catch (err) {
    console.error("LOAD MESSAGES ERROR:", err);
    document.getElementById("msgMessagesWrap").innerHTML =
      `<div class="msg-loading">Failed to load messages.</div>`;
  }
}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages(messages) {

  const wrap = document.getElementById("msgMessagesWrap");
  if (!wrap) return;

  if (!messages || messages.length === 0) {
    wrap.innerHTML = `
      <div class="msg-empty-state">
        <div class="msg-empty-icon">💬</div>
        <div class="msg-empty-text">No messages yet. Say hello!</div>
      </div>`;
    return;
  }

  let lastDate = null;
  wrap.innerHTML = messages.map(m => {

    const isOwn    = m.sender_id === msg_currentUserId;
    const msgDate  = new Date(m.created_at);
    const dateStr  = msgDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeStr  = msgDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const name     = m.sender_display_name || m.sender_username || "Unknown";

    let divider = "";
    if (dateStr !== lastDate) {
      divider  = `<div class="msg-date-divider">${dateStr}</div>`;
      lastDate = dateStr;
    }

    return `
      ${divider}
      <div class="msg-bubble-row ${isOwn ? "own" : ""}">
        <div class="msg-bubble-avatar">${isOwn ? "🧙" : "🧝"}</div>
        <div>
          <div class="msg-bubble">${escHtml(m.content)}</div>
          <div class="msg-bubble-meta">${isOwn ? "You" : escHtml(name)} · ${timeStr}</div>
        </div>
      </div>`;

  }).join("");

  /* Scroll to bottom */
  wrap.scrollTop = wrap.scrollHeight;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

  const input   = document.getElementById("msgComposeInput");
  const content = input?.value.trim();

  if (!content || !msg_currentThreadId) return;

  const sendBtn = document.getElementById("msgSendBtn");
  sendBtn.disabled = true;

  try {

    const token    = localStorage.getItem("token");
    const response = await fetch(
      `/api/messages/threads/${msg_currentThreadId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ content })
      }
    );

    if (!response.ok) throw new Error("Failed to send");

    input.value = "";
    await loadMessages(msg_currentThreadId);

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to send message.");
  } finally {
    sendBtn.disabled = false;
    input?.focus();
  }

}


/* =========================================================
   SEND NEW THREAD
   ========================================================= */

async function sendNewThread() {

  const content    = document.getElementById("msgNewContent")?.value.trim();
  const groupName  = document.getElementById("msgGroupName")?.value.trim();
  const isGroup    = msg_selectedRecipients.length > 1;

  if (!content || msg_selectedRecipients.length === 0) return;

  const sendBtn = document.getElementById("msgSendNewBtn");
  sendBtn.disabled = true;

  try {

    const token = localStorage.getItem("token");

    /* Create thread */
    const threadPayload = isGroup
      ? { name: groupName || "Group Thread", member_ids: msg_selectedRecipients.map(r => r.id) }
      : { recipient_id: msg_selectedRecipients[0].id };

    const threadRes = await fetch("/api/messages/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(threadPayload)
    });

    if (!threadRes.ok) throw new Error("Failed to create thread");

    const threadData = await threadRes.json();
    const threadId   = threadData.thread_id;

    /* Send first message */
    await fetch(`/api/messages/threads/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ content })
    });

    /* Open the thread */
    const recipientName = isGroup
      ? (groupName || "Group Thread")
      : (msg_selectedRecipients[0].display_name || msg_selectedRecipients[0].username);

    await loadThreads();
    openThread(threadId, recipientName);

  } catch (err) {
    console.error("SEND NEW THREAD ERROR:", err);
    if (typeof showToast === "function") showToast("Failed to send message.");
    sendBtn.disabled = false;
  }

}


/* =========================================================
   MARK THREAD READ
   ========================================================= */

async function markThreadRead(threadId) {
  try {
    const token = localStorage.getItem("token");
    await fetch(`/api/messages/threads/${threadId}/read`, {
      method: "PATCH",
      headers: { token }
    });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
  }
}


/* =========================================================
   MESSAGE POLLING
   ---------------------------------------------------------
   Polls every 8 seconds while a thread is open.
   ========================================================= */

function startMessagePolling(threadId) {
  stopMessagePolling();
  msg_pollTimer = setInterval(async () => {
    if (msg_currentThreadId === threadId) {
      await loadMessages(threadId);
    }
  }, 8000);
}

function stopMessagePolling() {
  if (msg_pollTimer) {
    clearInterval(msg_pollTimer);
    msg_pollTimer = null;
  }
}


/* =========================================================
   RECIPIENT SEARCH (for new thread)
   ========================================================= */

async function searchRecipients(query) {

  const container = document.getElementById("msgRecipientResults");
  if (!container) return;

  if (query.length < 2) {
    container.innerHTML = "";
    return;
  }

  try {

    const token    = localStorage.getItem("token");
    const response = await fetch(
      `/api/search/users?q=${encodeURIComponent(query)}&limit=8`,
      { headers: { token } }
    );

    const data = await response.json();

    if (!data.users || data.users.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 0;">No users found.</div>`;
      return;
    }

    container.innerHTML = data.users
      .filter(u => !msg_selectedRecipients.find(r => r.id === u.id))
      .map(u => `
        <div class="msg-recipient-row" onclick="selectRecipient(${u.id}, '${escHtml(u.username)}', '${escHtml(u.display_name || u.username)}')">
          <span class="msg-recipient-name">${escHtml(u.display_name || u.username)}</span>
          <span class="msg-recipient-username">@${escHtml(u.username)}</span>
        </div>`)
      .join("");

  } catch (err) {
    console.error("RECIPIENT SEARCH ERROR:", err);
  }

}


/* =========================================================
   SELECT / DESELECT RECIPIENT
   ========================================================= */

function selectRecipient(id, username, displayName) {

  if (msg_selectedRecipients.find(r => r.id === id)) return;

  msg_selectedRecipients.push({ id, username, displayName });
  renderSelectedRecipients();

  document.getElementById("msgRecipientSearch").value = "";
  document.getElementById("msgRecipientResults").innerHTML = "";

  /* Show group name field if more than 1 recipient */
  document.getElementById("msgGroupNameField").style.display =
    msg_selectedRecipients.length > 1 ? "flex" : "none";

  updateSendNewBtnState();

}

function removeRecipient(id) {
  msg_selectedRecipients = msg_selectedRecipients.filter(r => r.id !== id);
  renderSelectedRecipients();
  document.getElementById("msgGroupNameField").style.display =
    msg_selectedRecipients.length > 1 ? "flex" : "none";
  updateSendNewBtnState();
}

function renderSelectedRecipients() {
  const container = document.getElementById("msgSelectedRecipients");
  if (!container) return;
  container.innerHTML = msg_selectedRecipients.map(r => `
    <div class="msg-selected-chip">
      ${escHtml(r.displayName)}
      <button onclick="removeRecipient(${r.id})" type="button">✕</button>
    </div>`).join("");
}

function updateSendNewBtnState() {
  const btn     = document.getElementById("msgSendNewBtn");
  const content = document.getElementById("msgNewContent")?.value.trim();
  if (btn) btn.disabled = msg_selectedRecipients.length === 0 || !content;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("msgNewContent")?.addEventListener("input", updateSendNewBtnState);
});


/* =========================================================
   USER SEARCH
   ========================================================= */

async function runUserSearch(query) {

  if (query.length < 2) {
    renderSearchEmpty("Enter at least 2 characters.");
    return;
  }

  const role     = document.getElementById("searchRoleFilter")?.value || "";
  const token    = localStorage.getItem("token");

  try {

    const response = await fetch(
      `/api/search/users?q=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}`,
      { headers: { token } }
    );

    const data = await response.json();

    if (!data.users || data.users.length === 0) {
      renderSearchEmpty("No adventurers found.");
      return;
    }

    renderSearchResults(data.users);

  } catch (err) {
    console.error("USER SEARCH ERROR:", err);
    renderSearchEmpty("Search failed. Try again.");
  }

}


/* =========================================================
   RENDER SEARCH RESULTS
   ========================================================= */

function renderSearchResults(users) {

  const container = document.getElementById("searchResults");
  if (!container) return;

  container.innerHTML = users.map(u => {

    const name    = u.display_name || u.username;
    const roles   = Array.isArray(u.roles) && u.roles.length > 0
      ? u.roles.map(r => `<span class="search-result-role-tag">${escHtml(r)}</span>`).join("")
      : "";

    const statusCls = u.online_status === "online"    ? "online"
                    : u.online_status === "away"      ? "away"
                    : u.online_status === "busy"      ? "busy"
                    : u.online_status === "invisible" ? "offline"
                    : "offline";

    return `
      <div class="search-result-card">
        <div class="search-result-avatar">🧙</div>
        <div class="search-result-info">
          <div class="search-result-name">${escHtml(name)}</div>
          <div class="search-result-username">@${escHtml(u.username)}</div>
          ${roles ? `<div class="search-result-roles">${roles}</div>` : ""}
        </div>
        <span class="search-result-status status-dot ${statusCls}"></span>
        <div class="search-result-actions">
          <button class="btn-msg" onclick="startDMFromSearch(${u.id}, '${escHtml(name)}')">
            ✉ Message
          </button>
          <a class="btn-profile" href="/01_HTML/public_profile_en.html?id=${u.id}">
            View Profile
          </a>
        </div>
      </div>`;

  }).join("");

}

function renderSearchEmpty(text) {
  const container = document.getElementById("searchResults");
  if (!container) return;
  container.innerHTML = `
    <div class="search-empty-state">
      <div class="search-empty-icon">⚔️</div>
      <div class="search-empty-text">${text}</div>
    </div>`;
}


/* =========================================================
   START DM FROM SEARCH
   ========================================================= */

async function startDMFromSearch(recipientId, name) {
  closeSearchModal();
  openMessagesModal();

  try {

    const token    = localStorage.getItem("token");
    const response = await fetch("/api/messages/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ recipient_id: recipientId })
    });

    const data = await response.json();
    await loadThreads();
    openThread(data.thread_id, name);

  } catch (err) {
    console.error("START DM ERROR:", err);
  }

}


/* =========================================================
   MAIL BADGE
   ========================================================= */

function updateMailBadge(count) {
  const btn = document.getElementById("mailBtn");
  if (!btn) return;

  let badge = btn.querySelector(".mail-badge");
  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "notif-badge mail-badge";
      btn.style.position = "relative";
      btn.appendChild(badge);
    }
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = "flex";
  } else if (badge) {
    badge.style.display = "none";
  }
}


/* =========================================================
   HELPERS
   ========================================================= */

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusColor(s) {
  return s === "online" ? "#4caf50"
       : s === "away"   ? "#e8a020"
       : s === "busy"   ? "#c0392b"
       : "#555";
}

function formatMsgTime(date) {
  const now   = new Date();
  const diff  = now - date;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7)   return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}


/* =========================================================
   AUTO-INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", initializeMessaging);
