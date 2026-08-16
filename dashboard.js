import { requireAuth } from '../auth.js';
import { getWeddingProfile, getUserProfile, subscribeToTasks, subscribeToVendors } from '../db.js';
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeLayout } from '../layout.js';

requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  initializeLayout('dashboard', 'Dashboard');

  const profileSummary = document.getElementById('profile-summary');
  const statTotal = document.getElementById('stat-total');
  const statCompleted = document.getElementById('stat-completed');
  const statPending = document.getElementById('stat-pending');
  const statOverdue = document.getElementById('stat-overdue');
  const statVendorTotal = document.getElementById('stat-vendor-total');
  const statVendorCost = document.getElementById('stat-vendor-cost');
  
  const taskProgressBar = document.getElementById('task-progress-bar');
  const taskProgressText = document.getElementById('task-progress-text');
  const upcomingTasksList = document.getElementById('upcoming-tasks-list');
  const overdueTasksList = document.getElementById('overdue-tasks-list');

  let taskUnsubscribe = null;
  let vendorUnsubscribe = null;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Fetch user profile to display their name
      let userName = 'there';
      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile && userProfile.name) {
          userName = userProfile.name;
        }
      } catch (e) {
        console.warn("Could not load user profile:", e);
      }

      // Fetch wedding profile
      try {
        const weddingProfile = await getWeddingProfile(user.uid);
        if (weddingProfile && weddingProfile.coupleNames) {
          // Safe date parsing
          let displayDate = 'Date: TBD';
          if (weddingProfile.weddingDate) {
            const parts = weddingProfile.weddingDate.split('-');
            if(parts.length === 3) {
              const d = new Date(parts[0], parts[1] - 1, parts[2]);
              displayDate = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            } else {
              displayDate = weddingProfile.weddingDate;
            }
          }
          
          profileSummary.innerHTML = `
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--color-text-primary);">Welcome back, ${escapeHtml(userName)}!</h2>
            <p style="font-size: 1.1rem; color: var(--color-text-secondary); margin-bottom: 0.25rem;">Planning the wedding of <strong>${escapeHtml(weddingProfile.coupleNames)}</strong></p>
            <div style="display: flex; gap: var(--spacing-md); color: var(--color-text-secondary); font-size: 0.9rem;">
              <span>🗓 ${escapeHtml(displayDate)}</span>
              <span>📍 ${escapeHtml(weddingProfile.venue || 'Venue TBD')}</span>
            </div>
          `;
        } else {
          profileSummary.innerHTML = `
            <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--color-text-primary);">Welcome back, ${escapeHtml(userName)}!</h2>
            <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-md);">You haven't set up your Wedding Profile yet.</p>
            <a href="/wedding-profile.html" class="btn btn-primary">Create Wedding Profile</a>
          `;
        }
      } catch (e) {
        console.warn("Could not load wedding profile:", e);
        profileSummary.innerHTML = `
          <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--color-text-primary);">Welcome back, ${escapeHtml(userName)}!</h2>
          <p style="color: var(--color-danger); margin-bottom: var(--spacing-md);">Error loading profile data.</p>
          <a href="/wedding-profile.html" class="btn btn-primary">Try Again</a>
        `;
      }

      // Subscribe to Tasks for stats and lists
      if (taskUnsubscribe) taskUnsubscribe();
      taskUnsubscribe = subscribeToTasks(user.uid, (tasks) => {
        let total = tasks.length;
        let completed = 0;
        let pending = 0;
        let overdue = 0;
        
        const now = new Date();
        const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const upcomingTasks = [];
        const overdueTasks = [];

        tasks.forEach(task => {
          if (task.status === 'Completed') {
            completed++;
          } else {
            pending++;
            if (task.deadline && task.deadline < todayStr) {
              overdue++;
              overdueTasks.push(task);
            } else {
              upcomingTasks.push(task);
            }
          }
        });

        // Update stats
        statTotal.textContent = total;
        statCompleted.textContent = completed;
        statPending.textContent = pending;
        statOverdue.textContent = overdue;
        
        // Progress Bar
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        taskProgressBar.style.width = `${percentage}%`;
        taskProgressText.textContent = `${completed} / ${total} Completed (${percentage}%)`;
        
        // Sort and render upcoming
        upcomingTasks.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
        const nearestUpcoming = upcomingTasks.slice(0, 5);
        renderMiniTasks(upcomingTasksList, nearestUpcoming, 'No upcoming tasks.');
        
        // Sort and render overdue
        overdueTasks.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
        renderMiniTasks(overdueTasksList, overdueTasks, 'No overdue tasks!', true);
      });

      // Subscribe to Vendors for stats
      if (vendorUnsubscribe) vendorUnsubscribe();
      vendorUnsubscribe = subscribeToVendors(user.uid, (vendors) => {
        let total = vendors.length;
        let totalCost = 0;
        
        vendors.forEach(vendor => {
          totalCost += (vendor.estimatedCost || 0);
        });

        statVendorTotal.textContent = total;
        
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        });
        statVendorCost.textContent = formatter.format(totalCost);
      });
    }
  });

  function renderMiniTasks(container, tasksList, emptyMessage, isOverdue = false) {
    if (tasksList.length === 0) {
      container.innerHTML = `<div style="padding: 1rem; color: var(--color-text-secondary); text-align: center; border-radius: 8px; background-color: var(--color-surface-muted);">${emptyMessage}</div>`;
      return;
    }
    
    container.innerHTML = tasksList.map(task => {
      let priorityClass = 'badge-neutral';
      if (task.priority === 'High') priorityClass = 'badge-danger';
      else if (task.priority === 'Medium') priorityClass = 'badge-primary';
      
      return `
        <div class="mini-task-item">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 500; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isOverdue ? 'var(--color-danger)' : 'var(--color-text-primary)'};">
              ${escapeHtml(task.title)}
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
              <span class="badge ${priorityClass}" style="transform: scale(0.8); transform-origin: left; margin-right: 4px;">${escapeHtml(task.priority)}</span>
              Due: ${escapeHtml(task.deadline)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
});
