const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Railway/hosted environments often sit behind a proxy (needed for secure cookies)
app.set('trust proxy', 1);

// API info at /api (so GET / can serve the React app)
app.get('/api', function(req, res) {
    res.json({ 
        message: 'the upper crust API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            orders: '/api/orders',
            reviews: '/api/reviews',
            admin: '/api/admin'
        }
    });
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'upper-crust-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: IS_PROD,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
// In production we serve the React app from the same origin, so CORS isn't needed.
if (!IS_PROD) {
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend public directory
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));

// Serve React production build (single-service deploy)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Initialize database (use DATABASE_PATH for Railway Volume or custom path)
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'orders.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        
        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            apartment TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            avatar TEXT DEFAULT '/images/profile_bread.jpg',
            createdAt TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready');
            }
        });
        
        // Create orders table with userId and recurring
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            apartment TEXT NOT NULL,
            breadQuantity INTEGER NOT NULL DEFAULT 0,
            jamQuantity INTEGER NOT NULL DEFAULT 0,
            deliveryDate TEXT NOT NULL,
            notes TEXT,
            orderTime TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            isRecurring INTEGER DEFAULT 0,
            recurringFrequency TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Error creating orders table:', err.message);
            } else {
                console.log('Orders table ready');
                
                // Migration: Add missing columns if they don't exist
                db.all("PRAGMA table_info(orders)", (err, columns) => {
                    if (err) {
                        console.error('Error checking orders table schema:', err.message);
                        return;
                    }
                    
                    const columnNames = columns.map(col => col.name);
                    const migrations = [];
                    
                    // Add userId column if missing
                    if (!columnNames.includes('userId')) {
                        migrations.push(() => {
                            db.run("ALTER TABLE orders ADD COLUMN userId INTEGER", (err) => {
                                if (err) {
                                    console.error('Error adding userId column:', err.message);
                                } else {
                                    console.log('Added userId column to orders table');
                                }
                            });
                        });
                    }
                    
                    // Add isRecurring column if missing
                    if (!columnNames.includes('isRecurring')) {
                        migrations.push(() => {
                            db.run("ALTER TABLE orders ADD COLUMN isRecurring INTEGER DEFAULT 0", (err) => {
                                if (err) {
                                    console.error('Error adding isRecurring column:', err.message);
                                } else {
                                    console.log('Added isRecurring column to orders table');
                                }
                            });
                        });
                    }
                    
                    // Add recurringFrequency column if missing
                    if (!columnNames.includes('recurringFrequency')) {
                        migrations.push(() => {
                            db.run("ALTER TABLE orders ADD COLUMN recurringFrequency TEXT", (err) => {
                                if (err) {
                                    console.error('Error adding recurringFrequency column:', err.message);
                                } else {
                                    console.log('Added recurringFrequency column to orders table');
                                }
                            });
                        });
                    }
                    
                    // Execute all migrations
                    migrations.forEach(migration => migration());
                });
            }
        });
        
        // Create reviews table
        db.run(`CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            text TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Error creating reviews table:', err.message);
            } else {
                console.log('Reviews table ready');
            }
        });
    }
});

// ========== Authentication Routes ==========

// Register new user
app.post('/api/auth/register', (req, res) => {
    const { firstName, lastName, apartment, email, phone } = req.body;
    
    // Validation
    if (!firstName || !lastName || !apartment || !email || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate apartment (exactly 4 digits)
    if (!/^\d{4}$/.test(apartment)) {
        return res.status(400).json({ error: 'Apartment number must be exactly 4 digits' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const createdAt = new Date().toISOString();
    const avatar = '/images/profile_bread.jpg'; // Fixed avatar
    
    // Check if email already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create user
        db.run(
            `INSERT INTO users (firstName, lastName, apartment, email, phone, avatar, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, apartment, email, phone, avatar, createdAt],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Set session
                req.session.userId = this.lastID;
                
                // Return user data
                res.status(201).json({
                    id: this.lastID,
                    firstName,
                    lastName,
                    apartment,
                    email,
                    phone,
                    avatar
                });
            }
        );
    });
});

// Login (using email and apartment as credentials)
app.post('/api/auth/login', (req, res) => {
    const { email, apartment } = req.body;
    
    if (!email || !apartment) {
        return res.status(400).json({ error: 'Email and apartment number are required' });
    }
    
    db.get(
        'SELECT * FROM users WHERE email = ? AND apartment = ?',
        [email, apartment],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or apartment number' });
            }
            
            req.session.userId = user.id;
            
            res.json({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                apartment: user.apartment,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar
            });
        }
    );
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    
    db.get('SELECT id, firstName, lastName, apartment, email, phone, avatar FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// ========== Week / Monday delivery logic ==========
// Bread is delivered every Monday. Cutoff: Saturday 5pm CST (America/Chicago).
// Orders after that receive delivery the following week.
const LOAVES_PER_WEEK = 10;
const CUTOFF_DAY = 6;   // Saturday
const CUTOFF_HOUR = 17; // 5pm CST
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
    const weekday = get('weekday');
    const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
    return {
        day: dayMap[weekday] ?? 0,
        hour: parseInt(get('hour'), 10) || 0,
        minute: parseInt(get('minute'), 10) || 0
    };
}

function isPastCutoffCST(date) {
    const { day, hour, minute } = getChicagoTimeParts(date);
    return day === CUTOFF_DAY && (hour > CUTOFF_HOUR || (hour === CUTOFF_HOUR && minute >= 0));
}

