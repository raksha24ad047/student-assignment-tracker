'use strict';

const API_URL = '/api/assignments';
let assignments = [];
let toastTimer;

const $ = (id) => document.getElementById(id);
const form = $('assignmentForm');
const assignmentList = $('assignmentList');
const formMessage = $('formMessage');
const searchInput = $('searchInput');
const statusFilter = $('statusFilter');
const priorityFilter = $('priorityFilter');

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateAtMidnight(dateString) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateString) {
  if (!dateString) return 'No due date';
  const date = dateAtMidnight(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateState(assignment) {
  if (assignment.status === 'Completed') return { label: 'Completed', className: 'date-completed' };
  const today = localDateString();
  if (assignment.dueDate < today) return { label: 'Overdue', className: 'date-overdue' };
  if (assignment.dueDate === today) return { label: 'Due today', className: 'date-today' };
  const days = Math.round((dateAtMidnight(assignment.dueDate) - dateAtMidnight(today)) / 86400000);
  if (days <= 3) return { label: days === 1 ? 'Due tomorrow' : `Due in ${days} days`, className: 'date-soon' };
  return { label: 'Upcoming', className: 'date-upcoming' };
}

async function apiRequest(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
  } catch {
    throw new Error('Could not connect to the server. Start the app with “npm start” and open http://localhost:5000.');
  }
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'Something went wrong. Please try again.');
  return data;
}

async function loadAssignments() {
  assignmentList.innerHTML = '<div class="loading-state">Loading your assignments…</div>';
  try {
    assignments = await apiRequest(API_URL);
    renderDashboard();
    renderAssignments();
  } catch (error) {
    assignmentList.innerHTML = '';
    const state = document.createElement('div');
    state.className = 'empty-state error-state';
    const title = document.createElement('h3');
    title.textContent = 'We couldn’t load your assignments';
    const description = document.createElement('p');
    description.textContent = error.message;
    const retry = document.createElement('button');
    retry.className = 'button button-primary';
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', loadAssignments);
    state.append(title, description, retry);
    assignmentList.append(state);
  }
}

function renderDashboard() {
  const total = assignments.length;
  const completed = assignments.filter(item => item.status === 'Completed').length;
  const pending = total - completed;
  const today = localDateString();
  const overdue = assignments.filter(item => item.status === 'Pending' && item.dueDate < today).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  $('totalAssignments').textContent = total;
  $('pendingAssignments').textContent = pending;
  $('completedAssignments').textContent = completed;
  $('overdueAssignments').textContent = overdue;
  $('completionFoot').textContent = total ? `${total - completed} left to go` : 'Your wins will show up here';
  $('progressPercent').textContent = `${percent}%`;
  $('progressFill').style.width = `${percent}%`;
  $('progressCaption').textContent = total ? `${completed} of ${total} assignment${total === 1 ? '' : 's'} completed. Keep going at your own pace.` : 'Add your first assignment to start tracking your progress.';
  $('summaryText').textContent = total ? `${pending} assignment${pending === 1 ? '' : 's'} left to tackle${overdue ? ` · ${overdue} overdue` : ''}. You’ve got this.` : 'Your assignments, all in one place.';
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderAssignments() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const status = statusFilter.value;
  const priority = priorityFilter.value;
  const filtered = assignments.filter(item => {
    const searchable = `${item.subject} ${item.title} ${item.notes || ''}`.toLocaleLowerCase();
    return searchable.includes(query) && (status === 'All' || item.status === status) && (priority === 'All' || item.priority === priority);
  });

  $('visibleCount').textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
  assignmentList.replaceChildren();
  if (!filtered.length) {
    const empty = makeElement('div', 'empty-state');
    const icon = makeElement('div', 'empty-icon', query || status !== 'All' || priority !== 'All' ? '⌕' : '✦');
    const heading = makeElement('h3', '', query || status !== 'All' || priority !== 'All' ? 'No matching assignments' : 'A fresh start');
    const message = makeElement('p', '', query || status !== 'All' || priority !== 'All' ? 'Try a different search or clear your filters.' : 'Add an assignment to make your plan feel a little clearer.');
    empty.append(icon, heading, message);
    assignmentList.append(empty);
    return;
  }

  filtered.forEach(item => assignmentList.append(createAssignmentCard(item)));
}

