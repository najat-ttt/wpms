import { logoutUser } from './auth.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from './db.js';

export function initializeLayout(activePageId, pageTitle) {
  const appLayout = document.querySelector('.app-layout');
  
  if (!appLayout) return;

  const sidebarHtml = `
    <aside class="app-sidebar" id="app-sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">W</div>
        <h1 class="nav-brand">WPMS</h1>
        <button id="close-sidebar-btn" class="mobile-only icon-btn" aria-label="Close sidebar" style="margin-left: auto; border: none; background: transparent;">✕</button>
      </div>
      <nav class="sidebar-nav">
        <a href="/dashboard.html" class="nav-link ${activePageId === 'dashboard' ? 'active' : ''}">
          Dashboard
        </a>
        <a href="/wedding-profile.html" class="nav-link ${activePageId === 'profile' ? 'active' : ''}">
          Wedding Profile
        </a>
        <a href="/tasks.html" class="nav-link ${activePageId === 'tasks' ? 'active' : ''}">
          Tasks
        </a>
        <a href="/vendors.html" class="nav-link ${activePageId === 'vendors' ? 'active' : ''}">
          Vendors
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-profile-mini">
           <div class="user-avatar-sm" id="sidebar-avatar">?</div>
           <div class="user-info">
             <div class="user-name" id="sidebar-user-name">Loading...</div>
             <div class="user-email" id="sidebar-user-email">...</div>
           </div>
        </div>
        <button id="logout-btn" class="nav-link logout-link">
          Logout
        </button>
      </div>
    </aside>
    <div id="sidebar-overlay" class="sidebar-overlay"></div>
  `;

  // Check if sidebar already exists (if it does in HTML, remove it to replace with dynamic one)
  const existingSidebar = document.querySelector('.app-sidebar');
  if (existingSidebar) existingSidebar.remove();

  // Inject Sidebar and Overlay at the beginning of the layout
  appLayout.insertAdjacentHTML('afterbegin', sidebarHtml);

  // Render Header
  const appMain = document.querySelector('.app-main');
  const existingHeader = document.querySelector('.app-header');
  
  const headerHtml = `
    <header class="app-header" id="app-header">
      <div class="header-left">
        <button id="open-sidebar-btn" class="mobile-only icon-btn" aria-label="Open sidebar" style="border: none; background: transparent;">☰</button>
        <h2 class="page-title" style="margin: 0; font-size: 1.25rem;">${pageTitle}</h2>
      </div>
      <div class="header-right">
        <div class="header-user">
          <span id="header-user-name" class="header-user-name">Loading...</span>
          <div class="user-avatar-sm" id="header-avatar">?</div>
        </div>
        <button class="icon-btn notification-btn" aria-label="Notifications">
          <span class="notification-dot"></span>
          🔔
        </button>
      </div>
    </header>
  `;

  if (existingHeader) {
    existingHeader.outerHTML = headerHtml;
  } else if (appMain) {
    appMain.insertAdjacentHTML('afterbegin', headerHtml);
  }

  // Setup Event Listeners
  setupMobileToggle();
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let userProfile = null;
      try {
        userProfile = await getUserProfile(user.uid);
      } catch (e) {
        console.warn("Could not load layout user profile:", e);
      }
      const displayName = userProfile?.name || user.email.split('@')[0];
      const initial = displayName.charAt(0).toUpperCase();

      // Sidebar
      const sidebarName = document.getElementById('sidebar-user-name');
      const sidebarEmail = document.getElementById('sidebar-user-email');
      const sidebarAvatar = document.getElementById('sidebar-avatar');
      
      if (sidebarName) sidebarName.textContent = displayName;
      if (sidebarEmail) sidebarEmail.textContent = user.email;
      if (sidebarAvatar) sidebarAvatar.textContent = initial;

      // Header
      const headerName = document.getElementById('header-user-name');
      const headerAvatar = document.getElementById('header-avatar');
      
      if (headerName) headerName.textContent = displayName;
      if (headerAvatar) headerAvatar.textContent = initial;
    }
  });
}

function setupMobileToggle() {
  const openBtn = document.getElementById('open-sidebar-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  if (openBtn) openBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);
}
