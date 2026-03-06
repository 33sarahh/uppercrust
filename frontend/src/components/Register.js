import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    apartment: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handlePhoneInput = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 3) {
        value = `(${value}`;
      } else if (value.length <= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      }
    }
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.apartment) {
      newErrors.apartment = 'Apartment number is required';
    } else if (!/^\d{4}$/.test(formData.apartment)) {
      newErrors.apartment = 'Apartment number must be exactly 4 digits';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Invalid phone number';
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
    const result = await register(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
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
          <h2 className="auth-title">Create Your Profile</h2>
          <p className="auth-subtitle">Join the upper crust community</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
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
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneInput}
                required
                placeholder="(555) 123-4567"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
      
      <footer>
        <p>© 2024 the upper crust. Made with care, delivered with love.</p>
      </footer>
    </div>
  );
}

export default Register;
