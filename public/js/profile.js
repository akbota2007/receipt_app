const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = '/login';
}

document.getElementById('profileUsername').value = user.username;
document.getElementById('profileEmail').value = user.email;
document.getElementById('profileBudget').value = user.budget || 200000;
document.getElementById('profileDefaultCurrency').value = user.defaultCurrency || 'KZT';

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const budgetValue = parseInt(document.getElementById('profileBudget').value);
    if (isNaN(budgetValue) || budgetValue < 0) {
        showProfileAlert("Budget cannot be negative", "danger");
        return;
    }
    const updatedData = {
        username: document.getElementById('profileUsername').value,
        budget: budgetValue,
        defaultCurrency: document.getElementById('profileDefaultCurrency').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('monthlyBudget', result.user.budget);
            localStorage.setItem('defaultCurrency', result.user.defaultCurrency);

            showProfileAlert("Profile updated in MongoDB successfully!", "success");

            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1200);
        } else {
            showProfileAlert("Error: " + result.message, "danger");
        }
    } catch (err) {
        console.error('Update error:', err);
        showProfileAlert("Server connection failed", "danger");
    }
});

document.getElementById('exportDataBtn').addEventListener('click', () => {
    const backup = {
        user: user.username,
        email: user.email,
        budget: user.budget,
        currency: user.defaultCurrency,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${user.username}.json`;
    a.click();
});

function showProfileAlert(msg, type) {
    const alert = document.getElementById('profileAlert');
    if (!alert) return;
    alert.textContent = msg;
    alert.className = `alert alert-${type} show`;
    alert.style.display = 'block';

    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.style.display = 'none', 500);
    }, 3000);
}

window.openTab = function(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    const saveBtn = document.querySelector(".btn-save");
    if (tabName === 'data' && saveBtn) {
        saveBtn.style.display = 'none';
    } else if (saveBtn) {
        saveBtn.style.display = 'block';
    }
};