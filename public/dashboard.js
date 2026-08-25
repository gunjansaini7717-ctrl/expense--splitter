// dashboard.js

// Grab the token we stored during login. If there's none, this user isn't logged in.
const token = localStorage.getItem('token');
const userName = localStorage.getItem('userName');

// If no token exists, immediately redirect back to the login page -
// this "protects" the dashboard from being viewed by non-logged-in users
if (!token) {
  window.location.href = 'login.html';
}

const groupsListEl = document.getElementById('groupsList');
const messageEl = document.getElementById('message');
const createGroupForm = document.getElementById('createGroupForm');
const logoutBtn = document.getElementById('logoutBtn');

// This function fetches groups from our backend and displays them
async function loadGroups() {
  try {
    const response = await fetch('http://localhost:3000/api/groups', {
      method: 'GET',
      headers: {
        // This is the key difference from signup/login - we're now SENDING the token
        // so the backend's authMiddleware can verify who's asking
        'Authorization': `Bearer ${token}`
      }
    });

    const groups = await response.json();

    if (!response.ok) {
      messageEl.textContent = groups.error || 'Failed to load groups';
      return;
    }

    // Clear any existing content before re-rendering
    groupsListEl.innerHTML = '';

    if (groups.length === 0) {
      groupsListEl.innerHTML = '<p>No groups yet. Create one above!</p>';
      return;
    }

    // Loop through each group returned by the API, and build an HTML block for it
    groups.forEach(group => {
      // template literals (backticks) let us build HTML strings with embedded variables
      const groupCard = `
        <div class="group-card">
          <strong>${group.name}</strong>
          <p>Group ID: ${group.id}</p>
        </div>
      `;
      // += appends this new HTML onto whatever's already inside groupsListEl
      groupsListEl.innerHTML += groupCard;
    });

  } catch (err) {
    messageEl.textContent = 'Could not connect to server';
  }
}

// Handle creating a new group
createGroupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('groupName').value;

  try {
    const response = await fetch('http://localhost:3000/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (response.ok) {
      createGroupForm.reset();
      loadGroups(); // refresh the list to show the newly created group
    } else {
      messageEl.textContent = data.error || 'Failed to create group';
    }

  } catch (err) {
    messageEl.textContent = 'Could not connect to server';
  }
});

// Handle logout - simply clear stored data and redirect
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = 'login.html';
});

// Run this immediately when the page loads, so groups show up right away
loadGroups();