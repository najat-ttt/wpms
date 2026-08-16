import { requireAuth } from '../auth.js';
import { subscribeToVendors, addVendor, updateVendor, deleteVendor } from '../db.js';
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeLayout } from '../layout.js';

requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  initializeLayout('vendors', 'Vendor Management');

  let currentUserId = null;
  let unsubscribe = null;
  let allVendors = [];
  let vendorToDelete = null;

  // DOM Elements
  const stateLoading = document.getElementById('loading-state');
  const stateEmpty = document.getElementById('empty-state');
  const vendorsContainer = document.getElementById('vendors-container');
  const alertContainer = document.getElementById('alert-container');
  
  // Toolbar
  const searchInput = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const sortBy = document.getElementById('sort-by');

  // Modal Elements
  const vendorModal = document.getElementById('vendor-modal');
  const modalTitle = document.getElementById('modal-title');
  const vendorForm = document.getElementById('vendor-form');
  const inputId = document.getElementById('vendor-id');
  const inputName = document.getElementById('vendor-name');
  const inputCategory = document.getElementById('vendor-category');
  const inputCost = document.getElementById('vendor-cost');
  const inputPhone = document.getElementById('vendor-phone');
  const inputEmail = document.getElementById('vendor-email');
  const inputService = document.getElementById('vendor-service');
  const btnSaveVendor = document.getElementById('btn-save-vendor');
  
  // Delete Modal
  const deleteModal = document.getElementById('delete-modal');

  // Bind Events
  document.getElementById('btn-open-add-vendor').addEventListener('click', openAddModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeVendorModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeVendorModal);
  
  document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete);
  document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);
  
  searchInput.addEventListener('input', renderVendors);
  filterCategory.addEventListener('change', renderVendors);
  sortBy.addEventListener('change', renderVendors);
  
  vendorForm.addEventListener('submit', handleSaveVendor);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      if (unsubscribe) unsubscribe();
      
      unsubscribe = subscribeToVendors(user.uid, (vendors) => {
        allVendors = vendors;
        stateLoading.classList.add('hidden');
        renderVendors();
      });
    }
  });

  function openAddModal() {
    vendorForm.reset();
    inputId.value = '';
    modalTitle.textContent = 'Add Vendor';
    vendorModal.classList.add('active');
  }

  function openEditModal(vendorId) {
    const vendor = allVendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
    inputId.value = vendor.id;
    inputName.value = vendor.name || '';
    inputCategory.value = vendor.category || '';
    inputCost.value = vendor.estimatedCost || '';
    inputPhone.value = vendor.phone || '';
    inputEmail.value = vendor.email || '';
    inputService.value = vendor.service || '';
    
    modalTitle.textContent = 'Edit Vendor';
    vendorModal.classList.add('active');
  }

  function closeVendorModal() {
    vendorModal.classList.remove('active');
  }

  function openDeleteModal(vendorId) {
    vendorToDelete = vendorId;
    deleteModal.classList.add('active');
  }

  function closeDeleteModal() {
    vendorToDelete = null;
    deleteModal.classList.remove('active');
  }

  async function handleSaveVendor(e) {
    e.preventDefault();
    if (!currentUserId) return;

    const vendorData = {
      name: inputName.value.trim(),
      category: inputCategory.value,
      phone: inputPhone.value.trim(),
      email: inputEmail.value.trim(),
      service: inputService.value.trim(),
      estimatedCost: parseFloat(inputCost.value) || 0
    };

    if (!vendorData.name || !vendorData.category) {
      showAlert('Please fill all required fields.', 'danger');
      return;
    }
    
    if (vendorData.estimatedCost < 0) {
      showAlert('Estimated cost cannot be negative.', 'danger');
      return;
    }

    btnSaveVendor.disabled = true;
    btnSaveVendor.textContent = 'Saving...';

    try {
      if (inputId.value) {
        await updateVendor(currentUserId, inputId.value, vendorData);
        showAlert('Vendor updated successfully.');
      } else {
        await addVendor(currentUserId, vendorData);
        showAlert('Vendor created successfully.');
      }
      closeVendorModal();
    } catch (error) {
      console.error(error);
      showAlert('Failed to save vendor.', 'danger');
    } finally {
      btnSaveVendor.disabled = false;
      btnSaveVendor.textContent = 'Save Vendor';
    }
  }

  async function confirmDelete() {
    if (!currentUserId || !vendorToDelete) return;
    const btn = document.getElementById('btn-confirm-delete');
    btn.disabled = true;
    
    try {
      await deleteVendor(currentUserId, vendorToDelete);
      showAlert('Vendor deleted.');
      closeDeleteModal();
    } catch (error) {
      console.error(error);
      showAlert('Failed to delete vendor.', 'danger');
    } finally {
      btn.disabled = false;
    }
  }

  function renderVendors() {
    if (allVendors.length === 0) {
      stateEmpty.classList.remove('hidden');
      vendorsContainer.classList.add('hidden');
      return;
    }

    let filtered = [...allVendors];
    const query = searchInput.value.toLowerCase();
    const categoryFilter = filterCategory.value;
    const sort = sortBy.value;

    // Search
    if (query) {
      filtered = filtered.filter(v => 
        (v.name || '').toLowerCase().includes(query) ||
        (v.service || '').toLowerCase().includes(query) ||
        (v.category || '').toLowerCase().includes(query)
      );
    }

    // Filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(v => v.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sort === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      } else if (sort === 'cost-desc') {
        return (b.estimatedCost || 0) - (a.estimatedCost || 0);
      } else if (sort === 'cost-asc') {
        return (a.estimatedCost || 0) - (b.estimatedCost || 0);
      } else if (sort === 'recent') {
        return 0; // The base array is already recent. 
      }
      return 0;
    });

    if (sort === 'recent') {
       const orderMap = new Map(allVendors.map((v, i) => [v.id, i]));
       filtered.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));
    }

    if (filtered.length === 0) {
      stateEmpty.classList.remove('hidden');
      vendorsContainer.classList.add('hidden');
    } else {
      stateEmpty.classList.add('hidden');
      vendorsContainer.classList.remove('hidden');
      vendorsContainer.innerHTML = '';
      
      filtered.forEach(vendor => {
        let catBadgeClass = 'badge-primary';
        if (vendor.category === 'Venue') catBadgeClass = 'badge-danger';
        if (vendor.category === 'Catering') catBadgeClass = 'badge-warning';
        if (vendor.category === 'Photography') catBadgeClass = 'badge-success';
        
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        });

        const el = document.createElement('div');
        el.className = 'card task-card'; // Reuse task card styles for similar layout

        el.innerHTML = `
          <div class="task-header">
            <h4 class="task-title">${escapeHtml(vendor.name)}</h4>
            <span class="badge ${catBadgeClass}">${escapeHtml(vendor.category)}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">
            ${vendor.phone ? `<div>📞 ${escapeHtml(vendor.phone)}</div>` : ''}
            ${vendor.email ? `<div>✉️ ${escapeHtml(vendor.email)}</div>` : ''}
          </div>
          <p class="task-desc">${escapeHtml(vendor.service || 'No description.')}</p>
          <div class="task-footer">
            <div class="task-meta">
              <span style="font-weight: 600; color: var(--color-text-primary); font-size: 1rem;">
                ${formatter.format(vendor.estimatedCost || 0)}
              </span>
            </div>
            <div class="task-actions">
              <button class="btn btn-secondary btn-sm btn-edit-vendor">Edit</button>
              <button class="btn btn-outline-danger btn-sm btn-delete-vendor">Delete</button>
            </div>
          </div>
        `;

        el.querySelector('.btn-edit-vendor').addEventListener('click', () => openEditModal(vendor.id));
        el.querySelector('.btn-delete-vendor').addEventListener('click', () => openDeleteModal(vendor.id));
        
        vendorsContainer.appendChild(el);
      });
    }
  }
  
  function showAlert(message, type = 'success') {
    alertContainer.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
    setTimeout(() => {
      alertContainer.innerHTML = '';
    }, 3000);
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
