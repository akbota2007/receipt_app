/**
 * Global Constants & Variables
 */
const API_URL = window.location.origin + '/api';
let receipts = [];
let editingReceiptId = null;

// Global chart instances for Chart.js
let categoryChart = null;
let merchantChart = null;

/**
 * Authentication & Navigation Logic
 */
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
}

const user = JSON.parse(localStorage.getItem('user'));

// Set user info
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').src = user.avatar;

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

/**
 * Dark Mode Logic
 */
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';

// Apply theme on initial load
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';

  // Refresh charts to adapt to new theme if needed
  if (receipts.length > 0) updateCharts();
});

/**
 * Data Visualization Logic (Charts)
 */
function updateCharts() {
  const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
  const merchantCtx = document.getElementById('merchantChart')?.getContext('2d');

  if (!categoryCtx || !merchantCtx) return;

  // 1. Category Doughnut Chart
  const categoryTotals = receipts.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {});

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-main') } } }
    }
  });

  // 2. Top 5 Merchants Bar Chart
  const merchantTotals = receipts.reduce((acc, r) => {
    acc[r.merchant] = (acc[r.merchant] || 0) + r.amount;
    return acc;
  }, {});

  const sortedMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  if (merchantChart) merchantChart.destroy();
  merchantChart = new Chart(merchantCtx, {
    type: 'bar',
    data: {
      labels: sortedMerchants.map(m => m[0]),
      datasets: [{
        label: 'Spent (KZT)',
        data: sortedMerchants.map(m => m[1]),
        backgroundColor: '#667eea',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } },
        x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

/**
 * Export Logic
 */
function exportToCSV() {
  if (receipts.length === 0) {
    showAlert('No data to export', 'danger');
    return;
  }

  const headers = ['Title', 'Merchant', 'Amount', 'Currency', 'Category', 'Date', 'Payment Method'];
  const rows = receipts.map(r => [
    `"${r.title}"`, `"${r.merchant}"`, r.amount, r.currency, `"${r.category}"`,
    new Date(r.date).toLocaleDateString(), `"${r.paymentMethod}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `receipts_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showAlert('Export successful!', 'success');
}

/**
 * UI Helper Functions
 */
function showAlert(message, type = 'success') {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;
  setTimeout(() => alert.classList.remove('show'), 5000);
}

function formatCurrency(amount, currency = 'KZT') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getCategoryClass(category) {
  return 'category-' + category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
}

/**
 * API Communication
 */
async function fetchReceipts() {
  try {
    const { category, startDate, endDate, search } = getFilters();
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (search) params.append('search', search);

    const response = await fetch(`${API_URL}/receipts?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
      receipts = data.data;
      updateStats(data);
      renderReceipts();
      updateCharts();
    } else {
      showAlert(data.message || 'Error loading receipts', 'danger');
    }
  } catch (error) {
    showAlert('Server connection failed', 'danger');
  }
}

function getFilters() {
  return {
    category: document.getElementById('categoryFilter').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    search: document.getElementById('searchInput').value
  };
}

function updateStats(data) {
  document.getElementById('totalReceipts').textContent = data.count;
  document.getElementById('totalAmount').textContent = formatCurrency(data.totalAmount || 0);

  const now = new Date();
  const thisMonthTotal = receipts
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, r) => sum + r.amount, 0);
  document.getElementById('thisMonth').textContent = formatCurrency(thisMonthTotal);
}

function renderReceipts() {
  const container = document.getElementById('receiptsContainer');
  if (receipts.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No receipts found</h3><button class="btn btn-primary" onclick="openModal()">Add Receipt</button></div>`;
    return;
  }

  container.innerHTML = `<div class="receipts-grid">
    ${receipts.map(r => `
      <div class="receipt-card">
        <div class="receipt-content">
          <div class="receipt-header">
            <div><div class="receipt-title">${r.title}</div><div class="receipt-merchant">${r.merchant}</div></div>
            <div class="receipt-amount">${formatCurrency(r.amount, r.currency)}</div>
          </div>
          <div class="receipt-details">
            <span class="category-badge ${getCategoryClass(r.category)}">${r.category}</span>
            <span class="receipt-detail-value">${formatDate(r.date)}</span>
          </div>
          <div class="receipt-actions">
            <button class="icon-btn like ${r.likedBy?.includes(user.id) ? 'liked' : ''}" onclick="toggleLike('${r._id}')">
              ${r.likedBy?.includes(user.id) ? '❤️' : '🤍'}
            </button>
            <button class="icon-btn edit" onclick="editReceipt('${r._id}')">✏️</button>
            <button class="icon-btn delete" onclick="deleteReceipt('${r._id}')">🗑️</button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

/**
 * Modal & Event Listeners
 */
function openModal() {
  document.getElementById('receiptModal').classList.add('show');
  document.getElementById('receiptForm').reset();
  editingReceiptId = null;
  document.getElementById('date').valueAsDate = new Date();
}

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('receiptModal').classList.remove('show');
});

document.getElementById('addReceiptBtn').addEventListener('click', openModal);
document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);

document.getElementById('receiptForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {
    title: document.getElementById('title').value,
    merchant: document.getElementById('merchant').value,
    amount: parseFloat(document.getElementById('amount').value),
    currency: document.getElementById('currency').value,
    category: document.getElementById('category').value,
    date: document.getElementById('date').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    description: document.getElementById('description').value,
    imageUrl: document.getElementById('imageUrl').value
  };

  const url = editingReceiptId ? `${API_URL}/receipts/${editingReceiptId}` : `${API_URL}/receipts`;
  const method = editingReceiptId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formData)
  });

  if ((await response.json()).success) {
    document.getElementById('receiptModal').classList.remove('show');
    fetchReceipts();
  }
});

async function editReceipt(id) {
  const res = await fetch(`${API_URL}/receipts/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await res.json();
  if (data.success) {
    const r = data.data;
    editingReceiptId = id;
    document.getElementById('modalTitle').textContent = 'Edit Receipt';
    document.getElementById('title').value = r.title;
    document.getElementById('merchant').value = r.merchant;
    document.getElementById('amount').value = r.amount;
    document.getElementById('category').value = r.category;
    document.getElementById('date').value = r.date.split('T')[0];
    document.getElementById('receiptModal').classList.add('show');
  }
}

async function deleteReceipt(id) {
  if (confirm('Delete this receipt?')) {
    await fetch(`${API_URL}/receipts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchReceipts();
  }
}

async function toggleLike(id) {
  await fetch(`${API_URL}/receipts/${id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  fetchReceipts();
}

document.getElementById('categoryFilter').addEventListener('change', fetchReceipts);
document.getElementById('startDate').addEventListener('change', fetchReceipts);
document.getElementById('endDate').addEventListener('change', fetchReceipts);

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchReceipts, 500);
});

fetchReceipts();