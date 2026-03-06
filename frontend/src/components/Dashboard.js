import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Helper function to get image path
const getImagePath = (filename) => {
  return `/images/${encodeURIComponent(filename)}`;
};

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    text: ''
  });
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchReviews();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews/my', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleReorder = (order) => {
    navigate('/order', {
      state: {
        prefill: {
          breadQuantity: order.breadQuantity,
          jamQuantity: order.jamQuantity,
          notes: order.notes
        }
      }
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      setReviewError('Please select a rating');
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const newReview = await response.json();
      setReviews(prev => [newReview, ...prev]);
      setReviewData({ rating: 5, text: '' });
      setShowReviewForm(false);
    } catch (error) {
      setReviewError(error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <Link to="/" className="logo-link">
          <h1 className="logo">the upper crust</h1>
        </Link>
        <div className="header-actions">
          <button onClick={handleLogout} className="logout-button">Log Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="user-profile">
            <img 
              src={getImagePath('profile_bread.jpg')} 
              alt="Profile" 
              className="user-avatar"
            />
            <div className="user-info">
              <h2>Welcome, {user?.firstName}!</h2>
              <p>{user?.email} • Apt {user?.apartment}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            My Orders
          </button>
          <button
            className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Write a Review
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="dashboard-content">
            <div className="dashboard-actions">
              <Link to="/order" className="cta-button">
                Start New Order
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">
                <p>You haven't placed any orders yet.</p>
                <Link to="/order" className="cta-button">Place Your First Order</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div>
                        <h3>Order #{order.id}</h3>
                        <p className="order-date">{formatDate(order.orderTime)}</p>
                      </div>
                      <span className={`order-status ${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-details">
                      <div className="order-item">
                        <span className="item-label">Bread:</span>
                        <span className="item-value">{order.breadQuantity} {order.breadQuantity === 1 ? 'loaf' : 'loaves'}</span>
                      </div>
                      <div className="order-item">
                        <span className="item-label">Jam:</span>
                        <span className="item-value">{order.jamQuantity} {order.jamQuantity === 1 ? 'jar' : 'jars'}</span>
                      </div>
                      <div className="order-item">
                        <span className="item-label">Delivery Date:</span>
                        <span className="item-value">{formatDate(order.deliveryDate)}</span>
                      </div>
                      {order.isRecurring && (
                        <div className="order-item">
                          <span className="item-label">Recurring:</span>
                          <span className="item-value">Weekly</span>
                        </div>
                      )}
                      {order.notes && (
                        <div className="order-item">
                          <span className="item-label">Notes:</span>
                          <span className="item-value">{order.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="order-actions">
                      <button
                        onClick={() => handleReorder(order)}
                        className="reorder-button"
                      >
                        Order Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="dashboard-content">
            {!showReviewForm ? (
              <div className="review-section">
                <h3>Your Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="no-reviews">You haven't written any reviews yet.</p>
                ) : (
                  <div className="reviews-list">
                    {reviews.map(review => (
                      <div key={review.id} className="review-card">
                        <div className="review-rating">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                        {review.text && <p className="review-text">{review.text}</p>}
                        <p className="review-date">{formatDate(review.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="cta-button"
                >
                  Write a Review
                </button>
              </div>
            ) : (
              <div className="review-form-section">
                <h3>Write a Review</h3>
                {reviewError && <div className="error-message">{reviewError}</div>}
                <form onSubmit={handleReviewSubmit} className="review-form">
                  <div className="form-group">
                    <label>Rating *</label>
                    <div className="rating-selector">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          className={`rating-star ${reviewData.rating >= rating ? 'selected' : ''}`}
                          onClick={() => setReviewData(prev => ({ ...prev, rating }))}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <small className="form-hint">Click stars to rate (1-5)</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reviewText">Your Review</label>
                    <textarea
                      id="reviewText"
                      rows="5"
                      value={reviewData.text}
                      onChange={(e) => setReviewData(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Share your experience with the upper crust..."
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-button">
                      Submit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewData({ rating: 5, text: '' });
                        setReviewError('');
                      }}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <footer>
        <p>© 2024 the upper crust. Made with care, delivered with love.</p>
      </footer>
    </div>
  );
}

export default Dashboard;
