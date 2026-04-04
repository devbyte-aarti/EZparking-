import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Loader from './Loader';

const Navbar = ({ wallet, unreadCount, onWalletUpdate, onUnreadUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    setLoading(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    setLoading(false);
  };



  return (
    <>
      <nav className="glass-dark fixed w-full z-50 top-0 left-0 backdrop-blur-xl border-b border-white/10 shadow-2xl h-[60px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
              EZ Parking
            </span>
            <span className="text-gray-200 font-semibold text-lg">
              Welcome, {user.name || 'User'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="glass p-2 px-4 rounded-2xl text-sm font-bold hidden sm:block">
              <span className="text-emerald-400">₹{wallet?.toLocaleString() || '0'}</span>
            </div>
            <motion.button
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2 bg-red-500/20 backdrop-blur-xl border border-red-500/30 text-red-200 rounded-xl font-bold hover:bg-red-500/40 transition-all whitespace-nowrap disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? <Loader size="sm" /> : 'Logout'}
            </motion.button>
          </div>
        </div>
      </nav>

    </>
  );
};

export default Navbar;

