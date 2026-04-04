import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'lotowner') {
      return <Navigate to="/lotowner" replace />;
    }
    return <Navigate to="/user" replace />;
  }

  return children;
};

export default PrivateRoute;
