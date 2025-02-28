import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login';
import Admin from './dashboard/admin'; // Make sure the path is correct


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />

      </Routes>
    </Router>
  );
}

export default App;
