import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { paymentAPI, receiptAPI, parkingpassAPI } from '../services/api';

const Payment = ({ isOpen, onClose, booking, onSuccess, isPassPurchase = false }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [formData, setFormData] = useState({});
  const [passes, setPasses] = useState([]);
  const [passLoading, setPassLoading] = useState(false);

  const amount = booking?.totalAmount || 0;

  useEffect(() => {
    if (method === 'Pass' && step === 2) {
      loadPasses();
    }
  }, [method, step]);

  const loadPasses = async () => {
    if (!booking) return;
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

  const handleMethodChange = (selectedMethod) => {
    setMethod(selectedMethod);
    setStep(2);
  };

  const handlePayNow = async () => {
    setLoading(true);
    setStep(3);

    const interval = setInterval(() => {
      if (step < 4) setStep(step + 1);
      if (step >= 4) {
        clearInterval(interval);
        handlePaymentSuccess();
      }
    }, 800);

    setTimeout(() => clearInterval(interval), 3200);
  };

const handlePaymentSuccess = async () => {
    try {
      // VALIDATION: Ensure booking exists
      if (!booking?._id) {
        throw new Error("No valid booking found. Please create booking first.");
      }

      const normalizedMethod = Payment.normalizeMethod ? Payment.normalizeMethod(method) : method.toLowerCase();
      const payload = {
        bookingId: booking._id,
        method: normalizedMethod,
        isPassPurchase: false  // Modal is for bookings, not pass purchase
      };

      // Add passId for pass method
      if (normalizedMethod === 'pass' && formData.passId) {
        payload.passId = formData.passId;
      }

      console.log('Payment payload:', payload);
      const res = await paymentAPI.initiatePayment(payload);

      // PASS BOOKING - instant confirmation
      if (res.data?.usePass) {
        toast.success("Booking confirmed using Pass");
        onSuccess?.();
        onClose();
        return;
      }

      // Extract payment details
      const paymentId = res.data?.paymentId;
      if (!paymentId) {
        throw new Error("Payment initiation failed - no paymentId");
      }

      // Process payment (simulate success for demo)
      await paymentAPI.processPayment({
        paymentId: paymentId,
        success: true
      });


      // Set transaction ID
      setTxnId(res.transactionId || "TXN" + Date.now());

      setStep(4);
      setLoading(false);

      setTimeout(async () => {
        if (booking?._id) {
          const receiptRes = await receiptAPI.getReceiptByBooking(booking._id);
          if (receiptRes.data._id) {
            const pdfRes = await receiptAPI.getReceiptPDF(receiptRes.data._id);
            const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `EzParking-Receipt-${receiptRes.data._id}.pdf`;
            link.click();
          }
        }
        toast.success('Payment successful! Receipt sent to email.');
        onSuccess?.();
        setTimeout(onClose, 3000);
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + (error.message || 'Unknown error'));
      setLoading(false);
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-glass p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {step === 4 ? '✅ Payment Successful!' : step === 3 ? 'Processing...' : 'Pay Securely 🔒'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-6 rounded-2xl mb-6 border-2 border-emerald-500/30">
          <div className="text-emerald-400 font-bold">Amount: ₹{Number(amount).toFixed(amount % 1 !== 0 ? 2 : 0)}</div>
          {booking && (
            <div className="text-sm text-emerald-200 mt-1">Booking #{booking._id?.slice(-8)}</div>
          )}
          <div className="text-xs text-emerald-300 mt-2 flex items-center gap-1">
            🔒 256-bit SSL | EzParking Secure Gateway
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white text-center">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMethodChange('UPI')}
                className="payment-method-card bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-2 border-blue-500/40 p-4 rounded-2xl hover:border-blue-400 hover:shadow-lg shadow-blue-500/10 transition-all group"
              >
                <div className="text-4xl mb-4">📱</div>
                <div className="font-bold text-white text-lg mb-2">UPI</div>
                <div className="flex gap-2 text-sm text-blue-300 justify-center flex-wrap">
                  <span className="px-2 py-1 bg-blue-500/20 rounded-lg">GPay</span>
                  <span className="px-2 py-1 bg-indigo-500/20 rounded-lg">PhonePe</span>
                  <span className="px-2 py-1 bg-purple-500/20 rounded-lg">Paytm</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMethodChange('Card')}
                className="payment-method-card bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 p-4 rounded-2xl hover:border-emerald-400 hover:shadow-lg shadow-emerald-500/10 transition-all group"
              >
                <div className="text-4xl mb-4">💳</div>
                <div className="font-bold text-white text-lg mb-2">Card</div>
                <div className="flex gap-2 text-sm text-emerald-300 justify-center flex-wrap">
                  <span className="px-2 py-1 bg-emerald-500/20 rounded-lg">Visa</span>
                  <span className="px-2 py-1 bg-blue-500/20 rounded-lg">Mastercard</span>
                  <span className="px-2 py-1 bg-orange-500/20 rounded-lg">RuPay</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMethodChange('Net Banking')}
                className="payment-method-card bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 p-4 rounded-2xl hover:border-orange-400 hover:shadow-lg shadow-orange-500/10 transition-all group"
              >
                <div className="text-4xl mb-4">🏦</div>
                <div className="font-bold text-white text-lg mb-2">Net Banking</div>
                <div className="flex gap-2 text-sm text-orange-300 justify-center flex-wrap">
                  <span className="px-2 py-1 bg-orange-500/20 rounded-lg">SBI</span>
                  <span className="px-2 py-1 bg-blue-500/20 rounded-lg">HDFC</span>
                  <span className="px-2 py-1 bg-indigo-500/20 rounded-lg">ICICI</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => handleMethodChange('Pass')}
                className="payment-method-card bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 p-4 rounded-2xl hover:border-purple-400 hover:shadow-lg shadow-purple-500/10 transition-all"
              >
                <div className="text-4xl mb-4">🎫</div>
                <div className="font-bold text-white text-lg mb-2">Parking Pass</div>
                <div className="text-sm text-purple-300">{isPassPurchase ? 'Buy New Pass' : 'Use Existing Pass'}</div>
              </motion.button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">
              {method === 'Pass' ? 'Select Pass' : method === 'Net Banking' ? 'Choose Bank' : `${method} Payment`}
            </h3>

            {method === 'UPI' && (
              <div className="space-y-4">
                <label className="block text-white font-semibold mb-3">Enter UPI ID</label>
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl p-4 text-center mb-4">
                  <div className="text-4xl font-mono bg-blue-500/20 rounded-2xl p-6 mx-auto w-24 h-24 flex items-center justify-center mb-3">
                    ezpark@upi
                  </div>
                  <div className="text-2xl font-bold text-blue-400 mb-1">₹{amount}</div>
                </div>
                <input
                  type="text"
                  placeholder="yourupi@paytm"
                  value={formData.upiId}
                  onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                  className="input-glass w-full p-4 text-lg rounded-2xl border-2 border-blue-500/30 focus:border-blue-400"
                />
              </div>
            )}

            {method === 'Card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={formData.cardNumber.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || ''}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\s/g, '');
                      val = val.match(/.{1,4}/g)?.join(' ') || val;
                      setFormData({...formData, cardNumber: val});
                    }}
                    className="input-glass w-full p-4 rounded-xl text-lg border-2 border-green-500/30 focus:border-emerald-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Expiry MM/YY</label>
                    <input
                      type="text"
                      placeholder="12/25"
                      maxLength={5}
                      value={formData.expiry}
                      onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                      className="input-glass w-full p-4 rounded-xl border-2 border-green-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength={3}
                      value={formData.cvv}
                      onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                      className="input-glass w-full p-4 rounded-xl border-2 border-green-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.cardName}
                    onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                    className="input-glass w-full p-4 rounded-xl border-2 border-green-500/30 focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {method === 'Net Banking' && (
              <div>
                <label className="block text-white font-semibold mb-3">Select Bank</label>
                <select
                  value={formData.netbankingBank}
                  onChange={(e) => setFormData({...formData, netbankingBank: e.target.value})}
                  className="input-glass w-full p-5 text-lg rounded-2xl border-2 border-orange-500/30 focus:border-orange-400 appearance-none bg-no-repeat bg-right"
                >
                  <option value="">Choose Bank</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                </select>
              </div>
            )}

            {method === 'Pass' && (
              <div>
                <label className="block text-white font-semibold mb-3">Select Parking Pass</label>
                {passLoading ? (
                  <div className="input-glass p-5 text-center text-gray-400 rounded-2xl">Loading passes...</div>
                ) : (
                  <select
                    value={formData.passId || ''}
                    onChange={(e) => setFormData({...formData, passId: e.target.value})}
                    className="input-glass w-full p-5 text-lg rounded-2xl border-2 border-purple-500/30 focus:border-purple-400 appearance-none"
                    disabled={passLoading}
                  >
                    <option value="">Choose active pass</option>
                    {passes.length === 0 ? (
                      <option disabled>No active passes found</option>
                    ) : (
                      passes.map((pass) => (
                        <option key={pass._id} value={pass._id}>
                          {pass.name || `${pass.passType}`} - Expires {new Date(pass.endDate).toLocaleDateString()}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gradient-to-r from-gray-600/50 to-gray-700/50 text-white py-4 px-6 rounded-2xl font-bold hover:from-gray-500/50 transition-all border border-gray-500/30"
              >
                ← Back
              </button>
              <button
                onClick={handlePayNow}
                disabled={loading || (method === 'UPI' && !formData.upiId) || (method === 'Card' && !formData.cardNumber) || (method === 'Net Banking' && !formData.netbankingBank) || (method === 'Pass' && !formData.passId)}
                className="neon-btn flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay Now ₹${Number(amount).toFixed(amount % 1 !== 0 ? 2 : 0)}`
                )}
              </button>
            </div>

            <div className="text-center text-xs text-gray-400 mt-6 pt-6 border-t border-white/10">
              <div>🔒 Secure Payment Gateway</div>
              <div>Bank-grade encryption • Instant confirmation</div>
            </div>
          </div>
        )}

        {step === 3 && loading && (
          <div className="text-center space-y-8 p-12">
            <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-8"></div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Processing Payment</h3>
              <div className="space-y-3 text-lg font-mono">
                <div className={`flex items-center gap-3 ${step >= 1 ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full ${step >= 1 ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                  Processing Payment...
                </div>
                <div className={`flex items-center gap-3 ${step >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full ${step >= 2 ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                  Verifying Transaction...
                </div>
                <div className={`flex items-center gap-3 ${step >= 3 ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full ${step >= 3 ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                  Connecting to Bank...
                </div>
                <div className={`flex items-center gap-3 ${step >= 4 ? 'text-green-500' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full ${step >= 4 ? 'bg-green-500 animate-bounce' : 'bg-gray-600'}`} />
                  Confirming Payment...
                </div>
              </div>
            </div>
            <div className="text-sm text-blue-400 font-medium bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
              Amount: ₹${Number(amount).toFixed(amount % 1 !== 0 ? 2 : 0)} | Payment ID: {booking?._id?.slice(-8)}
            </div>
            <div className="text-xs text-gray-500 mt-8">
              Do not refresh or close • Secure processing
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-8">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-6xl mb-6"
            >
              ✅
            </motion.div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Payment Successful!
            </h3>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-8 rounded-3xl border-2 border-green-500/30">
              <div className="text-green-400 font-bold mb-2">Amount Paid</div>
              <div className="text-5xl font-black text-white mb-6">₹${Number(amount).toFixed(amount % 1 !== 0 ? 2 : 0)}</div>
              <div className="space-y-3 text-sm bg-black/20 p-4 rounded-2xl">
                <div>Transaction ID: <span className="font-mono text-lg bg-black/50 px-3 py-1 rounded-xl">{txnId || 'TXN' + Math.floor(Math.random() * 900000) + 100000}</span></div>
                <div>Date: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
              </div>
            </div>
            <div className="text-lg text-green-300 mb-8">
              Receipt sent to your email 📧
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Parking slot confirmed & ready</div>
              <div>Check your dashboard for details</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Payment;

