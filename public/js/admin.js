const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '/login';
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/';
});

async function fetchUsers() {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!data.success) return;

  document.getElementById('totalUsers').textContent = data.count;

  const container = document.getElementById('usersContainer');

  container.innerHTML = data.data.map(u => `
    <div class="user-card">
      <div class="user-info">
        <strong>${u.username}</strong>
        <span>${u.email}</span>
      </div>
      <button class="btn-delete" onclick="deleteUser('${u._id}')">
        Delete
      </button>
    </div>
  `).join('');
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;

  await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  fetchUsers();
}

async function fetchAllReceipts() {
  const res = await fetch(`${API_URL}/receipts`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!data.success) return;

  document.getElementById('totalReceipts').textContent = data.count;

  const container = document.getElementById('receiptsContainer');

  container.innerHTML = data.data.map(r => `
    <div class="receipt-card">
      <strong>${r.title}</strong>
      <div>Owner: ${r.user?.username || 'Unknown'}</div>
      <div>${r.amount} ${r.currency}</div>
      <button class="btn-delete" onclick="deleteReceipt('${r._id}')">
        Delete
      </button>
    </div>
  `).join('');
}

async function deleteReceipt(id) {
  if (!confirm('Delete this receipt?')) return;

  await fetch(`${API_URL}/receipts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  fetchAllReceipts();
}

document.getElementById('deleteAllReceiptsBtn')?.addEventListener('click', async () => {
  if (!confirm('Delete ALL receipts?')) return;

  await fetch(`${API_URL}/receipts/delete-all`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  fetchAllReceipts();
});

fetchUsers();
fetchAllReceipts();
