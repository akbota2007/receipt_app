/**
 * Global Constants & Variables
 */
const API_URL = window.location.origin + '/api';
let receipts = [];
let editingReceiptId = null;

// Global chart instances for Chart.js to allow updates/destruction
let categoryChart = null;
let merchantChart = null;

/**
 * Authentication & Navigation Logic
 */
// Check for JWT token in local storage
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login'; // Redirect to login if not authenticated
}

const user = JSON.parse(localStorage.getItem('user'));

// Set user-specific information on the UI
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').src = user.avatar;

// Handle user logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

/**
 * Data Visualization Logic (Charts)
 */
function updateCharts() {
  const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
  const merchantCtx = document.getElementById('merchantChart')?.getContext('2d');

  if (!categoryCtx || !merchantCtx) return;

  // 1. Prepare Data for Category Distribution (Doughnut Chart)
  const categoryTotals = receipts.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {});

  // Destroy previous instance to prevent overlapping
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: [
          '#667eea', '#764ba2', '#10b981', '#f59e0b',
          '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });

  // 2. Prepare Data for Top 5 Merchants (Bar Chart)
  const merchantTotals = receipts.reduce((acc, r) => {
    acc[r.merchant] = (acc[r.merchant] || 0) + r.amount;
    return acc;
  }, {});

  // Sort merchants by amount and take top 5
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
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/**
 * UI Helper Functions
 */
// Display temporary alerts (Success/Error)
function showAlert(message, type = 'success') {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;

  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

// Format numbers into currency strings
function formatCurrency(amount, currency = 'KZT') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount);
}

// Format ISO date strings to readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Map category names to CSS classes for styling badges
function getCategoryClass(category) {
  return 'category-' + category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
}

/**
 * API Communication (Backend Integration)
 */
// Fetch receipts from the server based on current filters
async function fetchReceipts() {
  try {
    const { category, startDate, endDate, search } = getFilters();

    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (search) params.append('search', search);

    const url = `${API_URL}/receipts?${params.toString()}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      receipts = data.data;
      updateStats(data);
      renderReceipts();
      updateCharts(); // Refresh visual data
    } else {
      showAlert(data.message || 'Failed to load receipts', 'danger');
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
    showAlert('Failed to load receipts', 'danger');
  }
}

// Gather current values from UI filter inputs
function getFilters() {
  return {
    category: document.getElementById('categoryFilter').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    search: document.getElementById('searchInput').value
  };
}

// Calculate and update the top dashboard stats (Totals, This Month)
function updateStats(data) {
  document.getElementById('totalReceipts').textContent = data.count;
  document.getElementById('totalAmount').textContent = formatCurrency(data.totalAmount || 0);

  const now = new Date();
  const thisMonthReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.date);
    return receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthReceipts.reduce((sum, r) => sum + r.amount, 0);
  document.getElementById('thisMonth').textContent = formatCurrency(thisMonthTotal);
}

// Dynamically generate and inject receipt cards into the HTML container
function renderReceipts() {
  const container = document.getElementById('receiptsContainer');

  if (receipts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No receipts found</h3>
        <p>Start by adding your first receipt!</p>
        <button class="btn btn-primary" onclick="openModal()">Add Receipt</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="receipts-grid">
      ${receipts.map(receipt => `
        <div class="receipt-card">
          ${receipt.imageUrl ?
      `<img src="${receipt.imageUrl}" alt="${receipt.title}" class="receipt-image" onerror="this.src='https://via.placeholder.com/400x200/667eea/ffffff?text=Receipt'">` :
      `<div class="receipt-image" style="display: flex; align-items: center; justify-content: center; font-size: 3rem;">📄</div>`
  }
          <div class="receipt-content">
            <div class="receipt-header">
              <div>
                <div class="receipt-title">${receipt.title}</div>
                <div class="receipt-merchant">${receipt.merchant}</div>
              </div>
              <div class="receipt-amount">${formatCurrency(receipt.amount, receipt.currency)}</div>
            </div>
            
            <div class="receipt-details">
              <div class="receipt-detail">
                <span class="receipt-detail-label">Category:</span>
                <span class="category-badge ${getCategoryClass(receipt.category)}">${receipt.category}</span>
              </div>
              <div class="receipt-detail">
                <span class="receipt-detail-label">Date:</span>
                <span class="receipt-detail-value">${formatDate(receipt.date)}</span>
              </div>
              <div class="receipt-detail">
                <span class="receipt-detail-label">Payment:</span>
                <span class="receipt-detail-value">${receipt.paymentMethod}</span>
              </div>
            </div>
            
            ${receipt.description ? `<p style="color: var(--gray); font-size: 0.875rem; margin-bottom: 1rem;">${receipt.description}</p>` : ''}
            
            <div class="receipt-actions">
              <button class="icon-btn like ${receipt.likedBy?.includes(user.id) ? 'liked' : ''}" onclick="toggleLike('${receipt._id}')">
                ${receipt.likedBy?.includes(user.id) ? '❤️' : '🤍'}
              </button>
              <button class="icon-btn edit" onclick="editReceipt('${receipt._id}')">✏️</button>
              <button class="icon-btn delete" onclick="deleteReceipt('${receipt._id}')">🗑️</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Modal & Form Handling
 */
// Open the Add/Edit Modal
function openModal() {
  document.getElementById('receiptModal').classList.add('show');
  document.getElementById('modalTitle').textContent = 'Add Receipt';
  document.getElementById('receiptForm').reset();
  document.getElementById('receiptId').value = '';
  editingReceiptId = null;
  document.getElementById('date').valueAsDate = new Date();
}

// Close modal triggers
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('receiptModal').classList.remove('show');
});

