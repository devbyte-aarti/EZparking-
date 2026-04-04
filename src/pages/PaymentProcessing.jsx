import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentProcessing = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || 'demo';
  const amount = searchParams.get('amount') || '50';

  const steps = [
    'Processing Payment...',
    'Verifying Transaction...',
    'Connecting to Bank...',
    'Confirming Payment...'
  ];

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      setStep(current);
      current++;
      if (current >= steps.length) {
        clearInterval(interval);
        // Simulate API success
        setTimeout(() => {
          setLoading(false);
          // Auto redirect to success with params
          navigate(`/payment-success?paymentId=${paymentId}&amount=${amount}&txnId=TXN${Math.floor(Math.random() * 900000) + 100000}`);
        }, 500);
      }
    }, 700); // ~2.8s total

    return () => clearInterval(interval);
  }, [navigate, paymentId, amount]);

  if (!loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-glass p-12 text-center w-full max-w-md backdrop-blur-xl"
      >
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-8"></div>
        
        <div className="space-y-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Processing Payment
          </h2>
          
          <div className="space-y-3 text-lg">
            {steps.map((msg, idx) => (
              <motion.div
                key={msg}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: idx <= step ? 1 : 0.5, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                className={`font-mono text-xl ${idx <= step ? 'text-green-400' : 'text-gray-400'}`}
              >
                {idx === step && (
                  <span className="animate-pulse mr-2">🔄</span>
                )}
                {msg}
              </motion.div>
            ))}
          </div>

          <div className="text-sm text-emerald-400 font-semibold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            Amount: ₹{amount} | Secure Payment Gateway 🔒
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div>Do not close or refresh this page</div>
            <div>Powered by EzParking Payment Gateway</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentProcessing;

