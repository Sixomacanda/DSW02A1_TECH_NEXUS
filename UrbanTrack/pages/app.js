const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 4000;

// Middleware - REQUIRED for reading data from HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('node-mysql')); // Change 'public' to your HTML folder name

// Session for login state
app.use(session({
    secret: 'Mlekeleli36@meh',
    resave: false,
    saveUninitialized: true
}));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'users_sign'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to database');
});

// ============ REGISTER - INSERT DATA INTO DATABASE ============
app.post('/api/register', async (req, res) => {
    // 1. GET data from HTML form
    const { surname, email, password } = req.body;
    
    // 2. VALIDATE data
    if (!surname || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    // 3. CHECK if email already exists in database
    const checkQuery = 'SELECT * FROM user_sign WHERE Email = ?';
    db.query(checkQuery, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // 4. HASH the password (encrypt for security)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 5. INSERT data into database
        const insertQuery = 'INSERT INTO user_sign (Surname, Email, Password) VALUES (?, ?, ?)';
        db.query(insertQuery, [surname, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to register user' });
            }
            
            // 6. SUCCESS response
            res.json({ success: true, message: 'Registration successful' });
        });
    });
});

// ============ LOGIN - VERIFY DATA FROM DATABASE ============
app.post('/api/login', (req, res) => {
    // 1. GET data from HTML form
    const { email, password } = req.body;
    
    // 2. VALIDATE data
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    // 3. FIND user in database by email
    const findQuery = 'SELECT * FROM user_sign WHERE Email = ?';
    db.query(findQuery, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        // 4. CHECK if user exists
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = results[0];
        
        // 5. VERIFY password (compare entered password with hashed password in database)
        const isValidPassword = await bcrypt.compare(password, user.Password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // 6. SUCCESS - Store user in session
        req.session.user = {
            id: user.id,
            surname: user.Surname,
            email: user.Email
        };
        
        res.json({ success: true, message: 'Login successful' });
    });
});

// ============ CHECK IF USER IS LOGGED IN ============
app.get('/api/current-user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// ============ LOGOUT ============
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

// ============ SERVE YOUR HTML FILES ============
// Change these paths to where your HTML files are located
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'node-mysql', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'node-mysql', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'your-html-folder', 'dashboard.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});