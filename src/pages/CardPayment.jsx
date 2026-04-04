import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { paymentAPI } from '../services/api';

const CardPayment = () => {
  return null; // Deprecated - use main Payment component
};
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePay = async () => {
    if (!formData.cardNumber || !formData.expiry || !formData.cvv || !formData.name) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const res = await paymentAPI.process({
        paymentId: 'auto',
        success: true
      });
      
      toast.success('Card Payment Successful!');
      onSuccess(res.data);
    } catch (error) {
      toast.error('Payment Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.button onClick={onBack} className="text-gray-400 hover:text-white mb-4">
        ← Back
      </motion.button>

      <div className="text-center">
        <div className="text-5xl mb-4">💳</div>
        <h2 className="text-2xl font-bold text-white mb-2">Pay with Card</h2>
        <p className="text-gray-400">Enter card details securely</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-white mb-2 font-medium">Card Number</label>
          <input
            name="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            value={formData.cardNumber}
            onChange={handleInput}
            className="input-glass w-full p-4"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-2 font-medium">Expiry</label>
            <input
              name="expiry"
              type="text"
              placeholder="MM/YY"
              maxLength={5}
              value={formData.expiry}
              onChange={handleInput}
              className="input-glass w-full p-4"
            />
          </div>
          <div>
            <label className="block text-white mb-2 font-medium">CVV</label>
            <input
              name="cvv"
              type="text"
              placeholder="123"
              maxLength={3}
              value={formData.cvv}
              onChange={handleInput}
              className="input-glass w-full p-4"
            />
          </div>
        </div>
        <div>
          <label className="block text-white mb-2 font-medium">Cardholder Name</label>
          <input
            name="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleInput}
            className="input-glass w-full p-4"
          />
        </div>
      </div>

      <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30 mb-6">
        <div className="text-green-400 font-bold">Total: ₹{amount}</div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg"
      >
        {loading ? 'Processing Securely...' : `Pay ₹{amount} with Card`}
      </motion.button>

      <div className="text-xs text-gray-500 text-center">
        🔒 Secure with 256-bit SSL • 3D Secure verified
      </div>
    </div>
  );
};

export default CardPayment;
