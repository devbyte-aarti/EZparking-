import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { userAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Loader from '../../components/Loader';

const MyVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ vehicleNo: '', company: '', model: '', type: 'car' });
  const [isOpen, setIsOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, walletRes, notificationsRes] = await Promise.all([
        userAPI.getVehicles(),
        userAPI.getWallet(),
        userAPI.getNotifications()
      ]);
      setVehicles(vehiclesRes.data || []);
      setWallet(walletRes.data?.wallet || 0);
      setUnreadCount(notificationsRes.data?.unreadCount || 0);
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await userAPI.addVehicle(formData);
      toast.success('Vehicle added successfully!');
      setShowAddModal(false);
      setFormData({ vehicleNo: '', company: '', model: '', type: 'car' });
      loadVehicles();
    } catch (error) {
      toast.error('Add failed - check vehicle number format');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? Cannot be undone.')) return;
    try {
      await userAPI.deleteVehicle(id);
      toast.success('Vehicle deleted');
      loadVehicles();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar wallet={wallet} unreadCount={unreadCount} />
        <div className="user-bg min-h-screen pt-[80px] flex items-center justify-center p-8">
          <Loader message="Loading your vehicles..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar wallet={wallet} unreadCount={unreadCount} />
      <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} wallet={wallet} unreadCount={unreadCount} />
      <div className="user-bg min-h-screen pt-[80px] p-6"> 
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">My Vehicles ({vehicles.length})</h1>
            <motion.button 
              onClick={() => {
                setIsOpen(false); // FIX: close hamburger menu
                setShowAddModal(true);
              }} 
              className="neon-btn px-8 py-3 font-bold" 
              whileHover={{ scale: 1.05 }}
            >
              + Add Vehicle
            </motion.button>
          </div>

          {vehicles.length === 0 ? (
            <motion.div 
              className="glass-dark p-16 text-center rounded-3xl border border-gray-500/30" 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
            >
              <div className="text-6xl mb-6">🚗</div>
              <h2 className="text-2xl font-bold text-white mb-4">No Vehicles Added</h2>
              <p className="text-gray-400 mb-8">Add your registered vehicles to start booking parking slots.</p>
              <motion.button 
                onClick={() => {
                  setIsOpen(false);
                  setShowAddModal(true);
                }} 
                className="neon-btn px-8 py-3 font-bold" 
                whileHover={{ scale: 1.05 }}
              >
                Add First Vehicle
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              {vehicles.map(vehicle => (
                <motion.div 
                  key={vehicle._id} 
                  className="glass-dark p-6 rounded-2xl border-2 border-white/10 hover:border-red-400/50 hover:shadow-xl transition-all" 
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-white mb-1">{vehicle.vehicleNo}</h3>
                      <div className="text-gray-300 text-lg">{vehicle.company} {vehicle.model}</div>
                      <div className="inline-flex items-center mt-1 px-2 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm rounded-lg font-medium">
                        {vehicle.type}
                      </div>
                    </div>
                    <motion.button 
                      onClick={() => handleDelete(vehicle._id)} 
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all ml-auto" 
                      whileTap={{ scale: 0.9, rotate: 5 }}
                      title="Delete vehicle"
                    >
                      ✕
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="glass-dark p-8 rounded-3xl w-full max-w-md border-2 border-white/20 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-3xl mr-3">🚗</span>
                Add New Vehicle
              </h3>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <input
                  autoFocus
                  placeholder="Vehicle No (DL01AB1234)"
                  value={formData.vehicleNo}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase(); // FIX: allow typing freely
                    setFormData({ ...formData, vehicleNo: value });
                  }}
                  className="input-glass w-full p-4 text-lg font-mono tracking-wider"
                  required
                  maxLength={20}
                />
                <input
                  placeholder="Company (e.g. Maruti, Honda)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="input-glass w-full p-4"
                  required
                />
                <input
                  placeholder="Model (e.g. Swift, Activa)"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="input-glass w-full p-4"
                  required
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-glass w-full p-4 text-lg"
                >
                  <option value="car">Car 🚗</option>
                  <option value="bike">Bike 🏍️</option>
                  <option value="scooter">Scooter 🛵</option>
                </select>
                <div className="flex gap-4 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="flex-1 bg-gray-600/50 text-white py-4 px-6 rounded-2xl font-bold hover:bg-gray-500/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={formLoading || !formData.vehicleNo || !formData.company || !formData.model}
                    className="neon-btn flex-1 py-4 px-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? 'Loading...' : 'Add Vehicle 🚀'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default MyVehiclesPage;
