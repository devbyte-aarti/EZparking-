 import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { adminAPI, parkingpassAPI } from '../services/api';
import { useUserStore } from '../stores/userStore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [users, setUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreatePassModal, setShowCreatePassModal] = useState(false);
const [formData, setFormData] = useState({ name: '', type: 'weekly', price: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPass, setEditingPass] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', passType: 'weekly', price: '' });
const user = useUserStore((state) => state.user);
  console.log("AdminDashboard - Current User Role:", user?.role);
  // Reports state
  const [reportType, setReportType] = useState('user');
  const [dateType, setDateType] = useState('weekly');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportUserTypeFilter, setReportUserTypeFilter] = useState('both');
  const [reportCityFilter, setReportCityFilter] = useState('');
  const [showReportData, setShowReportData] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Weekly bookings data
  const weeklyBookingsData = useCallback(() => {
    if (!allBookings?.length) return Array(7).fill(0).map((_, i) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], bookings: 0 }));
    const now = new Date();
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    allBookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      const day = date.getDay();
      const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      if (date >= weekAgo && date <= now) {
        counts[['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]]++;
      }
    });
    return Object.entries(counts).map(([day, bookings]) => ({ day, bookings }));
  }, [allBookings]);

  // Parking usage bar data (bookings per day last 7 days)
  const parkingUsageData = weeklyBookingsData();

  // Revenue data
  const revenueData = [
    { name: 'Admin Share (20%)', value: Number(stats?.totalRevenue || 0) * 0.2 },
    { name: 'Lot Owner Share (80%)', value: Number(stats?.totalRevenue || 0) * 0.8 }
  ];

  // Status colors
  const statusColors = {
    Active: 'bg-green-500/20 text-green-400',
    Completed: 'bg-blue-500/20 text-blue-400',
    Cancelled: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400'
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, ownersRes, usersRes, bookingsRes, passesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingOwners(),
        adminAPI.getUsers(),
        adminAPI.getAllBookings(),
        parkingpassAPI.getPasses()
      ]);
      setStats(statsRes.data);
      setPendingOwners(ownersRes.data);
      setUsers(usersRes.data);
      setAllBookings(bookingsRes.data);
      setPasses(passesRes.data);
      toast.success('Dashboard data loaded successfully');
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleDeletePass = async (passId) => {
    try {
      await parkingpassAPI.deletePass(passId);
      toast.success('Pass deleted successfully!');
      loadData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = users.filter(user => 
    (!userTypeFilter || user.role === userTypeFilter) &&
    (!cityFilter || user.city === cityFilter)
  );

  const filteredBookings = allBookings.filter(booking => 
    (!statusFilter || booking.status === statusFilter) &&
    (!cityFilter || booking.slotId?.city === cityFilter) &&
    (!dateFrom || new Date(booking.createdAt) >= new Date(dateFrom)) &&
    (!dateTo || new Date(booking.createdAt) <= new Date(dateTo))
  );

  const filteredPendingOwners = pendingOwners.filter(owner => 
    (!cityFilter || owner.city === cityFilter)
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleApproveOwner = async (id) => {
    try {
      await adminAPI.approveOwner(id);
      toast.success('Owner approved');
      loadData();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleRejectOwner = async (id) => {
    try {
      await adminAPI.rejectOwner(id);
      toast.success('Owner rejected');
      loadData();
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const handleBlockUser = async (id) => {
    try {
      await adminAPI.blockUser(id);
      toast.success('User blocked');
      loadData();
    } catch (error) {
      toast.error('Block failed');
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      await adminAPI.unblockUser(id);
      toast.success('User unblocked');
      loadData();
    } catch (error) {
      toast.error('Unblock failed');
    }
  };

  const handleCreatePass = async (e) => {
    e.preventDefault();
    try {
      await parkingpassAPI.createPass({
        name: formData.name,
        passType: formData.type,
        price: Number(formData.price)
      });
      toast.success('Pass created successfully!');
      setShowCreatePassModal(false);
      setFormData({ name: '', type: 'weekly', price: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to create pass');
    }
  };

  const handleEditPass = async (e) => {
    e.preventDefault();
    try {
      await parkingpassAPI.updatePass(editingPass._id, editFormData);
      toast.success('Pass updated successfully!');
      setShowEditModal(false);
      setEditingPass(null);
      setEditFormData({ name: '', passType: 'weekly', price: '' });
      loadData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const computeReportData = useCallback(() => {
    const now = new Date();
    let dateFrom, dateTo;

    // Compute date range based on dateType
    const currentMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthLast = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (dateType) {
      case 'weekly':
        const weekStart = new Date(currentMonthFirst);
        weekStart.setDate(weekStart.getDate() + (selectedWeek - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > currentMonthLast) weekEnd.setTime(currentMonthLast.getTime());
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = weekEnd.toISOString().split('T')[0];
        break;
      case 'monthly':
        const monthFirst = new Date(selectedYear, selectedMonth, 1);
        const monthLast = new Date(selectedYear, selectedMonth + 1, 0);
        dateFrom = monthFirst.toISOString().split('T')[0];
        dateTo = monthLast.toISOString().split('T')[0];
        break;
      case 'yearly':
        const yearFirst = new Date(selectedYear, 0, 1);
        const yearLast = new Date(selectedYear, 11, 31);
        dateFrom = yearFirst.toISOString().split('T')[0];
        dateTo = yearLast.toISOString().split('T')[0];
        break;
      case 'custom':
        dateFrom = customStart;
        dateTo = customEnd;
        break;
      default:
        dateFrom = new Date(0).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
    }

    // Filter bookings by date
    const filteredBookings = allBookings.filter(b => {
      const bDate = new Date(b.createdAt).toISOString().split('T')[0];
      return bDate >= dateFrom && bDate <= dateTo;
    });

    let data = [];

    switch (reportType) {
      case 'user':
        const userBookings = {};
        filteredBookings.forEach(b => {
          const uid = b.userId?._id?.toString() || b.userId;
          if (!userBookings[uid]) userBookings[uid] = { count: 0, revenue: 0 };
          userBookings[uid].count += 1;
          userBookings[uid].revenue += Number(b.totalAmount || 0);
        });
        
        data = users
          .filter(u => {
            if (userTypeFilter === 'both') return true;
            if (userTypeFilter === 'user' && u.role === 'normal') return true;
            if (userTypeFilter === 'lotowner' && u.role === 'lotowner') return true;
            return false;
          })
          .filter(u => !reportCityFilter || u.city === reportCityFilter)
          .map(u => {
            const stats = userBookings[u._id.toString()] || { count: 0, revenue: 0 };
            return {
              name: u.name,
              role: u.role,
              city: u.city || 'N/A',
              totalBookings: stats.count,
              revenue: stats.revenue.toFixed(2),
              lastActivity: new Date(u.updatedAt || u.createdAt).toLocaleDateString()
            };
          });
        break;

      case 'lotowner':
        const ownerBookings = {};
        filteredBookings.forEach(b => {
          if (b.slotId && b.slotId.ownerId) {
            const oid = b.slotId.ownerId._id.toString();
            if (!ownerBookings[oid]) ownerBookings[oid] = { count: 0, revenue: 0 };
            ownerBookings[oid].count += 1;
            ownerBookings[oid].revenue += Number(b.totalAmount || 0);
          }
        });
        
        data = users
          .filter(u => u.role === 'lotowner')
          .filter(u => !reportCityFilter || u.city === reportCityFilter)
          .map(u => {
            const stats = ownerBookings[u._id.toString()] || { count: 0, revenue: 0 };
            return {
              name: u.name,
              city: u.city || 'N/A',
              totalBookings: stats.count,
              revenue: stats.revenue.toFixed(2)
            };
          });
        break;

      case 'booking':
        data = filteredBookings.map(b => ({
          id: b._id.toString().slice(-8),
          user: b.userId ? b.userId.name : 'N/A',
          vehicle: b.vehicleId ? b.vehicleId.vehicleNo : 'N/A',
          slot: b.slotId ? b.slotId.location : 'N/A',
          city: b.slotId ? b.slotId.city : 'N/A',
          startTime: b.startTime ? new Date(b.startTime).toLocaleString() : 'N/A',
          endTime: b.endTime ? new Date(b.endTime).toLocaleString() : 'N/A',
          amount: b.totalAmount ? b.totalAmount.toFixed(2) : 0,
          status: b.status
        }));
        break;

      case 'revenue':
        const revenueStats = filteredBookings.reduce((stats, b) => {
          stats.total += Number(b.totalAmount || 0);
          stats.transactionCount += 1;
          return stats;
        }, { total: 0, transactionCount: 0 });
        data = [{
          totalRevenue: revenueStats.total.toFixed(2),
          transactionCount: revenueStats.transactionCount,
          average: (revenueStats.total / revenueStats.transactionCount || 0).toFixed(2)
        }];
        break;

      case 'all':
        const allStats = {
          totalBookings: filteredBookings.length,
          usersCount: new Set(filteredBookings.map(b => b.userId?._id)).size,
          revenue: filteredBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0).toFixed(2)
        };
        data = [allStats];
        break;

      default:
        data = [];
    }

    return data;
  }, [allBookings, users, dateType, selectedWeek, selectedMonth, selectedYear, customStart, customEnd, reportType, userTypeFilter, reportCityFilter]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pendingOwners', label: 'Pending Owners', icon: '⏳' },
    { id: 'manageUsers', label: 'Manage Users', icon: '👥' },
    { id: 'allBookings', label: 'All Bookings', icon: '📅' },
    { id: 'passManagement', label: 'Pass Management', icon: '🎫' },
    { id: 'reports', label: 'Reports', icon: '📋' }
  ];

  if (loading) {
    return (
      <div className="admin-bg min-h-screen flex items-center justify-center">
        <div className="spinner w-20 h-20"></div>
      </div>
    );
  }

  return (
    <div className="admin-bg min-h-screen">
      <div className="min-h-screen bg-black/80">

        {/* Header */}
        <nav className="glass-dark fixed w-full z-50 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">EZ Parking Admin</h1>
            <div className="flex items-center space-x-4">
              <span className="text-white font-semibold">Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-24 flex min-h-screen">
          {/* Glassmorphism Sidebar */}
          <div className="w-64 glass-dark p-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl mx-4 mt-6 shadow-2xl">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all group ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white shadow-lg shadow-purple-500/25 border-2 border-white/20'
                      : 'text-gray-300 hover:bg-white/10 hover:shadow-lg hover:border-white/20 border-2 border-transparent'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                      Dashboard Overview
                    </h2>
                    <p className="text-gray-400 text-lg">Real-time analytics with live database data.</p>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { value: stats?.totalUsers || 0, label: 'Total Users', icon: '👥', color: 'purple' },
                      { value: stats?.totalOwners || 0, label: 'Total Lot Owners', icon: '🏢', color: 'blue' },
                      { value: stats?.totalSlots || 0, label: 'Total Parking Slots', icon: '🅿️', color: 'indigo' },
                      { value: stats?.totalBookings || 0, label: 'Total Bookings', icon: '📅', color: 'green' },
                      { value: stats?.activeBookings || 0, label: 'Active Bookings', icon: '⚡', color: 'yellow' },
                      { value: `₹${Number(stats?.totalRevenue || 0).toFixed(2)}`, label: 'Total Revenue', icon: '💰', color: 'pink' }
                    ].map((card, i) => (
                      <motion.div 
                        key={i}
                        className="card-glass p-6 text-center group cursor-pointer rounded-3xl"
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className={`text-4xl mb-3 group-hover:text-${card.color}-400 transition-colors`}>
                          {card.icon}
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                          {card.value}
                        </div>
                        <div className="text-gray-400 text-base font-medium">
                          {card.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Booking Analytics Line Chart */}
                    <motion.div className="card-glass p-8 lg:col-span-2 rounded-3xl">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        📈 Booking Analytics (Last 7 Days)
                      </h3>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={weeklyBookingsData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="day" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
                          <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
                          <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
                          <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={4} dot={{ fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Parking Usage Bar Chart */}
                    <motion.div className="card-glass p-8 rounded-3xl">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        📊 Parking Usage
                      </h3>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={parkingUsageData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="day" stroke="#94A3B8" />
                          <YAxis stroke="#94A3B8" />
                          <Tooltip />
                          <Bar dataKey="bookings" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Revenue Distribution Pie Chart */}
                    <motion.div className="card-glass p-8 rounded-3xl">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        💰 Revenue Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie data={revenueData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                            <Cell fill="#10B981" />
                            <Cell fill="#F59E0B" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </div>

                  {/* Recent Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Bookings Table */}
                    <motion.div className="card-glass p-8 rounded-3xl overflow-hidden">
                      <h3 className="text-2xl font-bold text-white mb-6">Recent Bookings (Latest 5)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="text-left py-4 text-gray-300 font-medium">Booking ID</th>
                              <th className="text-left py-4 text-gray-300 font-medium">User Name</th>
                              <th className="text-left py-4 text-gray-300 font-medium">Vehicle</th>
                              <th className="text-left py-4 text-gray-300 font-medium">Parking Slot</th>
                              <th className="text-left py-4 text-gray-300 font-medium">Amount</th>
                              <th className="text-left py-4 text-gray-300 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allBookings.slice(0, 5).map((booking) => (
                              <tr key={booking._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                <td className="py-4 font-mono text-purple-400 text-sm">#{booking._id?.slice(-8)}</td>
                                <td className="py-4 font-semibold text-white">{booking.userId?.name || 'N/A'}</td>
                                <td className="py-4 text-gray-300">{booking.vehicleId?.number || 'N/A'}</td>
                                <td className="py-4 font-semibold text-white">{booking.slotId?.location || 'N/A'}</td>
                                <td className="py-4 font-bold text-green-400">₹{Number(booking.totalAmount || 0).toFixed(2)}</td>
                                <td className="py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[booking.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                    {booking.status || 'Unknown'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>

                    {/* Recent Users Table */}
                    <motion.div className="card-glass p-8 rounded-3xl">
                      <h3 className="text-2xl font-bold text-white mb-6">Recent Users (Latest 5)</h3>
                      <div className="space-y-4">
                        {users.slice(0, 5).map((user) => (
                          <div key={user._id} className="flex items-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mr-4">
                              <span className="text-xl font-bold text-white">{user.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-white truncate">{user.name}</div>
                              <div className="text-gray-400 text-sm truncate">{user.email}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              user.role === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                              user.role === 'lotowner' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'pendingOwners' && (
                <motion.div
                  key="pendingOwners"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap gap-4 items-center">
                    <h2 className="text-3xl font-bold text-white flex-1">Pending Owners</h2>
                    <input
                      type="text"
                      placeholder="Type city name..."
                      className="input-glass px-4 py-2 w-64"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white/5 rounded-3xl">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Name</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Email</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Phone</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">City</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Reg Date</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPendingOwners.map((owner) => (
                          <tr key={owner._id} className="border-b border-white/10 hover:bg-white/10">
                            <td className="py-4 px-6 font-semibold text-white">{owner.name}</td>
                            <td className="py-4 px-6 text-gray-300">{owner.email}</td>
                            <td className="py-4 px-6 text-gray-300">{owner.Phone || 'N/A'}</td>
                            <td className="py-4 px-6 font-semibold text-purple-400">{owner.city || 'N/A'}</td>
                            <td className="py-4 px-6 text-gray-400 text-sm">{new Date(owner.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                <motion.button
                                  onClick={() => handleApproveOwner(owner._id)}
                                  className="px-4 py-2 bg-green-500/90 hover:bg-green-600 text-white rounded-xl text-sm font-semibold shadow-lg"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  Approve
                                </motion.button>
                                <motion.button
                                  onClick={() => handleRejectOwner(owner._id)}
                                  className="px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl text-sm font-semibold shadow-lg"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  Reject
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredPendingOwners.length === 0 && (
                    <div className="card-glass p-12 text-center text-gray-400 rounded-3xl">
                      No pending owners matching filters 🎉
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'manageUsers' && (
                <motion.div
                  key="manageUsers"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap gap-4 items-center">
                    <h2 className="text-3xl font-bold text-white flex-1">Manage Users</h2>
                    <select 
                      className="input-glass px-4 py-2" 
                      value={userTypeFilter} 
                      onChange={(e) => {
                        setUserTypeFilter(e.target.value);
                        if (e.target.value === '') setCityFilter('');
                      }}
                    >
                      <option value="">All Users</option>
                      <option value="normal">User</option>
                      <option value="lotowner">Lot Owner</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Type city name..."
                      className="input-glass px-4 py-2"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white/5 rounded-3xl">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Name</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Email</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Role</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">City</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Reg Date</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="border-b border-white/10 hover:bg-white/10">
                            <td className="py-4 px-6 font-semibold text-white">{user.name}</td>
                            <td className="py-4 px-6 text-gray-300 truncate max-w-xs">{user.email}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                user.role === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-orange-500/20 text-orange-400'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-purple-400 font-semibold">{user.city || 'N/A'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                user.status === 'blocked' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                                {user.status || 'active'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                {user.status !== 'blocked' ? (
                                  <motion.button
                                    onClick={() => handleBlockUser(user._id)}
                                    className="px-3 py-1 bg-red-500/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    Block
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    onClick={() => handleUnblockUser(user._id)}
                                    className="px-3 py-1 bg-green-500/90 hover:bg-green-600 text-white rounded-lg text-xs font-semibold"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    Unblock
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredUsers.length === 0 && (
                    <div className="card-glass p-12 text-center text-gray-400 rounded-3xl">
                      No users matching filters
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'allBookings' && (
                <motion.div
                  key="allBookings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap gap-4 items-center">
                    <h2 className="text-3xl font-bold text-white flex-1">All Bookings</h2>
                    <select className="input-glass px-4 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="pending">Pending</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Type city name..."
                      className="input-glass px-4 py-2"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                    />
                    <input type="date" className="input-glass px-4 py-2" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <input type="date" className="input-glass px-4 py-2" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white/5 rounded-3xl">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Booking ID</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">User</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Vehicle</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Slot</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Location</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Amount</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                          <th className="text-left py-4 px-6 text-gray-300 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking) => (
                          <tr key={booking._id} className="border-b border-white/10 hover:bg-white/10">
                            <td className="py-4 px-6 font-mono text-purple-400 text-sm">#{booking._id?.slice(-8)}</td>
                            <td className="py-4 px-6 font-semibold text-white">{booking.userId?.name}</td>
                            <td className="py-4 px-6 text-gray-300">{booking.vehicleId?.number || 'N/A'}</td>
                            <td className="py-4 px-6 font-semibold text-white">{booking.slotId?.location}</td>
                            <td className="py-4 px-6 text-gray-400">{booking.slotId?.city || 'N/A'}</td>
                            <td className="py-4 px-6 font-bold text-green-400">₹{Number(booking.totalAmount || 0).toFixed(2)}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[booking.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 text-sm">{new Date(booking.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

{activeTab === 'passManagement' && (
                <motion.div
                  key="passManagement"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-3xl font-bold text-white">Pass Management</h2>
                  
                  <motion.button
                    onClick={() => setShowCreatePassModal(true)}
                    className="neon-btn px-8 py-4 text-xl font-bold max-w-max mx-auto"
                    whileHover={{ scale: 1.05 }}
                  >
                    ➕ Create Pass
                  </motion.button>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{passes.map((pass) => (
                      <motion.div
                        key={pass._id}
className="w-full max-w-[260px] min-h-[360px] rounded-3xl shadow-xl p-6 flex flex-col card-glass group hover:shadow-2xl hover:scale-105 transition-all overflow-visible"
                        whileHover={{ scale: 1.03 }}
                      >
                        <div className="text-center mb-8">
                          <div className="bg-white p-2 rounded-full w-fit mx-auto mb-3 shadow">
                            <img src="/image/logo.png" alt="logo" className="h-14 object-contain" />
                          </div>
                          <h2 className="text-xl font-bold text-white mb-1">EZ PARKING</h2>
                          <p className="text-sm opacity-80 capitalize text-white">PREMIUM PASS</p>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <h3 className="text-lg font-semibold text-white text-center">{pass.name || 'Monthly Parking Pass'}</h3>
                          <p className="text-sm text-white text-center">Type: {pass.passType.charAt(0).toUpperCase() + pass.passType.slice(1)}</p>
                          <p className="text-sm text-white text-center">Validity: 30 Days</p>
                          <p className="text-2xl font-bold text-green-400 text-center">₹{Number(pass.price || 0).toFixed(2)}</p>
                        </div>
{user?.role && (user.role.toLowerCase() === 'admin') && (
                          <div className="flex gap-2 mt-auto pt-4">
                            <motion.button
                              className="flex-1 bg-blue-500/90 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPass(pass);
                                setEditFormData({
                                  name: pass.name || '',
                                  passType: pass.passType || 'weekly',
                                  price: pass.price || ''
                                });
                                setShowEditModal(true);
                              }}
                            >
                              ✏️ Edit
                            </motion.button>
                            <motion.button
                              className="flex-1 bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePass(pass._id);
                              }}
                            >
                              🗑️ Delete
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {passes.length === 0 && (
                      <div className="col-span-full card-glass p-12 text-center text-gray-400 rounded-3xl">
                        No passes created yet. Create your first pass above! 🎫
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-3xl font-bold text-white">Reports</h2>
                  {/* Reports filters */}
                  <div className="card-glass p-8 rounded-3xl">
                    <h3 className="text-xl font-bold text-white mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <select 
                        className="input-glass p-3" 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                      >
                        <option value="user">User Report</option>
                        <option value="lotowner">Lot Owner Report</option>
                        <option value="booking">Booking Report</option>
                        <option value="revenue">Revenue Report</option>
                        <option value="all">All Reports</option>
                      </select>
                      <select 
                        className="input-glass p-3" 
                        value={dateType}
                        onChange={(e) => setDateType(e.target.value)}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom Date</option>
                      </select>
                      {dateType === 'weekly' && (
                        <div>
                          <label className="text-sm text-gray-300 block mb-1">Week</label>
                          <select className="input-glass p-3 w-full" value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))}>
                            <option value={1}>Week 1 (1-7)</option>
                            <option value={2}>Week 2 (8-14)</option>
                            <option value={3}>Week 3 (15-21)</option>
                            <option value={4}>Week 4 (22-28)</option>
                            <option value={5}>Week 5 (29-End)</option>
                          </select>
                        </div>
                      )}
                      {dateType === 'monthly' && (
                        <>
                          <select className="input-glass p-3" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                              <option key={i} value={i}>{m}</option>
                            ))}
                          </select>
                          <select className="input-glass p-3" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                            {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </>
                      )}
                      {dateType === 'yearly' && (
                        <select className="input-glass p-3" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                          {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      )}
                      {dateType === 'custom' && (
                        <>
                          <input
                            type="date"
                            className="input-glass p-3"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                          />
                          <input
                            type="date"
                            className="input-glass p-3"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                          />
                        </>
                      )}
                      <input
                        type="text"
                        placeholder="City Filter"
                        className="input-glass p-3"
                        value={reportCityFilter}
                        onChange={(e) => setReportCityFilter(e.target.value)}
                      />
                      {(reportType === 'user' || reportType === 'lotowner') && (
                        <select className="input-glass p-3" value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}>
                          <option value="both">Both</option>
                          <option value="user">User</option>
                          <option value="lotowner">Lot Owner</option>
                        </select>
                      )}
                      <motion.button
                        className="neon-btn p-3 font-semibold"
                        onClick={() => {
                          setReportData(computeReportData());
                          setShowReportData(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        Show Data
                      </motion.button>
                    </div>
                    {showReportData && (
                      <div className="flex gap-4 mb-6">
                        <motion.button
                          className="neon-btn px-8 py-3 flex-1"
                          onClick={async () => {
                            // Save to backend first
                            const filters = {
                              type: reportType,
                              dateFrom,
                              dateTo,
                              cityFilter: reportCityFilter || undefined,
                              userTypeFilter: userTypeFilter !== 'both' ? userTypeFilter : undefined
                            };
                            try {
                              await adminAPI.generateCustomReport(filters);
                              toast.success('Report saved to database');
                            } catch (err) {
                              toast.error('Failed to save report');
                            }
                            // Client PDF
                            import('jspdf').then(({ jsPDF }) => {
                              import('jspdf-autotable').then(({ default: autoTable }) => {
                                let head = [];
                                let body = [];
                                if (reportType === 'booking') {
                                  head = [['ID', 'User', 'Vehicle', 'Slot', 'City', 'Start', 'End', 'Amount', 'Status']];
                                  body = reportData.map(row => [row.id, row.user, row.vehicle, row.slot, row.city, row.startTime, row.endTime, `₹${row.amount}`, row.status]);
                                } else if (reportType === 'revenue' || reportType === 'all') {
                                  head = [['Metric', 'Value']];
                                  body = reportData.map(row => {
                                    const entries = Object.entries(row);
                                    return entries.map(([k, v]) => [k, v]);
                                  }).flat();
                                } else {
                                  head = [['Name', 'Role/City', 'Bookings', 'Revenue']];
                                  body = reportData.map(row => [row.name, reportType === 'user' ? row.role : row.city, row.totalBookings, `₹${row.revenue}`]);
                                }
                                const doc = new jsPDF();
                                autoTable(doc, { head, body });
                                doc.save(`ezparking-${reportType}-report.pdf`);
                                toast.success('PDF exported');
                              });
                            });
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          📄 Export PDF
                        </motion.button>
                        <motion.button
                          className="px-8 py-3 bg-green-500/90 hover:bg-green-600 text-white rounded-xl flex-1 font-semibold shadow-lg"
                          onClick={async () => {
                            // Save to backend
                            const filters = {
                              type: reportType,
                              dateFrom,
                              dateTo,
                              cityFilter: reportCityFilter || undefined,
                              userTypeFilter: userTypeFilter !== 'both' ? userTypeFilter : undefined,
                              exportType: 'excel'
                            };
                            try {
                              await adminAPI.generateCustomReport(filters);
                              toast.success('Report saved to database');
                            } catch (err) {
                              toast.error('Failed to save report');
                            }
                            // Client Excel
                            import('xlsx').then(({ utils, writeFile }) => {
                              const ws = utils.json_to_sheet(reportData);
                              const wb = utils.book_new();
                              utils.book_append_sheet(wb, ws, `${reportType} Report`);
                              writeFile(wb, `ezparking-${reportType}-report.xlsx`);
                              toast.success('Excel exported');
                            });
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          📊 Export Excel
                        </motion.button>
                      </div>
                    )}
                  </div>
                  
                  {/* Reports table */}
                  {showReportData && reportData.length > 0 ? (
                    <div className="card-glass p-8 rounded-3xl overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">
                          Report Results ({reportData.length} records)
                        </h3>
                        <motion.button
                          className="px-4 py-2 bg-gray-500/80 hover:bg-gray-600 text-white rounded-xl text-sm"
                          onClick={() => setShowReportData(false)}
                          whileHover={{ scale: 1.05 }}
                        >
                          Clear
                        </motion.button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/20">
                              {reportType === 'booking' ? (
                                <>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">ID</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">User</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Vehicle</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Slot</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">City</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Start</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">End</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Amount</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                                </>
                              ) : reportType === 'revenue' || reportType === 'all' ? (
                                <>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Metric</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Value</th>
                                </>
                              ) : (
                                <>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Name</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Role/City</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Bookings</th>
                                  <th className="text-left py-4 px-6 text-gray-300 font-medium">Revenue (₹)</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.map((row, index) => (
                              <tr key={index} className="border-b border-white/10 hover:bg-white/10">
                                {reportType === 'booking' ? (
                                  <>
                                    <td className="py-4 px-6 font-mono text-purple-400 text-sm">{row.id}</td>
                                    <td className="py-4 px-6 font-semibold text-white">{row.user}</td>
                                    <td className="py-4 px-6 text-gray-300">{row.vehicle}</td>
                                    <td className="py-4 px-6 text-white">{row.slot}</td>
                                    <td className="py-4 px-6 text-purple-400">{row.city}</td>
                                    <td className="py-4 px-6 text-gray-300 text-sm">{row.startTime}</td>
                                    <td className="py-4 px-6 text-gray-300 text-sm">{row.endTime}</td>
                                    <td className="py-4 px-6 font-bold text-green-400">₹{row.amount}</td>
                                    <td className="py-4 px-6">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[row.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                        {row.status}
                                      </span>
                                    </td>
                                  </>
                                ) : reportType === 'revenue' || reportType === 'all' ? (
                                  <>
                                    <td className="py-4 px-6 font-semibold text-white">{Object.keys(row)[0]}</td>
                                    <td className="py-4 px-6 font-bold text-green-400">{row[Object.keys(row)[0]]}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-4 px-6 font-semibold text-white">{row.name}</td>
                                    <td className="py-4 px-6 text-purple-400">{reportType === 'user' ? row.role : row.city}</td>
                                    <td className="py-4 px-6 font-bold text-white">{row.totalBookings}</td>
                                    <td className="py-4 px-6 font-bold text-green-400">₹{row.revenue}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : showReportData ? (
                    <div className="card-glass p-12 text-center text-gray-400 rounded-3xl">
                      No data matching filters
                    </div>
                  ) : (
                    <div className="card-glass p-12 text-center text-gray-400 rounded-3xl">
                      Select filters and click "Show Data" to generate report 📊
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          onClick={loadData}
          className="fixed bottom-8 right-8 neon-btn p-4 rounded-3xl shadow-2xl z-40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Refresh Data
        </motion.button>

        {/* Create Pass Modal */}
        {showCreatePassModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card-glass p-8 w-full max-w-md rounded-3xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Create New Pass</h3>
              <form onSubmit={handleCreatePass} className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">Pass Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Parking Weekly Pass"
                    className="input-glass w-full p-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-semibold">Pass Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="input-glass w-full p-3"
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2 font-semibold">Pass Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="200.00"
                      className="input-glass w-full pl-8 p-3"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="submit"
                    className="neon-btn flex-1 py-3 font-bold text-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    Create Pass
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowCreatePassModal(false);
                      setFormData({ name: '', type: 'weekly', price: '' });
                    }}
                    className="px-8 py-3 glass text-white rounded-xl font-semibold hover:bg-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Pass Modal */}
        {showEditModal && editingPass && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card-glass p-8 w-full max-w-md rounded-3xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Edit Pass</h3>
              <form onSubmit={handleEditPass} className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">Pass Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Pass Name"
                    className="input-glass w-full p-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-semibold">Pass Type</label>
                  <select
                    value={editFormData.passType}
                    onChange={(e) => setEditFormData({...editFormData, passType: e.target.value})}
                    className="input-glass w-full p-3"
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2 font-semibold">Pass Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                      placeholder="Price"
                      className="input-glass w-full pl-8 p-3"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="submit"
                    className="neon-btn flex-1 py-3 font-bold text-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    Update Pass
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPass(null);
                      setEditFormData({ name: '', passType: 'weekly', price: '' });
                    }}
                    className="px-8 py-3 glass text-white rounded-xl font-semibold hover:bg-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

