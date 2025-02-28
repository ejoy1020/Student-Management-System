import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'font-awesome/css/font-awesome.min.css'; // Importing Font Awesome
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === 'admin' && password === 'adminpass') {
      toast.success('Admin login successful!', { position: "top-center", autoClose: 2000 });
      setTimeout(() => navigate('/admin'), 100);
    }  else {
      toast.error('Invalid username or password.', { position: "top-center", autoClose: 2000 });
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <div className="login-key">
          <i className="fa fa-key" aria-hidden="true"></i>
        </div>
        <div className="login-title">LOGIN PANEL</div>

        <div className="login-form">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-control-label">USERNAME</label>
              <input
                type="text"
                className="form-control"
                placeholder="Email or Phone"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-control-label">PASSWORD</label>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="loginbttm">
              <div className="login-button">
                <button type="submit" className="btn btn-outline-primary">
                  LOGIN
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
