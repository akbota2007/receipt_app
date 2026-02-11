const API_URL = window.location.origin + '/api';
let receipts = [];
let editingReceiptId = null;
let currentView = 'all';

const EXCHANGE_RATES = {
  KZT: 1,
  USD: 450,
  EUR: 485
};

let categoryChart = null;
let merchantChart = null;
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
}

const user = JSON.parse(localStorage.getItem('user'));
if (user.role === 'admin') {
  const navMenu = document.querySelector('.nav-menu');

  const adminBtn = document.createElement('a');
  adminBtn.href = '/admin';
  adminBtn.textContent = '🛠 Admin Panel';
  adminBtn.className = 'btn btn-secondary btn-small';
  adminBtn.style.marginRight = '10px';

  navMenu.prepend(adminBtn);
}
let currentBaseCurrency = user.defaultCurrency || 'KZT';
if (document.getElementById('userName')) {
  document.getElementById('userName').textContent = user.username;
}
const currencySelector = document.getElementById('baseCurrencySelector');
if (currencySelector) {
  currencySelector.value = currentBaseCurrency;
}

const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';

document.documentElement.setAttribute('data-theme', savedTheme);
if (themeToggle) {
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';

    if (receipts.length > 0) updateCharts();
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
}

function updateCharts() {
  const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
  const merchantCtx = document.getElementById('merchantChart')?.getContext('2d');

  if (!categoryCtx || !merchantCtx) return;

  const categoryTotals = receipts.reduce((acc, r) => {
    const rateToKZT = EXCHANGE_RATES[r.currency] || 1;
    const amountInBase = (r.amount * rateToKZT) / EXCHANGE_RATES[currentBaseCurrency];
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
            label: (context) => ` ${context.label}: ${formatCurrency(context.raw, currentBaseCurrency)}`
          }
        }
      }
    }
  });

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

