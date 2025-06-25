// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ReportItem from './components/ReportItem';
import ClaimItem from './components/ClaimItem';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EditItem from './components/EditItem';
import EditProfile from './components/EditProfile';
import ItemDetails from './components/ItemDetails';
import AdminDashboard from './components/AdminDashboard';
import SavedItems from './components/SavedItems';
import EmailVerification from './components/EmailVerification';
function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/report" element={<ReportItem />} />
          <Route path="/claim" element={<ClaimItem />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/edit-item/:itemId" element={<EditItem />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/saved" element={<SavedItems />} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;
