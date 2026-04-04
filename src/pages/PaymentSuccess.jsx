import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { receiptAPI, paymentAPI } from '../services/api';
import { useUserStore } from '../stores/userStore'; // Assuming user store exists

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const { user } = useUserStore();
  
  const txnId = searchParams.get('txnId') || 'TXN874562';
  const amount = searchParams.get('amount') || '50';
  const paymentId = searchParams.get('paymentId') || 'demo';
  const bookingId = searchParams.get('bookingId') || null;
  const now = new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  });

  const handleDownloadReceipt = async () => {
    if (!bookingId) {
      toast.info('No booking ID provided');
      return;
    }
    setLoadingReceipt(true);
    try {
      const receiptRes = await receiptAPI.getReceiptByBooking(bookingId);
      if (receiptRes.data._id) {
        const pdfRes = await receiptAPI.getReceiptPDF(receiptRes.data._id);
        const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `EzParking-Receipt-${receiptRes.data._id}.pdf`;
        link.click();
        toast.success('Receipt downloaded!');
      }
    } catch (error) {
      toast.error('Receipt generation failed');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleBackToDashboard = () => {
    const role = user?.role || 'user';
    navigate(role === 'admin' ? '/admin' : role === 'lotowner' ? '/lotowner' : '/user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900/50 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass p-12 text-center w-full max-w-2xl backdrop-blur-2xl border border-green-500/20 shadow-2xl"
      >
        {/* Success Icon */}
        <div className="w-32 h-32 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border-4 border-green-500/50">
          <div className="text-6xl">✅</div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-6">
          Payment Successful!
        </h1>

        {/* Details Card */}
        <div className="bg-white/10 p-8 rounded-3xl mb-8 border-2 border-green-500/30 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <div className="text-sm font-medium text-green-300 mb-1">Transaction ID</div>
              <div className="font-mono text-2xl text-white bg-black/30 px-4 py-2 rounded-xl tracking-wider">
                {txnId}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-green-300 mb-1">Amount Paid</div>
              <div className="text-4xl font-bold text-green-400">₹{amount}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-medium text-green-300 mb-1">Date & Time</div>
              <div className="text-lg text-white">{now}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-10">
          <div className="text-xl text-green-300">Your parking is confirmed!</div>
          <div className="text-lg text-white/90">Receipt emailed to your registered email</div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadReceipt}
            disabled={loadingReceipt || !bookingId}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingReceipt ? 'Generating...' : '📄 Download Receipt'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToDashboard}
            className="flex-1 bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all"
          >
            ← Back to Dashboard
          </motion.button>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-xs text-green-400/80 text-center">
          <div>🔒 Secure Payment | Powered by EzParking Gateway</div>
          <div>Transaction protected with bank-grade encryption</div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;

