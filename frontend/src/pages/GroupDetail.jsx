import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseMessage, setExpenseMessage] = useState('');
  const [settlement, setSettlement] = useState(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/expenses/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
    } catch (err) {
      setExpenseMessage('Failed to load expenses');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/expenses`,
        { groupId, description, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDescription('');
      setAmount('');
      setExpenseMessage('Expense added!');
      loadExpenses();
    } catch (err) {
      setExpenseMessage(err.response?.data?.error || 'Failed to add expense');
    }
  };

  const handleCalculateSettlement = async () => {
    setSettlementLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/expenses/${groupId}/settlement`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettlement(response.data);
    } catch (err) {
      setExpenseMessage('Failed to calculate settlement');
    } finally {
      setSettlementLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Group #{groupId}</h1>
          <Link to="/dashboard" className="text-sm text-indigo-600 font-medium hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Add an Expense</h2>
          <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (e.g. Dinner)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full sm:w-32 border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Add
            </motion.button>
          </form>
          {expenseMessage && (
            <p className="text-sm mt-2 text-gray-600">{expenseMessage}</p>
          )}
        </div>

        <h2 className="font-semibold text-gray-900 mb-3">Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-sm mb-8">No expenses yet.</p>
        ) : (
          <div className="grid gap-3 mb-8">
            <AnimatePresence>
              {expenses.map((exp) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{exp.description}</span>
                    <span className="font-semibold text-gray-900">₹{exp.amount}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Paid by {exp.paid_by_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Split: {exp.splits.map(s => `${s.user_name}: ₹${s.share_amount}`).join(', ')}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-900">Settle Up</h2>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCalculateSettlement}
              disabled={settlementLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {settlementLoading ? 'Calculating...' : 'Calculate Settlement'}
            </motion.button>
          </div>

          <AnimatePresence>
            {settlement && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                {settlement.transactions.length === 0 ? (
                  <p className="text-green-600 text-sm">Everyone is settled up! 🎉</p>
                ) : (
                  <ul className="space-y-2">
                    {settlement.transactions.map((t, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-sm bg-indigo-50 text-indigo-800 rounded-lg px-3 py-2"
                      >
                        <span className="font-medium">{t.from}</span> pays{' '}
                        <span className="font-medium">{t.to}</span>{' '}
                        <span className="font-semibold">₹{t.amount}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default GroupDetail;