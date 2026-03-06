import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Helper function to get image path
const getImagePath = (filename) => {
  return `/images/${encodeURIComponent(filename)}`;
};

function Admin() {
  const [prepData, setPrepData] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('prep'); // 'prep' or 'users'

  useEffect(() => {
    fetchPrepData();
    fetchUsers();
    fetchOrders();
  }, []);

  const fetchPrepData = async () => {
    try {
      const response = await fetch('/api/admin/prep');
      if (response.ok) {
        const data = await response.json();
        setPrepData(data);
      }
    } catch (error) {
      console.error('Failed to fetch prep data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonday = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
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
          <h1 className="logo">the upper crust - Admin</h1>
        </Link>
      </header>

      <main className="admin-main">
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeView === 'prep' ? 'active' : ''}`}
            onClick={() => setActiveView('prep')}
          >
            This Week's Prep
          </button>
          <button
            className={`tab-button ${activeView === 'users' ? 'active' : ''}`}
            onClick={() => setActiveView('users')}
          >
            All Users & Orders
          </button>
        </div>

        {activeView === 'prep' && (
          <div className="prep-view">
            {prepData && (
              <>
                <div className="prep-header">
                  <h2>How many loaves you need to prep Sunday night</h2>
                  <p className="prep-date">Delivery: {formatMonday(prepData.deliveryMonday)}</p>
                  <p className="prep-count">{prepData.totalLoaves} {prepData.totalLoaves === 1 ? 'loaf' : 'loaves'}</p>
                </div>
                <div className="prep-orders-list">
                  <h3>Orders for that Monday</h3>
                  {prepData.orders.length === 0 ? (
                    <p className="prep-empty">No orders yet for this Monday.</p>
                  ) : (
                    <div className="prep-order-cards">
                      {prepData.orders.map((order) => (
                        <div key={order.id} className="prep-order-card">
                          <span className="prep-order-loaves">{order.breadQuantity} {order.breadQuantity === 1 ? 'loaf' : 'loaves'}</span>
                          <span className="prep-order-name">{order.name}</span>
                          <span className="prep-order-apt">Apt {order.apartment}</span>
                          {order.notes ? <span className="prep-order-notes">{order.notes}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeView === 'users' && (
          <div className="users-view">
            <h2>All Users ({users.length})</h2>
            <div className="users-list">
              {users.map((user) => {
                const userOrders = orders.filter(o => o.userId === user.id);
                return (
                  <div key={user.id} className="user-card">
                    <div className="user-card-header">
                      <img
                        src={getImagePath('profile_bread.jpg')}
                        alt="User"
                        className="user-card-avatar"
                      />
                      <div>
                        <h3>{user.firstName} {user.lastName}</h3>
                        <p>{user.email} • Apt {user.apartment} • {user.phone}</p>
                      </div>
                    </div>
                    <div className="user-orders-count">
                      <strong>Total Orders:</strong> {userOrders.length}
                    </div>
                  </div>
                );
              })}
            </div>

            <h2 style={{ marginTop: '3rem' }}>All Orders ({orders.length})</h2>
            <div className="orders-list">
              {orders.map((order) => (
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
                      <span className="item-label">Customer:</span>
                      <span className="item-value">{order.name} (Apt {order.apartment})</span>
                    </div>
                    <div className="order-item">
                      <span className="item-label">Phone:</span>
                      <span className="item-value">{order.phone}</span>
                    </div>
                    <div className="order-item">
                      <span className="item-label">Delivery Date:</span>
                      <span className="item-value">{formatDate(order.deliveryDate)}</span>
                    </div>
                    <div className="order-item">
                      <span className="item-label">Bread:</span>
                      <span className="item-value">{order.breadQuantity} {order.breadQuantity === 1 ? 'loaf' : 'loaves'}</span>
                    </div>
                    <div className="order-item">
                      <span className="item-label">Jam:</span>
                      <span className="item-value">{order.jamQuantity} {order.jamQuantity === 1 ? 'jar' : 'jars'}</span>
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
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>© 2024 the upper crust. Made with care, delivered with love.</p>
      </footer>
    </div>
  );
}

export default Admin;
