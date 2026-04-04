import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { parkingpassAPI, paymentAPI } from '../services/api';

const PassPayment = () => {
  return null; // Deprecated - use main Payment component
};
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      const res = await parkingpassAPI.getMyPasses();
      setPasses(res.data.filter(p => p.status === 'active'));
    } catch (error) {
      toast.error('Error loading passes');
    } finally {
      setLoading(false);
    }
  };

  const handleUsePass = async (passId) => {
    setLoading(true);
    
    try {
      // Process with pass
      const res = await paymentAPI.process({
        paymentId: 'pass',
        method: 'Pass',
        passId
      });
      
      toast.success('Pass applied! Booking confirmed');
      onSuccess(res.data);
    } catch (error) {
      toast.error('Pass invalid');
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
        <div className="text-5xl mb-4">🎫</div>
        <h2 className="text-2xl font-bold text-white mb-2">Use Parking Pass</h2>
        <p className="text-gray-400">Select active pass for free parking</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div>Loading passes...</div>
        </div>
      ) : passes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No active passes found. <br />
          <span className="text-sm">Buy monthly/yearly pass from dashboard</span>
        </div>
      ) : (
        <div className="space-y-3">
          {passes.map((pass) => (
            <motion.div
              key={pass._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-xl p-6 cursor-pointer hover:border-purple-400/50"
              onClick={() => handleUsePass(pass._id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-white text-lg capitalize">{pass.passType} Pass</div>
                  <div className="text-sm text-gray-300">Valid till {new Date(pass.endDate).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">FREE</div>
                  <div className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">Active</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">Pass ID: {pass._id.slice(-8)}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Passes auto-renew • Unlimited parking during validity
      </div>
    </div>
  );
};

