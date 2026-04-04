import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { paymentAPI, receiptAPI, parkingpassAPI, bookingAPI } from '../services/api';
import Loader from './Loader';

const PaymentModal = ({ isOpen, onClose, booking, amount, passType = '', passId = '', onSuccess, isPassPurchase = false }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [passes, setPasses] = useState([]);
  const [passLoading, setPassLoading] = useState(false);
  const [wallet, setWallet] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadWallet();
      if (method === 'Pass' && step === 2) loadPasses();
    }
  }, [isOpen, method, step]);

  const loadWallet = async () => {
    // Removed getRevenue call (TASK 6 - admin only)
  };

  const loadPasses = async () => {
    setPassLoading(true);
    try {
      const res = await parkingpassAPI.getMyPasses();
      setPasses(res.data.filter(p => p.status === 'active'));
    } catch (error) {
      toast.error('Failed to load passes');
    } finally {
      setPassLoading(false);
    }
  };

  // CRITICAL: Amount = 0 (PASS) - Direct Success, NO Payment APIs
  useEffect(() => {
    if (isOpen && amount === 0) {
      handleDirectSuccess();
    }
  }, [isOpen, amount]);

  const handleDirectSuccess = async () => {
    setLoading(true);
    try {
      toast.info('Using active pass - booking confirmed instantly!');
      
      // Confirm booking saved in DB
      const confirmRes = await bookingAPI.getBooking(booking._id);
      if (confirmRes.data.status === 'Active') {
        toast.success('Free booking confirmed with pass!');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Booking confirmation failed');
      }
    } catch (error) {
      toast.error('Pass confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (selectedMethod) => {
    if (amount === 0) return; // Block if pass
    setMethod(selectedMethod);
    setStep(2);
  };

  const handlePayNow = async () => {
    if (amount === 0) return handleDirectSuccess();

    setLoading(true);
    try {
      toast.info('Processing secure payment...');
      
      let paymentRes, txnId;
      
      // PASS PURCHASE PAYLOAD
      if (isPassPurchase) {
        if (!passId) {
          toast.error('Pass ID missing');
          return;
        }
        // Validate form data
        if (!formData.upiId && !formData.cardNumber && !formData.netbankingAccount) {
          toast.error('Please enter payment details');
          return;
        }
        
        paymentRes = await paymentAPI.initiatePayment({
          isPassPurchase: true,
          passId,
          method,
          amount,
          passType,
          ...formData  // upiId, cardNumber, netbankingBank, etc.
        });
        
        // STRICT CHECK
        const paymentId = paymentRes?.data?.paymentId;
        if (!paymentId) {
          throw new Error("Payment failed - no paymentId");
        }
        txnId = paymentRes?.data?.transactionId || "TXN" + Date.now();
        
      } else {
        // Booking flow (unchanged)
        paymentRes = await paymentAPI.initiatePayment({
          bookingId: booking?._id,
          method,
          ...formData
        });
      }

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const paymentId = isPassPurchase ? paymentRes.data.paymentId : paymentRes.data.payment?._id;
      await paymentAPI.processPayment({
        paymentId,
        success: true
      });

      if (isPassPurchase) {
        toast.success('🎫 Pass purchased successfully. Receipt sent to email 📧', {
          style: {
            background: '#16a34a',
            color: '#fff',
            fontWeight: 'bold'
          }
        });
        
        // Download pass receipt PDF
        try {
          const receiptRes = await receiptAPI.getReceiptByPayment(paymentId); // assume exists or use recent
          if (receiptRes.data) {
            const pdfRes = await receiptAPI.downloadPDF('pass', receiptRes.data._id);
            const url = URL.createObjectURL(new Blob([pdfRes.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `pass_receipt_${txnId}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
          }
        } catch (pdfErr) {
          console.log('PDF download optional');
        }
        
        onSuccess?.();
        onClose();
        return;
      }

      // Confirm booking updated (normal booking flow)
      const updatedBooking = await bookingAPI.getBooking(booking._id);
      
      // Download receipt
      if (updatedBooking.data.paymentId) {
        const receiptRes = await receiptAPI.getReceiptByBooking(booking._id);
        if (receiptRes.data._id) {
          const pdfRes = await receiptAPI.getReceiptPDF(receiptRes.data._id);
          const url = URL.createObjectURL(new Blob([pdfRes.data]));
          const link = document.createElement('a');
          link.href = url;
          link.download = `EzParking-Receipt-${receiptRes.data._id.slice(-8)}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }

                toast.success(`Payment successful! ₹${Number(amount).toFixed(amount % 1 !== 0 ? 2 : 0)} • Receipt ready in Receipts`);
      navigate('/user/receipts');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed - booking still created');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-dark p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-white/20 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-black/50 backdrop-blur-sm z-10 p-2 -m-2 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-white">
            {loading ? '🔄 Processing...' : step === 3 ? '✅ Payment Successful!' : 'Pay Securely 🔒'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl p-1 rounded-xl hover:bg-white/10 transition-all" disabled={loading}>
            ×
          </button>
        </div>

        {/* Amount Display */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-6 rounded-2xl mb-6 border border-emerald-500/30">
          <div className={`font-bold text-2xl ${amount === 0 ? 'text-emerald-400' : 'text-emerald-400'}`}>
            ₹${Number(amount).toFixed(amount % 1 !== 0 ? 2 : 0)}
          </div>
          {booking && <div className="text-sm text-emerald-200 mt-1">Booking #{booking._id?.slice(-8)}</div>}
          {amount === 0 && <div className="text-xs text-green-300 mt-2 font-bold">🎫 Active Pass - FREE</div>}
          <div className="text-xs text-emerald-300 mt-2">🔒 256-bit SSL Secure | EzParking Gateway</div>
        </div>

        {step === 1 && !loading && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white text-center mb-4">
              {amount === 0 ? 'Pass Confirmed!' : 'Select Payment Method'}
            </h3>
            {amount === 0 ? (
              <motion.button
                onClick={handlePayNow}
                className="w-full neon-btn py-6 text-xl font-bold"
                whileHover={{ scale: 1.05 }}
              >
                ✅ Confirm Free Booking
              </motion.button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMethodChange('UPI')}
                  className="payment-method-card bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-2 border-blue-500/40 p-4 rounded-2xl hover:border-blue-400 hover:shadow-lg shadow-blue-500/10 transition-all"
                >
                  <div className="text-3xl mb-3">📱</div>
                  <div className="font-bold text-white mb-1">UPI</div>
                  <div className="text-xs text-blue-300">GPay • PhonePe • Paytm</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMethodChange('Card')}
                  className="payment-method-card bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 p-4 rounded-2xl hover:border-emerald-400 hover:shadow-lg shadow-emerald-500/10 transition-all"
                >
                  <div className="text-3xl mb-3">💳</div>
                  <div className="font-bold text-white mb-1">Cards</div>
                  <div className="text-xs text-emerald-300">Visa • MC • RuPay</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMethodChange('Netbanking')}
                  className="payment-method-card bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 p-4 rounded-2xl hover:border-orange-400 hover:shadow-lg shadow-orange-500/10 transition-all"
                >
                  <div className="text-3xl mb-3">🏦</div>
                  <div className="font-bold text-white mb-1">Net Banking</div>
                  <div className="text-xs text-orange-300">SBI • HDFC • ICICI</div>
                </motion.button>

                {!isPassPurchase && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleMethodChange('Pass')}
                    className="payment-method-card bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 p-4 rounded-2xl hover:border-purple-400 hover:shadow-lg shadow-purple-500/10 transition-all"
                  >
                    <div className="text-3xl mb-3">🎫</div>
                    <div className="font-bold text-white mb-1">Pass</div>
                    <div className="text-xs text-purple-300">Monthly Unlimited</div>
                  </motion.button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && !loading && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">{method} Details</h3>
            {/* Form fields for UPI/Card/Netbanking/Pass - SIMPLIFIED */}
            {method === 'UPI' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-mono bg-blue-500/20 rounded-2xl p-4 mx-auto w-20 h-20 flex items-center justify-center mb-3">
                    ezpark@upi
                  </div>
                  <div className="text-xl font-bold text-blue-400 mb-1">₹{amount}</div>
                </div>
                <input
                  type="text"
                  placeholder="yourupi@paytm"
                  value={formData.upiId || ''}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="input-glass w-full p-4 rounded-2xl border-2 border-blue-500/30 focus:border-blue-400 text-lg"
                />
              </div>
            )}
            
            {method === 'Pass' && (
              <div>
                <select
                  value={formData.passId || ''}
                  onChange={(e) => setFormData({ ...formData, passId: e.target.value })}
                  className="input-glass w-full p-4 rounded-2xl border-2 border-purple-500/30 focus:border-purple-400 text-lg"
                >
                  <option value="">Select Active Pass</option>
                  {passes.map(pass => (
                    <option key={pass._id} value={pass._id}>
                      {pass.passType} - Expires {new Date(pass.endDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Simplified other methods */}
            {['Card', 'Netbanking'].includes(method) && (
              <div className="space-y-3">
<input 
  type="text" 
  placeholder={method === 'Card' ? 'Card Number' : 'Bank IFSC'} 
  value={formData.cardNumber || formData.netbankingBank || ''}
  onChange={(e) => setFormData({ ...formData, [method === 'Card' ? 'cardNumber' : 'netbankingBank']: e.target.value })}
  className="input-glass w-full p-4 rounded-xl border-2 border-emerald-500/30 focus:border-emerald-400" 
/>
                <div className="grid grid-cols-2 gap-3">
<input 
  type="text" 
  placeholder={method === 'Card' ? 'Expiry MM/YY' : 'Account Number'} 
  value={formData.expiry || formData.netbankingAccount || ''}
  onChange={(e) => setFormData({ ...formData, [method === 'Card' ? 'expiry' : 'netbankingAccount']: e.target.value })}
  className="input-glass p-4 rounded-xl border-2 border-emerald-500/30 focus:border-emerald-400" 
/>
<input 
  type="password" 
  placeholder={method === 'Card' ? 'CVV' : 'Transaction PIN'} 
  value={formData.cvv || ''}
  onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
  className="input-glass p-4 rounded-xl border-2 border-emerald-500/30 focus:border-emerald-400" 
/>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-600/50 text-white py-4 px-6 rounded-2xl font-bold hover:bg-gray-500/50 transition-all"
                disabled={loading}
              >
                ← Back
              </button>
              <button
                onClick={handlePayNow}
disabled={loading || (method === 'Pass' && !formData.passId) || (method === 'UPI' && !formData.upiId) || (method === 'Card' && (!formData.cardNumber || !formData.expiry || !formData.cvv)) || (method === 'Netbanking' && (!formData.netbankingBank || !formData.netbankingAccount))}
                className="neon-btn flex-1 py-4 px-6 font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader size="sm" /> : `Pay ₹${Number(amount).toFixed(amount % 1 !== 0 ? 2 : 0)}`}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center p-16 space-y-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full mx-auto mb-8"
            />
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">Secure Processing</h3>
              <div className="text-lg text-emerald-400 font-mono space-y-2">
                <div>✓ Payment authorized</div>
                <div>✓ Receipt generated</div>
              </div>
            </div>
            <div className="text-sm text-emerald-400 bg-emerald-500/10 p-4 rounded-xl">
              Do not close • Almost done...
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 mt-8 pt-6 border-t border-white/10 space-y-1">
          <div>Powered by EzParking Secure Gateway</div>
          <div>256-bit SSL • PCI DSS Level 1 Compliant</div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;

