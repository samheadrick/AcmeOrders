const form = document.querySelector('#search-form');
const importForm = document.querySelector('#import-form');
const orderUrlInput = document.querySelector('#order-url');
const customerNameInput = document.querySelector('#customer-name');
const ordersBody = document.querySelector('#orders-body');
const message = document.querySelector('#message');
const resultCount = document.querySelector('#result-count');
const health = document.querySelector('.health');
const healthLabel = document.querySelector('#health-label');

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function formatNote(note) {
  let formatted = escapeHtml(note);
  formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  return formatted.replace(/\n/g, '<br>');
}

function renderOrders(orders) {
  ordersBody.replaceChildren(...orders.map((order) => {
    const row = document.createElement('tr');
    const values = [order.id, order.customerName, order.status, `$${Number(order.total).toFixed(2)}`, new Date(order.createdAt).toLocaleString()];

    values.forEach((value, index) => {
      const cell = document.createElement('td');
      if (index === 2) {
        const status = document.createElement('span');
        status.className = 'status';
        status.textContent = value;
        cell.append(status);
      } else {
        cell.textContent = value;
      }
      row.append(cell);
    });

    const noteCell = document.createElement('td');
    const noteForm = document.createElement('form');
    noteForm.className = 'note-form';
    const noteInput = document.createElement('textarea');
    noteInput.rows = 2;
    noteInput.maxLength = 1000;
    noteInput.placeholder = '**bold** *italic* [link](https://...)';
    noteInput.value = order.notes || '';
    noteInput.setAttribute('aria-label', `Note for ${order.id}`);
    const notePreview = document.createElement('div');
    notePreview.className = 'note-preview';
    notePreview.setAttribute('aria-label', `Formatted preview for ${order.id}`);
    notePreview.innerHTML = formatNote(noteInput.value) || 'Preview appears here';
    noteInput.addEventListener('input', () => {
      notePreview.innerHTML = formatNote(noteInput.value) || 'Preview appears here';
    });
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Save';
    noteForm.append(noteInput, notePreview, saveButton);
    noteForm.addEventListener('submit', (event) => saveNote(event, order.id, noteInput, saveButton));
    noteCell.append(noteForm);
    row.append(noteCell);
    return row;
  }));
}

async function saveNote(event, orderId, noteInput, saveButton) {
  event.preventDefault();
  saveButton.disabled = true;
  saveButton.textContent = 'Saving';
  try {
    const response = await fetch(`/orders/${encodeURIComponent(orderId)}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteInput.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to save note');
    noteInput.value = result.data.notes;
    noteInput.dispatchEvent(new Event('input'));
    setMessage('Note saved.');
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save';
  }
}

async function searchOrders(event) {
  event.preventDefault();
  const customerName = customerNameInput.value.trim();
  if (!customerName) return;

  setMessage('Searching orders...');
  resultCount.textContent = 'Searching';
  try {
    const response = await fetch(`/orders/search?customerName=${encodeURIComponent(customerName)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to search orders');

    renderOrders(result.data);
    resultCount.textContent = `${result.count} ${result.count === 1 ? 'order' : 'orders'}`;
    setMessage(result.count ? '' : 'No orders found for that customer.');
  } catch (error) {
    ordersBody.replaceChildren();
    resultCount.textContent = 'Search failed';
    setMessage(error.message, true);
  }
}

async function importOrder(event) {
  event.preventDefault();
  const url = orderUrlInput.value.trim();
  if (!url) return;

  setMessage('Importing order...');
  try {
    const response = await fetch('/orders/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to import order');
    setMessage(`Order ${result.data.id} imported successfully.`);
    orderUrlInput.value = '';
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function checkHealth() {
  try {
    const response = await fetch('/health');
    if (!response.ok) throw new Error('Health check failed');
    health.classList.add('is-healthy');
    healthLabel.textContent = 'System operational';
  } catch {
    health.classList.add('is-unhealthy');
    healthLabel.textContent = 'System unavailable';
  }
}

form.addEventListener('submit', searchOrders);
importForm.addEventListener('submit', importOrder);
checkHealth();
