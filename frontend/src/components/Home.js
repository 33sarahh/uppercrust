import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Helper function to get image path
const getImagePath = (filename) => {
  return `/images/${encodeURIComponent(filename)}`;
};

function Home() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'the upper crust - Breaking bread, not your schedule';
  }, []);

  return (
    <>
      <header className="site-header">
        <h1 className="business-name">the upper crust</h1>
        <div className="header-auth">
          {user ? (
            <Link to="/dashboard" className="profile-link">
              <img 
                src={getImagePath('profile_bread.jpg')} 
                alt="Profile" 
                className="header-avatar"
              />
            </Link>
          ) : (
            <Link to="/login" className="auth-link">Sign In</Link>
          )}
        </div>
      </header>
      {/* Bread Section */}
      <section className="hero-section">
        <div className="hero-image-wrapper">
          <img 
            src={getImagePath('3_posters.jpg')}
            alt="Fresh round ciabatta bread" 
            className="hero-image grain-overlay" 
          />
          <div className="hero-button-overlay">
            <Link to="/register" className="cta-button hero-cta">knead a loaf?</Link>
          </div>
        </div>
      </section>
      <section className="bio-image-section">
        <img 
          src={getImagePath('bio_and_butter.jpg')}
          alt="My story, portrait, and spread the word with Kerrigold butter" 
          className="bio-and-butter-image" 
        />
      </section>
    </>
  );
}

export default Home;
