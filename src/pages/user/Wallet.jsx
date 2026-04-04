import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { userAPI, paymentAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Loader from '../../components/Loader';

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [refunds, setRefunds] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [walletRes, paymentsRes, notificationsRes] = await Promise.all([
        userAPI.getWallet(),
        paymentAPI.getAllPayments(),
        userAPI.getNotifications()
      ]);

      setBalance(walletRes.data?.wallet || 0);
      setWallet(walletRes.data?.wallet || 0);
      setUnreadCount(notificationsRes.data?.unreadCount || 0);

      // Refund history from payments
      const refundHistory = paymentsRes.data.filter(p => p.status === 'refunded' || p.method === 'cancel');
      setRefunds(refundHistory.slice(0, 10)); // Last 10
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar wallet={wallet} unreadCount={unreadCount} />
        <div className="user-bg min-h-screen pt-[80px] flex items-center justify-center p-8">
          <Loader message="Loading wallet..." size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar wallet={wallet} unreadCount={unreadCount} />
      <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} wallet={wallet} unreadCount={unreadCount} />
      <div className="user-bg min-h-screen pt-[80px] p-6"> 
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Balance Card */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="glass-dark p-12 text-center rounded-3xl border-2 border-emerald-500/30 shadow-2xl"
          >
            <div className="text-6xl mb-6">💰</div>
            <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
              ₹{balance.toLocaleString()}
            </div>
            <div className="text-xl text-gray-300 mb-8 font-semibold">Available Balance</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400 max-w-md mx-auto">
              <div className="text-center p-4 border-r border-white/10 md:border-r last:border-r-0">
                <div className="text-emerald-400 font-bold text-lg mb-1">Auto-deduct</div>
                <div>Used on payments</div>
              </div>
              <div className="text-center p-4 border-r border-white/10 md:border-r last:border-r-0">
                <div className="text-blue-400 font-bold text-lg mb-1">Refunds added</div>
                <div>Cancellations auto-refunded</div>
              </div>
              <div className="text-center p-4">
                <div className="text-purple-400 font-bold text-lg mb-1">No expiry</div>
                <div>Balance never expires</div>
              </div>
            </div>
          </motion.div>

          {/* Refund History */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-dark rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                💸 Refund History ({refunds.length})
              </h2>
              <p className="text-emerald-300 text-sm mt-1">Refunds from cancelled bookings</p>
            </div>
            
            {refunds.length === 0 ? (
              <div className="p-12 text-center text-gray-400 bg-gradient-to-r from-slate-900/50 to-transparent">
                <div className="text-4xl mb-4">✨</div>
                No refunds yet. All your payments processed successfully!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-4 text-left text-gray-200 font-bold bg-white/5">Date</th>
                      <th className="p-4 text-left text-gray-200 font-bold bg-white/5">Booking ID</th>
                      <th className="p-4 text-left text-gray-200 font-bold bg-white/5">Reason</th>
                      <th className="p-4 text-right text-gray-200 font-bold bg-white/5">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-emerald-500/5 transition-colors">
                        <td className="p-4 font-mono text-emerald-300">{new Date(refund.createdAt).toLocaleDateString('short')}</td>
                        <td className="p-4 font-mono text-sm text-gray-400">#{refund.bookingId?.slice(-8)}</td>
                        <td className="p-4 text-gray-300 capitalize">{refund.reason || 'Cancelled'}</td>
                        <td className="p-4 font-bold text-emerald-400 text-right text-lg">+₹{refund.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          <motion.div className="flex gap-4 justify-center pt-8">
            <motion.button 
              onClick={loadWalletData} 
              className="neon-btn px-10 py-4 font-bold text-lg" 
              whileHover={{ scale: 1.05 }}
            >
              🔄 Refresh Balance
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default WalletPage;
