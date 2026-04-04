import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { userAPI, parkingpassAPI } from '../services/api';
import Navbar from '../components/Navbar';
import HamburgerMenu from '../components/HamburgerMenu';
import Loader from '../components/Loader';
import ChartCard from '../components/ChartCard';
import { CHART_COLORS } from '../components/ChartCard';

const UserDashboard = () => {
  const [stats, setStats] = useState({ 
    totalBookings: 0, 
    activeBookings: 0, 
    totalSpending: 0, 
    vehiclesCount: 0 
  });
  const [chartsData, setChartsData] = useState({
    trends: [],
    spending: [],
    status: [],
    vehiclesUsage: []
  });
  const [activeBooking, setActiveBooking] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [myPasses, setMyPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, vehiclesRes, myPassesRes] = await Promise.all([
        userAPI.getBookings(),
        userAPI.getVehicles(),
        parkingpassAPI.getMyPasses()
      ]);

      const bookings = bookingsRes.data || [];
      const vehicles = vehiclesRes.data || [];
      const myPassesData = myPassesRes.data || [];
      const totalSpending = bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

      setStats({
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'Active').length,
        totalSpending: Math.round(totalSpending),
        vehiclesCount: vehicles.length
      });

      setChartsData({
        trends: generateTrends(bookings),
        spending: generateSpending(bookings),
        status: generateStatus(bookings),
        vehiclesUsage: generateVehicleUsage(bookings, vehicles)
      });

      // Active Booking (only 1)
      setActiveBooking(bookings.find(b => b.status === 'Active') || null);

      // Recent Bookings (last 5)
      setRecentBookings(bookings.slice(0, 5));

      // All vehicles
      setVehiclesList(vehicles);

      setMyPasses(myPassesData);

      toast.success('Dashboard loaded');
    } catch (error) {
      toast.error('Failed to load data');
      setTimeout(loadDashboardData, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Chart generators
  const generateTrends = (bookings) => Object.entries(bookings.reduce((acc, b) => {
    const week = new Date(b.startTime).toISOString().slice(0, 10);
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {})).slice(-7).map(([date, count]) => ({ date, bookings: count }));

  const generateSpending = (bookings) => Object.entries(bookings.reduce((acc, b) => {
    const month = new Date(b.startTime).toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + Number(b.totalAmount || 0);
    return acc;
  }, {})).slice(-6).map(([month, spent]) => ({ month, spent: Number(spent.toFixed(0)) }));

  const generateStatus = (bookings) => {
    const statusCounts = bookings.reduce((acc, b) => {
      const status = b.status || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const priorityStatuses = [
      { name: 'Active', color: '#10b981' },
      { name: 'Completed', color: '#3b82f6' },
      { name: 'Cancelled', color: '#ef4444' }
    ];
    
    return priorityStatuses.map(({ name, color }) => ({
      name,
      value: statusCounts[name] || 0,
      color
    })).filter(s => s.value > 0);
  };

  const generateVehicleUsage = (bookings, vehicles) => {
    const usageCounts = bookings.reduce((acc, b) => {
      const vehicleNo = b.vehicleId?.vehicleNo;
      if (vehicleNo) {
        acc[vehicleNo] = (acc[vehicleNo] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(usageCounts)
      .map(([name, value], index) => ({ name, value, color: CHART_COLORS.neutral[index % CHART_COLORS.neutral.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  };

  const getStatusClass = (status) => {
    const classes = {
      Active: 'bg-green-500/20 text-green-400 border-green-400/50',
      Completed: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      Cancelled: 'bg-red-500/20 text-red-400 border-red-400/50',
      Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50'
    };
    return classes[status || 'Pending'] || 'bg-gray-500/20 text-gray-400 border-gray-400/50';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="user-bg min-h-screen pt-[80px] flex items-center justify-center">
          <Loader message="Loading dashboard..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="user-bg pt-[80px] min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* 1. STATS CARDS */}
          <section>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">Dashboard</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div className="glass-dark p-8 rounded-3xl text-center border-2 border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all" whileHover={{ y: -4 }}>
                <div className="text-4xl mb-4">📅</div>
                <div className="text-3xl font-black text-white">{stats.totalBookings}</div>
                <div className="text-gray-400 text-lg mt-1">Total Bookings</div>
              </motion.div>
              <motion.div className="glass-dark p-8 rounded-3xl text-center border-2 border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all" whileHover={{ y: -4 }}>
                <div className="text-4xl mb-4">🔴</div>
                <div className="text-3xl font-black text-green-400">{stats.activeBookings}</div>
                <div className="text-gray-400 text-lg mt-1">Active Bookings</div>
              </motion.div>
              <motion.div className="glass-dark p-8 rounded-3xl text-center border-2 border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all" whileHover={{ y: -4 }}>
                <div className="text-4xl mb-4">💰</div>
                <div className="text-3xl font-black text-emerald-400">₹{stats.totalSpending.toLocaleString()}</div>
                <div className="text-gray-400 text-lg mt-1">Total Spending</div>
              </motion.div>
              <motion.div className="glass-dark p-8 rounded-3xl text-center border-2 border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all" whileHover={{ y: -4 }}>
                <div className="text-4xl mb-4">🚗</div>
                <div className="text-3xl font-black text-blue-400">{stats.vehiclesCount}</div>
                <div className="text-gray-400 text-lg mt-1">Vehicles Count</div>
              </motion.div>
            </div>
          </section>

          {/* 2. CHARTS (2x2 GRID gap-6) */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-8">Analytics</h2>
            <div className="grid grid-cols-2 gap-6">
              <ChartCard type="line" data={chartsData.trends} title="Booking Trends" loading={loading} />
              <ChartCard type="bar" data={chartsData.spending} title="Monthly Spending" loading={loading} />
              <ChartCard type="pie" data={chartsData.status} title="Booking Status" statusColors={chartsData.status} loading={loading} />
              <ChartCard type="donut" data={chartsData.vehiclesUsage} title="Vehicle Usage" statusColors={chartsData.vehiclesUsage} loading={loading} />
            </div>
          </section>

          {/* 3. ACTIVE BOOKING TABLE */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-6">Active Booking</h2>
            <div className="glass-dark rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
              {activeBooking ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-6 text-left text-xl font-bold text-white">Parking Name</th>
                      <th className="p-6 text-left text-xl font-bold text-white">Date</th>
                      <th className="p-6 text-left text-xl font-bold text-white">Time</th>
                      <th className="p-6 text-left text-xl font-bold text-white">Vehicle</th>
                      <th className="p-6 text-left text-xl font-bold text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-white/10 transition-colors border-b border-white/5">
                      <td className="p-6 font-bold text-white">{activeBooking.slotId?.location}</td>
                      <td className="p-6 text-gray-200">{new Date(activeBooking.startTime).toLocaleDateString('en-IN')}</td>
                      <td className="p-6 text-gray-200">{new Date(activeBooking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="p-6 text-gray-200">{activeBooking.vehicleId?.vehicleNo}</td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-full font-bold ${getStatusClass(activeBooking.status)}`}>
                          {activeBooking.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4 text-gray-500">🅿️</div>
                  <div className="text-2xl font-bold text-gray-400">No Active Booking</div>
                </div>
              )}
            </div>
          </section>

          {/* 4. RECENT BOOKINGS TABLE (last 5) */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-6">Recent Bookings</h2>
            <div className="glass-dark rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 sticky top-0">
                    <th className="p-6 text-left text-xl font-bold text-white">Parking Name</th>
                    <th className="p-6 text-left text-xl font-bold text-white">Date</th>
                    <th className="p-6 text-left text-xl font-bold text-white">Time</th>
                    <th className="p-6 text-left text-xl font-bold text-white">Vehicle</th>
                    <th className="p-6 text-left text-xl font-bold text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-white/10 transition-colors border-b border-white/5">
                      <td className="p-6 font-semibold text-white">{booking.slotId?.location}</td>
                      <td className="p-6 text-gray-200">{new Date(booking.startTime).toLocaleDateString('en-IN')}</td>
                      <td className="p-6 text-gray-200">{new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="p-6 text-gray-200">{booking.vehicleId?.vehicleNo}</td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-full font-bold ${getStatusClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-400">
                        No recent bookings
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. VEHICLES TABLE */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-6">Vehicles</h2>
            <div className="glass-dark rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 sticky top-0">
                    <th className="p-6 text-left text-xl font-bold text-white">Vehicle Number</th>
                    <th className="p-6 text-left text-xl font-bold text-white">Type</th>
                    <th className="p-6 text-left text-xl font-bold text-white">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesList.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-white/10 transition-colors border-b border-white/5">
                      <td className="p-6 font-bold text-white">{vehicle.vehicleNo}</td>
                      <td className="p-6 text-gray-200">{vehicle.type}</td>
                      <td className="p-6 text-gray-200">{vehicle.model || 'N/A'}</td>
                    </tr>
                  ))}
                  {vehiclesList.length === 0 && (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-gray-400">
                        No vehicles added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. MY PASSES SECTION (PART 4) */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-3xl font-bold text-white flex-1">My Passes</h2>
              <motion.button 
                className="glass-dark px-8 py-3 font-bold border border-white/30 rounded-2xl hover:bg-white/10" 
                whileHover={{ scale: 1.05 }}
                onClick={() => window.location.href = '/user/pass'}
              >
                Buy New Pass →
              </motion.button>
            </div>
            {myPasses.length === 0 ? (
              <div className="glass-dark p-16 text-center rounded-3xl border-2 border-white/10">
                <div className="text-6xl mb-6">🎫</div>
                <div className="text-2xl font-bold text-gray-300 mb-2">No passes yet</div>
                <div className="text-gray-400 mb-8">Buy your first parking pass</div>
                <motion.button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-2xl" 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => window.location.href = '/user/pass'}
                >
                  Buy Pass
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPasses.map((pass) => {
                  const now = new Date();
                  const totalDays = Math.round((pass.endDate - pass.startDate) / (1000*60*60*24));
                  const remainingDays = Math.max(0, Math.ceil((pass.endDate - now) / (1000*60*60*24)));
                  
                  return (
                    <motion.div 
                      key={pass._id}
                      className={`glass-dark p-6 rounded-3xl border-2 ${pass.status === 'active' ? 'border-green-400/30 bg-green-500/5' : 'border-orange-400/30 bg-orange-500/5'} hover:shadow-xl hover:scale-[1.02] transition-all`}
                      whileHover={{ y: -4 }}
                    >
                      <div className="text-3xl mb-4 text-center">
                        {pass.status === 'active' ? '✅' : '⚠️'}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 text-center capitalize">{pass.passType} Pass</h3>
                      <div className="text-lg font-bold text-green-400 mb-4 text-center">₹{pass.amount?.toLocaleString() || pass.price?.toLocaleString()}</div>
                      <div className="space-y-2 text-sm text-gray-300 mb-4">
                        <div><strong>Start:</strong> {new Date(pass.startDate).toLocaleDateString('en-IN')}</div>
                        <div><strong>End:</strong> {new Date(pass.endDate).toLocaleDateString('en-IN')}</div>
                        <div><strong>Total:</strong> {totalDays} days</div>
                        <div className={`font-bold text-lg ${remainingDays > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          <strong>Remaining:</strong> {remainingDays} days
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full font-bold text-sm text-center w-full ${pass.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-400/50' : 'bg-red-500/20 text-red-300 border border-red-400/50'}`}>
                        {pass.status.toUpperCase()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex justify-center">
            <motion.button className="glass-dark px-12 py-6 text-xl font-black border-2 border-white/30 rounded-3xl hover:bg-white/10 hover:border-white/50 transition-all shadow-2xl" whileHover={{ scale: 1.05 }} onClick={loadDashboardData}>
              🔄 Refresh Dashboard
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;

