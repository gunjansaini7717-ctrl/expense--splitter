// group.js

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// URLSearchParams reads query parameters from the current page's URL
const params = new URLSearchParams(window.location.search);
const groupId = params.get('id'); // reads the '?id=3' value

document.getElementById('groupTitle').textContent = `Group #${groupId}`;

const expensesListEl = document.getElementById('expensesList');
const addExpenseForm = document.getElementById('addExpenseForm');
const expenseMessageEl = document.getElementById('expenseMessage');

// Fetch and display all expenses for this group
async function loadExpenses() {
  try {
    const response = await fetch(`http://localhost:3000/api/expenses/${groupId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const expenses = await response.json();

    if (!response.ok) {
      expensesListEl.textContent = expenses.error || 'Failed to load expenses';
      return;
    }

    if (expenses.length === 0) {
      expensesListEl.innerHTML = '<p>No expenses yet.</p>';
      return;
    }

    expensesListEl.innerHTML = '';

    expenses.forEach(exp => {
      // Build a readable list of who owes what for this expense
      const splitsHtml = exp.splits
        .map(s => `${s.user_name}: ₹${s.share_amount}`)
        .join(', ');

      const card = `
        <div class="group-card">
          <strong>${exp.description}</strong> - ₹${exp.amount}
          <p>Paid by: ${exp.paid_by_name}</p>
          <p style="font-size:13px; color:#666;">Split: ${splitsHtml}</p>
        </div>
      `;
      expensesListEl.innerHTML += card;
    });

  } catch (err) {
    expensesListEl.textContent = 'Could not connect to server';
  }
}

// Handle adding a new expense
addExpenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const description = document.getElementById('description').value;
  const amount = document.getElementById('amount').value;

  try {
    const response = await fetch('http://localhost:3000/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId, description, amount })
    });

    const data = await response.json();

    if (response.ok) {
      addExpenseForm.reset();
      expenseMessageEl.style.color = 'green';
      expenseMessageEl.textContent = 'Expense added!';
      loadExpenses(); // refresh the list
    } else {
      expenseMessageEl.style.color = 'red';
      expenseMessageEl.textContent = data.error || 'Failed to add expense';
    }

  } catch (err) {
    expenseMessageEl.style.color = 'red';
    expenseMessageEl.textContent = 'Could not connect to server';
  }
});

loadExpenses();

const settlementBtn = document.getElementById('loadSettlementBtn');
const settlementResultEl = document.getElementById('settlementResult');

settlementBtn.addEventListener('click', async () => {
  settlementResultEl.innerHTML = 'Calculating...';

  try {
    const response = await fetch(`http://localhost:3000/api/expenses/${groupId}/settlement`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      settlementResultEl.textContent = data.error || 'Failed to calculate settlement';
      return;
    }

    if (data.transactions.length === 0) {
      settlementResultEl.innerHTML = '<p>Everyone is settled up! 🎉</p>';
      return;
    }

    // Build a clean list of "X pays Y ₹amount" lines
    let html = '<div class="group-card"><strong>Suggested Payments:</strong><ul>';
    data.transactions.forEach(t => {
      html += `<li>${t.from} pays ${t.to} ₹${t.amount}</li>`;
    });
    html += '</ul></div>';

    settlementResultEl.innerHTML = html;

  } catch (err) {
    settlementResultEl.textContent = 'Could not connect to server';
  }
});