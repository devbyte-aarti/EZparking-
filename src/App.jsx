import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OTPVerification from './pages/OTPVerification';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import MyBookingsPage from './pages/user/MyBookings';
import FindParkingPage from './pages/user/FindParking';
import MyVehiclesPage from './pages/user/MyVehicles';
import WalletPage from './pages/user/Wallet';
import NotificationsPage from './pages/user/Notifications';
import PassPage from './pages/user/Pass';
import LotOwnerDashboard from './pages/LotOwnerDashboard';
import Pass from './pages/Pass';
import PaymentProcessing from './pages/PaymentProcessing';
import PaymentSuccess from './pages/PaymentSuccess';

// Components
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

function App() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const getDefaultRoute = () => {
    if (!token) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'lotowner') return '/lotowner';
    return '/user/dashboard';
  };

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        
        <Route path="/admin" element={
          <PrivateRoute roles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
        <Route path="/user/dashboard" element={
          <PrivateRoute roles={['normal']}>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/user/bookings" element={
          <PrivateRoute roles={['normal']}>
            <MyBookingsPage />
          </PrivateRoute>
        } />
        <Route path="/user/find-parking" element={
          <PrivateRoute roles={['normal']}>
            <FindParkingPage />
          </PrivateRoute>
        } />
        <Route path="/user/my-vehicles" element={
          <PrivateRoute roles={['normal']}>
            <MyVehiclesPage />
          </PrivateRoute>
        } />
        <Route path="/user/wallet" element={
          <PrivateRoute roles={['normal']}>
            <WalletPage />
          </PrivateRoute>
        } />
        <Route path="/user/notifications" element={
          <PrivateRoute roles={['normal']}>
            <NotificationsPage />
          </PrivateRoute>
        } />
        <Route path="/user/pass" element={
          <PrivateRoute roles={['normal']}>
            <PassPage />
          </PrivateRoute>
        } />
        <Route path="/lotowner" element={
          <PrivateRoute roles={['lotowner']}>
            <LotOwnerDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/payment-processing" element={
          <PrivateRoute roles={['normal', 'lotowner', 'admin']}>
            <PaymentProcessing />
          </PrivateRoute>
        } />
        <Route path="/payment-success" element={
          <PrivateRoute roles={['normal', 'lotowner', 'admin']}>
            <PaymentSuccess />
          </PrivateRoute>
        } />
        
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

