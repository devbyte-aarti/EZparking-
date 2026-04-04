import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const HamburgerMenu = ({ isOpen, setIsOpen, wallet, unreadCount }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/user/dashboard' },
    { id: 'bookings', label: 'My Bookings', icon: '📅', path: '/user/bookings' },
    { id: 'find-parking', label: 'Find Parking', icon: '🔍', path: '/user/find-parking' },
    { id: 'vehicles', label: 'My Vehicles', icon: '🚗', path: '/user/my-vehicles' },
    { id: 'wallet', label: 'Wallet', icon: '💳', path: '/user/wallet' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', path: '/user/notifications' },
    { id: 'pass', label: 'Pass', icon: '🎫', path: '/user/pass' }
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* FIXED WHITE ☰ BUTTON - VISIBLE ON ALL PAGES */}
      <motion.button 
        onClick={() => setIsOpen(true)}
        className="hamburger-btn fixed top-[70px] left-[20px] z-[60] flex md:flex p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 hover:bg-white/20 hover:border-white/50 transition-all shadow-2xl"
        whileTap={{ scale: 0.95 }}
        aria-label="Open menu"
      >
        <div className="space-y-1 w-6 h-4">
          <motion.div className="h-0.5 w-full bg-white rounded" />
          <motion.div className="h-0.5 w-4/5 bg-white rounded ml-1" />
          <motion.div className="h-0.5 w-full bg-white rounded" />
        </div>
      </motion.button>

      {/* FULL-SCREEN OVERLAY MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-start pl-8 pr-4 py-12"
            onClick={() => setIsOpen(false)}
          >
            {/* MENU CONTAINER - LEFT/CENTER ALIGNED */}
            <motion.div
              initial={{ scale: 0.9, x: -50, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              exit={{ scale: 0.9, x: -50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-dark w-full max-w-md h-[90vh] overflow-y-auto rounded-3xl border-2 border-white/20 shadow-2xl p-8 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Menu
                </h2>
                <motion.button 
                  onClick={() => setIsOpen(false)} 
                  className="text-gray-400 hover:text-white text-3xl p-2 rounded-2xl hover:bg-white/10 transition-all"
                  whileTap={{ scale: 0.9, rotate: 90 }}
                >
                  ×
                </motion.button>
              </div>
              
              {/* MENU ITEMS - LARGE CLICKABLE TABS */}
              <div className="flex-1 space-y-4">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    className={`group w-full text-left p-8 rounded-3xl border-2 transition-all shadow-xl backdrop-blur-xl ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-emerald-500/40 to-teal-500/40 border-emerald-400/60 ring-4 ring-emerald-400/40 shadow-emerald-500/30 text-white'
                        : 'bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl hover:text-white text-gray-200'
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-6">
                      <motion.span 
                        className="text-3xl"
                        animate={isActive(item.path) ? { scale: 1.2, rotate: 5 } : { scale: 1 }}
                      >
                        {item.icon}
                      </motion.span>
                      <span className="font-black text-2xl tracking-wide">{item.label}</span>
                      {isActive(item.path) && (
                        <motion.div 
                          className="ml-auto w-3 h-3 bg-emerald-400 rounded-full shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring' }}
                        />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* FOOTER - WALLET */}
              <div className="pt-8 mt-auto border-t border-white/10">
                <div className="glass p-6 rounded-3xl">
                  <div className="text-emerald-400 font-black text-2xl">₹{wallet?.toLocaleString() || '0'}</div>
                  <div className="text-gray-400 text-lg mt-1">Wallet Balance</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HamburgerMenu;

