// login.js

const form = document.getElementById('loginForm');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // IMPORTANT: localStorage saves data in the browser itself, persisting even after page refresh/closing tab
      // This is how we "remember" the logged-in user across pages, without asking them to log in every time
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);

      messageEl.style.color = 'green';
      messageEl.textContent = `Welcome, ${data.name}! Login successful.`;
    } else {
      messageEl.style.color = 'red';
      messageEl.textContent = data.error || 'Login failed';
    }

  } catch (err) {
    messageEl.style.color = 'red';
    messageEl.textContent = 'Could not connect to server';
  }
});