function createAssignmentCard(item) {
  const card = makeElement('article', `assignment-card${item.status === 'Completed' ? ' is-completed' : ''}`);
  const check = makeElement('button', `completion-toggle${item.status === 'Completed' ? ' checked' : ''}`);
  check.type = 'button';
  check.setAttribute('aria-label', item.status === 'Completed' ? `Mark ${item.title} as in progress` : `Mark ${item.title} as completed`);
  check.textContent = item.status === 'Completed' ? '✓' : '';
  check.addEventListener('click', () => toggleStatus(item));

  const body = makeElement('div', 'assignment-main');
  const top = makeElement('div', 'assignment-title-row');
  const title = makeElement('h3', 'assignment-title', item.title);
  const priorityBadge = makeElement('span', `priority-badge priority-${item.priority.toLowerCase()}`, item.priority);
  top.append(title, priorityBadge);
  const subject = makeElement('p', 'assignment-subject', item.subject);
  body.append(top, subject);
  if (item.notes) body.append(makeElement('p', 'assignment-notes', item.notes));

  const meta = makeElement('div', 'assignment-meta');
  const due = makeElement('span', `due-label ${dateState(item).className}`);
  due.textContent = `◷ ${formatDate(item.dueDate)} · ${dateState(item).label}`;
  meta.append(due);
  const actions = makeElement('div', 'card-actions');
  const edit = makeElement('button', 'icon-button', 'Edit');
  edit.type = 'button';
  edit.setAttribute('aria-label', `Edit ${item.title}`);
  edit.addEventListener('click', () => startEditing(item));
  const remove = makeElement('button', 'icon-button delete-button', 'Delete');
  remove.type = 'button';
  remove.setAttribute('aria-label', `Delete ${item.title}`);
  remove.addEventListener('click', () => deleteAssignment(item));
  actions.append(edit, remove);
  card.append(check, body, meta, actions);
  return card;
}

function showToast(message, type = 'success') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast visible ${type === 'error' ? 'toast-error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

function resetForm() {
  form.reset();
  $('editingId').value = '';
  $('formHeading').textContent = 'Add an assignment';
  $('saveButton').textContent = '＋ Add assignment';
  $('cancelEditButton').classList.add('hidden');
  $('notesCount').textContent = '0';
  formMessage.textContent = '';
  $('dueDate').value = '';
}

function startEditing(item) {
  $('editingId').value = item.id;
  $('subject').value = item.subject;
  $('title').value = item.title;
  $('dueDate').value = item.dueDate;
  $('priority').value = item.priority;
  $('notes').value = item.notes || '';
  $('notesCount').textContent = String(($('notes').value).length);
  $('formHeading').textContent = 'Edit assignment';
  $('saveButton').textContent = 'Save changes';
  $('cancelEditButton').classList.remove('hidden');
  formMessage.textContent = '';
  $('add-assignment').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('subject').focus({ preventScroll: true });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  formMessage.textContent = '';
  const editingId = $('editingId').value;
  const payload = {
    subject: $('subject').value.trim(),
    title: $('title').value.trim(),
    dueDate: $('dueDate').value,
    priority: $('priority').value,
    notes: $('notes').value.trim()
  };
  if (!payload.subject || !payload.title || !payload.dueDate) {
    formMessage.textContent = 'Please fill in the subject, title, and due date.';
    return;
  }
  const button = $('saveButton');
  button.disabled = true;
  button.textContent = editingId ? 'Saving…' : 'Adding…';
  try {
    await apiRequest(editingId ? `${API_URL}/${editingId}` : API_URL, {
      method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload)
    });
    resetForm();
    await loadAssignments();
    showToast(editingId ? 'Assignment updated!' : 'Assignment added to your plan!');
  } catch (error) {
    formMessage.textContent = error.message;
    showToast(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = $('editingId').value ? 'Save changes' : '＋ Add assignment';
  }
});

async function toggleStatus(item) {
  try {
    await apiRequest(`${API_URL}/${item.id}`, { method: 'PUT', body: JSON.stringify({ status: item.status === 'Completed' ? 'Pending' : 'Completed' }) });
    await loadAssignments();
    showToast(item.status === 'Completed' ? 'Moved back to in progress.' : 'One more win. Assignment completed!');
  } catch (error) { showToast(error.message, 'error'); }
}

async function deleteAssignment(item) {
  if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
  try {
    await apiRequest(`${API_URL}/${item.id}`, { method: 'DELETE' });
    if ($('editingId').value === String(item.id)) resetForm();
    await loadAssignments();
    showToast('Assignment deleted.');
  } catch (error) { showToast(error.message, 'error'); }
}

function exportCSV() {
  if (!assignments.length) { showToast('There are no assignments to export yet.', 'error'); return; }
  const headers = ['Subject', 'Assignment', 'Due date', 'Priority', 'Status', 'Notes'];
  const rows = assignments.map(item => [item.subject, item.title, item.dueDate, item.priority, item.status, item.notes || '']);
  const escapeCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `studyflow-assignments-${localDateString()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Your CSV export is ready.');
}

searchInput.addEventListener('input', renderAssignments);
statusFilter.addEventListener('change', renderAssignments);
priorityFilter.addEventListener('change', renderAssignments);
$('clearFiltersButton').addEventListener('click', () => {
  searchInput.value = '';
  statusFilter.value = 'All';
  priorityFilter.value = 'All';
  renderAssignments();
});
$('exportButton').addEventListener('click', exportCSV);
$('cancelEditButton').addEventListener('click', resetForm);
$('notes').addEventListener('input', () => { $('notesCount').textContent = String($('notes').value.length); });
$('todayLabel').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

loadAssignments();
