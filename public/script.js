// script.js

// This grabs the <form> element from the HTML using its id, so we can attach behavior to it
const form = document.getElementById('signupForm');

// This grabs the empty <p> tag where we'll display success/error messages
const messageEl = document.getElementById('message');

// 'addEventListener' waits for something to happen (an "event") - here, the form being submitted
// (i.e., the Sign Up button being clicked)
form.addEventListener('submit', async (event) => {

  // By default, submitting a form reloads the whole page - we don't want that,
  // since we're handling the submission ourselves with JavaScript instead
  event.preventDefault();

  // Grab the current values typed into each input box
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // 'fetch' sends an HTTP request from the browser to our backend server
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST', // matches the POST route we built in auth.js
      headers: {
        'Content-Type': 'application/json' // tells the server "I'm sending JSON data"
      },
      body: JSON.stringify({ name, email, password }) // converts our JS object into a JSON string
    });

    // Converts the server's JSON response back into a usable JS object
    const data = await response.json();

    if (response.ok) {
      // response.ok is true if status code is in the 200-299 range (success)
      messageEl.style.color = 'green';
      messageEl.textContent = data.message + ` (User ID: ${data.userId})`;
      form.reset(); // clears the form fields
    } else {
      messageEl.style.color = 'red';
      messageEl.textContent = data.error || 'Something went wrong';
    }

  } catch (err) {
    messageEl.style.color = 'red';
    messageEl.textContent = 'Could not connect to server';
  }
});