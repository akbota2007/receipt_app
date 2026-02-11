const API_URL = window.location.origin + '/api';

function showAlert(message, type = 'success') {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;
  
  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    
    let hasError = false;
    
    if (username.length < 3) {
      document.getElementById('username').classList.add('error');
      document.getElementById('usernameError').classList.add('show');
      hasError = true;
    }
    
    if (!validateEmail(email)) {
      document.getElementById('email').classList.add('error');
      document.getElementById('emailError').classList.add('show');
      hasError = true;
    }
    
    if (password.length < 6) {
      document.getElementById('password').classList.add('error');
      document.getElementById('passwordError').classList.add('show');
      hasError = true;
    }
    
    if (hasError) return;
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        showAlert(data.message || 'Registration failed', 'danger');
      }
    } catch (error) {
      showAlert('An error occurred. Please try again.', 'danger');
      console.error('Error:', error);
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    
    let hasError = false;
    
    if (!validateEmail(email)) {
      document.getElementById('email').classList.add('error');
      document.getElementById('emailError').classList.add('show');
      hasError = true;
    }
    
    if (!password) {
      document.getElementById('password').classList.add('error');
      document.getElementById('passwordError').classList.add('show');
      hasError = true;
    }
    
    if (hasError) return;
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        showAlert(data.message || 'Login failed', 'danger');
      }
    } catch (error) {
      showAlert('An error occurred. Please try again.', 'danger');
      console.error('Error:', error);
    }
  });
}
