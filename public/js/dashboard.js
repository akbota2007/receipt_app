/**
 * Global Constants & Variables
 */
const API_URL = window.location.origin + '/api';
let receipts = [];
let editingReceiptId = null;
let currentBaseCurrency = 'KZT'; // Валюта отображения по умолчанию

// Статичные курсы валют (соответствуют бэкенду)
const EXCHANGE_RATES = {
  KZT: 1,
  USD: 450,
  EUR: 485,
  RUB: 5
};

// Global chart instances
let categoryChart = null;
let merchantChart = null;

/**
 * Authentication & Navigation
 */
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
}

const user = JSON.parse(localStorage.getItem('user'));

// Set user info
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').src = user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff`;

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

document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';

  if (receipts.length > 0) updateCharts();
});

/**
 * Data Visualization (Charts)
 */
function updateCharts() {
  const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
  const merchantCtx = document.getElementById('merchantChart')?.getContext('2d');

  if (!categoryCtx || !merchantCtx) return;

  // Группировка по категориям С КОНВЕРТАЦИЕЙ в выбранную базовую валюту
  const categoryTotals = receipts.reduce((acc, r) => {
    const rateToKZT = EXCHANGE_RATES[r.currency] || 1;
    const amountInKZT = r.amount * rateToKZT;
    const amountInBase = amountInKZT / EXCHANGE_RATES[currentBaseCurrency];

    acc[r.category] = (acc[r.category] || 0) + amountInBase;
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
      plugins: {
        legend: {
          position: 'right',
          labels: { color: getComputedStyle(document.body).getPropertyValue('--text-main') }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${formatCurrency(context.raw, currentBaseCurrency)}`;
            }
          }
        }
      }
    }
  });

  // Топ-5 Мерчантов С КОНВЕРТАЦИЕЙ в выбранную базовую валюту
  const merchantTotals = receipts.reduce((acc, r) => {
    const rateToKZT = EXCHANGE_RATES[r.currency] || 1;
    const amountInBase = (r.amount * rateToKZT) / EXCHANGE_RATES[currentBaseCurrency];
    acc[r.merchant] = (acc[r.merchant] || 0) + amountInBase;
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
        label: `Spent (${currentBaseCurrency})`,
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
 * UI Helpers
 */
function showAlert(message, type = 'success') {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;
  setTimeout(() => alert.classList.remove('show'), 5000);
}

function formatCurrency(amount, currency = 'KZT') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount);
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

/**
 * Исправленная функция updateStats с динамической логикой бюджета
 */
function updateStats(data) {
  // Получаем бюджет из localStorage или используем дефолтный
  const monthlyBudgetKZT = parseInt(localStorage.getItem('monthlyBudget')) || 200000;

  document.getElementById('totalReceipts').textContent = data.count;

  // 1. Общий баланс в выбранной валюте
  const totalInBase = (data.totalAmount || 0) / EXCHANGE_RATES[currentBaseCurrency];
  document.getElementById('totalAmount').textContent = formatCurrency(totalInBase, currentBaseCurrency);

  // 2. Расчет за текущий месяц (в KZT для логики бюджета)
  const now = new Date();
  const thisMonthTotalKZT = receipts
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, r) => {
        const rate = EXCHANGE_RATES[r.currency] || 1;
        return sum + (r.amount * rate);
      }, 0);

  // Показываем "This Month" в выбранной валюте
  const thisMonthInBase = thisMonthTotalKZT / EXCHANGE_RATES[currentBaseCurrency];
  document.getElementById('thisMonth').textContent = formatCurrency(thisMonthInBase, currentBaseCurrency);

  // --- ЛОГИКА БЮДЖЕТА ---
  const percent = Math.min((thisMonthTotalKZT / monthlyBudgetKZT) * 100, 100);
  const progressBar = document.getElementById('budgetProgressBar');
  const budgetPercent = document.getElementById('budgetPercent');

  if (progressBar && budgetPercent) {
    progressBar.style.width = `${percent}%`;
    budgetPercent.textContent = `${Math.round((thisMonthTotalKZT / monthlyBudgetKZT) * 100)}%`;

    // Смена цвета
    if (percent > 90) progressBar.style.backgroundColor = '#ef4444';
    else if (percent > 70) progressBar.style.backgroundColor = '#f59e0b';
    else progressBar.style.backgroundColor = '#10b981';

    // Текстовые подписи бюджета
    const limitInBase = monthlyBudgetKZT / EXCHANGE_RATES[currentBaseCurrency];
    document.getElementById('budgetSpentText').textContent = `Spent: ${formatCurrency(thisMonthInBase, currentBaseCurrency)}`;
    document.getElementById('budgetLimitText').textContent = `Limit: ${formatCurrency(limitInBase, currentBaseCurrency)} ⚙️`;
  }
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
        ${r.imageUrl ? `
          <img src="${r.imageUrl}" alt="${r.title}" class="receipt-image" onerror="this.src='https://via.placeholder.com/300x180?text=Receipt'">
        ` : `
          <div class="receipt-image" style="display: flex; align-items: center; justify-content: center; font-size: 3rem; background: var(--purple-grad); color: white;">📄</div>
        `}
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
 * Modal Handling
 */
function openModal() {
  editingReceiptId = null;
  document.getElementById('modalTitle').textContent = 'Add Receipt';
  document.getElementById('receiptForm').reset();
  document.getElementById('date').valueAsDate = new Date();
  document.getElementById('receiptModal').classList.add('show');
}

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('receiptModal').classList.remove('show');
});

document.getElementById('addReceiptBtn').addEventListener('click', openModal);

/**
 * Form Submission
 */
document.getElementById('receiptForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('merchant', document.getElementById('merchant').value);
  formData.append('amount', document.getElementById('amount').value);
  formData.append('currency', document.getElementById('currency').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('date', document.getElementById('date').value);
  formData.append('paymentMethod', document.getElementById('paymentMethod').value);
  formData.append('description', document.getElementById('description').value);

  const imageFile = document.getElementById('imageFile').files[0];
  if (imageFile) formData.append('image', imageFile);
  else formData.append('imageUrl', document.getElementById('imageUrl').value);

  const url = editingReceiptId ? `${API_URL}/receipts/${editingReceiptId}` : `${API_URL}/receipts`;
  const method = editingReceiptId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if ((await response.json()).success) {
      document.getElementById('receiptModal').classList.remove('show');
      fetchReceipts();
      showAlert(editingReceiptId ? 'Receipt updated!' : 'Receipt added!');
    }
  } catch (err) { showAlert('Server error occurred', 'danger'); }
});

/**
 * Edit, Delete, Like
 */
async function editReceipt(id) {
  try {
    const res = await fetch(`${API_URL}/receipts/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      const r = data.data;
      editingReceiptId = id;
      document.getElementById('modalTitle').textContent = 'Edit Receipt';
      document.getElementById('title').value = r.title;
      document.getElementById('merchant').value = r.merchant;
      document.getElementById('amount').value = r.amount;
      document.getElementById('currency').value = r.currency;
      document.getElementById('category').value = r.category;
      document.getElementById('date').value = r.date.split('T')[0];
      document.getElementById('paymentMethod').value = r.paymentMethod;
      document.getElementById('description').value = r.description || '';
      document.getElementById('imageUrl').value = r.imageUrl || '';
      document.getElementById('receiptModal').classList.add('show');
    }
  } catch (err) { showAlert('Failed to load receipt', 'danger'); }
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

/**
 * Events
 */
document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
document.getElementById('categoryFilter').addEventListener('change', fetchReceipts);
document.getElementById('startDate').addEventListener('change', fetchReceipts);
document.getElementById('endDate').addEventListener('change', fetchReceipts);

document.getElementById('baseCurrencySelector').addEventListener('change', (e) => {
  currentBaseCurrency = e.target.value;
  const totalKZT = receipts.reduce((sum, r) => sum + (r.amount * (EXCHANGE_RATES[r.currency] || 1)), 0);
  updateStats({ count: receipts.length, totalAmount: totalKZT });
  updateCharts();
});

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchReceipts, 500);
});

function exportToCSV() {
  if (receipts.length === 0) return showAlert('No data to export', 'danger');
  const headers = ['Title', 'Merchant', 'Amount', 'Currency', 'Category', 'Date'];
  const rows = receipts.map(r => [`"${r.title}"`, `"${r.merchant}"`, r.amount, r.currency, `"${r.category}"`, r.date]);
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'receipts.csv';
  a.click();
}

fetchReceipts();