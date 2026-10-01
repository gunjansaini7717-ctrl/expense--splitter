import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [message, setMessage] = useState('');
  const [memberEmails, setMemberEmails] = useState({}); // tracks each group's own input value
  const [memberMessages, setMemberMessages] = useState({}); // tracks each group's own status message

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');

  // useEffect runs side effects - code that needs to run when the component loads,
  // or when specific values change. The empty array [] at the end means
  // "run this only once, when the component first mounts" (similar to our old
  // 'loadGroups()' call at the bottom of dashboard.js)
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data);
    } catch (err) {
      setMessage('Failed to load groups');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3000/api/groups',
        { name: groupName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroupName('');
      loadGroups(); // refresh list after creating
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleAddMember = async (groupId, e) => {
    e.preventDefault();
    const email = memberEmails[groupId] || '';

    try {
      await axios.post(
        `http://localhost:3000/api/groups/${groupId}/members`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update just THIS group's message, keeping others untouched (spread + override one key)
      setMemberMessages(prev => ({ ...prev, [groupId]: { text: 'Member added!', ok: true } }));
      setMemberEmails(prev => ({ ...prev, [groupId]: '' }));
    } catch (err) {
      setMemberMessages(prev => ({
        ...prev,
        [groupId]: { text: err.response?.data?.error || 'Failed to add member', ok: false }
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
            <p className="text-gray-500 text-sm">Welcome back, {userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-red-500 font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex gap-2 mb-8">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="New group name"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Create
          </motion.button>
        </form>

        {message && <p className="text-red-500 text-sm mb-4">{message}</p>}

        {groups.length === 0 ? (
          <p className="text-gray-500 text-sm">No groups yet. Create one above!</p>
        ) : (
          <div className="grid gap-4">
            {/* AnimatePresence lets items animate IN when added and OUT when removed from the list */}
            <AnimatePresence>
              {groups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-xs text-gray-400">Group ID: {group.id}</p>
                    </div>
                    <Link
                      to={`/group/${group.id}`}
                      className="text-sm text-indigo-600 font-medium hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>

                  <form
                    onSubmit={(e) => handleAddMember(group.id, e)}
                    className="flex gap-2"
                  >
                    <input
                      type="email"
                      value={memberEmails[group.id] || ''}
                      onChange={(e) =>
                        setMemberEmails(prev => ({ ...prev, [group.id]: e.target.value }))
                      }
                      placeholder="Member's email"
                      className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                    >
                      Add
                    </button>
                  </form>

                  {memberMessages[group.id] && (
                    <p className={`text-xs mt-2 ${memberMessages[group.id].ok ? 'text-green-600' : 'text-red-500'}`}>
                      {memberMessages[group.id].text}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;