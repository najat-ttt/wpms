import { requireAuth } from '../auth.js';
import { getWeddingProfile, saveWeddingProfile } from '../db.js';
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeLayout } from '../layout.js';

requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  initializeLayout('profile', 'Wedding Profile');

  let currentUserId = null;
  let hasExistingProfile = false;

  // DOM Elements
  const stateLoading = document.getElementById('loading-state');
  const stateEmpty = document.getElementById('empty-state');
  const stateView = document.getElementById('view-state');
  const stateEdit = document.getElementById('edit-state');
  
  const alertContainer = document.getElementById('alert-container');

  // Form Elements
  const form = document.getElementById('profile-form');
  const inputCoupleNames = document.getElementById('coupleNames');
  const inputWeddingDate = document.getElementById('weddingDate');
  const inputVenue = document.getElementById('venue');
  const inputDescription = document.getElementById('description');
  const btnSave = document.getElementById('btn-save');

  // View Elements
  const displayCoupleNames = document.getElementById('display-couple-names');
  const displayDate = document.getElementById('display-date');
  const displayVenue = document.getElementById('display-venue');
  const displayDescription = document.getElementById('display-description');

  // Action Buttons
  document.getElementById('btn-create-profile').addEventListener('click', showEditState);
  document.getElementById('btn-edit-profile').addEventListener('click', showEditState);
  document.getElementById('btn-cancel').addEventListener('click', () => {
    if (hasExistingProfile) {
      showViewState();
    } else {
      showEmptyState();
    }
  });

  function hideAllStates() {
    stateLoading.classList.add('hidden');
    stateEmpty.classList.add('hidden');
    stateView.classList.add('hidden');
    stateEdit.classList.add('hidden');
  }

  function showEmptyState() {
    hideAllStates();
    stateEmpty.classList.remove('hidden');
  }

  function showViewState() {
    hideAllStates();
    stateView.classList.remove('hidden');
  }

  function showEditState() {
    hideAllStates();
    stateEdit.classList.remove('hidden');
  }
  
  function showAlert(message, type = 'success') {
    alertContainer.innerHTML = `<div class="alert alert-${type}" style="margin-bottom: 1.5rem;">${escapeHtml(message)}</div>`;
    setTimeout(() => {
      alertContainer.innerHTML = '';
    }, 5000);
  }

  function populateView(data) {
    displayCoupleNames.textContent = data.coupleNames || 'Not specified';
    
    // Format Date safely
    if (data.weddingDate) {
       // Convert from YYYY-MM-DD to localized date
       // Adjust for timezone shift by breaking it apart
       const parts = data.weddingDate.split('-');
       if(parts.length === 3) {
         const d = new Date(parts[0], parts[1] - 1, parts[2]);
         displayDate.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
       } else {
         displayDate.textContent = data.weddingDate;
       }
    } else {
       displayDate.textContent = 'Not specified';
    }
    
    displayVenue.textContent = data.venue || 'Not specified';
    displayDescription.textContent = data.description || 'No description provided.';
  }

  function populateForm(data) {
    inputCoupleNames.value = data.coupleNames || '';
    inputWeddingDate.value = data.weddingDate || '';
    inputVenue.value = data.venue || '';
    inputDescription.value = data.description || '';
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      try {
        const profile = await getWeddingProfile(user.uid);
        if (profile && profile.coupleNames) {
          hasExistingProfile = true;
          populateView(profile);
          populateForm(profile);
          showViewState();
        } else {
          hasExistingProfile = false;
          showEmptyState();
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        showAlert("Failed to load profile data. Please refresh.", "danger");
      }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    const data = {
      coupleNames: inputCoupleNames.value.trim(),
      weddingDate: inputWeddingDate.value,
      venue: inputVenue.value.trim(),
      description: inputDescription.value.trim()
    };

    if (!data.coupleNames || !data.weddingDate || !data.venue) {
      showAlert("Please fill in all required fields.", "danger");
      return;
    }

    btnSave.disabled = true;
    btnSave.textContent = 'Saving...';

    try {
      await saveWeddingProfile(currentUserId, data);
      
      hasExistingProfile = true;
      populateView(data);
      // We don't repopulate form to keep exact input
      showViewState();
      showAlert("Profile saved successfully.");
    } catch (error) {
      console.error(error);
      showAlert("Failed to save profile. Please try again.", "danger");
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Save Profile';
    }
  });
  
  function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
});
