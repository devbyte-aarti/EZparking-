import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { userAPI, receiptAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Loader from '../../components/Loader';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wallet, setWallet] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notificationsRes, walletRes] = await Promise.all([
        userAPI.getNotifications(),
        userAPI.getWallet()
      ]);
      let allNotifs = notificationsRes.data.notifications || [];
      
      // Apply filter
      if (filter === 'unread') {
        allNotifs = allNotifs.filter(n => !n.read);
      } else if (filter === 'read') {
        allNotifs = allNotifs.filter(n => n.read);
      }
      
      setNotifications(allNotifs);
      setUnreadCount(notificationsRes.data.unreadCount || 0);
      setWallet(walletRes.data?.wallet || 0);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      await markRead(notif._id);
    }
    if (notif.type === 'booking') {
      navigate('/user/receipts');
      toast.success('Opening receipts...');
    }
  };

  const markRead = async (id) => {
    try {
      await userAPI.markNotificationRead(id);
      setNotifications(notifs => notifs.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Mark read failed');
    }
  };

  const markAllRead = async () => {
    try {
      // Simulate - in real would batch API
      setNotifications(notifs => notifs.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked read');
    } catch (error) {
      toast.error('Failed');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar wallet={wallet} unreadCount={unreadCount} />
        <div className="user-bg min-h-screen pt-[80px] flex items-center justify-center p-8">
          <Loader message="Loading notifications..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar wallet={wallet} unreadCount={unreadCount} />
      <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} wallet={wallet} unreadCount={unreadCount} />
      <div className="user-bg min-h-screen pt-[80px] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              <div className="text-2xl font-black text-blue-400">{unreadCount} unread</div>
            </div>
            <div className="flex gap-2">
              <motion.button 
                onClick={loadNotifications} 
                className="neon-btn px-6 py-2 font-bold" 
                whileHover={{ scale: 1.05 }}
              >
                🔄 Refresh
              </motion.button>
              {unreadCount > 0 && (
                <motion.button 
                  onClick={markAllRead} 
                  className="bg-blue-500/20 border border-blue-500/40 text-blue-200 px-6 py-2 rounded-xl font-bold hover:bg-blue-500/30 transition-all" 
                  whileHover={{ scale: 1.05 }}
                >
                  Mark All Read
                </motion.button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="glass-dark p-4 rounded-2xl flex gap-2 bg-white/5">
            <motion.button 
              onClick={() => setFilter('all')} 
              className={`px-6 py-2 rounded-xl font-bold transition-all ${filter === 'all' ? 'bg-blue-500/20 border-2 border-blue-400 text-blue-200 shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}
              whileTap={{ scale: 0.98 }}
            >
              All ({notifications.length})
            </motion.button>
            <motion.button 
              onClick={() => setFilter('unread')} 
              className={`px-6 py-2 rounded-xl font-bold transition-all ${filter === 'unread' ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}
              whileTap={{ scale: 0.98 }}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </motion.button>
            <motion.button 
              onClick={() => setFilter('read')} 
              className={`px-6 py-2 rounded-xl font-bold transition-all ${filter === 'read' ? 'bg-gray-500/20 border-2 border-gray-400 text-gray-200 shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}
              whileTap={{ scale: 0.98 }}
            >
              Read ({notifications.filter(n => n.read).length})
            </motion.button>
          </div>

          {/* Notifications List */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-dark rounded-2xl divide-y divide-white/10 max-h-96 overflow-y-auto shadow-2xl"
          >
            {notifications.length === 0 ? (
              <div className="p-16 text-center text-gray-400 bg-gradient-to-b from-transparent to-black/50">
                <div className="text-5xl mb-6">🔔</div>
                <h3 className="text-xl font-bold text-gray-300 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up! New updates will appear here.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <motion.div
                  key={notif._id}
                  className={`p-6 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-l-4 border-l-blue-400 relative' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleNotifClick(notif)}
                >

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-white mb-1 line-clamp-1">{notif.title || 'Update'}</h4>
                      <p className="text-gray-300 text-sm line-clamp-2">{notif.message}</p>
                    </div>
                    <div className="flex gap-2 ml-3 flex-shrink-0">
                      {!notif.read && (
                        <motion.button
                          className="px-3 py-1 bg-blue-500/30 border border-blue-500/50 text-blue-200 text-xs font-bold rounded-lg hover:bg-blue-500/50 transition-all whitespace-nowrap"
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(notif._id);
                          }}
                        >
                          Read
                        </motion.button>
                      )}
                      {notif.hasPDF && notif.metadata?.receiptId && (
                        <motion.button
                          className="px-3 py-1 bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-500/50 transition-all flex items-center gap-1"
                          whileTap={{ scale: 0.95 }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              toast.info('Downloading PDF receipt...');
                              const res = await receiptAPI.downloadPDF(notif.type, notif.metadata.receiptId);
                              const blob = new Blob([res.data], { type: 'application/pdf' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `EZParking-${notif.type === 'pass' ? 'Pass' : 'Receipt'}-${notif.metadata.receiptId.slice(-8)}.pdf`;
                              link.click();
                              window.URL.revokeObjectURL(url);
                              toast.success('PDF downloaded!');
                            } catch (error) {
                              toast.error('Download failed');
                            }
                          }}
                        >
                          📄 PDF
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    {notif.type && <span className="px-2 py-1 bg-gray-500/30 text-gray-300 rounded-full text-xs capitalize">{notif.type}</span>}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {notifications.length > 0 && (
            <motion.div className="text-center pt-8">
              <motion.button 
                onClick={markAllRead} 
                className="neon-btn px-12 py-3 font-bold text-lg" 
                whileHover={{ scale: 1.05 }}
              >
                Mark All as Read
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;

