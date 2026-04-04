import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { bookingAPI } from '../services/api';
import Loader from './Loader';

const BookingCard = ({ booking, onCancel, variant = 'list' }) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Cancel booking?')) return;
    
    setLoading(true);
    try {
      await bookingAPI.cancelBooking(booking._id);
      toast.success('Booking cancelled successfully');
      onCancel?.(booking._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancel failed');
    } finally {
      setLoading(false);
    }
  };

  // TASK STATUS DISPLAY
  const getStatusBadge = () => {
    const status = booking.bookingStatus || booking.status || 'pending';
    const payment = booking.paymentStatus || 'pending';
    
    if (status === 'cancelled') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-400/50">Cancelled</span>;
    }
    
    if (payment === 'paid' && status === 'active') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-400/50">Active • Paid</span>;
    }
    
    if (payment === 'pending') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-400/50">Pending Payment</span>;
    }
    
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-400/50">Pending</span>;
  };

  return (
    <motion.div
      className={`glass-dark p-6 rounded-2xl border-2 border-white/10 hover:border-blue-400/50 ${variant === 'compact' ? 'flex items-center justify-between p-4' : 'max-w-sm'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-xl text-white">
            #{booking._id?.slice(-8).toUpperCase()}
          </h3>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-1 text-gray-300">
          <div className="font-semibold">📍 {booking.slotId?.location || 'N/A'}</div>
          <div>🚗 {booking.vehicleId?.vehicleNo || 'N/A'}</div>
          <div className="text-sm opacity-75">
            {new Date(booking.startTime).toLocaleDateString()} → {new Date(booking.endTime).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-2xl font-black text-emerald-400">
            ₹{booking.totalAmount || 0}
          </div>
          
          {booking.bookingStatus === 'active' && (
            <motion.button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-red-500/90 to-red-600/90 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/50 border border-red-500/50 disabled:opacity-50 transition-all text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <Loader size="sm" /> : 'Cancel Booking'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BookingCard;

