import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    apartment: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setError('');
  };

  const handleApartmentInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({
      ...prev,
      apartment: value
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.apartment) {
      newErrors.apartment = 'Apartment number is required';
    } else if (!/^\d{4}$/.test(formData.apartment)) {
      newErrors.apartment = 'Apartment number must be exactly 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    const result = await login(formData.email, formData.apartment);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <header>
        <Link to="/" className="logo-link">
          <h1 className="logo">the upper crust</h1>
        </Link>
      </header>
      
      <main className="auth-main">
        <div className="auth-container">
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Welcome back to the upper crust</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="apartment">Apartment Number *</label>
              <input
                type="text"
                id="apartment"
                name="apartment"
                value={formData.apartment}
                onChange={handleApartmentInput}
                required
                placeholder="4 digits"
                maxLength="4"
                pattern="[0-9]{4}"
                className={errors.apartment ? 'error' : ''}
              />
              {errors.apartment && <span className="field-error">{errors.apartment}</span>}
              <small className="form-hint">4-digit apartment number</small>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </main>
      
      <footer>
        <p>© 2024 the upper crust. Made with care, delivered with love.</p>
      </footer>
    </div>
  );
}

export default Login;
