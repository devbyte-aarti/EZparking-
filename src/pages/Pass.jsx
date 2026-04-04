import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { parkingpassAPI } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import Navbar from '../components/Navbar';

const Pass = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await parkingpassAPI.getPasses();
      setTemplates(res.data);
    } catch (error) {
      toast.error('Failed to load pass templates');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPass = (pass) => {
    setSelectedPass(pass);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('🎫 Pass purchased successfully!');
    loadTemplates();
    setShowPayment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8 space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-6">
            Parking Passes
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Buy monthly or yearly passes for unlimited parking access. Save money and hassle!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {templates.map((pass) => (
            <motion.div
              key={pass._id}
              className="group glass-dark rounded-3xl p-8 border-2 border-white/10 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/25 transition-all cursor-pointer overflow-hidden hover:scale-[1.02] bg-gradient-to-b from-transparent to-black/20"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleBuyPass(pass)}
            >
              <div className="relative">
                <div className="absolute top-4 right-4 bg-green-500/20 border border-green-500/50 px-3 py-1 rounded-full text-xs font-bold text-green-300">
                  Active Template
                </div>
                <div className="text-5xl mx-auto mb-6 flex justify-center">{pass.passType === 'monthly' ? '🗓️' : '📅'}</div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-white mb-3 capitalize">
                    {pass.passType} Pass
                  </h3>
                  <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-4">
                    ₹{pass.price}
                  </div>
                  <div className="text-lg text-gray-300 mb-2">
                    {pass.durationDays} days validity
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-8 text-center">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-400 mb-1">∞</div>
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wide">Unlimited</div>
                    <div className="text-xs text-white/70">Bookings</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="text-lg font-bold text-blue-400 mb-1">0₹</div>
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wide">Per Booking</div>
                    <div className="text-xs text-white/70">After Purchase</div>
                  </div>
                </div>

                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <div className="text-center w-full">
                    <div className="text-lg font-bold text-white mb-2">Ready to Save?</div>
                    <div className="text-white/90 text-sm mb-4">Tap to purchase</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Modal */}
        {showPayment && selectedPass && (
          <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            amount={selectedPass.price}
            selectedPass={selectedPass}
            onSuccess={handlePaymentSuccess}
            isPassPurchase={true}
          />
        )}
      </div>
    </div>
  );
};

export default Pass;

