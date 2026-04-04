import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div className="fixed-bg min-h-screen">
      <div className="min-h-screen bg-black/50">
        {/* Navigation */}
        <nav className="glass-dark fixed w-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-white">EZ Parking</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-white hover:text-purple-300 transition-colors"
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="neon-btn"
                  >
                    Register
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-screen pt-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center px-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Smart Parking <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Solution</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Experience the future of parking management with EZ Parking. 
              Book your spot, manage your vehicles, and enjoy seamless parking experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="neon-btn text-lg px-8 py-4"
                >
                  Get Started
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass px-8 py-4 text-white text-lg rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  Login
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-7xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white text-center mb-12">Why Choose EZ Parking?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Easy Booking',
                  desc: 'Book your parking spot in seconds with our intuitive interface',
                  icon: '🚀'
                },
                {
                  title: 'Secure Payments',
                  desc: 'Safe and secure payment processing with instant receipts',
                  icon: '💳'
                },
                {
                  title: 'Real-time Updates',
                  desc: 'Get instant notifications about your bookings and availability',
                  icon: '🔔'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="card-glass p-8 text-center"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* How It Works Section */}
        <div className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Register',
                  desc: 'Create your account in seconds',
                  icon: '📝'
                },
                {
                  step: '02',
                  title: 'Search Slot',
                  desc: 'Find available parking near you',
                  icon: '🔍'
                },
                {
                  step: '03',
                  title: 'Book & Pay',
                  desc: 'Secure booking with instant payment',
                  icon: '💰'
                },
                {
                  step: '04',
                  title: 'Get Receipt',
                  desc: 'Receive digital receipt instantly',
                  icon: '🧾'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  className="card-glass p-6 text-center"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-purple-400 font-bold text-sm mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* User Roles Section */}
        <div className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white text-center mb-12">System User Roles</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  role: '👑 Admin',
                  tasks: ['Approves Lot Owners', 'Blocks Users', 'Views Revenue', 'Generates Reports'],
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  role: '👤 User',
                  tasks: ['Search Slots', 'Book Parking', 'Download Receipt', 'OTP Reset'],
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  role: '🏢 Lot Owner',
                  tasks: ['Add Slots', 'Manage Pricing', 'View Earnings', 'Booking History'],
                  color: 'from-green-500 to-emerald-500'
                }
              ].map((user, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  className="card-glass p-8 text-center"
                >
                  <div className={`text-3xl font-bold mb-4 bg-gradient-to-r ${user.color} bg-clip-text text-transparent`}>
                    {user.role}
                  </div>
                  <ul className="space-y-2">
                    {user.tasks.map((task, idx) => (
                      <li key={idx} className="text-gray-300 flex items-center justify-center">
                        <span className="text-purple-400 mr-2">✓</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Highlight Strip Section */}
        <div className="py-16 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <div className="card-glass p-8">
              <h2 className="text-3xl font-bold text-white text-center mb-8">Secure. Transparent. Reliable.</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: '🔐', text: 'OTP Reset (2 Min Expiry)' },
                  { icon: '₹', text: 'Indian Payment Gateway' },
                  { icon: '📄', text: 'PDF Receipt' },
                  { icon: '✅', text: 'Admin Approval System' },
                  { icon: '📱', text: 'SMS Notification' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex items-center justify-center space-x-2 text-gray-200"
                  >
                    <span className="text-purple-400">{item.icon}</span>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Call To Action Section */}
        <div className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="card-glass p-12">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Experience Smart Parking?</h2>
              <p className="text-xl text-gray-200 mb-8">
                Join EZ Parking and simplify parking management today.
              </p>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="neon-btn text-lg px-10 py-4"
                >
                  Register Now
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="glass-dark py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
            <p>&copy; 2024 EZ Parking. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
