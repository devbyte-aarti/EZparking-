import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    DOB: '',
    licenceNo: '',
    Phone: '',
    role: 'normal'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.DOB || !formData.licenceNo) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Password validation feedback
    const passwordRegex = /^(?=.*[A-Za-z]{3,})(?=.*\d{3,})[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 6 characters with at least 3 letters and 3 numbers');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      toast.success(response.data.message);
      
      // Redirect based on role
      if (formData.role === 'lotowner') {
        toast.info('Please wait for Admin Approval before logging in');
      }
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-bg min-h-screen flex items-center justify-center">
      <div className="min-h-screen bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-glass p-8 w-full max-w-lg my-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">EZ Parking</h1>
            <p className="text-gray-300">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-glass"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-glass"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Date of Birth</label>
              <input
                type="date"
                name="DOB"
                value={formData.DOB}
                onChange={handleChange}
                className="input-glass"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">License Number</label>
              <input
                type="text"
                name="licenceNo"
                value={formData.licenceNo}
                onChange={handleChange}
                className="input-glass"
                placeholder="Enter your license number"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Phone Number</label>
              <input
                type="tel"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
                className="input-glass"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-glass"
                placeholder="Min 6 chars, 3 letters, 3 numbers"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-glass"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Register As</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-glass"
              >
                <option value="normal">User</option>
                <option value="lotowner">Lot Owner</option>
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="neon-btn w-full py-3 text-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="spinner mx-auto"></div>
              ) : (
                'Register'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-300 hover:text-purple-200 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

