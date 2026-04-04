import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { slotAPI, lotOwnerAPI } from '../services/api';
import { useUserStore } from '../stores/userStore';

const LotOwnerDashboard = () => {
  const navigate = useNavigate();
  const { user: storeUser, logout } = useUserStore();
  
  const localUserStr = localStorage.getItem('user');
  const localUser = localUserStr ? JSON.parse(localUserStr) : null;
  const currentUser = storeUser || localUser;

  // Core states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [slots, setSlots] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Slot management states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({
    location: '', city: '', price: '', numSlots: 1, type: 'car'
  });

  // Bookings filters
  const [historyFilters, setHistoryFilters] = useState({
    status: 'All', vehicleType: '', startDate: '', endDate: '', search: ''
  });

  // Wallet states
  const [walletData, setWalletData] = useState([]);
  const [walletFilters, setWalletFilters] = useState({ startDate: '', endDate: '', status: 'All' });
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletPagination, setWalletPagination] = useState({});
  const [walletSummary, setWalletSummary] = useState({ totalEarnings: 0, totalDays: 0 });

  // Reports states
  const [reportType, setReportType] = useState('booking');
  const [filterType, setFilterType] = useState('weekly');
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [showReportData, setShowReportData] = useState(false);

  useEffect(() => {
    if (!currentUser?.role || currentUser.role !== 'lotowner') {
      toast.error('Access denied. Please login as Lot Owner.');
      navigate('/login');
      return;
    }
    initLoad();
  }, []);

  const initLoad = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(), 
      loadSlots(), 
      loadActiveBookings(),
      loadChartData()
    ]);
    setLoading(false);
  };


  const loadStats = useCallback(async () => {
    try {
      const res = await lotOwnerAPI.getStats();
      setStats(res.data || {});
    } catch (error) {
      console.error('Stats error:', error);
      toast.error('Failed to load stats');
      setStats({ slotsCount: 0, availableSlots: 0, activeBookings: 0, totalEarnings: 0 });
    }
  }, []);

  const loadSlots = useCallback(async () => {
    try {
      const res = await lotOwnerAPI.getSlots();
      setSlots(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Slots error:', error);
      toast.error('Failed to load slots');
      setSlots([]);
    }
  }, []);

  const loadActiveBookings = useCallback(async () => {
    try {
      const res = await lotOwnerAPI.getActiveBookings();
      setActiveBookings(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Active bookings error:', error);
      toast.error('Failed to load active bookings');
      setActiveBookings([]);
    }
  }, []);

  const loadWalletData = useCallback(async (filters = {}) => {
    setWalletLoading(true);
    try {
      const params = {
        type: 'earnings',
        ...filters
      };
      const res = await lotOwnerAPI.getReportData(params);
      console.log('Wallet API Response:', res.data);
      if (!Array.isArray(res.data)) {
        console.warn('Wallet data not array, using empty array:', res.data);
        setWalletData([]);
        setWalletSummary({ totalEarnings: '0.00', totalDays: 0 });
        setWalletPagination({});
        return;
      }
      setWalletData(res.data || []);
      
      // Calculate summary - safer parsing
      const totalEarnings = res.data.reduce((sum, day) => {
        let earnings = 0;
        if (day.totalEarnings) {
          earnings = parseFloat(day.totalEarnings.replace(/[₹,]/g, '') || '0');
        }
        return sum + earnings;
      }, 0);
      
      setWalletSummary({
        totalEarnings: totalEarnings.toFixed(2),
        totalDays: res.data.length
      });
      
      setWalletPagination(res.pagination || {});
    } catch (error) {
      console.error('Wallet data error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Failed to load earnings data: ${error.response?.data?.message || error.message}`);
      setWalletData([]);
      setWalletSummary({ totalEarnings: '0.00', totalDays: 0 });
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadHistoryBookings = useCallback(async (filters = {}) => {
    setLoadingHistory(true);
    try {
      const params = {
        page: currentHistoryPage,
        limit: 10,
        ...filters
      };
      const res = await lotOwnerAPI.getOwnerBookings(params);
      setHistoryBookings(res.data.data || []);
      setPagination(res.data.pagination || {});
      if (filters.summary !== false) {
        const summaryRes = await lotOwnerAPI.getBookingsSummary();
        setHistorySummary(summaryRes.data.data);
      }
    } catch (error) {
      console.error('History bookings error:', error);
      toast.error('Failed to load booking history');
      setHistoryBookings([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentHistoryPage]);

  const handleFilterTypeChange = useCallback((e) => {
    const type = e.target.value;
    setFilterType(type);
    setShowCustomDates(type === 'custom');
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let newStart = '', newEnd = '';
    
    if (type === 'weekly') {
      // Default to current week (Week 1)
      const daysSinceMonthStart = now.getDate() - 1;
      const weekNum = Math.floor(daysSinceMonthStart / 7) + 1;
      setSelectedWeek(Math.min(weekNum, 5));
      const weekStart = new Date(currentYear, currentMonth, 1 + (weekNum - 1) * 7);
      newStart = weekStart.toISOString().slice(0, 10);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      newEnd = weekEnd.toISOString().slice(0, 10);
    } else if (type === 'monthly') {
      setSelectedMonth(currentMonth);
      newStart = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10);
      newEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10);
    } else if (type === 'yearly') {
      newStart = new Date(currentYear, 0, 1).toISOString().slice(0, 10);
      newEnd = new Date(currentYear, 11, 31).toISOString().slice(0, 10);
    }
    
    setStartDate(newStart);
    setEndDate(newEnd);
  }, []);

  const updateDateRange = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let newStart = '', newEnd = '';
    
    if (filterType === 'weekly') {
      const weekStart = new Date(currentYear, currentMonth, 1 + (selectedWeek - 1) * 7);
      newStart = weekStart.toISOString().slice(0, 10);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      newEnd = Math.min(weekEnd, new Date(currentYear, currentMonth + 1, 0)).toISOString().slice(0, 10);
    } else if (filterType === 'monthly') {
      newStart = new Date(currentYear, selectedMonth, 1).toISOString().slice(0, 10);
      newEnd = new Date(currentYear, selectedMonth + 1, 0).toISOString().slice(0, 10);
    } else if (filterType === 'yearly') {
      newStart = new Date(selectedYear, 0, 1).toISOString().slice(0, 10);
      newEnd = new Date(selectedYear, 11, 31).toISOString().slice(0, 10);
    }
    
    setStartDate(newStart);
    setEndDate(newEnd);
  }, [filterType, selectedWeek, selectedMonth, selectedYear]);

  const getSlotStatus = (slot) => slot.availableCount > 0 ? 'Available' : 'Booked';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSlotForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSlot = async (e, isEdit = false) => {
    e.preventDefault();
    try {
      if (isEdit && editingSlot) {
        await slotAPI.updateSlot(editingSlot._id, slotForm);
      } else {
        await slotAPI.createSlot(slotForm);
      }
      
      await Promise.all([loadSlots(), loadStats()]);
      
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingSlot(null);
      setSlotForm({ location: '', city: '', price: '', numSlots: 1, type: 'car' });
      
      toast.success(isEdit ? 'Slot updated!' : 'New slot added!');
    } catch (error) {
      console.error('Slot operation error:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteSlot = async () => {
    try {
      await slotAPI.deleteSlot(showDeleteConfirm._id);
      await Promise.all([loadSlots(), loadStats()]);
      toast.success('Slot deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Cancel this booking? This will free the slot.')) return;
    try {
      await lotOwnerAPI.cancelBooking(id);
      toast.success('Booking cancelled successfully');
      await Promise.all([loadActiveBookings(), loadStats()]);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.message || 'Cancel failed');
    }
  };

  // Chart states
  const [bookings7Days, setBookings7Days] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);

  // Retry utility
  const retryApi = async (apiFn, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiFn();
      } catch (error) {
        console.log(`API attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  };

  // Load chart data - SEQUENTIAL to reduce backend load
  const loadChartData = useCallback(async () => {
    try {
      // Sequential loading to avoid overwhelming backend
      const bookingsRes = await retryApi(() => lotOwnerAPI.getBookings7Days());
      const earningsRes = await retryApi(() => lotOwnerAPI.getReportData({ type: 'earnings' }));
      const vehicleRes = await retryApi(() => lotOwnerAPI.getReportData({ type: 'vehicle' }));
      
      setBookings7Days(bookingsRes.data?.data || []);
      setEarningsData(earningsRes.data?.data || []);
      let vehicleDataRaw = vehicleRes.data?.data || [];
      // Aggregate for vehicle chart if raw booking list
      if (vehicleDataRaw.length > 0 && vehicleDataRaw[0].vehicleType) {
        const typeCounts = {};
        vehicleDataRaw.forEach(item => {
          const type = item.vehicleType || 'Unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        vehicleDataRaw = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
      }
      setVehicleData(vehicleDataRaw);
    } catch (error) {
      console.error('Chart data error:', error);
      toast.error('Failed to load some charts (using fallback data)');
      // Specific fallbacks
      setBookings7Days([
        { day: 'Mon', bookings: 0 }, { day: 'Tue', bookings: 0 },
        { day: 'Wed', bookings: 0 }, { day: 'Thu', bookings: 0 },
        { day: 'Fri', bookings: 0 }, { day: 'Sat', bookings: 0 },
        { day: 'Sun', bookings: 0 }
      ]);
      setEarningsData([]);
      setVehicleData([]);
    }
  }, []);


  // Chart data computed
  const chartData = bookings7Days;
  const occupancyData = [
    { name: 'Available', value: stats?.availableSlots || 0 },
    { name: 'Occupied', value: (stats?.slotsCount || 0) - (stats?.availableSlots || 0) }
  ];
  const earningsChartData = earningsData.map(item => ({
    date: item.date?.slice(5) || 'N/A', // Format YYYY-MM-DD -> MM-DD
    earnings: item.totalEarnings || 0
  })).slice(0, 7); // Last 7 days
  const vehicleChartData = vehicleData.map(item => ({
    name: item.type || 'Unknown',
    value: item.totalBookings || 0
  }));


const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'slots', label: 'Slots', icon: '🅿️' },
  { id: 'history', label: 'Bookings', icon: '📋' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'wallet', label: 'Wallet', icon: '💰' }
];

  if (loading) {

    return (
      <div className="min-h-screen lotowner-bg flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
        <motion.div 
          className="w-20 h-20 border-4 border-white/20 border-t-emerald-400 rounded-full relative z-10" 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  const renderSummaryCards = () => {
    if (!historySummary && !stats) return null;
    const summary = historySummary || stats;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { value: summary.totalBookings || summary.slotsCount || 0, label: 'Total Bookings', icon: '📊', color: 'purple' },
          { value: summary.activeBookings || 0, label: 'Active', icon: '⚡', color: 'amber' },
          { value: summary.cancelledBookings || 0, label: 'Cancelled', icon: '❌', color: 'red' },
          { value: `₹${(summary.totalEarnings || 0).toFixed(2)}`, label: 'Total Earnings', icon: '💰', color: 'emerald' }
        ].map((card, i) => (
          <motion.div 
            key={i} 
            className="glass-dark p-6 rounded-3xl text-center border border-white/20 group hover:shadow-2xl hover:-translate-y-2 transition-all backdrop-blur-xl" 
            whileHover={{ y: -4 }}
          >
            <div className={`text-3xl mb-3 group-hover:scale-110 ${card.color === 'purple' ? 'text-purple-400' : card.color === 'emerald' ? 'text-emerald-400' : card.color === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-gray-400 uppercase tracking-wide text-sm">{card.label}</div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen lotowner-bg relative overflow-hidden">
      {/* Background Overlay */}

<header className="glass-dark-nav fixed top-0 left-0 right-0 z-50 py-4 px-6 shadow-2xl">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* Left Side */}
    <div className="flex flex-col">
      <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">
        EZ Parking
      </h1>
      {currentUser?.name && (
        <p className="text-gray-300 text-sm font-medium mt-1">
          Welcome, <span className="text-emerald-300 font-semibold">{currentUser.name}</span>
        </p>
      )}
    </div>
    
    {/* Right Side */}
    <div className="flex items-center space-x-4">
      {stats?.totalEarnings !== undefined && (
        <div className="text-right hidden md:block">
          <p className="text-emerald-400 font-bold text-xl drop-shadow-md">
            ₹{(stats.totalEarnings || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-gray-400 text-xs uppercase tracking-wide">Total Earnings</p>
        </div>
      )}
      <motion.button
        onClick={() => {
          logout();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          toast.success('Logged out successfully');
        }}
        className="btn-logout px-6 py-2 font-semibold hover:shadow-lg transition-all"
        whileHover={{ scale: 1.05 }}
      >
        Logout
      </motion.button>
    </div>
  </div>
</header>

<div className="pt-20 flex min-h-screen">
        {/* Sidebar */}
        <motion.div 
className={`lg:w-72 min-h-screen glass-dark backdrop-blur-xl border-r border-white/10 p-6 lg:sticky lg:top-24 z-40 ${
            isMobileMenuOpen ? 'fixed inset-0 bg-black/80 lg:hidden flex flex-col' : 'hidden lg:flex'
          }`}
          initial={{ x: -250 }} 
          animate={{ x: isMobileMenuOpen ? 0 : -250 }}
        >
          <button 
            className="lg:hidden mb-6 p-3 glass-dark rounded-xl w-full text-left z-50" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="text-xl mr-3">✕</span> Close Menu
          </button>
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                  if (item.id === 'history') loadHistoryBookings(historyFilters);
                  if (item.id === 'wallet') loadWalletData(walletFilters);
                }}
                className={`w-full flex items-center space-x-3 p-4 rounded-2xl font-semibold transition-all group border-2 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-emerald-500/40 to-teal-500/40 text-white border-emerald-400/50 shadow-emerald-500/20 shadow-lg'
                    : 'text-gray-300 hover:bg-white/10 hover:border-white/20 border-transparent'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Mobile Menu Toggle */}
        <button 
className="lg:hidden fixed top-24 left-4 z-50 p-3 glass-dark rounded-xl shadow-lg" 
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:ml-72 overflow-y-auto relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.section 
                key="dashboard" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }} 
                className="space-y-8 w-full"
              >
                {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { value: stats?.slotsCount || 0, label: 'Total Slots', icon: '🅿️', color: 'purple' },
                    { value: stats?.availableSlots || 0, label: 'Available', icon: '✅', color: 'emerald' },
                    { value: stats?.activeBookings || 0, label: 'Active Bookings', icon: '⚡', color: 'amber' },
                    { value: `₹${(stats?.totalEarnings || 0).toFixed(2)}`, label: 'Total Earnings', icon: '💰', color: 'gradient-emerald' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      className="glass-dark p-6 rounded-3xl text-center border border-white/20 group hover:shadow-2xl hover:-translate-y-2 backdrop-blur-xl" 
                      whileHover={{ y: -4 }}
                    >
                      <div className={`text-3xl mb-3 group-hover:scale-110 ${stat.color === 'purple' ? 'text-purple-400' : stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'amber' ? 'text-amber-400' : 'text-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent'}`}>
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-gray-400 uppercase tracking-wide text-sm">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* 4 Charts Grid - Responsive */}
                <div className="max-w-7xl mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chart 1: Booking Trend (Bar Chart) */}
                    <motion.div className="glass-dark p-6 rounded-xl border border-white/20 backdrop-blur-xl h-[350px]" whileHover={{ y: -2 }}>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        📈 Booking Trend
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Chart 2: Earnings (Line Chart) */}
                    <motion.div className="glass-dark p-6 rounded-xl border border-white/20 backdrop-blur-xl h-[350px]" whileHover={{ y: -2 }}>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        💰 Earnings
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={earningsChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Earnings']} />
                          <Line type="monotone" dataKey="earnings" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Chart 3: Slot Occupancy (Horizontal Bar Chart) */}
                    <motion.div className="glass-dark p-6 rounded-xl border border-white/20 backdrop-blur-xl h-[350px]" whileHover={{ y: -2 }}>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        🅿️ Slot Occupancy
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart layout="vertical" data={occupancyData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
                          <Tooltip formatter={(value) => [value, 'Slots']} />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} layout="vertical" />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Chart 4: Vehicle Type (Bar Chart) */}
                    <motion.div className="glass-dark p-6 rounded-xl border border-white/20 backdrop-blur-xl h-[350px]" whileHover={{ y: -2 }}>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        🚗 Vehicle Type
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={vehicleChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </div>
                </div>

                {/* Quick Slots */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-white">My Parking Slots ({slots.length})</h2>

                    <motion.button 
                      onClick={() => setShowAddModal(true)} 
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-emerald-500/50 z-50 pointer-events-auto" 
                      whileHover={{ scale: 1.05 }}
                    >
                      ➕ Add Slot
                    </motion.button>
                  </div>

                  <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {slots.slice(0, 4).map(slot => (
                      <motion.div 
                        key={slot._id} 
                        className="glass-dark p-4 rounded-xl h-52 flex flex-col w-full"
                        whileHover={{ y: -4 }}
                      >
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-white mb-1 line-clamp-1">{slot.location}, {slot.city}</h4>
                          <p className="text-xs text-gray-400 mb-1 capitalize">Type: {slot.type}</p>
                          <div className={`inline-flex px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                            getSlotStatus(slot) === 'Available' 
                              ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-400/50' 
                              : 'bg-red-500/30 text-red-400 border border-red-400/50'
                          }`}>
                            {getSlotStatus(slot)} ({slot.availableCount}/{slot.totalSlots})
                          </div>
                          <div className="text-2xl font-bold text-emerald-400 mb-2">₹{slot.price}/hr</div>
                        </div>
                        <div className="mt-auto pt-3 flex gap-2">
                          <motion.button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSlot(slot);
                              setSlotForm({
                                location: slot.location || '',
                                city: slot.city || '',
                                price: slot.price || '',
                                numSlots: slot.totalSlots || 1,
                                type: slot.type || 'car'
                              });
                              setShowEditModal(true);
                            }} 
                            className="px-3 py-1 text-sm bg-blue-500 rounded-md hover:bg-blue-600 text-white font-medium shadow-lg hover:shadow-blue-500/30" 
                            whileHover={{ scale: 1.02 }}
                          >
                            Edit
                          </motion.button>
                          <motion.button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(slot);
                            }} 
                            className="px-3 py-1 text-sm bg-red-500 rounded-md hover:bg-red-600 text-white font-medium shadow-lg hover:shadow-red-500/30" 
                            whileHover={{ scale: 1.02 }}
                          >
                            Delete
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                    {slots.length === 0 && (
                      <motion.div className="glass-dark p-12 rounded-3xl text-center border-2 border-dashed border-gray-500/50 col-span-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="text-6xl mb-4">🅿️</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Parking Slots</h3>
                        <p className="text-gray-400 mb-6">Add your first parking slot to start earning money!</p>
                        <motion.button 
                          onClick={() => setShowAddModal(true)}
                          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold shadow-xl hover:shadow-emerald-500/50" 
                          whileHover={{ scale: 1.05 }}
                        >
                          ➕ Add First Slot
                        </motion.button>
                      </motion.div>
                    )}
                    </div>
                  </div>
                </section>

                {/* Active Bookings Table */}
                <motion.section className="glass-dark p-8 rounded-3xl border border-white/20 backdrop-blur-xl" whileHover={{ y: -2 }}>
                  <h3 className="text-2xl font-bold text-white mb-6">Active Bookings ({activeBookings.length})</h3>
                  {activeBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-lg">No active bookings at the moment</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="p-4 text-left text-gray-300 font-semibold">User</th>
                            <th className="p-4 text-left text-gray-300 font-semibold">Vehicle</th>
                            <th className="p-4 text-left text-gray-300 font-semibold">Slot</th>
                            <th className="p-4 text-left text-gray-300 font-semibold">Start</th>
                            <th className="p-4 text-left text-gray-300 font-semibold">Amount</th>
                            <th className="p-4 text-left text-gray-300 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBookings.map(booking => (
                            <tr key={booking._id} className="border-b border-white/10 hover:bg-white/10">
                              <td className="p-4 font-semibold text-white">{booking.userId?.name}</td>
                              <td className="p-4 text-gray-300">{booking.vehicleId?.number} ({booking.vehicleId?.type})</td>
                              <td className="p-4 font-medium">{booking.slotId?.location}</td>
                              <td className="p-4 text-gray-300 text-sm">{new Date(booking.startTime).toLocaleString()}</td>
                              <td className="p-4 font-bold text-emerald-400">₹{booking.totalAmount?.toFixed(2)}</td>
                              <td className="p-4">
                                <motion.button 
                                  onClick={() => handleCancelBooking(booking._id)}
                                  className="px-4 py-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-red-500/30" 
                                  whileHover={{ scale: 1.05 }}
                                >
                                  Cancel
                                </motion.button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.section>
              </motion.section>
            )}

            {/* Slots Tab */}
            {activeTab === 'slots' && (
              <motion.section 
                key="slots" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-8 w-full"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Manage Parking Slots
                  </h2>
                  <motion.button 
                    onClick={() => setShowAddModal(true)} 
                    className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 z-50 pointer-events-auto" 
                    whileHover={{ scale: 1.05 }}
                  >
                    ➕ Add New Slot
                  </motion.button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-4 mb-8 z-50 pointer-events-auto">
                  <motion.button 
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all ${viewMode === 'list' ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-400 shadow-lg' : 'glass-dark text-gray-300 hover:bg-white/10'}`} 
                    onClick={() => setViewMode('list')}
                    whileHover={{ scale: 1.02 }}
                  >
                    Card View
                  </motion.button>
                  <motion.button 
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all ${viewMode === 'table' ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-400 shadow-lg' : 'glass-dark text-gray-300 hover:bg-white/10'}`} 
                    onClick={() => setViewMode('table')}
                    whileHover={{ scale: 1.02 }}
                  >
                    Table View
                  </motion.button>
                </div>

                {/* Slots Content */}
                {viewMode === 'list' ? (
                  <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {slots.map(slot => (
                      <motion.div 
                        key={slot._id} 
                        className="glass-dark p-4 rounded-xl border border-white/20 backdrop-blur-xl h-52 flex flex-col hover:shadow-xl group cursor-pointer" 
                        whileHover={{ y: -4 }}
                      >
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-white mb-1 line-clamp-1">{slot.location}, {slot.city}</h4>
                          <p className="text-xs text-gray-400 mb-1 capitalize">Type: {slot.type}</p>
                          <div className={`inline-flex px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                            getSlotStatus(slot) === 'Available' 
                              ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-400/50' 
                              : 'bg-red-500/30 text-red-400 border border-red-400/50'
                          }`}>
                            {getSlotStatus(slot)} ({slot.availableCount}/{slot.totalSlots})
                          </div>
                          <div className="text-2xl font-bold text-emerald-400 mb-2">₹{slot.price}/hr</div>
                        </div>
                        <div className="mt-auto pt-3 flex gap-2">
                          <motion.button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSlot(slot);
                              setSlotForm({
                                location: slot.location || '',
                                city: slot.city || '',
                                price: slot.price || '',
                                numSlots: slot.totalSlots || 1,
                                type: slot.type || 'car'
                              });
                              setShowEditModal(true);
                            }} 
                            className="px-3 py-1 text-sm bg-blue-500 rounded-md hover:bg-blue-600 text-white font-medium shadow-lg hover:shadow-blue-500/30" 
                            whileHover={{ scale: 1.02 }}
                          >
                            Edit
                          </motion.button>
                          <motion.button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(slot);
                            }} 
                            className="px-3 py-1 text-sm bg-red-500 rounded-md hover:bg-red-600 text-white font-medium shadow-lg hover:shadow-red-500/30" 
                            whileHover={{ scale: 1.02 }}
                          >
                            Delete
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                    {slots.length === 0 && (
                      <motion.div className="glass-dark p-16 rounded-3xl text-center border-2 border-dashed border-gray-500/50 col-span-full backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="text-6xl mb-6">🅿️</div>
                        <h3 className="text-2xl font-bold text-white mb-4">No Parking Slots Found</h3>
                        <p className="text-gray-400 mb-8 text-lg">Get started by adding your first parking slot location</p>
                        <motion.button 
                          onClick={() => setShowAddModal(true)}
                          className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50" 
                          whileHover={{ scale: 1.05 }}
                        >
                          ➕ Add Your First Slot
                        </motion.button>
                      </motion.div>
                    )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto glass-dark rounded-3xl border border-white/20 backdrop-blur-xl">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="p-4 text-left text-gray-300 font-semibold">Location</th>
                          <th className="p-4 text-left text-gray-300 font-semibold">City</th>
                          <th className="p-4 text-left text-gray-300 font-semibold">Type</th>
                          <th className="p-4 text-left text-gray-300 font-semibold">Available</th>
                          <th className="p-4 text-left text-gray-300 font-semibold">Price/hr</th>
                          <th className="p-4 text-left text-gray-300 font-semibold">Status</th>
                          <th className="p-4 text-left text-gray-300 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slots.map(slot => (
                          <tr key={slot._id} className="border-b border-white/10 hover:bg-white/10">
                            <td className="p-4 font-medium text-white">{slot.location}</td>
                            <td className="p-4 text-gray-300">{slot.city}</td>
                            <td className="p-4 capitalize text-emerald-400 font-semibold">{slot.type}</td>
                            <td className="p-4 font-bold text-emerald-400">{slot.availableCount}/{slot.totalSlots}</td>
                            <td className="p-4 font-bold text-emerald-400">₹{slot.price}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                getSlotStatus(slot) === 'Available' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50' 
                                  : 'bg-red-500/20 text-red-400 border border-red-400/50'
                              }`}>
                                {getSlotStatus(slot)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <motion.button 
                                  onClick={() => {
                                    setEditingSlot(slot);
                                    setSlotForm({
                                      location: slot.location,
                                      city: slot.city,
                                      price: slot.price,
                                      numSlots: slot.totalSlots,
                                      type: slot.type
                                    });
                                    setShowEditModal(true);
                                  }} 
                                  className="px-3 py-1 text-sm bg-blue-500 rounded-md hover:bg-blue-600 text-white font-medium shadow-lg hover:shadow-blue-500/30" 
                                  whileHover={{ scale: 1.02 }}
                                >
                                  Edit
                                </motion.button>
                                <motion.button 
                                  onClick={() => setShowDeleteConfirm(slot)}
                                  className="px-3 py-1 text-sm bg-red-500 rounded-md hover:bg-red-600 text-white font-medium shadow-lg hover:shadow-red-500/30" 
                                  whileHover={{ scale: 1.02 }}
                                >
                                  Delete
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {slots.length === 0 && (
                          <tr>
                            <td colSpan="7" className="p-16 text-center text-gray-400">
                              <div className="text-5xl mb-4">🅿️</div>
                              <p className="text-xl font-semibold text-white mb-2">No slots available</p>
                              <motion.button 
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold shadow-xl hover:shadow-emerald-500/50" 
                                whileHover={{ scale: 1.05 }}
                              >
                                ➕ Add Slot Now
                              </motion.button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.section>
            )}

            {/* Bookings Tab */}
            {activeTab === 'history' && (
              <motion.section 
                key="history" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-8"
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-8 flex items-center gap-4">
                  Booking History
                  <span className="text-xl bg-emerald-500/20 px-4 py-1 rounded-full text-emerald-300">
                    {historyBookings.length} bookings found
                  </span>
                </h2>

                {/* Summary Cards */}

                {/* Filters */}
                <motion.div 
                  className="glass-dark p-6 rounded-3xl border border-white/20 backdrop-blur-xl" 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm uppercase tracking-wide">Status</label>
                      <select 
                        value={historyFilters.status} 
                        onChange={(e) => setHistoryFilters({...historyFilters, status: e.target.value})} 
                        className="input-glass w-full p-3 rounded-xl text-white"
                      >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm uppercase tracking-wide">Vehicle Type</label>
                      <select 
                        value={historyFilters.vehicleType} 
                        onChange={(e) => setHistoryFilters({...historyFilters, vehicleType: e.target.value})} 
                        className="input-glass w-full p-3 rounded-xl text-white"
                      >
                        <option value="">All Vehicles</option>
                        <option value="car">Car</option>
                        <option value="bike">Bike</option>
                        <option value="scooter">Scooter</option>
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-white font-semibold mb-2 text-sm uppercase tracking-wide">Date Range</label>
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={historyFilters.startDate} 
                          onChange={(e) => setHistoryFilters({...historyFilters, startDate: e.target.value})}
                          className="input-glass flex-1 p-3 rounded-xl text-white text-sm" 
                        />
                        <span className="text-gray-400 self-center px-2 font-semibold">TO</span>
                        <input 
                          type="date" 
                          value={historyFilters.endDate} 
                          onChange={(e) => setHistoryFilters({...historyFilters, endDate: e.target.value})}
                          className="input-glass flex-1 p-3 rounded-xl text-white text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <motion.button 
                      onClick={() => loadHistoryBookings(historyFilters)}
                      className="flex-1 py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-emerald-500/50 transition-all" 
                      whileHover={{ scale: 1.02 }}
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? 'Loading...' : '🔍 Apply Filters'}
                    </motion.button>
                    <motion.button 
                      onClick={() => {
                        setHistoryFilters({ status: 'All', vehicleType: '', startDate: '', endDate: '', search: '' });
                        setCurrentHistoryPage(1);
                        loadHistoryBookings({});
                      }}
                      className="px-8 py-4 glass-dark border border-white/30 text-white rounded-2xl font-bold hover:bg-white/10 transition-all" 
                      whileHover={{ scale: 1.02 }}
                    >
                      🔄 Reset
                    </motion.button>
                  </div>
                </motion.div>

                {/* Bookings Table */}
                <motion.div 
                  className="glass-dark rounded-3xl border border-white/20 overflow-hidden backdrop-blur-xl" 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                >
                  {loadingHistory ? (
                    <div className="p-16 text-center">
                      <motion.div 
                        className="w-16 h-16 border-4 border-white/20 border-t-emerald-400 rounded-full mx-auto" 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <p className="text-gray-400 mt-4 text-lg">Loading booking history...</p>
                    </div>
                  ) : historyBookings.length === 0 ? (
                    <div className="p-20 text-center text-gray-400">
                      <div className="text-7xl mb-6">📋</div>
                      <h3 className="text-3xl font-bold text-white mb-4">No Bookings Found</h3>
                      <p className="text-xl mb-8">Try adjusting filters above or add parking slots to start receiving bookings</p>
                      <motion.button 
                        onClick={() => setActiveTab('slots')}
                        className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50" 
                        whileHover={{ scale: 1.05 }}
                      >
                        ➕ Add Parking Slots
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/10">
                            <tr>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">ID</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">User</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Phone</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Vehicle</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Location</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Date</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Status</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyBookings.map(booking => {
                              const statusColor = booking.status === 'Active' ? 'bg-amber-500/20 text-amber-400' 
                                : booking.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' 
                                : booking.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' 
                                : 'bg-gray-500/20 text-gray-400';
                              return (
                                <tr key={booking._id} className="border-b border-white/10 hover:bg-white/10">
                                  <td className="p-4 font-mono text-emerald-400 text-xs font-medium">#{booking._id.slice(-8)}</td>
                                  <td className="p-4 font-semibold text-white text-sm">{booking.userId?.name || 'N/A'}</td>
                                  <td className="p-4 text-gray-300 text-xs">{booking.userId?.phone || 'N/A'}</td>
                                  <td className="p-4 text-gray-200 text-sm">
                                    <div className="font-semibold">{booking.vehicleId?.number || 'N/A'}</div>
                                    <div className="capitalize text-xs text-gray-400">{booking.vehicleId?.type}</div>
                                  </td>
                                  <td className="p-4 font-medium text-white text-sm">{booking.slotId?.location || 'N/A'}</td>
                                  <td className="p-4 text-gray-400 text-xs">{new Date(booking.createdAt).toLocaleDateString()}</td>
                                  <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                                      {booking.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-emerald-400 text-sm">₹{(booking.totalAmount || 0).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {pagination.total > 10 && (
                        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                          <div className="text-gray-400 text-sm">
                            Showing {(currentHistoryPage - 1) * 10 + 1} to {Math.min(currentHistoryPage * 10, pagination.total)} of {pagination.total} bookings
                          </div>
                          <div className="flex gap-2">
                            <motion.button 
                              onClick={() => setCurrentHistoryPage(p => Math.max(1, p - 1))}
                              disabled={currentHistoryPage === 1}
                              className="px-4 py-2 glass-dark border border-white/30 text-white rounded-xl font-medium hover:bg-white/10 disabled:opacity-50" 
                              whileHover={{ scale: 1.02 }}
                            >
                              Previous
                            </motion.button>
                            <span className="text-white font-semibold px-4 py-2 bg-white/10 rounded-xl">{currentHistoryPage} / {pagination.pages}</span>
                            <motion.button 
                              onClick={() => setCurrentHistoryPage(p => Math.min(pagination.pages, p + 1))}
                              disabled={currentHistoryPage === pagination.pages}
                              className="px-4 py-2 glass-dark border border-white/30 text-white rounded-xl font-medium hover:bg-white/10 disabled:opacity-50" 
                              whileHover={{ scale: 1.02 }}
                            >
                              Next
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Export */}
                <div className="flex gap-4 mt-8">
                  <motion.button 
                    onClick={async () => {
                      if (historyBookings.length === 0) {
                        toast.warning('No data to export');
                        return;
                      }
                      try {
                        const { jsPDF } = await import('jspdf');
                        const { default: autoTable } = await import('jspdf-autotable');
                        const doc = new jsPDF();
                        doc.text(`Lot Owner Report - ${new Date().toLocaleDateString()}`, 14, 15);
                        autoTable(doc, {
                          head: [['ID', 'User', 'Vehicle', 'Location', 'Status', 'Amount']],
                          body: historyBookings.map(b => [
                            b._id.slice(-8),
                            b.userId?.name || '',
                            b.vehicleId?.number || '',
                            b.slotId?.location || '',
                            b.status || '',
                            `₹${(b.totalAmount || 0).toFixed(2)}`
                          ])
                        });
                        doc.save(`lotowner-bookings-${Date.now()}.pdf`);
                        toast.success('PDF exported successfully!');
                      } catch (error) {
                        toast.error('Export failed');
                      }
                    }}
                    className="flex-1 py-4 px-8 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-red-500/50 transition-all" 
                    whileHover={{ scale: 1.02 }}
                  >
                    📄 Export PDF
                  </motion.button>
                  <motion.button 
                    onClick={async () => {
                      if (historyBookings.length === 0) {
                        toast.warning('No data to export');
                        return;
                      }
                      try {
                        const { utils, writeFile } = await import('xlsx');
                        const ws = utils.json_to_sheet(historyBookings.map(b => ({
                          'ID': b._id.slice(-8),
                          'User': b.userId?.name || '',
                          'Phone': b.userId?.phone || '',
                          'Vehicle': b.vehicleId?.number || '',
                          'Location': b.slotId?.location || '',
                          'Status': b.status || '',
                          'Amount': `₹${(b.totalAmount || 0).toFixed(2)}`
                        })));
                        const wb = utils.book_new();
                        utils.book_append_sheet(wb, ws, 'Bookings');
                        writeFile(wb, `lotowner-bookings-${Date.now()}.xlsx`);
                        toast.success('Excel exported successfully!');
                      } catch (error) {
                        toast.error('Export failed');
                      }
                    }}
                    className="flex-1 py-4 px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/50 transition-all" 
                    whileHover={{ scale: 1.02 }}
                  >
                    📊 Export Excel
                  </motion.button>
                </div>
              </motion.section>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <motion.section 
                key="wallet" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-8"
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent mb-8 flex items-center gap-4">
                  💰 Wallet & Earnings
                  <span className="text-xl bg-emerald-500/20 px-4 py-1 rounded-full text-emerald-300">
                    {walletData.length} earning days
                  </span>
                </h2>

                {/* Wallet Summary Cards */}
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { value: `₹${walletSummary.totalEarnings}`, label: 'Total Earnings', icon: '💰', color: 'emerald' },
                    { value: walletData.length, label: 'Earning Days', icon: '📅', color: 'blue' },
                    { value: stats?.activeBookings || 0, label: 'Active Revenue', icon: '⚡', color: 'amber' }
                  ].map((card, i) => (
                    <motion.div 
                      key={i}
                      className="glass-dark p-8 rounded-3xl text-center border border-white/20 group hover:shadow-2xl hover:-translate-y-2 backdrop-blur-xl" 
                      whileHover={{ y: -4 }}
                    >
                      <div className={`text-4xl mb-4 group-hover:scale-110 ${card.color === 'emerald' ? 'text-emerald-400' : card.color === 'blue' ? 'text-blue-400' : 'text-amber-400'}`}>
                        {card.icon}
                      </div>
                      <div className="text-3xl font-black text-white mb-2">{card.value}</div>
                      <div className="text-gray-400 uppercase tracking-wide text-sm font-semibold">{card.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Filters */}
                <motion.div 
                  className="glass-dark p-6 rounded-3xl border border-white/20 backdrop-blur-xl" 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                    <div className="lg:col-span-2">
                      <label className="block text-white font-semibold mb-2 text-sm uppercase tracking-wide">Date Range</label>
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={walletFilters.startDate} 
                          onChange={(e) => setWalletFilters({...walletFilters, startDate: e.target.value})}
                          className="input-glass flex-1 p-3 rounded-xl text-white text-sm" 
                        />
                        <span className="text-gray-400 self-center px-2 font-semibold">TO</span>
                        <input 
                          type="date" 
                          value={walletFilters.endDate} 
                          onChange={(e) => setWalletFilters({...walletFilters, endDate: e.target.value})}
                          className="input-glass flex-1 p-3 rounded-xl text-white text-sm" 
                        />
                      </div>
                    </div>
                    <motion.button 
                      onClick={() => loadWalletData(walletFilters)}
                      className="py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-emerald-500/50 w-full lg:w-auto" 
                      whileHover={{ scale: 1.02 }}
                      disabled={walletLoading}
                    >
                      {walletLoading ? 'Loading...' : '🔍 Load Earnings'}
                    </motion.button>
                  </div>
                  <motion.button 
                    onClick={() => {
                      setWalletFilters({ startDate: '', endDate: '', status: 'All' });
                      loadWalletData({});
                    }}
                    className="mt-4 px-8 py-3 glass-dark border border-white/30 text-white rounded-2xl font-bold hover:bg-white/10 w-full lg:w-auto" 
                    whileHover={{ scale: 1.02 }}
                  >
                    🔄 Reset Filters
                  </motion.button>
                </motion.div>

                {/* Earnings Table */}
                <motion.div 
                  className="glass-dark rounded-3xl border border-white/20 overflow-hidden backdrop-blur-xl" 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                >
                  {walletLoading ? (
                    <div className="p-16 text-center">
                      <motion.div 
                        className="w-16 h-16 border-4 border-white/20 border-t-emerald-400 rounded-full mx-auto" 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <p className="text-gray-400 mt-4 text-lg">Loading earnings data...</p>
                    </div>
                  ) : walletData.length === 0 ? (
                    <div className="p-20 text-center text-gray-400">
                      <div className="text-7xl mb-6">💰</div>
                      <h3 className="text-3xl font-bold text-white mb-4">No Earnings Data</h3>
                      <p className="text-xl mb-8">Apply date filters or check back after receiving bookings</p>
                      <motion.button 
                        onClick={() => loadWalletData({})}
                        className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50" 
                        whileHover={{ scale: 1.05 }}
                      >
                        🔄 Reload Data
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          📊 Daily Earnings Breakdown ({walletData.length} days)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/10">
                            <tr>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Date</th>
                              <th className="p-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Bookings</th>
                              <th className="p-4 text-right text-gray-300 font-semibold text-sm uppercase tracking-wider">Earnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {walletData.map((day, idx) => (
                              <tr key={idx} className="border-b border-white/10 hover:bg-emerald-500/5 transition-colors">
                                <td className="p-4 font-medium text-white">{day.date}</td>
                                <td className="p-4 font-semibold text-emerald-400">{day.totalBookings || 0}</td>
                                <td className="p-4 font-bold text-emerald-400 text-right text-xl">{day.totalEarnings}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Export */}
                      <div className="flex gap-4 px-6 py-4 bg-white/5 border-t border-white/10">
                        <motion.button 
                          onClick={async () => {
                            if (walletData.length === 0) return toast.warning('No data to export');
                            try {
                              const { jsPDF } = await import('jspdf');
                              const { default: autoTable } = await import('jspdf-autotable');
                              const doc = new jsPDF();
                              doc.text(`Lot Owner Earnings Report - ${new Date().toLocaleDateString()}`, 14, 15);
                              autoTable(doc, {
                                head: [['Date', 'Bookings', 'Earnings']],
                                body: walletData.map(d => [d.date, d.totalBookings || 0, d.totalEarnings])
                              });
                              doc.save(`lotowner-earnings-${Date.now()}.pdf`);
                              toast.success('PDF exported!');
                            } catch (error) {
                              toast.error('Export failed');
                            }
                          }}
                          className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg" 
                          whileHover={{ scale: 1.02 }}
                        >
                          📄 Export PDF
                        </motion.button>
                        <motion.button 
                          onClick={async () => {
                            if (walletData.length === 0) return toast.warning('No data to export');
                            try {
                              const { utils, writeFile } = await import('xlsx');
                              const ws = utils.json_to_sheet(walletData.map(d => ({
                                Date: d.date,
                                'Total Bookings': d.totalBookings || 0,
                                Earnings: d.totalEarnings
                              })));
                              const wb = utils.book_new();
                              utils.book_append_sheet(wb, ws, 'Earnings');
                              writeFile(wb, `lotowner-earnings-${Date.now()}.xlsx`);
                              toast.success('Excel exported!');
                            } catch (error) {
                              toast.error('Export failed');
                            }
                          }}
                          className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg" 
                          whileHover={{ scale: 1.02 }}
                        >
                          📊 Export Excel
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.section>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <motion.section 
                key="reports" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-8"
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-8">
                  Generate Reports 📊
                </h2>

                {/* Report Form */}
                <motion.div className="glass-dark p-8 rounded-3xl border border-white/20 backdrop-blur-xl" whileHover={{ y: -2 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div>
                      <label className="block text-white font-bold mb-4 text-lg">Report Type</label>
                      <select 
                        value={reportType} 
                        onChange={(e) => setReportType(e.target.value)}
                        className="input-glass w-full p-4 rounded-2xl text-lg font-semibold"
                      >
                        <option value="booking">Booking Report</option>
                        <option value="earnings">Earnings Report</option>
                        <option value="vehicle">Vehicle Report</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-bold mb-4 text-lg">Filter Type</label>
                      <select 
                        value={filterType} 
                        onChange={handleFilterTypeChange}
                        className="input-glass w-full p-4 rounded-2xl text-lg font-semibold"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    {filterType === 'weekly' && (
                      <div>
                        <label className="block text-white font-bold mb-4 text-lg">Select Week</label>
                        <select 
                          value={selectedWeek} 
                          onChange={(e) => {
                            setSelectedWeek(Number(e.target.value));
                            updateDateRange();
                          }}
                          className="input-glass w-full p-4 rounded-2xl text-lg font-semibold"
                        >
                          <option value={1}>Week 1 (1-7)</option>
                          <option value={2}>Week 2 (8-14)</option>
                          <option value={3}>Week 3 (15-21)</option>
                          <option value={4}>Week 4 (22-28)</option>
                          <option value={5}>Week 5 (29-end)</option>
                        </select>
                      </div>
                    )}
                    {filterType === 'monthly' && (
                      <div>
                        <label className="block text-white font-bold mb-4 text-lg">Select Month</label>
                        <select 
                          value={selectedMonth} 
                          onChange={(e) => {
                            setSelectedMonth(Number(e.target.value));
                            updateDateRange();
                          }}
                          className="input-glass w-full p-4 rounded-2xl text-lg font-semibold"
                        >
                          <option value={0}>January</option>
                          <option value={1}>February</option>
                          <option value={2}>March</option>
                          <option value={3}>April</option>
                          <option value={4}>May</option>
                          <option value={5}>June</option>
                          <option value={6}>July</option>
                          <option value={7}>August</option>
                          <option value={8}>September</option>
                          <option value={9}>October</option>
                          <option value={10}>November</option>
                          <option value={11}>December</option>
                        </select>
                      </div>
                    )}
                    {filterType === 'yearly' && (
                      <div>
                        <label className="block text-white font-bold mb-4 text-lg">Select Year</label>
                        <input 
                          type="number" 
                          value={selectedYear}
                          onChange={(e) => {
                            setSelectedYear(Number(e.target.value));
                            updateDateRange();
                          }}
                          className="input-glass w-full p-4 rounded-2xl text-lg font-semibold text-center"
                          min={2020}
                          max={2030}
                        />
                      </div>
                    )}
                    {showCustomDates && (
                      <div>
                        <label className="block text-white font-bold mb-4 text-lg">Custom Date Range</label>
                        <div className="flex gap-2">
                          <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-glass flex-1 p-4 rounded-2xl text-lg" 
                          />
                          <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input-glass flex-1 p-4 rounded-2xl text-lg" 
                          />
                        </div>
                      </div>
                    )}
                    {reportType === 'vehicle' && (
                      <div>
                        <label className="block text-white font-bold mb-4 text-lg">Vehicle Type</label>
                        <select 
                          value={vehicleFilter} 
                          onChange={(e) => setVehicleFilter(e.target.value)}
                          className="input-glass w-full p-4 rounded-2xl text-lg font-semibold"
                        >
                          <option value="">All Vehicles</option>
                          <option value="car">Car</option>
                          <option value="bike">Bike</option>
                          <option value="scooter">Scooter</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <motion.button 
                    onClick={async () => {
                      setIsReportLoading(true);
                      try {
                        const params = {
                          type: reportType,
                          startDate,
                          endDate,
                          vehicleType: vehicleFilter
                        };
                        const res = await lotOwnerAPI.getReportData(params);
                        setReportData(res.data.data || []);
                        setShowReportData(true);
                        toast.success('Report data loaded!');
                      } catch (error) {
                        console.error('Report error:', error);
                        toast.error('Failed to load report data');
                      } finally {
                        setIsReportLoading(false);
                      }
                    }}
                    disabled={isReportLoading}
                    className={`px-16 py-5 text-xl font-bold rounded-3xl shadow-2xl mx-auto block transition-all text-white ${
                      isReportLoading 
                        ? 'bg-gray-600/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {isReportLoading ? 'Loading...' : `Generate ${reportType.toUpperCase()} Report`}
                  </motion.button>
                </motion.div>

                {/* Report Data Table */}
                {showReportData && reportData.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="space-y-6"
                  >
                    <h3 className="text-2xl font-bold text-white">Report Results ({reportData.length} records)</h3>
                    <div className="glass-dark rounded-3xl border border-white/20 p-8 backdrop-blur-xl overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="p-4 text-left text-gray-300 font-semibold">Date</th>
                            <th className="p-4 text-left text-gray-300 font-semibold">Details</th>
                            <th className="p-4 text-left text-gray-300 font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((row, i) => (
                            <tr key={i} className="border-b border-white/10 hover:bg-white/10">
                              <td className="p-4 font-medium text-white">{row.date || row.type || 'N/A'}</td>
                              <td className="p-4 text-gray-300">{row.totalBookings || row.bookingCount || row.description || 'N/A'}</td>
                              <td className="p-4 font-bold text-emerald-400">₹{row.totalEarnings || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="glass-dark p-8 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl" 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Add Parking Slot</h3>
              <form onSubmit={(e) => handleSubmitSlot(e, false)} className="space-y-4">
                <input name="location" value={slotForm.location} onChange={handleInputChange} placeholder="Parking Location *" className="input-glass w-full p-4 rounded-2xl" required />
                <input name="city" value={slotForm.city} onChange={handleInputChange} placeholder="City *" className="input-glass w-full p-4 rounded-2xl" required />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                  <input name="price" type="number" step="0.01" min="1" value={slotForm.price} onChange={handleInputChange} placeholder="Price per hour" className="input-glass w-full pl-12 p-4 rounded-2xl" required />
                </div>
                <input name="numSlots" type="number" min="1" value={slotForm.numSlots} onChange={handleInputChange} placeholder="Number of slots (1-100)" className="input-glass w-full p-4 rounded-2xl" required />
                <select name="type" value={slotForm.type} onChange={handleInputChange} className="input-glass w-full p-4 rounded-2xl">
                  <option value="car">Car Parking</option>
                  <option value="bike">Bike Parking</option>
                  <option value="scooter">Scooter Parking</option>
                </select>
                <div className="flex gap-4">
                  <motion.button type="submit" className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold text-lg shadow-2xl" whileHover={{ scale: 1.05 }}>
                    Create Slot
                  </motion.button>
                  <motion.button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 glass-dark border border-white/30 text-white rounded-2xl font-bold hover:bg-white/10" whileHover={{ scale: 1.05 }}>
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showEditModal && editingSlot && (
          <motion.div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="glass-dark p-8 rounded-3xl max-w-md w-full backdrop-blur-xl" 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Edit Slot</h3>
              <form onSubmit={(e) => handleSubmitSlot(e, true)} className="space-y-4">
                {/* Same form fields as add */}
                <input name="location" value={slotForm.location} onChange={handleInputChange} placeholder="Location *" className="input-glass w-full p-4 rounded-2xl" required />
                <input name="city" value={slotForm.city} onChange={handleInputChange} placeholder="City *" className="input-glass w-full p-4 rounded-2xl" required />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                  <input name="price" type="number" step="0.01" min="1" value={slotForm.price} onChange={handleInputChange} placeholder="Price per hour" className="input-glass w-full pl-12 p-4 rounded-2xl" required />
                </div>
                <input name="numSlots" type="number" min="1" value={slotForm.numSlots} onChange={handleInputChange} placeholder="Number of slots" className="input-glass w-full p-4 rounded-2xl" required />
                <select name="type" value={slotForm.type} onChange={handleInputChange} className="input-glass w-full p-4 rounded-2xl">
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                </select>
                <div className="flex gap-4">
                  <motion.button type="submit" className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl" whileHover={{ scale: 1.05 }}>
                    Update Slot
                  </motion.button>
                  <motion.button type="button" onClick={() => { setShowEditModal(false); setEditingSlot(null); }} className="px-8 py-4 glass-dark border border-white/30 text-white rounded-2xl font-bold hover:bg-white/10" whileHover={{ scale: 1.05 }}>
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showDeleteConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="glass-dark p-8 rounded-3xl max-w-md text-center border-2 border-red-500/30 backdrop-blur-xl" 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
            >
              <div className="text-6xl mb-6 text-red-400">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Delete Slot?</h3>
              <p className="text-gray-300 mb-8 text-lg">
                Delete <strong>"{showDeleteConfirm.location}, {showDeleteConfirm.city}"</strong>?<br/>
                <span className="text-sm text-gray-400">({showDeleteConfirm.availableCount}/{showDeleteConfirm.totalSlots} available)</span>
              </p>
              <div className="flex gap-4">
                <motion.button 
                  onClick={handleDeleteSlot} 
                  className="flex-1 py-4 px-8 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-red-500/50" 
                  whileHover={{ scale: 1.05 }}
                >
                  Delete Permanently
                </motion.button>
                <motion.button 
                  onClick={() => setShowDeleteConfirm(null)} 
                  className="flex-1 py-4 px-8 bg-gray-500/30 hover:bg-gray-500/50 text-white rounded-2xl font-bold border border-white/30" 
                  whileHover={{ scale: 1.05 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refresh Button */}
      <motion.button 
        onClick={async () => {
          toast.info('🔄 Refreshing dashboard...');
          await Promise.all([loadStats(), loadSlots(), loadActiveBookings()]);
          toast.success('Dashboard refreshed!');
        }} 
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-3xl shadow-2xl border-4 border-white/20 z-40 flex items-center justify-center text-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all" 
        whileHover={{ scale: 1.1 }} 
        whileTap={{ scale: 0.95 }}
      >
        🔄
      </motion.button>
    </div>
  );
};

export default LotOwnerDashboard;

