import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Helper function to get image path
const getImagePath = (filename) => {
  return `/images/${encodeURIComponent(filename)}`;
};

// Next Monday for delivery — cutoff Saturday 5pm CST (matches backend)
const MAX_LOAVES = 10;
const CHICAGO_TZ = 'America/Chicago';

function getChicagoTimeParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(date);
  const get = (type) => (parts.find(p => p.type === type) || {}).value;
  const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
  return {
    day: dayMap[get('weekday')] ?? 0,
    hour: parseInt(get('hour'), 10) || 0,
    minute: parseInt(get('minute'), 10) || 0
  };
}

function getNextDeliveryMonday() {
  const d = new Date();
  const { day, hour, minute } = getChicagoTimeParts(d);
  const pastCutoff = day === 6 && (hour > 17 || (hour === 17 && minute >= 0));
  if (pastCutoff) {
    d.setDate(d.getDate() + 9);
  } else {
    const daysToAdd = day === 1 ? 7 : (8 - day + 7) % 7;
    d.setDate(d.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

function Order() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    breadQuantity: 1,
    notes: '',
    isRecurring: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [weekInfo, setWeekInfo] = useState(null);

  useEffect(() => {
    document.title = 'Place Your Order | the upper crust';
    if (!authLoading && !user) {
      navigate('/login', { state: { from: { pathname: '/order' } } });
      return;
    }
    if (location.state?.prefill) {
      const prefill = location.state.prefill;
      setFormData(prev => ({
        ...prev,
        breadQuantity: prefill.breadQuantity || 1,
        notes: prefill.notes || ''
      }));
    }
  }, [user, authLoading, navigate, location]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/orders/week-info', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setWeekInfo(data))
      .catch(() => {});
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleQuantityClick = (quantity) => {
    setFormData(prev => ({
      ...prev,
      breadQuantity: quantity
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (parseInt(formData.breadQuantity) === 0) {
      setError('Please select at least one loaf of bread to order.');
      setLoading(false);
      return;
    }
    if (weekInfo && weekInfo.remaining < parseInt(formData.breadQuantity)) {
      setError(`Only ${weekInfo.remaining} loaf(ves) left this week. Please choose a smaller quantity.`);
      setLoading(false);
      return;
    }
    const payload = {
      ...formData,
      deliveryDate: weekInfo ? weekInfo.deliveryMonday : null,
    };
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      const orderData = await response.json();
      console.log('Order submitted:', orderData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'An error occurred while submitting your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (submitted) {
    return (
      <div className="container">
        <header>
          <Link to="/" className="logo-link">
            <h1 className="logo">the upper crust</h1>
          </Link>
        </header>
        <main className="order-main">
          <div className="order-confirmation">
            <div className="confirmation-content">
              <h2>Order Confirmed!</h2>
              <p>Thank you for your order. We'll see you soon!</p>
              <div className="confirmation-actions">
                <Link to="/dashboard" className="cta-button">View My Orders</Link>
                <Link to="/" className="cta-button secondary">Back to Home</Link>
              </div>
            </div>
          </div>
        </main>
        <footer>
          <p>© 2024 the upper crust. Made with care, delivered with love.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <Link to="/" className="logo-link">
          <h1 className="logo">the upper crust</h1>
        </Link>
      </header>
      
      <main className="order-main">
        <section className="order-section">
          {/* Left column: Bread image with film grain */}
          <div className="order-image-wrapper">
            <img 
              src={getImagePath('jam and cream grain.jpg')}
              alt="Jam and cream on bread" 
              className="order-image grain-overlay" 
            />
            <div className="film-grain"></div>
          </div>
          
          {/* Right column: Order form */}
          <div className="order-form-container">
            <h2 className="order-title">Place Your Order</h2>
            <p className="order-subtitle">Fresh ciabatta, made to order and delivered to your door</p>
            <p className="order-user-info">Ordering as: {user.firstName} {user.lastName} (Apt {user.apartment})</p>

            <div className="order-week-banners">
              <p className="order-delivery-date">
                Your order will be delivered on Monday, {weekInfo
                  ? new Date(weekInfo.deliveryMonday + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : getNextDeliveryMonday().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
              {weekInfo?.afterCutoff && (
                <p className="order-after-cutoff">
                  You're ordering after Saturday at 5:00 PM. Your order will roll over to the next week.
                </p>
              )}
              <p className="order-loaves-left">
                {weekInfo == null
                  ? `Max ${MAX_LOAVES} loaves per week. Loading availability…`
                  : weekInfo.remaining <= 0
                    ? `No loaves left this week (0 of ${weekInfo.maxLoaves ?? MAX_LOAVES}) — check back next week!`
                    : `${weekInfo.remaining} of ${weekInfo.maxLoaves ?? MAX_LOAVES} loaves still available.`}
              </p>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="order-form">
              
              {/* Bread Quantity Selection */}
              <div className="form-group">
                <label htmlFor="breadQuantity">Number of Loaves</label>
                <div className="quantity-selector">
                  {[1, 2, 3].map((qty) => {
                    const remaining = weekInfo ? weekInfo.remaining : 10;
                    const disabled = remaining < qty;
                    return (
                      <button 
                        key={qty}
                        type="button" 
                        className={`quantity-btn ${formData.breadQuantity === qty ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && handleQuantityClick(qty)}
                        disabled={disabled}
                      >
                        {qty} {qty === 1 ? 'Loaf' : 'Loaves'}
                      </button>
                    );
                  })}
                </div>
                <input 
                  type="hidden" 
                  id="breadQuantity" 
                  name="breadQuantity" 
                  value={formData.breadQuantity} 
                  required 
                />
                {weekInfo && weekInfo.remaining > 0 && (
                  <small className="form-hint">Place your order by Saturday at 5:00 PM and your bread arrives this Monday. Orders after that roll over to the next week.</small>
                )}
              </div>
              
              {/* Notes for Baker */}
              <div className="form-group">
                <label htmlFor="notes">Notes for the Baker</label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  rows="4" 
                  placeholder="Optional: Let me know if you have any special requests..."
                  value={formData.notes}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              
              {/* Recurring Order Option */}
              <div className="form-group">
                <label className="recurring-checkbox-label">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="recurring-checkbox"
                  />
                  <span>Make this a weekly recurring order</span>
                </label>
              </div>

              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || !weekInfo || weekInfo.remaining === 0}
              >
                {loading ? 'Placing Order...' : weekInfo && weekInfo.remaining === 0 ? 'Sold Out This Week' : 'Place Order'}
              </button>
            </form>
          </div>
        </section>
      </main>
      
      <footer>
        <p>© 2024 the upper crust. Made with care, delivered with love.</p>
      </footer>
    </div>
  );
}

export default Order;
