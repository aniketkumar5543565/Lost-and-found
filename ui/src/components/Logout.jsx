import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    navigate('/'); 
    window.location.reload(false);
  };

  return (
    <Link to='/' onClick={handleLogout}>
      Logout
    </Link>
  );
};


export default Logout;
