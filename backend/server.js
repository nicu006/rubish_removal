const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env (preferred) or env.example (fallback)
// This makes `npm start` work without manually exporting $env:... variables.
try {
    const dotenv = require('dotenv');
    const envPath = fs.existsSync(path.join(__dirname, '.env'))
        ? path.join(__dirname, '.env')
        : path.join(__dirname, 'env.example');
    dotenv.config({ path: envPath });
} catch (e) {
    // dotenv is optional at runtime; if missing, we fall back to process.env/defaults below
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Enhanced CORS configuration for mobile access
const corsOptions = {
    origin: '*', // Allow all origins (for development)
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: false,
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API info endpoint (before static files)
app.get('/api', (req, res) => {
    res.json({
        message: 'EcoClean Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            messages: '/api/messages',
            documentation: 'See README.md for API documentation'
        }
    });
});

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecoclean_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
let pool;

async function initDatabase() {
    try {
        // Helpful early error if password is required but missing
        if (!process.env.DB_PASSWORD) {
            console.warn(
                "⚠️ DB_PASSWORD is empty. If your MySQL root user has a password (common with Docker/MySQL), " +
                "create backend/.env (or edit backend/env.example) and set DB_PASSWORD, then rerun `npm start`."
            );
        }

        // First, connect without database to create it if needed
        const adminConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // Create database if it doesn't exist
        await adminConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await adminConnection.end();

        // Now create pool with database
        pool = mysql.createPool(dbConfig);

        // Create table if it doesn't exist
        await createTable();

        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
}

async function createTable() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(254) NOT NULL,
            phone VARCHAR(20),
            service VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            read_status BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_timestamp (timestamp DESC),
            INDEX idx_read_status (read_status),
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await pool.query(createTableSQL);
        console.log('✅ Table created/verified successfully');
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        throw error;
    }
}

// API Routes

// GET all messages
app.get('/api/messages', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM messages ORDER BY timestamp DESC'
        );

        // Transform to frontend format
        const messages = rows.map(row => ({
            id: row.id,
            timestamp: row.timestamp,
            data: {
                name: row.name,
                email: row.email,
                phone: row.phone,
                service: row.service,
                message: row.message
            },
            read: row.read_status || false
        }));

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST new message
app.post('/api/messages', async (req, res) => {
    try {
        const { timestamp, data } = req.body;

        // Validate required fields
        if (!timestamp || !data || !data.name || !data.email || !data.service || !data.message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Sanitize input
        const name = data.name.substring(0, 100);
        const email = data.email.substring(0, 254);
        const phone = data.phone ? data.phone.substring(0, 20) : null;
        const service = data.service.substring(0, 50);
        const message = data.message.substring(0, 2000);

        const [result] = await pool.query(
            `INSERT INTO messages (timestamp, name, email, phone, service, message, read_status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [timestamp, name, email, phone, service, message, false]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Message saved successfully'
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// PATCH update message read status
app.patch('/api/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { read } = req.body;

        if (typeof read !== 'boolean') {
            return res.status(400).json({ error: 'read field must be boolean' });
        }

        await pool.query(
            'UPDATE messages SET read_status = ? WHERE id = ?',
            [read, id]
        );

        res.json({ message: 'Message updated successfully' });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// DELETE message
app.delete('/api/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM messages WHERE id = ?', [id]);

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// Serve frontend files from public folder (AFTER all API routes)
// This allows mobile devices to access everything from the same origin (no CORS issues)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback: serve index.html for all non-API routes (for SPA routing)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next(); // Let API routes handle it
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
async function startServer() {
    await initDatabase();

    app.listen(PORT, '0.0.0.0', () => {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        let localIP = 'localhost';
        
        // Find local IP address
        for (const interfaceName in networkInterfaces) {
            const interfaces = networkInterfaces[interfaceName];
            for (const iface of interfaces) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    localIP = iface.address;
                    break;
                }
            }
            if (localIP !== 'localhost') break;
        }
        
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🌐 Server accessible from network: http://${localIP}:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
        console.log(`📱 For mobile access, use: http://${localIP}:${PORT}/api`);
        console.log(`\nAvailable endpoints:`);
        console.log(`  GET    /api/messages     - Get all messages`);
        console.log(`  POST   /api/messages     - Create new message`);
        console.log(`  PATCH  /api/messages/:id - Update message read status`);
        console.log(`  DELETE /api/messages/:id - Delete message`);
        console.log(`  GET    /api/health       - Health check\n`);
    });
}

startServer().catch(console.error);
