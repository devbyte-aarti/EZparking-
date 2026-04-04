import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { userAPI, slotAPI, parkingpassAPI, bookingAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Loader from '../../components/Loader';
import PaymentModal from '../../components/PaymentModal';
import { useNavigate } from 'react-router-dom';

const FindParkingPage = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ city: '', location: '', type: '' });
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({ vehicleId: '', startTime: '', endTime: '' });
  const [totalPrice, setTotalPrice] = useState(0);
  const [hasActivePass, setHasActivePass] = useState(false);
  const [usePass, setUsePass] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [vehiclesRes, passRes, walletRes, notificationsRes] = await Promise.all([
        userAPI.getVehicles(),
        parkingpassAPI.getActivePass(),
        userAPI.getWallet(),
        userAPI.getNotifications()
      ]);
      setVehicles(vehiclesRes.data || []);
      setHasActivePass(!!passRes.data);
      setWallet(walletRes.data?.wallet || 0);
      setUnreadCount(notificationsRes.data?.unreadCount || 0);
    } catch (error) {
      toast.error('Initial load failed');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await userAPI.searchSlots(filters);
      setSlots(res.data || []);
      toast.success(`Found ${res.data?.length || 0} slots`);
    } catch (error) {
      toast.error('No slots found - try different filters');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = (slot) => {
    setSelectedSlot(slot);
    setBookingModal(true);
  };

  const calculatePrice = () => {
    if (usePass || !selectedSlot) return 0;
    const start = new Date(bookingForm.startTime);
    const end = new Date(bookingForm.endTime);
    const hours = (end - start) / (1000 * 60 * 60);
    return Math.max(1, Math.ceil(hours)) * (selectedSlot.price || 0);
  };

  useEffect(() => {
    setTotalPrice(calculatePrice());
  }, [bookingForm, selectedSlot, usePass]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (new Date(bookingForm.startTime) >= new Date(bookingForm.endTime)) {
      toast.error('End time must be after start');
      return;
    }
    if (!bookingForm.vehicleId) {
      toast.error('Select vehicle');
      return;
    }

    setLoading(true);
    try {
      // ALWAYS create pending booking first (even for pass - backend handles activation)
      toast.info('Creating booking...');
      const bookingRes = await bookingAPI.createBooking({
        slotId: selectedSlot._id,
        vehicleId: bookingForm.vehicleId,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        paymentStatus: usePass ? 'pending_pass' : 'pending'  // Hint for pass
      });
      
      toast.success(`Booking created! ${usePass ? 'Using pass...' : 'Proceed to payment.'}`);
      setCurrentBooking(bookingRes.data.booking);
      setBookingModal(false);
      if (usePass) {
        // Direct pass check for new booking
        const res = await paymentAPI.initiatePayment({
          bookingId: bookingRes.data.booking._id,
          method: 'pass',
          isPassPurchase: false
        });
        if (res.data?.usePass) {
          toast.success('Booking confirmed using Pass!');
          await loadInitialData();
          navigate('/user/my-bookings');
          return;
        } else {
          toast.error(res.data?.message || "Pass not available");
          setPaymentOpen(true);  // Fallback to paid payment
        }
      } else {
        setPaymentOpen(true);
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking process failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast.success('Booking confirmed successfully!');
    await loadInitialData(); // Refresh wallet/notifications
    navigate('/user/my-bookings');
  };

  if (vehicles.length === 0) {
    return (
      <>
        <Navbar wallet={wallet} unreadCount={unreadCount} />
        <div className="user-bg min-h-screen pt-[80px] flex items-center justify-center p-6">
          <motion.div className="glass-dark p-12 text-center rounded-3xl max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <div className="text-6xl mb-6">🚗</div>
            <h2 className="text-2xl font-bold text-white mb-4">Add Vehicles First</h2>
            <p className="text-gray-400 mb-8">You need to add at least one vehicle to book parking.</p>
            <motion.button onClick={() => navigate('/user/my-vehicles')} className="neon-btn px-8 py-3 font-bold" whileHover={{ scale: 1.05 }}>
              Add Vehicle →
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar wallet={wallet} unreadCount={unreadCount} />
      <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} wallet={wallet} unreadCount={unreadCount} />
      <div className="user-bg min-h-screen pt-[80px]">
        <div className="max-w-7xl mx-auto p-6 space-y-6"> 
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white mb-6">Find Parking</h1>
            
            {/* Filters */}
            <div className="glass-dark p-6 rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="input-glass p-4 rounded-xl"
                />
                <input
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="input-glass p-4 rounded-xl"
                />
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="input-glass p-4 rounded-xl"
                >
                  <option value="">All Types</option>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                </select>
              </div>
              <motion.button
                onClick={handleSearch}
                disabled={loading}
                className="neon-btn mt-6 px-8 py-4 font-bold w-full md:w-auto"
                whileHover={{ scale: 1.05 }}
              >
                {loading ? <Loader /> : 'Search Slots 🔍'}
              </motion.button>
            </div>
          </motion.div>

          {/* Slots Grid */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <Loader message="Searching available slots..." />
            ) : slots.length === 0 ? (
              <div className="col-span-full glass-dark p-12 text-center rounded-2xl text-gray-400">
                No available slots. Try different filters.
              </div>
            ) : (
              slots.map(slot => (
                <motion.div
                  key={slot._id}
                  className="glass-dark p-6 rounded-2xl border-2 border-white/10 hover:border-blue-400/50 cursor-pointer group"
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => handleBookSlot(slot)}
                >
                  <div className="text-2xl mb-4">{slot.type === 'car' ? '🚗' : slot.type === 'bike' ? '🏍️' : '🛵'}</div>
                  <h3 className="font-bold text-white text-xl mb-2">{slot.location}</h3>
                  <div className="text-green-400 text-2xl font-bold mb-4">₹{slot.price}/hr</div>
                  <div className="text-gray-400 text-sm mb-6">{slot.city} • {slot.capacity} spots</div>
                  <div className="group-hover:text-blue-400 font-bold">Book Now →</div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Booking Modal */}
        {bookingModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-dark p-8 rounded-3xl w-full max-w-md">
              <h3 className="text-2xl font-bold text-white mb-6">{selectedSlot?.location}</h3>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <select
                  value={bookingForm.vehicleId}
                  onChange={(e) => setBookingForm({ ...bookingForm, vehicleId: e.target.value })}
                  className="input-glass w-full p-4"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNo} ({v.type})</option>)}
                </select>
                <input
                  type="datetime-local"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  className="input-glass w-full p-4"
                  required
                />
                <input
                  type="datetime-local"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  className="input-glass w-full p-4"
                  required
                />
                {hasActivePass && (
                  <label className="flex items-center p-3 bg-green-500/20 border border-green-500/30 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePass}
                      onChange={(e) => setUsePass(e.target.checked)}
                      className="w-5 h-5 mr-3"
                    />
                    <span className="text-green-200 font-bold">Use Active Pass (Free Parking)</span>
                  </label>
                )}
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400 mb-4">
                    Total: ₹{totalPrice}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setBookingModal(false)} className="flex-1 bg-gray-600/50 text-white py-4 px-6 rounded-2xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="neon-btn flex-1 py-4 px-6 font-bold">
                    {loading ? <Loader /> : usePass ? 'Confirm Free Booking' : `Pay ₹${totalPrice}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentOpen && currentBooking && (
          <PaymentModal
            isOpen={paymentOpen}
            onClose={() => setPaymentOpen(false)}
            booking={currentBooking}
            amount={totalPrice}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </>
  );
};

export default FindParkingPage;

