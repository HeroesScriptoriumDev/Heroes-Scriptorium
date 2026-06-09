/**
 * tavern_en.js — Heroes Scriptorium Tavern Home
 * API-driven with mock fallback. Replace API.BASE_URL when backend is ready.
 */

'use strict';

// ── Config ────────────────────────────────────────────────────────────────
const API = {
  BASE_URL: '/api',
  TIMEOUT_MS: 8000,
  async fetch(endpoint) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      const res = await fetch(this.BASE_URL + endpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`[Tavern] API failed ${endpoint}:`, e.message);
      return null;
    }
  }
};

// ── Mock Data ─────────────────────────────────────────────────────────────
const MOCK = {
  upcomingSessions: [
    { id:1, campaignName:'Ashes of Velthorne',  sessionType:'DM Session',     date: nextDateString(2), time:'19:00', status:'scheduled', playerCount:3, maxPlayers:4, thumbnailUrl:null },
    { id:2, campaignName:'Crown of Black Salt',  sessionType:'Player Session', date: nextDateString(5), time:'20:00', status:'confirmed', playerCount:4, maxPlayers:5, thumbnailUrl:null },
    { id:3, campaignName:'Shadows of Eryndor',   sessionType:'Player Session', date: nextDateString(6), time:'18:00', status:'scheduled', playerCount:2, maxPlayers:5, thumbnailUrl:null },
  ],
  campaigns: [
    { id:1, name:'Ashes of Velthorne', role:'Player', level:4, playerCount:4, currentXP:2150, nextLevelXP:3200, badgeUrl:null, status:'active' },
    { id:2, name:'Crown of Black Salt', role:'DM',   level:2, playerCount:5, currentXP:800,  nextLevelXP:1200, badgeUrl:null, status:'active' },
  ],
  downtimeActivities: [
    { id:1, campaignName:'Ashes of Velthorne', activityName:'Research',  description:'Investigate the Ember Key.', daysRemaining:3, goldCost:10,  status:'available' },
    { id:2, campaignName:'Ashes of Velthorne', activityName:'Training',  description:'Weapon proficiency practice.', daysRemaining:5, goldCost:25, status:'available' },
    { id:3, campaignName:'Crown of Black Salt', activityName:'Crafting', description:'Brew a healing potion.',      daysRemaining:2, goldCost:50,  status:'in_progress' },
  ],
  friends: [
    { id:1, displayName:'RogarStonefist',    status:'online',  location:'In Tavern', avatarUrl:null },
    { id:2, displayName:'ThaliaMoonwhisper', status:'online',  location:'In VTT',    avatarUrl:null },
    { id:3, displayName:'SpellBinder',       status:'online',  location:'Online',    avatarUrl:null },
    { id:4, displayName:'VenomClaw',         status:'offline', location:'Offline',   avatarUrl:null },
    { id:5, displayName:'IronVeil',          status:'away',    location:'Away',      avatarUrl:null },
  ],
  recentActivity: [
    { id:1, actorName:'You',               actorSelf:true,  action:'scheduled', target:'"Ashes of Velthorne"', targetType:'session',     detail:'for May 25, 7:00 PM', timestamp: minutesAgo(120) },
    { id:2, actorName:'ThaliaMoonwhisper', actorSelf:false, action:'joined',    target:'the party',            targetType:'party',        detail:null,                  timestamp: minutesAgo(300) },
    { id:3, actorName:'You',               actorSelf:true,  action:'completed a downtime activity:', target:'Research', targetType:'downtime', detail:null,             timestamp: hoursAgo(26) },
    { id:4, actorName:'RogarStonefist',    actorSelf:false, action:'posted:',   target:'"Looking for a Healer"', targetType:'forum',      detail:null,                  timestamp: hoursAgo(50) },
    { id:5, actorName:'You',               actorSelf:true,  action:'earned the achievement:', target:'Storyteller', targetType:'achievement', detail:null,              timestamp: daysAgo(3) },
  ],
  upcomingEvents: [
    { id:1, name:'Ashes of Velthorne',      type:'session',   date: nextDateString(2),  time:'19:00', subLabel:'DM Session' },
    { id:2, name:'Crown of Black Salt',     type:'session',   date: nextDateString(5),  time:'20:00', subLabel:'Player Session' },
    { id:3, name:'Shadows of Eryndor',      type:'session',   date: nextDateString(6),  time:'18:00', subLabel:'Player Session' },
    { id:4, name:'Guild Council Meeting',   type:'guild',     date: nextDateString(4),  time:'20:00', subLabel:'Guild Event' },
    { id:5, name:'Summer One-Shot Bracket', type:'community', date: nextDateString(10), time:'14:00', subLabel:'Community Event' },
  ],
};