function showAlert(message, type = 'success') {
  const alert = document.getElementById('alert');
  if (!alert) return;
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

async function fetchReceipts() {
  try {
    const filters = getFilters();
    const params = new URLSearchParams(filters);

    const response = await fetch(`${API_URL}/receipts?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
      receipts = data.data;
      updateStats(data);
      renderReceipts();
      updateCharts();
      generateSmartInsight(receipts);
    } else {
      showAlert(data.message || 'Error loading receipts', 'danger');
    }
  } catch (error) {
    showAlert('Server connection failed', 'danger');
  }
}

function getFilters() {
  return {
    category: document.getElementById('categoryFilter')?.value || '',
    startDate: document.getElementById('startDate')?.value || '',
    endDate: document.getElementById('endDate')?.value || '',
    search: document.getElementById('searchInput')?.value || ''
  };
}

function updateStats(data) {
  const monthlyBudgetKZT = user.budget > 0 ? user.budget : 200000;
  const totalInBase = (data.totalAmount || 0) / EXCHANGE_RATES[currentBaseCurrency];
  document.getElementById('totalReceipts').textContent = data.count;
  document.getElementById('totalAmount').textContent = formatCurrency(totalInBase, currentBaseCurrency);

  const now = new Date();
  const thisMonthTotalKZT = receipts
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, r) => sum + (r.amount * (EXCHANGE_RATES[r.currency] || 1)), 0);

  const thisMonthInBase = thisMonthTotalKZT / EXCHANGE_RATES[currentBaseCurrency];
  document.getElementById('thisMonth').textContent = formatCurrency(thisMonthInBase, currentBaseCurrency);

  const percent = Math.min((thisMonthTotalKZT / monthlyBudgetKZT) * 100, 100);
  const progressBar = document.getElementById('budgetProgressBar');
  const budgetPercent = document.getElementById('budgetPercent');
  if (user.role === 'admin') {
    document.querySelector('h1').textContent = 'System Receipts';
  }

  if (progressBar && budgetPercent) {
    progressBar.style.width = `${percent}%`;
    budgetPercent.textContent = `${Math.round((thisMonthTotalKZT / monthlyBudgetKZT) * 100)}%`;

    if (percent > 90) progressBar.style.backgroundColor = '#ef4444';
    else if (percent > 70) progressBar.style.backgroundColor = '#f59e0b';
    else progressBar.style.backgroundColor = '#10b981';

    const limitInBase = monthlyBudgetKZT / EXCHANGE_RATES[currentBaseCurrency];
    document.getElementById('budgetSpentText').textContent = `Spent: ${formatCurrency(thisMonthInBase, currentBaseCurrency)}`;
    document.getElementById('budgetLimitText').textContent = `Limit: ${formatCurrency(limitInBase, currentBaseCurrency)} ⚙️`;
  }
}

function renderReceipts() {
  const container = document.getElementById('receiptsContainer');
  if (!container) return;

  let visibleReceipts = receipts;

  if (currentView === 'favorites') {
    visibleReceipts = receipts.filter(r =>
      r.likedBy?.includes(user.id)
    );
  }

  if (visibleReceipts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No favorite receipts yet ❤️</h3>
        <p>Tap the heart icon to add receipts to favorites</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="receipts-grid">
      ${visibleReceipts.map(r => `
        <div class="receipt-card">
          ${r.imageUrl
            ? `<img src="${r.imageUrl}" class="receipt-image">`
            : `<div class="receipt-image">📄</div>`}
          
          <div class="receipt-content">
            <div class="receipt-header">
            <div>
            <div class="receipt-title">${r.title}</div>
            <div class="receipt-merchant">${r.merchant}</div>
            ${user.role === 'admin' && r.user ? `
              <div style="font-size:12px; color:#ef4444;">
              Owner: ${r.user.username || r.user}
              </div>
              ` : ''}
              </div>
              <div class="receipt-amount">${formatCurrency(r.amount, r.currency)}</div>
              </div>

            <div class="receipt-details">
              <span class="category-badge ${getCategoryClass(r.category)}">${r.category}</span>
              <span>${formatDate(r.date)}</span>
            </div>

            <div class="receipt-actions">
              <button class="icon-btn like ${r.likedBy?.includes(user.id) ? 'liked' : ''}"
                onclick="toggleLike('${r._id}')">
                ${r.likedBy?.includes(user.id) ? '❤️' : '🤍'}
              </button>
              <button class="icon-btn edit" onclick="editReceipt('${r._id}')">✏️</button>
              <button class="icon-btn delete" onclick="deleteReceipt('${r._id}')">🗑️</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

function validateDateRange() {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (!startDate || !endDate) {
    clearDateError();
    return true;
  }

  if (startDate > endDate) {
    showDateError('From Date cannot be later than To Date');
    return false;
  }

  clearDateError();
  return true;
}

function showDateError(message) {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = 'alert alert-danger';
  alert.style.display = 'block';
}

function clearDateError() {
  const alert = document.getElementById('alert');
  alert.style.display = 'none';
}

startDateInput.addEventListener('change', validateDateRange);
endDateInput.addEventListener('change', validateDateRange);

function openModal() {
  editingReceiptId = null;
  const modal = document.getElementById('receiptModal');
  const form = document.getElementById('receiptForm');
  if (modal && form) {
    document.getElementById('modalTitle').textContent = 'Add Receipt';
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    modal.classList.add('show');
  }
}

document.getElementById('closeModal')?.addEventListener('click', () => {
  document.getElementById('receiptModal')?.classList.remove('show');
});

document.getElementById('addReceiptBtn')?.addEventListener('click', openModal);

document.getElementById('receiptForm')?.addEventListener('submit', async (e) => {
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
    const result = await response.json();
    if (result.success) {
      document.getElementById('receiptModal').classList.remove('show');
      fetchReceipts();
      showAlert(editingReceiptId ? 'Receipt updated!' : 'Receipt added!');
    }
  } catch (err) { showAlert('Error saving receipt', 'danger'); }
});

document.getElementById('allTab')?.addEventListener('click', () => {
  currentView = 'all';
  setActiveTab('allTab');
  renderReceipts();
});

document.getElementById('favoritesTab')?.addEventListener('click', () => {
  currentView = 'favorites';
  setActiveTab('favoritesTab');
  renderReceipts();
});

function setActiveTab(id) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function editReceipt(id) {
  try {
    console.log("EDIT ID:", id);

    const res = await fetch(`${API_URL}/receipts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error('Backend returned success = false');
    }

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

    document.getElementById('receiptModal').classList.add('show');
  } catch (err) {
    console.error("EDIT ERROR:", err.message);
    showAlert(`Error loading details`, 'danger');
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
function generateSmartInsight(receipts) {
  if (!receipts || receipts.length === 0) return;

  let total = 0;
  const categoryTotals = {};

  receipts.forEach(r => {
    const rateToKZT = EXCHANGE_RATES[r.currency] || 1;
    const amountInBase =
      (r.amount * rateToKZT) / EXCHANGE_RATES[currentBaseCurrency];

    total += amountInBase;
    categoryTotals[r.category] =
      (categoryTotals[r.category] || 0) + amountInBase;
  });

  let topCategory = '';
  let topAmount = 0;

  for (const cat in categoryTotals) {
    if (categoryTotals[cat] > topAmount) {
      topAmount = categoryTotals[cat];
      topCategory = cat;
    }
  }

  const percent = Math.round((topAmount / total) * 100);

  showSmartInsight(topCategory, percent, topAmount, total);
}
function showSmartInsight(category, percent, categoryAmount, total) {
  const box = document.getElementById('smartInsight');
  const text = document.getElementById('insightText');

  let emoji = '📦';
  if (category.includes('Food')) emoji = '🍔';
  if (category.includes('Shopping')) emoji = '🛍️';
  if (category.includes('Transportation')) emoji = '🚗';
  if (category.includes('Health')) emoji = '🏥';

  text.innerHTML = `
    ${emoji} <strong>${category}</strong> accounts for
    <strong>${percent}%</strong> of your expenses.<br>
    💰 ${categoryAmount.toFixed(2)} out of ${total.toFixed(2)}
  `;

  box.style.display = 'block';
}

function showBudgetInsight(spent, limit) {
  const percent = (spent / limit) * 100;

  if (percent < 50) return '🟢 Budget is under control';
  if (percent < 80) return '🟡 Keep an eye on your budget';
  return '🔴 You are close to your budget limit';
}

document.getElementById('baseCurrencySelector')?.addEventListener('change', (e) => {
  currentBaseCurrency = e.target.value;
  const totalKZT = receipts.reduce((sum, r) => sum + (r.amount * (EXCHANGE_RATES[r.currency] || 1)), 0);
  updateStats({ count: receipts.length, totalAmount: totalKZT });
  updateCharts();
});

document.getElementById('categoryFilter')?.addEventListener('change', fetchReceipts);
document.getElementById('startDate')?.addEventListener('change', fetchReceipts);
document.getElementById('endDate')?.addEventListener('change', fetchReceipts);

let searchTimeout;
document.getElementById('searchInput')?.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchReceipts, 500);
});

document.getElementById('exportCsvBtn')?.addEventListener('click', exportToCSV);

function exportToCSV() {
  if (receipts.length === 0) return showAlert('No data to export', 'danger');
  const headers = ['Title', 'Merchant', 'Amount', 'Currency', 'Category', 'Date'];
  const rows = receipts.map(r => [`"${r.title}"`, `"${r.merchant}"`, r.amount, r.currency, `"${r.category}"`, r.date]);
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'receipts.csv'; a.click();
}

fetchReceipts();