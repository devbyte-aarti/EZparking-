import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import Loader from '../../../components/Loader';
import { receiptAPI, userAPI } from '../../../services/api';

const ReceiptsPage = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [receiptsRes, walletRes, notificationsRes] = await Promise.all([
        receiptAPI.getMyReceipts(),
        userAPI.getWallet(),
        userAPI.getNotifications()
      ]);
      setReceipts(receiptsRes.data || []);
      setWallet(walletRes.data?.wallet || 0);
      setUnreadCount(notificationsRes.data?.unreadCount || 0);
    } catch (error) {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refetch receipts every 20s
  useEffect(() => {
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const downloadPDF = async (receiptId) => {
    try {
      toast.info('Downloading receipt PDF...');
      const res = await receiptAPI.getReceiptPDF(receiptId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EZParking_Receipt_${receiptId.slice(-8)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const viewDetails = async (receiptId) => {
    try {
      const res = await receiptAPI.getReceipt(receiptId);
      setSelectedReceipt(res.data);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  if (loading) {
    return (
      <div className="user-bg min-h-screen pt-[80px]">
        <Navbar wallet={wallet} unreadCount={unreadCount} />
        <Loader message="Loading receipts..." />
      </div>
    );
  }

  return (
    <div className="user-bg min-h-screen pt-[80px]">
      <Navbar wallet={wallet} unreadCount={unreadCount} />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-white mb-6 flex items-center gap-3">
            📄 My Receipts
            <span className="text-sm bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full">
              {receipts.length}
            </span>
          </h1>
        </motion.div>

        {receipts.length === 0 ? (
          <motion.div className="glass-dark p-12 text-center rounded-3xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-2xl font-bold text-white mb-4">No receipts yet</h2>
            <p className="text-gray-400 mb-8">Complete your first booking to get receipts</p>
            <motion.button 
              onClick={() => navigate('/user/find-parking')} 
              className="neon-btn px-8 py-3 font-bold" 
              whileHover={{ scale: 1.05 }}
            >
              Book Parking →
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receipts.map((receipt) => (
              <motion.div 
                key={receipt._id}
                className="glass-dark p-6 rounded-2xl border-2 border-white/10 hover:border-emerald-400/50 cursor-pointer group"
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => viewDetails(receipt._id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="text-2xl">📄</div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDF(receipt._id);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-bold group-hover:text-emerald-200"
                  >
                    Download PDF ↓
                  </button>
                </div>
                <h3 className="font-bold text-white text-xl mb-2">Receipt #{receipt._id.slice(-8).toUpperCase()}</h3>
                <div className="text-emerald-400 text-2xl font-bold mb-3">₹{receipt.amount}</div>
                <div className="text-gray-400 text-sm mb-4">
                  {new Date(receipt.createdAt).toLocaleDateString()} • {receipt.paymentId?.method?.toUpperCase()}
                </div>
                {receipt.vehicleId && (
                  <div className="text-gray-300 mb-2">Vehicle: {receipt.vehicleId.vehicleNo}</div>
                )}
                {receipt.bookingId && (
                  <div className="text-gray-300 text-sm">Booking: {receipt.bookingId._id.slice(-8)}</div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="glass-dark p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Receipt Details</h2>
                <button 
                  onClick={() => setSelectedReceipt(null)} 
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-6 rounded-2xl border border-emerald-500/30">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">₹{selectedReceipt.amount}</div>
                  <div className="text-sm text-emerald-200">Paid on {new Date(selectedReceipt.createdAt).toLocaleString()}</div>
                </div>
                {selectedReceipt.vehicleId && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="glass p-4 rounded-xl">
                      <div className="text-gray-400 mb-1">Vehicle</div>
                      <div className="font-bold">{selectedReceipt.vehicleId.vehicleNo}</div>
                    </div>
                    <div className="glass p-4 rounded-xl">
                      <div className="text-gray-400 mb-1">Method</div>
                      <div className="font-bold capitalize">{selectedReceipt.paymentId?.method}</div>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => downloadPDF(selectedReceipt._id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-6 rounded-2xl font-bold transition-all"
                  >
                    Download PDF
                  </button>
                  <button 
                    onClick={() => setSelectedReceipt(null)}
                    className="flex-1 bg-gray-600/50 hover:bg-gray-500/50 text-white py-4 px-6 rounded-2xl font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptsPage;

