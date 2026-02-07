const user = JSON.parse(localStorage.getItem('user'));

// Заполняем поля текущими данными
document.getElementById('profileUsername').value = user.username;
document.getElementById('profileBudget').value = localStorage.getItem('monthlyBudget') || 200000;

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newUsername = document.getElementById('profileUsername').value;
    const newBudget = document.getElementById('profileBudget').value;

    // Сохраняем бюджет локально
    localStorage.setItem('monthlyBudget', newBudget);

    // Здесь можно добавить fetch запрос на бэкенд для смены ника
    // Обновляем локальный объект пользователя
    user.username = newUsername;
    localStorage.setItem('user', JSON.stringify(user));

    const alert = document.getElementById('profileAlert');
    alert.textContent = "Settings saved successfully!";
    alert.className = "alert alert-success show";

    setTimeout(() => {
        window.location.href = '/dashboard';
    }, 1500);
});