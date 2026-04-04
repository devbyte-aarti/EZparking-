import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { parkingpassAPI, userAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import HamburgerMenu from '../../components/HamburgerMenu';
import Loader from '../../components/Loader';
import PaymentModal from '../../components/PaymentModal';

const PassPage = () => {
  const [passes, setPasses] = useState([]);
  const [myPasses, setMyPasses] = useState([]);
  const [showMyPasses, setShowMyPasses] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMyPass, setSelectedMyPass] = useState(null);
  const [showPassDetails, setShowPassDetails] = useState(false);

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    setLoading(true);
    try {
      const [allRes, myRes, walletRes, notificationsRes] = await Promise.all([
        parkingpassAPI.getPasses(),
        parkingpassAPI.getMyPasses(),
        userAPI.getWallet(),
        userAPI.getNotifications()
      ]);

      setPasses(allRes.data || []);
      setMyPasses(myRes.data || []);
      setWallet(walletRes.data?.wallet || 0);
      setUnreadCount(notificationsRes.data?.unreadCount || 0);

    } catch (error) {
      toast.error('Failed to load passes');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPass = (pass) => {
    const validityDays =
      pass.passType === 'daily' ? 1 :
      pass.passType === 'weekly' ? 7 :
      pass.passType === 'monthly' ? 30 : 365;

    setSelectedPass({
      ...pass,
      passId: pass._id,
      totalAmount: pass.price,
      validityDays
    });

    setShowPayment(true);
  };

    const handlePaymentSuccess = () => {
    toast.success('🎫 Pass purchased successfully. Receipt sent to email 📧', {
      style: {
        background: '#16a34a',
        color: '#fff',
        fontWeight: 'bold'
      }
    });
    loadPasses();
    setShowPayment(false);
    setSelectedPass(null);
  };

  if (loading) {
    return (
      <>
        <Navbar wallet={wallet} unreadCount={unreadCount} />
        <div className="user-bg min-h-screen pt-[80px] flex items-center justify-center">
          <Loader message="Loading passes..." />
        </div>
      </>
    );
  }

  const passFeatures = {
    daily: ['1 day validity'],
    weekly: ['7 days validity'],
    monthly: ['30 days validity', 'Unlimited parking'],
    yearly: ['365 days validity', 'Best value']
  };

  const getPassDescription = (passType) => {
    const durations = {
      daily: '1 day',
      weekly: '7 days',
      monthly: '30 days',
      yearly: '365 days'
    };
    return `This pass allows unlimited parking for ${durations[passType] || 'duration'}`;
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const remaining = Math.ceil((new Date(endDate) - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  return (
    <>
      <Navbar wallet={wallet} unreadCount={unreadCount} />
      <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="user-bg min-h-screen pt-[80px] p-6">
        <div className="w-full max-w-[1400px] mx-auto space-y-10">

          {/* HEADER */}
          {/* My Pass Button ABOVE Choose Your Pass */}
          <motion.button
            onClick={() => setShowMyPasses(true)}
            whileHover={{ scale: 1.05 }}
            className="mx-auto mb-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-emerald-500/40 transition-all">
            <span className="text-3xl">🎫</span>
            My Pass
          </motion.button>

          <div className="text-center">
            <h1 className="text-4xl font-black text-white mb-4">
              {showMyPasses ? 'My Passes' : 'Parking Pass'}
            </h1>
            <p className="text-gray-400 mb-6">
              {showMyPasses
                ? 'Your purchased passes'
                : 'Buy a pass & skip booking payments'}
            </p>
          </div>

          {/* 🔙 BACK BUTTON */}
          {showMyPasses && (
            <motion.button
              onClick={() => setShowMyPasses(false)}
              whileHover={{ scale: 1.05 }}
              className="mb-8 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-2xl font-bold shadow-lg hover:shadow-gray-500/50 transition-all border border-gray-600 hover:border-gray-500"
            >
              ← Back to All Passes
            </motion.button>
          )}

          {/* GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">

            {/* 🔹 ALL PASSES VIEW */}
            {!showMyPasses &&
              passes.map((pass) => {

                const alreadyBought = myPasses.some(
                  (p) =>
                    (p.passId === pass._id || (p.passId?._id === pass._id)) &&
                    p.status === 'active'
                );

                return (
                  <motion.div
                    key={pass._id}
                    className="glass-dark p-6 rounded-3xl border border-white/10 hover:border-purple-400 hover:shadow-purple-500/30 hover:shadow-2xl transition-all flex flex-col justify-between"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div>
                      <div className="text-4xl text-center mb-4">
                        {pass.passType === 'monthly' ? '🗓️' : '📅'}
                      </div>

                      <h3 className="text-lg font-bold text-white text-center capitalize mb-2">
                        {pass.passType} Pass
                      </h3>

                      <div className="text-2xl font-black text-green-400 text-center mb-4">
                        ₹{pass.price}
                      </div>

                      <div className="text-sm text-gray-300 space-y-1 mb-4">
                        {passFeatures[pass.passType]?.map((f, i) => (
                          <div key={i}>• {f}</div>
                        ))}
                      </div>
                    </div>

                    {alreadyBought ? (
                      <button
                        onClick={() => setShowMyPasses(true)}
                        className="mt-auto bg-green-500 text-white py-2 rounded-xl font-bold"
                      >
                        My Pass
                      </button>
                    ) : (
                      <motion.button
                        onClick={() => handleBuyPass(pass)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl font-bold"
                      >
                        Buy Pass
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}

            {/* 🔹 MY PASSES VIEW (ONLY unique active purchased passes) */}
            {showMyPasses && (
              (() => {
                const uniqueMyPasses = Array.from(
                  new Map(
                    myPasses
                      .filter(p => p.status === 'active')
                      .map(p => [p.passId || (p.passId?._id), p])
                  ).values()
                );
                
                if (uniqueMyPasses.length === 0) {
                  return (
                    <motion.div 
                      className="col-span-full card-glass p-12 text-center text-gray-400 rounded-3xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="text-6xl mb-6">🎫</div>
                      No active passes yet
                      <div className="text-sm mt-4">
                        Buy your first parking pass above ↑
                      </div>
                    </motion.div>
                  );
                }

                return uniqueMyPasses.map((pass) => (
                  <motion.div
                    key={pass._id}
                    className="glass-dark p-6 rounded-3xl border border-green-400 shadow-green-500/30 shadow-xl flex flex-col"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="text-4xl text-center mb-4">🎫</div>

                    <h3 className="text-lg font-bold text-white text-center capitalize mb-2">
                      {pass.passType} Pass
                    </h3>

                    <div className="text-2xl font-black text-green-400 text-center mb-4">
₹{(pass.amount || pass.price || 0).toLocaleString()}
                    </div>

                    <div className="text-sm text-gray-300 space-y-1 mb-4">
                      <div>• Status: <span className={`font-bold px-2 py-1 rounded-full ${getDaysRemaining(pass.endDate) > 0 ? 'bg-green-500/20 text-green-400 border border-green-400/50' : 'bg-red-500/20 text-red-400 border border-red-400/50'}`}>{getDaysRemaining(pass.endDate) > 0 ? 'Active' : 'Expired'}</span></div>
                      <div>• Days Remaining: <span className="font-bold text-blue-400">{getDaysRemaining(pass.endDate)}</span></div>
                    </div>

                    <motion.button
                      onClick={() => {
                        setSelectedMyPass(pass);
                        setShowPassDetails(true);
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="mt-auto bg-green-600 text-white py-2 rounded-xl font-bold hover:bg-green-700 transition-all cursor-pointer"
                    >
                      View Details
                    </motion.button>
                  </motion.div>
                ));
              })()
            )}

          </div>

        </div>

        {/* PASS DETAILS MODAL */}
        {showPassDetails && selectedMyPass && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" 
            onClick={() => setShowPassDetails(false)}
          >
            <motion.div
              className="glass-dark w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-2 border-white/20 relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPassDetails(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white text-3xl font-bold p-2 rounded-xl hover:bg-white/10 transition-all"
              >
                ×
              </button>
              
              <div className="text-center mb-8">
                <div className="text-6xl mb-6 mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-4 border-emerald-400/30 flex items-center justify-center shadow-2xl">
                  🎫
                </div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-4 capitalize">
                  {selectedMyPass.passType} Pass
                </h2>
                <div className="text-3xl font-black text-green-400 mb-2">
                  ₹{selectedMyPass.amount?.toLocaleString() || selectedMyPass.price?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-emerald-300 font-medium">
                  Amount Paid
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8 text-sm">
                <div className="glassmorphism p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">Pass Type</span>
                    <span className="font-bold text-white capitalize px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm">
                      {selectedMyPass.passType}
                    </span>
                  </div>
                </div>
                <div className="glassmorphism p-4 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Start Date</span>
                    <span className="font-bold text-white">{new Date(selectedMyPass.startDate).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="glassmorphism p-4 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-gray-300">End Date</span>
                    <span className="font-bold text-white">{new Date(selectedMyPass.endDate).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="glassmorphism p-4 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Status</span>
                    <span className={`px-4 py-2 rounded-2xl font-bold text-sm shadow-lg ${
                      getDaysRemaining(selectedMyPass.endDate) > 0 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-green-400/50 shadow-green-500/25' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-2 border-red-400/50 shadow-red-500/25'
                    }`}>
                      {getDaysRemaining(selectedMyPass.endDate) > 0 ? 'Active' : 'Expired'}
                    </span>
                  </div>
                </div>
                <div className="glassmorphism p-4 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Days Remaining</span>
                    <span className={`text-2xl font-black ${
                      getDaysRemaining(selectedMyPass.endDate) > 7 ? 'text-emerald-400' :
                      getDaysRemaining(selectedMyPass.endDate) > 0 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {getDaysRemaining(selectedMyPass.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl border-2 border-blue-400/30 backdrop-blur-sm">
                <p className="text-center text-blue-300 font-semibold text-lg leading-relaxed">
                  {getPassDescription(selectedMyPass.passType)}
                </p>
              </div>

              <motion.button
                onClick={() => setShowPassDetails(false)}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-5 rounded-3xl font-black text-xl shadow-2xl hover:shadow-emerald-500/50 transition-all border border-emerald-400/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </div>
        )}

        {/* PAYMENT MODAL */}
        {showPayment && selectedPass && (
            <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            amount={selectedPass.totalAmount}
            passType={selectedPass.passType}
            passId={selectedPass.passId}
            onSuccess={handlePaymentSuccess}
            isPassPurchase={true}
          />

        )}
      </div>
    </>
  );
};

export default PassPage;   