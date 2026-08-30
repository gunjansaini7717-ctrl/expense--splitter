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
  const groupCard = `
    <div class="group-card">
      <strong>${group.name}</strong>
      <p>Group ID: ${group.id}</p>

      <!-- Small inline form to add a member to THIS specific group -->
      <form class="addMemberForm" data-group-id="${group.id}">
        <input type="email" placeholder="Member's email" required>
        <button type="submit">Add Member</button>
      </form>
      <p class="addMemberMessage"></p>
    </div>
  `;
  groupsListEl.innerHTML += groupCard;
});

// After rendering ALL group cards, attach a submit handler to EACH add-member form.
document.querySelectorAll('.addMemberForm').forEach(form => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const groupId = form.getAttribute('data-group-id');
    const email = form.querySelector('input').value;
    const msgEl = form.nextElementSibling;

    try {
      const response = await fetch(`http://localhost:3000/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        msgEl.style.color = 'green';
        msgEl.textContent = 'Member added!';
        form.reset();
      } else {
        msgEl.style.color = 'red';
        msgEl.textContent = data.error || 'Failed to add member';
      }

    } catch (err) {
      msgEl.style.color = 'red';
      msgEl.textContent = 'Could not connect to server';
    }
  });
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