import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'normal'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill email and password');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      
      // Clear old token if any
      // Redirect based on role from server response
      const userRole = response.data.user.role;
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'lotowner') {
        navigate('/lotowner');
      } else {
        navigate('/user');
      }
    } catch (error) {
      // Clear invalid token
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      toast.error(error.response?.data?.message || 'Login failed. Check server logs.');
      console.error('Login error:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
      backgroundImage: `url('/image/login_bc.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-glass p-8 w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">EZ Parking</h1>
            <p className="text-gray-300">Welcome back! Please login to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="block text-white mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-glass"
                placeholder="Enter your password"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-glass"
              >
                <option value="normal">User</option>
                <option value="lotowner">Lot Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-purple-300 hover:text-purple-200">
                Forgot Password?
              </Link>
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
                'Login'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-300 hover:text-purple-200 font-semibold">
                Register
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
