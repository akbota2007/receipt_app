const API_URL = window.location.origin + '/api';
let receipts = [];
let editingReceiptId = null;

// Check if user is logged in
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
}

const user = JSON.parse(localStorage.getItem('user'));

// Set user info
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').src = user.avatar;

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// Show alert
function showAlert(message, type = 'success') {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;
  
  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

// Format currency
function formatCurrency(amount, currency = 'KZT') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get category class
function getCategoryClass(category) {
  return 'category-' + category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
}

// Fetch receipts
async function fetchReceipts() {
  try {
    const { category, startDate, endDate, search } = getFilters();
    
    // Build URL with proper query parameters
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (search) params.append('search', search);
    
    const url = `${API_URL}/receipts?${params.toString()}`;
    console.log('Fetching receipts with URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      receipts = data.data;
      updateStats(data);
      renderReceipts();
    } else {
      showAlert(data.message || 'Failed to load receipts', 'danger');
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
    showAlert('Failed to load receipts', 'danger');
  }
}

// Get filters
function getFilters() {
  return {
    category: document.getElementById('categoryFilter').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    search: document.getElementById('searchInput').value
  };
}

// Update statistics
function updateStats(data) {
  document.getElementById('totalReceipts').textContent = data.count;
  document.getElementById('totalAmount').textContent = formatCurrency(data.totalAmount || 0);
  
  // Calculate this month's total
  const now = new Date();
  const thisMonthReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.date);
    return receiptDate.getMonth() === now.getMonth() && 
           receiptDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthReceipts.reduce((sum, r) => sum + r.amount, 0);
  document.getElementById('thisMonth').textContent = formatCurrency(thisMonthTotal);
}

// Render receipts
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

// Open modal
function openModal() {
  document.getElementById('receiptModal').classList.add('show');
  document.getElementById('modalTitle').textContent = 'Add Receipt';
  document.getElementById('receiptForm').reset();
  document.getElementById('receiptId').value = '';
  editingReceiptId = null;
  
  // Set today's date
  document.getElementById('date').valueAsDate = new Date();
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('receiptModal').classList.remove('show');
});

document.getElementById('receiptModal').addEventListener('click', (e) => {
  if (e.target.id === 'receiptModal') {
    document.getElementById('receiptModal').classList.remove('show');
  }
});

// Add receipt button
document.getElementById('addReceiptBtn').addEventListener('click', openModal);

// Submit receipt form
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
    const url = editingReceiptId ? 
      `${API_URL}/receipts/${editingReceiptId}` : 
      `${API_URL}/receipts`;
    
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
    console.error('Error:', error);
    showAlert('An error occurred', 'danger');
  }
});

// Edit receipt
async function editReceipt(id) {
  try {
    const response = await fetch(`${API_URL}/receipts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
    console.error('Error:', error);
    showAlert('Failed to load receipt', 'danger');
  }
}

// Delete receipt
async function deleteReceipt(id) {
  if (!confirm('Are you sure you want to delete this receipt?')) return;
  
  try {
    const response = await fetch(`${API_URL}/receipts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Receipt deleted!', 'success');
      fetchReceipts();
    } else {
      showAlert(data.message || 'Failed to delete receipt', 'danger');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('An error occurred', 'danger');
  }
}

// Toggle like
async function toggleLike(id) {
  try {
    const response = await fetch(`${API_URL}/receipts/${id}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      fetchReceipts();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Filters
document.getElementById('categoryFilter').addEventListener('change', () => {
  console.log('Category changed:', document.getElementById('categoryFilter').value);
  fetchReceipts();
});

document.getElementById('startDate').addEventListener('change', () => {
  console.log('Start date changed:', document.getElementById('startDate').value);
  fetchReceipts();
});

document.getElementById('endDate').addEventListener('change', () => {
  console.log('End date changed:', document.getElementById('endDate').value);
  fetchReceipts();
});

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    console.log('Search changed:', document.getElementById('searchInput').value);
    fetchReceipts();
  }, 500);
});

// Initial load
fetchReceipts();