function navigate(destination){

  switch(destination){

    /* =====================================================
       HOME
       ===================================================== */

    case "home":
      localStorage.setItem("mode", "player");
      window.location.href = "home_en.html";
    break;


    /* =====================================================
       PLAYER MODE
       ===================================================== */

    case "player":
      localStorage.setItem("mode", "dm");
      window.location.href = "dm_home_en.html";
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


// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadUpcomingSessions(),
    loadEnrolledCampaigns(),
    loadAvailableDowntimeActivities(),
    loadOnlineFriends(),
    loadRecentActivity(),
    loadUpcomingEvents(),
  ]);
});

// ── 1. Upcoming Sessions ──────────────────────────────────────────────────
async function loadUpcomingSessions() {
  const container = document.querySelector('.upcoming-session-information');
  if (!container) return;
  const data = await API.fetch('/player/sessions/upcoming') ?? MOCK.upcomingSessions;
  container.innerHTML = '';

  if (!data.length) { container.innerHTML = emptyState('No upcoming sessions.'); return; }

  // Show only the next 2 to keep it compact
  data.slice(0, 2).forEach(s => {
    const d = parseDate(s.date);
    const statusClass = s.status === 'confirmed' ? 'status-confirmed'
                      : s.status === 'cancelled'  ? 'status-cancelled'
                      : 'status-scheduled';
    const el = div('sidebar-session-item');
    el.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start">
        <div class="sidebar-session-thumb thumb-placeholder">${s.thumbnailUrl ? `<img src="${esc(s.thumbnailUrl)}" alt="">` : '🏰'}</div>
        <div class="sidebar-session-info" style="flex:1">
          <div class="sidebar-session-name">${esc(s.campaignName)}</div>
          <div class="sidebar-session-meta" style="color:var(--gold-dim)">${esc(s.sessionType)}</div>
          <div class="sidebar-session-meta">${formatDate(d)} · ${formatTime(s.time)}</div>
          <span class="sidebar-session-status ${statusClass}">${capitalize(s.status)}</span>
        </div>
      </div>
      ${s.playerCount != null ? `<div class="sidebar-session-players">👥 ${s.playerCount} / ${s.maxPlayers} Players</div>` : ''}
    `;
    container.appendChild(el);
  });
}

// ── 2. Campaign Status ────────────────────────────────────────────────────
async function loadEnrolledCampaigns() {
  const container = document.querySelector('.campaign-information');
  if (!container) return;
  const data = await API.fetch('/player/campaigns') ?? MOCK.campaigns;
  container.innerHTML = '';

  if (!data.length) { container.innerHTML = emptyState('Not enrolled in any campaigns.'); return; }

  // Show only first campaign to keep compact
  data.slice(0, 1).forEach(c => {
    const pct = Math.min(100, Math.round((c.currentXP / c.nextLevelXP) * 100));
    const el = div('sidebar-campaign-item');
    el.innerHTML = `
      <div class="sidebar-campaign-header">
        <div class="sidebar-campaign-badge badge-placeholder">${c.badgeUrl ? `<img src="${esc(c.badgeUrl)}" alt="">` : '🛡️'}</div>
        <div class="sidebar-campaign-info" style="flex:1">
          <div class="sidebar-campaign-name">${esc(c.name)}</div>
          <div class="sidebar-campaign-meta">Level ${c.level} · ${c.playerCount} Players</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <span style="font-family:var(--font-heading);font-size:10px;color:var(--text-muted)">${c.currentXP.toLocaleString()}</span>
        <span style="font-family:var(--font-heading);font-size:10px;color:var(--text-muted)">${c.nextLevelXP.toLocaleString()} XP</span>
      </div>
      <div class="sidebar-xp-bar"><div class="sidebar-xp-fill" style="width:${pct}%"></div></div>
    `;
    container.appendChild(el);
  });
}

// ── 3. Downtime Activities ────────────────────────────────────────────────
async function loadAvailableDowntimeActivities() {
  const container = document.querySelector('.downtime-information');
  if (!container) return;
  const data = await API.fetch('/player/downtime') ?? MOCK.downtimeActivities;
  container.innerHTML = '';

  const available = data.filter(d => d.status === 'available' || d.status === 'in_progress');

  if (!available.length) {
    container.innerHTML = emptyState('No downtime activities available.');
    return;
  }

  // Reference style: hourglass icon + summary text + view button
  const summary = div('downtime-summary');
  summary.innerHTML = `
    <div class="downtime-summary-icon">⏳</div>
    <div class="downtime-summary-text">You have ${available.length} downtime ${available.length === 1 ? 'activity' : 'activities'} available.</div>
  `;
  container.appendChild(summary);

  const btn = document.createElement('button');
  btn.className = 'downtime-view-btn';
  btn.textContent = 'View Downtime';
  btn.onclick = () => navigate('downtime');
  container.appendChild(btn);
}

// ── 4. Online Friends ─────────────────────────────────────────────────────
async function loadOnlineFriends() {
  const container = document.querySelector('.online-friends-information');
  if (!container) return;
  const data = await API.fetch('/player/friends') ?? MOCK.friends;
  container.innerHTML = '';

  const sorted = [...data].sort((a,b) => {
    const o = { online:0, away:1, offline:2 };
    return (o[a.status]??3) - (o[b.status]??3);
  });

  // Header with View All
  const hdr = div('friends-header');
  const onlineCount = sorted.filter(f => f.status === 'online').length;
  hdr.innerHTML = `
    <span class="friends-count">${onlineCount} online</span>
    <button class="friends-view-all" onclick="navigate('friends')">View All</button>
  `;
  container.appendChild(hdr);

  // Show online + away only (up to 4) to keep compact
  sorted.filter(f => f.status !== 'offline').slice(0, 4).forEach(f => {
    const dotClass = f.status === 'online' ? 'dot-online' : f.status === 'away' ? 'dot-away' : 'dot-offline';
    const el = div('sidebar-friend-item');
    el.innerHTML = `
      <div class="friend-avatar avatar-placeholder">${f.avatarUrl ? `<img src="${esc(f.avatarUrl)}" alt="">` : esc(f.displayName.charAt(0))}</div>
      <div class="friend-info" style="flex:1">
        <div class="friend-name">${esc(f.displayName)}</div>
        <div class="friend-location">${esc(f.location)}</div>
      </div>
      <span class="friend-dot ${dotClass}"></span>
    `;
    container.appendChild(el);
  });
}

// ── 5. Recent Activity ────────────────────────────────────────────────────
async function loadRecentActivity() {
  const container = document.querySelector('.recent-activity-information');
  if (!container) return;
  const data = await API.fetch('/player/activity/recent') ?? MOCK.recentActivity;

  // Inject View All into the title row
  const titleEl = document.querySelector('.recent-activity-title');
  if (titleEl && !titleEl.parentElement.querySelector('.activity-view-all')) {
    const wrap = div('recent-activity-header');
    titleEl.parentNode.insertBefore(wrap, titleEl);
    wrap.appendChild(titleEl);
    const btn = document.createElement('button');
    btn.className = 'activity-view-all';
    btn.textContent = 'View All';
    btn.onclick = () => navigate('activity');
    wrap.appendChild(btn);
    titleEl.style.marginBottom = '0';
    titleEl.style.paddingBottom = '0';
    titleEl.style.borderBottom = 'none';
  }

  container.innerHTML = '';
  if (!data.length) { container.innerHTML = emptyState('No recent activity.'); return; }

  data.slice(0, 5).forEach(item => {
    const el = div('sidebar-activity-item');
    el.innerHTML = `
      <div class="activity-icon-wrap">${activityIcon(item.targetType)}</div>
      <div class="activity-body">
        <div class="activity-text">
          <strong>${esc(item.actorName)}</strong> ${esc(item.action)} <span class="activity-target">${esc(item.target)}</span>${item.detail ? ' ' + esc(item.detail) : ''}
        </div>
        <div class="activity-time">${timeAgo(item.timestamp)}</div>
      </div>
    `;
    container.appendChild(el);
  });
}

// ── 6. Upcoming Events ────────────────────────────────────────────────────
async function loadUpcomingEvents() {
  const container = document.querySelector('.upcoming-events-information');
  if (!container) return;
  const data = await API.fetch('/player/events/upcoming') ?? MOCK.upcomingEvents;
  container.innerHTML = '';

  if (!data.length) { container.innerHTML = emptyState('No upcoming events.'); return; }

  data.slice(0, 4).forEach(ev => {
    const d = parseDate(ev.date);
    const el = div('sidebar-event-item');
    el.innerHTML = `
      <div class="sidebar-event-date">
        <span class="event-month">${SHORT_MONTHS[d.getMonth()]}</span>
        <span class="event-day">${d.getDate()}</span>
      </div>
      <div class="sidebar-event-info" style="flex:1">
        <div class="sidebar-event-name">${esc(ev.name)}</div>
        <div class="sidebar-event-meta">${esc(ev.subLabel ?? '')}</div>
      </div>
      ${ev.time ? `<div class="sidebar-event-right">${formatTime(ev.time)}</div>` : ''}
    `;
    container.appendChild(el);
  });
}

// ── Navigation ────────────────────────────────────────────────────────────
function navigate(page) {
  // Replace with your router: window.location.href = `/pages/${page}.html`;
  console.log('[Tavern] Navigate:', page);
}

// ── Utilities ─────────────────────────────────────────────────────────────
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function div(cls) { const el = document.createElement('div'); el.className = cls; return el; }
function esc(s)   { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function parseDate(s)  { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
function formatDate(d) { return SHORT_MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
function formatTime(t) {
  if (!t) return '';
  const [h,m] = t.split(':').map(Number);
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}
function emptyState(msg) { return `<div class="sidebar-empty">${msg}</div>`; }
function activityIcon(type) {
  return { session:'🗓️', party:'👥', downtime:'⏳', forum:'💬', achievement:'⭐', default:'📜' }[type] ?? '📜';
}
function nextDateString(n) {
  const d = new Date(); d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function minutesAgo(n) { return new Date(Date.now() - n*60000); }
function hoursAgo(n)   { return new Date(Date.now() - n*3600000); }
function daysAgo(n)    { return new Date(Date.now() - n*86400000); }
