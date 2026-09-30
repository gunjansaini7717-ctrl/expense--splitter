import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userName', response.data.name);

      setMessage(`Welcome back, ${response.data.name}!`);
      setTimeout(() => navigate('/dashboard'), 800);

    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white max-w-md"
        >
          <h1 className="text-4xl font-bold mb-4">Expense Splitter</h1>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Track shared expenses, split costs fairly, and settle up with
            the fewest transactions possible.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 mb-8 text-sm">Log in to your account to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           transition-all"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           transition-all"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg
                         transition-colors mt-2 disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </motion.button>
          </form>

          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center text-sm mt-4 ${
                message.includes('Welcome') ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {message}
            </motion.p>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;