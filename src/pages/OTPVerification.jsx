

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const OTPVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(searchParams.get('email') || '');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.verifyOTP({ email, otp });
      toast.success('OTP verified! You can now reset password.');
      navigate('/reset-password?email=' + encodeURIComponent(email));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.forgotPassword({ email });
      toast.success('New OTP sent!');
    } catch (error) {
      toast.error('Failed to send OTP');
    }
  };

  useEffect(() => {
    if (!email) {
      toast.error('Email required');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  return (
    <div className="login-bg min-h-screen flex items-center justify-center">
      <div className="min-h-screen bg-black/60 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-glass p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">EZ Parking</h1>
            <p className="text-gray-300 mb-2">Enter OTP sent to</p>
            <p className="text-white font-semibold bg-purple-900/50 px-3 py-1 rounded">{email}</p>
            <p className="text-purple-300 text-sm mt-2">Valid for 2 minutes</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-white mb-2">Enter 6-digit OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="input-glass text-center text-2xl tracking-widest"
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading || otp.length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="neon-btn w-full py-3 text-lg disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </motion.button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <button 
              onClick={handleResend} 
              className="text-purple-300 hover:text-purple-200 underline"
              disabled={loading}
            >
              Resend OTP
            </button>
            <Link to="/login" className="text-purple-300 hover:text-purple-200 block">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OTPVerification;


