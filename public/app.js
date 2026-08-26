const form = document.querySelector('#search-form');
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

function renderOrders(orders) {
  ordersBody.replaceChildren(...orders.map((order) => {
    const row = document.createElement('tr');
    const values = [
      order.id,
      order.customerName,
      order.status,
      `$${Number(order.total).toFixed(2)}`,
      new Date(order.createdAt).toLocaleString()
    ];

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
    return row;
  }));
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
checkHealth();