document.getElementById('receiptModal').addEventListener('click', (e) => {
  if (e.target.id === 'receiptModal') {
    document.getElementById('receiptModal').classList.remove('show');
  }
});

document.getElementById('addReceiptBtn').addEventListener('click', openModal);

// Handle form submission for both Create and Update
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

  try {
    const url = editingReceiptId ? `${API_URL}/receipts/${editingReceiptId}` : `${API_URL}/receipts`;
    const method = editingReceiptId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      showAlert(editingReceiptId ? 'Receipt updated!' : 'Receipt added!', 'success');
      document.getElementById('receiptModal').classList.remove('show');
      fetchReceipts();
    } else {
      showAlert(data.message || 'Failed to save receipt', 'danger');
    }
  } catch (error) {
    showAlert('An error occurred', 'danger');
  }
});

/**
 * Interaction Actions (CRUD & Likes)
 */
// Load specific receipt data into modal for editing
async function editReceipt(id) {
  try {
    const response = await fetch(`${API_URL}/receipts/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      const receipt = data.data;
      editingReceiptId = id;
      document.getElementById('modalTitle').textContent = 'Edit Receipt';
      document.getElementById('receiptId').value = id;
      document.getElementById('title').value = receipt.title;
      document.getElementById('merchant').value = receipt.merchant;
      document.getElementById('amount').value = receipt.amount;
      document.getElementById('currency').value = receipt.currency;
      document.getElementById('category').value = receipt.category;
      document.getElementById('date').value = receipt.date.split('T')[0];
      document.getElementById('paymentMethod').value = receipt.paymentMethod;
      document.getElementById('description').value = receipt.description || '';
      document.getElementById('imageUrl').value = receipt.imageUrl || '';
      document.getElementById('receiptModal').classList.add('show');
    }
  } catch (error) {
    showAlert('Failed to load receipt', 'danger');
  }
}

// Delete a receipt after confirmation
async function deleteReceipt(id) {
  if (!confirm('Are you sure you want to delete this receipt?')) return;
  try {
    const response = await fetch(`${API_URL}/receipts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      showAlert('Receipt deleted!', 'success');
      fetchReceipts();
    }
  } catch (error) {
    showAlert('An error occurred', 'danger');
  }
}

// Toggle "Like" status of a receipt
async function toggleLike(id) {
  try {
    const response = await fetch(`${API_URL}/receipts/${id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) fetchReceipts();
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}

/**
 * Event Listeners for Filters
 */
document.getElementById('categoryFilter').addEventListener('change', fetchReceipts);
document.getElementById('startDate').addEventListener('change', fetchReceipts);
document.getElementById('endDate').addEventListener('change', fetchReceipts);

// Debounced search input (waits 500ms before triggering API call)
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchReceipts, 500);
});

// Run initial data fetch on page load
fetchReceipts();