import { requireAuth } from '../auth.js';
import { subscribeToTasks, addTask, updateTask, deleteTask } from '../db.js';
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeLayout } from '../layout.js';

requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  initializeLayout('tasks', 'Task Management');

  let currentUserId = null;
  let unsubscribe = null;
  let allTasks = [];
  let taskToDelete = null;

  // DOM Elements
  const stateLoading = document.getElementById('loading-state');
  const stateEmpty = document.getElementById('empty-state');
  const tasksContainer = document.getElementById('tasks-container');
  const alertContainer = document.getElementById('alert-container');
  
  // Toolbar
  const searchInput = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');
  const sortBy = document.getElementById('sort-by');

  // Modal Elements
  const taskModal = document.getElementById('task-modal');
  const modalTitle = document.getElementById('modal-title');
  const taskForm = document.getElementById('task-form');
  const inputId = document.getElementById('task-id');
  const inputTitle = document.getElementById('task-title');
  const inputDesc = document.getElementById('task-desc');
  const inputDeadline = document.getElementById('task-deadline');
  const inputPriority = document.getElementById('task-priority');
  const inputStatus = document.getElementById('task-status');
  const btnSaveTask = document.getElementById('btn-save-task');
  
  // Delete Modal
  const deleteModal = document.getElementById('delete-modal');

  // Bind Events
  document.getElementById('btn-open-add-task').addEventListener('click', openAddModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeTaskModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeTaskModal);
  
  document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete);
  document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);
  
  searchInput.addEventListener('input', renderTasks);
  filterStatus.addEventListener('change', renderTasks);
  sortBy.addEventListener('change', renderTasks);
  
  taskForm.addEventListener('submit', handleSaveTask);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      if (unsubscribe) unsubscribe();
      
      unsubscribe = subscribeToTasks(user.uid, (tasks) => {
        allTasks = tasks;
        stateLoading.classList.add('hidden');
        renderTasks();
      });
    }
  });

  function openAddModal() {
    taskForm.reset();
    inputId.value = '';
    modalTitle.textContent = 'Add Task';
    
    // Set default deadline to today
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    inputDeadline.value = today;
    
    taskModal.classList.add('active');
  }

  function openEditModal(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    inputId.value = task.id;
    inputTitle.value = task.title || '';
    inputDesc.value = task.description || '';
    inputDeadline.value = task.deadline || '';
    inputPriority.value = task.priority || 'Medium';
    inputStatus.value = task.status || 'To Do';
    
    modalTitle.textContent = 'Edit Task';
    taskModal.classList.add('active');
  }

  function closeTaskModal() {
    taskModal.classList.remove('active');
  }

  function openDeleteModal(taskId) {
    taskToDelete = taskId;
    deleteModal.classList.add('active');
  }

  function closeDeleteModal() {
    taskToDelete = null;
    deleteModal.classList.remove('active');
  }

  async function handleSaveTask(e) {
    e.preventDefault();
    if (!currentUserId) return;

    const taskData = {
      title: inputTitle.value.trim(),
      description: inputDesc.value.trim(),
      deadline: inputDeadline.value,
      priority: inputPriority.value,
      status: inputStatus.value
    };

    if (!taskData.title || !taskData.deadline || !taskData.priority || !taskData.status) {
      showAlert('Please fill all required fields.', 'danger');
      return;
    }

    btnSaveTask.disabled = true;
    btnSaveTask.textContent = 'Saving...';

    try {
      if (inputId.value) {
        await updateTask(currentUserId, inputId.value, taskData);
        showAlert('Task updated successfully.');
      } else {
        await addTask(currentUserId, taskData);
        showAlert('Task created successfully.');
      }
      closeTaskModal();
    } catch (error) {
      console.error(error);
      showAlert('Failed to save task.', 'danger');
    } finally {
      btnSaveTask.disabled = false;
      btnSaveTask.textContent = 'Save Task';
    }
  }

  async function confirmDelete() {
    if (!currentUserId || !taskToDelete) return;
    const btn = document.getElementById('btn-confirm-delete');
    btn.disabled = true;
    
    try {
      await deleteTask(currentUserId, taskToDelete);
      showAlert('Task deleted.');
      closeDeleteModal();
    } catch (error) {
      console.error(error);
      showAlert('Failed to delete task.', 'danger');
    } finally {
      btn.disabled = false;
    }
  }

  function renderTasks() {
    if (allTasks.length === 0) {
      stateEmpty.classList.remove('hidden');
      tasksContainer.classList.add('hidden');
      return;
    }

    let filtered = [...allTasks];
    const query = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;
    const sort = sortBy.value;

    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    // Search
    if (query) {
      filtered = filtered.filter(t => 
        (t.title || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query)
      );
    }

    // Filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Overdue') {
        filtered = filtered.filter(t => t.deadline < todayStr && t.status !== 'Completed');
      } else {
        filtered = filtered.filter(t => t.status === statusFilter);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'deadline-asc') {
        return (a.deadline || '').localeCompare(b.deadline || '');
      } else if (sort === 'deadline-desc') {
        return (b.deadline || '').localeCompare(a.deadline || '');
      } else if (sort === 'priority') {
        const order = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      } else if (sort === 'recent') {
        // We can approximate recent by relying on Firestore's default ordering from subscribeToTasks
        // Or if we had strict timestamp parsing: return b.createdAt - a.createdAt.
        // since we just grabbed them ordered by createdAt desc from the db, it's mostly correct to leave as is,
        // but since we mutate the array let's do a simple id comparison or rely on original index
        return 0; // The base array is already recent. We should probably just not alter order here.
      }
      return 0;
    });
    
    // Sort logic patch for recent
    if(sort === 'recent') {
       // Since the db query returns recent first, we just reset from allTasks mapping
       // Wait, `filtered` is already a subset. Let's just rely on the original array order.
       const orderMap = new Map(allTasks.map((t, i) => [t.id, i]));
       filtered.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));
    }

    if (filtered.length === 0) {
      stateEmpty.classList.remove('hidden');
      tasksContainer.classList.add('hidden');
    } else {
      stateEmpty.classList.add('hidden');
      tasksContainer.classList.remove('hidden');
      tasksContainer.innerHTML = '';
      
      filtered.forEach(task => {
        const isOverdue = task.deadline < todayStr && task.status !== 'Completed';
        const isCompleted = task.status === 'Completed';
        
        let statusBadgeClass = 'badge-neutral';
        if (task.status === 'In Progress') statusBadgeClass = 'badge-warning';
        if (task.status === 'Completed') statusBadgeClass = 'badge-success';
        
        let priorityBadgeClass = 'badge-neutral';
        if (task.priority === 'High') priorityBadgeClass = 'badge-danger';
        if (task.priority === 'Medium') priorityBadgeClass = 'badge-primary';

        const el = document.createElement('div');
        el.className = 'card task-card';
        if (isCompleted) el.style.opacity = '0.7';

        el.innerHTML = `
          <div class="task-header">
            <h4 class="task-title" style="${isCompleted ? 'text-decoration: line-through;' : ''}">${escapeHtml(task.title)}</h4>
            <div style="display:flex; gap: 4px;">
              <span class="badge ${statusBadgeClass}">${escapeHtml(task.status)}</span>
              ${isOverdue ? '<span class="badge badge-danger">Overdue</span>' : ''}
            </div>
          </div>
          <p class="task-desc">${escapeHtml(task.description || 'No description.')}</p>
          <div class="task-footer">
            <div class="task-meta">
              <span class="badge ${priorityBadgeClass}">${escapeHtml(task.priority)}</span>
              <span>🕒 ${escapeHtml(task.deadline)}</span>
            </div>
            <div class="task-actions">
              <select class="quick-status form-control" style="padding: 0.35rem 0.75rem; font-size: 0.85rem; width: auto; height: auto;">
                <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
                <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
              <button class="btn btn-secondary btn-sm btn-edit-task">Edit</button>
              <button class="btn btn-outline-danger btn-sm btn-delete-task">Delete</button>
            </div>
          </div>
        `;

        el.querySelector('.btn-edit-task').addEventListener('click', () => openEditModal(task.id));
        el.querySelector('.btn-delete-task').addEventListener('click', () => openDeleteModal(task.id));
        
        const quickStatus = el.querySelector('.quick-status');
        quickStatus.addEventListener('change', async (e) => {
          quickStatus.disabled = true;
          try {
             await updateTask(currentUserId, task.id, { status: e.target.value });
             showAlert('Status updated.');
          } catch(err) {
             showAlert('Failed to update status.', 'danger');
             quickStatus.value = task.status; // Revert
          } finally {
             quickStatus.disabled = false;
          }
        });

        tasksContainer.appendChild(el);
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
