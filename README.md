# the upper crust

A beautiful web application for ordering fresh ciabatta bread, delivered weekly to your door.

## Features

- **User Authentication**: Register and login with email and password
- **Order Management**: Place orders for fresh bread with quantity selection and special notes
- **Weekly Delivery**: Automatic Monday delivery scheduling with Saturday 5pm CST cutoff
- **Order History**: View all your past orders in your dashboard
- **Reviews**: Leave reviews and ratings for your orders
- **Admin Dashboard**: View prep lists and manage orders (admin access)

## Tech Stack

- **Frontend**: React 18, React Router, CSS3
- **Backend**: Node.js, Express, SQLite
- **Authentication**: Session-based authentication

## Project Structure

```
uppercrust_final/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context (Auth)
│   │   └── styles/        # CSS styles
│   └── public/
│       └── images/         # Image assets
├── backend/           # Express API server
│   └── server.js      # Main server file
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3001`

2. **Start the frontend development server:**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **The backend will serve the built frontend automatically** when running in production mode.

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3001
NODE_ENV=production
SESSION_SECRET=your-secret-key-here
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Orders
- `GET /api/orders/week-info` - Get week availability info
- `GET /api/orders` - Get user's orders (requires auth)
- `POST /api/orders` - Create a new order (requires auth)

### Reviews
- `POST /api/reviews` - Create a review (requires auth)
- `GET /api/reviews/my` - Get user's reviews (requires auth)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/prep` - Get prep list for next Monday

## Database

The application uses SQLite for data storage. The database file (`orders.db`) will be created automatically when you first run the backend server.

### Database Schema

- **users**: User accounts with firstName, lastName, apartment, email, phone
- **orders**: Orders with bread/jam quantities, delivery dates, notes
- **reviews**: User reviews with ratings and text

## Design

The application features a beautiful, rustic design with:
- Elegant serif typography (GFS Didot, Cormorant Garamond, Playfair Display)
- Warm color palette (cream, beige, rustic brown)
- Film grain overlay effects on images
- Responsive design for mobile and desktop

## License

© 2024 the upper crust. Made with care, delivered with love.