function getNextDeliveryMonday(fromDate) {
    const d = new Date(fromDate);
    const pastCutoff = isPastCutoffCST(d);
    if (pastCutoff) {
        // After Saturday 5pm CST → delivery is the Monday after next (9 days from today)
        d.setDate(d.getDate() + 9);
    } else {
        // Next Monday (in Chicago: which "today" is it?)
        const { day } = getChicagoTimeParts(d);
        const daysToAdd = day === 1 ? 7 : (8 - day + 7) % 7;
        d.setDate(d.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
    }
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
}

// ========== Orders Routes ==========

// Get week info for ordering (next delivery Monday, total ordered, remaining) — public for order page
app.get('/api/orders/week-info', (req, res) => {
    const now = new Date();
    const afterCutoff = isPastCutoffCST(now);
    const deliveryMonday = getNextDeliveryMonday(now);
    db.get(
        `SELECT COALESCE(SUM(breadQuantity), 0) as total FROM orders WHERE deliveryDate = ? AND status != 'cancelled'`,
        [deliveryMonday],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const totalOrdered = row ? row.total : 0;
            const remaining = Math.max(0, LOAVES_PER_WEEK - totalOrdered);
            res.json({ deliveryMonday, totalOrdered, remaining, maxLoaves: LOAVES_PER_WEEK, afterCutoff });
        }
    );
});

// Get all orders for authenticated user
app.get('/api/orders', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    db.all(
        'SELECT * FROM orders WHERE userId = ? ORDER BY orderTime DESC',
        [userId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Create a new order (delivery is always next Monday; cutoff Saturday 5pm)
app.post('/api/orders', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { breadQuantity, deliveryDate, notes, isRecurring } = req.body;
    
    db.get('SELECT firstName, lastName, phone, apartment FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const expectedMonday = getNextDeliveryMonday(new Date());
        const deliveryDateToUse = deliveryDate && deliveryDate === expectedMonday ? deliveryDate : expectedMonday;
        
        const breadQty = Math.min(3, Math.max(1, parseInt(breadQuantity) || 0));
        const jamQty = 0;
        
        if (breadQty === 0) {
            return res.status(400).json({ error: 'Please select at least one loaf of bread to order' });
        }
        
        db.get(
            `SELECT COALESCE(SUM(breadQuantity), 0) as total FROM orders WHERE deliveryDate = ? AND status != 'cancelled'`,
            [deliveryDateToUse],
            (err, row) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                const totalOrdered = row ? row.total : 0;
                if (totalOrdered + breadQty > LOAVES_PER_WEEK) {
                    return res.status(400).json({ error: `Only ${LOAVES_PER_WEEK - totalOrdered} loaf(ves) left for that Monday. Please choose a smaller quantity.` });
                }
                
                const orderTime = new Date().toISOString();
                const name = `${user.firstName} ${user.lastName}`;
                const recurring = isRecurring ? 1 : 0;
                const recurringFreq = isRecurring ? 'weekly' : null;
                
                db.run(
                    `INSERT INTO orders (userId, name, phone, apartment, breadQuantity, jamQuantity, deliveryDate, notes, orderTime, status, isRecurring, recurringFrequency)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, name, user.phone, user.apartment, breadQty, jamQty, deliveryDateToUse, notes || '', orderTime, 'pending', recurring, recurringFreq],
                    function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.status(201).json({
                            id: this.lastID,
                            userId,
                            name,
                            phone: user.phone,
                            apartment: user.apartment,
                            breadQuantity: breadQty,
                            jamQuantity: jamQty,
                            deliveryDate: deliveryDateToUse,
                            notes: notes || '',
                            orderTime,
                            status: 'pending',
                            isRecurring: recurring,
                            recurringFrequency: recurringFreq
                        });
                    }
                );
            }
        );
    });
});

// ========== Reviews Routes ==========

// Create review
app.post('/api/reviews', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { rating, text } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const createdAt = new Date().toISOString();
    
    db.run(
        `INSERT INTO reviews (userId, rating, text, createdAt) VALUES (?, ?, ?, ?)`,
        [userId, rating, text || '', createdAt],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: this.lastID,
                userId,
                rating,
                text: text || '',
                createdAt
            });
        }
    );
});

// Get user's reviews
app.get('/api/reviews/my', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    db.all(
        'SELECT * FROM reviews WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (err, reviews) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(reviews);
        }
    );
});

// ========== Admin Routes ==========

// Get all users (admin)
app.get('/api/admin/users', (req, res) => {
    db.all('SELECT id, firstName, lastName, apartment, email, phone, avatar, createdAt FROM users ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get all orders (admin)
app.get('/api/admin/orders', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY deliveryDate ASC, orderTime DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get prep summary for next Monday (loaves to prep, list of orders)
app.get('/api/admin/prep', (req, res) => {
    const deliveryMonday = getNextDeliveryMonday(new Date());
    db.all(
        `SELECT o.id, o.breadQuantity, o.name, o.apartment, o.notes
         FROM orders o
         WHERE o.deliveryDate = ? AND o.status != 'cancelled'
         ORDER BY o.orderTime ASC`,
        [deliveryMonday],
        (err, orders) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const totalLoaves = orders.reduce((sum, o) => sum + (o.breadQuantity || 0), 0);
            res.json({ deliveryMonday, totalLoaves, orders });
        }
    );
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'the upper crust API is running' });
});

// React SPA fallback (must be after API routes)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});
