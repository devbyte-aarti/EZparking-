import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { paymentAPI } from '../services/api';

const UpiPayment = () => {
  return null; // Deprecated - use main Payment component
};
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!upiId) {
      toast.error('Please enter UPI ID');
      return;
    }
    setLoading(true);
    
    try {
      // Simulate QR scan/payment
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const res = await paymentAPI.process({
        paymentId: 'auto', // From context
        success: true
      });
      
      toast.success('UPI Payment Successful!');
      onSuccess(res.data);
    } catch (error) {
      toast.error('Payment Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onBack}
        className="text-gray-400 hover:text-white mb-4"
      >
        ← Back to Methods
      </motion.button>

      <div className="text-center">
        <div className="text-5xl mb-4">📱</div>
        <h2 className="text-2xl font-bold text-white mb-2">Pay with UPI</h2>
        <p className="text-gray-400 mb-6">Scan QR or enter UPI ID</p>
      </div>

      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 rounded-2xl p-6 text-center">
        <div className="text-4xl font-mono bg-black/50 rounded-xl p-4 mx-auto w-32 h-32 mb-4 flex items-center justify-center">
          ezparking@upi
        </div>
        <div className="text-xl text-blue-400 font-bold mb-2">₹{amount}</div>
        <div className="text-sm text-gray-400">Enter UPI ID to pay</div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="yourupi@paytm"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="input-glass w-full p-4 text-lg"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePay}
          disabled={loading || !upiId}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg neon-btn"
        >
          {loading ? 'Processing...' : `Pay Now ₹${amount}`}
        </motion.button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Secure payment powered by UPI • Instant confirmation
      </div>
    </div>
  );
};

export default UpiPayment;

