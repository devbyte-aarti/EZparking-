import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { userAPI, bookingAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Loader from '../../components/Loader';
import BookingCard from '../../components/BookingCard';
import { useNavigate } from 'react-router-dom';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, walletRes, notificationsRes] = await Promise.all([
        userAPI.getBookings(),
        userAPI.getWallet(),
        userAPI.getNotifications()
      ]);
      setBookings(bookingsRes.data || []);
      applyFilters(bookingsRes.data || []);
      setWallet(walletRes.data?.wallet || 0);
      setUnreadCount(notificationsRes.data?.unreadCount || 0);
      toast.success('Bookings loaded');
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data) => {
    let filtered = data;
    if (filters.status) {
      filtered = filtered.filter(b => (b.bookingStatus || b.status) === filters.status);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(b => new Date(b.startTime || b.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(b => new Date(b.endTime || b.createdAt) <= new Date(filters.dateTo));
    }
    setFilteredBookings(filtered);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(bookings);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking? Refund will be processed to wallet.')) return;
    
    try {
      await bookingAPI.cancelBooking(id);
      toast.success('Booking cancelled & refunded');
      loadData(); // Refresh list
    } catch (error) {
      toast.error('Cancel failed');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar wallet={wallet} unreadCount={unreadCount} />
        <div className="user-bg min-h-screen pt-[80px] flex items-center justify-center p-8">
          <Loader message="Loading bookings..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar wallet={wallet} unreadCount={unreadCount} />
      <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} wallet={wallet} unreadCount={unreadCount} />
      <div className="user-bg min-h-screen pt-[80px] p-6"> 
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h1 className="text-3xl font-bold text-white">My Bookings ({filteredBookings.length})</h1>
            <div className="flex gap-2 flex-wrap">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
                className="px-4 py-2 glass text-white rounded-xl font-medium"
              >
                {viewMode === 'card' ? 'Table View' : 'Card View'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 1000); }}
                disabled={refreshing}
                className="neon-btn px-6 py-2 font-bold"
              >
                {refreshing ? <Loader size="sm" /> : '🔄 Refresh'}
              </motion.button>
            </div>
          </div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-dark p-6 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-glass p-3 rounded-xl"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
<option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="active">Active</option>
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input-glass p-3 rounded-xl"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input-glass p-3 rounded-xl"
              />
              <button 
                onClick={() => { 
                  setFilters({ status: '', dateFrom: '', dateTo: '' }); 
                  applyFilters(bookings); 
                }} 
                className="neon-btn"
              >
                Clear
              </button>
            </div>
          </motion.div>

          {/* Bookings Content */}
          {filteredBookings.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-dark p-12 text-center rounded-2xl text-gray-400 text-xl">
              No bookings match your filters.{' '}
              <motion.button 
                onClick={loadData} 
                className="text-blue-400 hover:text-blue-300 font-bold ml-2 inline" 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reload?
              </motion.button>
            </motion.div>
          ) : viewMode === 'table' ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-4 text-left text-white font-bold">ID</th>
                      <th className="p-4 text-left text-white font-bold">Location</th>
                      <th className="p-4 text-left text-white font-bold">Vehicle</th>
                      <th className="p-4 text-left text-white font-bold">Dates</th>
                      <th className="p-4 text-left text-white font-bold">Status</th>
                      <th className="p-4 text-left text-white font-bold">Amount</th>
                      <th className="p-4 text-left text-white font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(booking => (
                      <tr key={booking._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono text-gray-300">#{booking._id?.slice(-8)}</td>
                        <td className="p-4 text-white font-medium">{booking.slotId?.location}</td>
                        <td className="p-4">{booking.vehicleId?.vehicleNo} ({booking.vehicleId?.type})</td>
                        <td className="p-4 text-sm">{new Date(booking.startTime).toLocaleDateString()} - {new Date(booking.endTime).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            booking.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            booking.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' : 
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-emerald-400">₹{booking.totalAmount}</td>
                        <td className="p-4 space-x-2">
                          {booking.status === 'Active' && (
                            <motion.button 
                              onClick={() => handleCancel(booking._id)}
                              className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-xs hover:bg-red-500/30 transition-all"
                              whileTap={{ scale: 0.95 }}
                            >
                              Cancel
                            </motion.button>
                          )}
                          {booking.paymentId && (
                            <motion.button 
                              className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs hover:bg-purple-500/30 transition-all"
                              whileTap={{ scale: 0.95 }}
                            >
                              Receipt
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.map(booking => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancel={handleCancel}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyBookingsPage;

