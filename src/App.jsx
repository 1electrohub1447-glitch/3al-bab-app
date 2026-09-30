import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CustomerPage from './pages/CustomerPage';
import CustomerOrderTrack from './pages/CustomerOrderTrack';
import DriverPage from './pages/DriverPage';
import MerchantDashboard from './pages/MerchantDashboard';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import OrderHistory from './pages/OrderHistory';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CustomerPage />} />
          <Route path="/track/:orderId" element={<CustomerOrderTrack />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/orders" element={<OrderHistory />} />

          <Route 
            path="/driver" 
            element={
              <ProtectedRoute allowedRoles={['DRIVER', 'ADMIN']}>
                <DriverPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/merchant" 
            element={
              <ProtectedRoute allowedRoles={['MERCHANT', 'ADMIN']}>
                <MerchantDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;