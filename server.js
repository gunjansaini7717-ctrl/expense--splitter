// server.js

// 'require' loads an external library into this file. This is how we use Express.
const express = require('express');

// This creates our actual server application object. Every route/feature we add goes on 'app'.
const app = express();

// Just a plain variable to store which network port our server listens on.
const PORT = 3000;

// This defines a "route": when someone visits our server's root URL ('/') using a GET request,
// run this function. 'req' = the incoming request data, 'res' = what we send back.
app.get('/', (req, res) => {
  res.send('Expense Splitter backend is running!');
});

// This starts the server, telling it to actively listen for incoming requests on PORT 3000.
// The second argument is a function that runs once the server successfully starts.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});