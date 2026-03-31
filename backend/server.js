const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

// Configure multer for image uploads (memory storage - no files on disk)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max per file
        files: 5 // Maximum 5 files
    }
});

// Load environment variables from .env (preferred) or .env.example (fallback)
try {
    const dotenv = require('dotenv');
    const envPath = path.join(__dirname, '.env');
    const fallbackPath = path.join(__dirname, '.env.example');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
    } else {
        dotenv.config({ path: fallbackPath, override: true });
    }
} catch (e) {
    // dotenv optional at runtime
}

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed service values (strict validation)
const ALLOWED_SERVICES = ['residential', 'commercial', 'bulk', 'garden', 'recycling'];

// CORS: use CORS_ORIGIN in production (e.g. https://yourdomain.com), '*' for development
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
    origin: corsOrigin === undefined || corsOrigin === ''
        ? '*'
        : corsOrigin.split(',').map(s => s.trim()).filter(Boolean),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: false,
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
    const allowOrigin = corsOptions.origin === '*'
        ? '*'
        : (Array.isArray(corsOptions.origin) && req.headers.origin && corsOptions.origin.includes(req.headers.origin))
            ? req.headers.origin
            : (Array.isArray(corsOptions.origin) ? corsOptions.origin[0] : '*');
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General API rate limit (all /api routes: 100 per 15 min per IP)
const apiGeneralLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_API_MAX, 10) || 100,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', apiGeneralLimiter);

// Rate limit for POST /api/messages (stricter: 20 per 15 minutes per IP)
const messageCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MESSAGES_MAX, 10) || 20,
    message: { error: 'Too many submissions. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Auth for protected routes (GET/PATCH/DELETE messages). Requires API_SECRET_KEY in .env; send header Authorization: Bearer <key> or X-API-Key: <key> or query ?token=<key>
function requireApiKey(req, res, next) {
    const secret = process.env.API_SECRET_KEY;
    if (!secret || secret.trim() === '') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access to messages is disabled. Set API_SECRET_KEY in backend/.env to enable and use Authorization: Bearer <key> or X-API-Key: <key>.'
        });
    }
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    const queryToken = req.query.token; // Allow token in query string for image loading
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7).trim() : (apiKeyHeader || queryToken || '').trim();
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const crypto = require('crypto');
    const secretBuf = Buffer.from(secret, 'utf8');
    const tokenBuf = Buffer.from(token, 'utf8');
    if (secretBuf.length !== tokenBuf.length || !crypto.timingSafeEqual(secretBuf, tokenBuf)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// API info endpoint (before static files)
app.get('/api', (req, res) => {
    res.json({
        message: 'EasyWaste Backend API',
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

// Email configuration (trim values in case .env has trailing spaces)
const emailConfig = {
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
        user: (process.env.SMTP_USER || '').trim(),
        pass: (process.env.SMTP_PASS || '').trim()
    }
};

const contactEmail = process.env.CONTACT_EMAIL || 'softionyxgroup@gmail.com';

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Function to send email
async function sendContactEmail(formData, attachments = []) {
    const { name, email, phone, service, region, message } = formData;
    
    const serviceLabels = {
        residential: 'Residential',
        commercial: 'Commercial',
        bulk: 'Bulk Removal',
        garden: 'Garden & Outdoor',
        recycling: 'Recycling'
    };
    
    const serviceIcons = {
        residential: '🏠',
        commercial: '🏢',
        bulk: '📦',
        garden: '🌿',
        recycling: '♻️'
    };
    
    const formattedDate = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = phone ? escapeHtml(phone) : '';
    const safeService = serviceLabels[service] || service;
    const safeMessage = message.replace(/\n/g, '<br>').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                � EasyWaste
                            </h1>
                            <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                New Contact Form Submission
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <!-- Date Badge -->
                            <div style="background-color: #ecf0f1; border-radius: 8px; padding: 12px 16px; margin-bottom: 30px; text-align: center;">
                                <p style="margin: 0; color: #7f8c8d; font-size: 14px; font-weight: 500;">
                                    📅 ${formattedDate}
                                </p>
                            </div>
                            
                            <!-- Service Card -->
                            <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); border-radius: 10px; padding: 20px; margin-bottom: 30px; text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 10px;">
                                    ${serviceIcons[service] || '📋'}
                                </div>
                                <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">
                                    ${safeService}
                                </h2>
                            </div>
                            
                            <!-- Contact Information -->
                            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                                <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 18px; font-weight: 600; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
                                    👤 Contact Information
                                </h3>
                                
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                                            <strong style="color: #34495e; font-size: 14px; display: inline-block; width: 100px;">Name:</strong>
                                            <span style="color: #2c3e50; font-size: 15px; font-weight: 500;">${safeName}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                                            <strong style="color: #34495e; font-size: 14px; display: inline-block; width: 100px;">Email:</strong>
                                            <a href="mailto:${safeEmail}" style="color: #27ae60; font-size: 15px; text-decoration: none; font-weight: 500;">${safeEmail}</a>
                                        </td>
                                    </tr>
                                    ${safePhone ? `
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                                            <strong style="color: #34495e; font-size: 14px; display: inline-block; width: 100px;">Phone:</strong>
                                            <a href="tel:${safePhone}" style="color: #27ae60; font-size: 15px; text-decoration: none; font-weight: 500;">${safePhone}</a>
                                        </td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <strong style="color: #34495e; font-size: 14px; display: inline-block; width: 100px;">Region:</strong>
                                            <span style="color: #2c3e50; font-size: 15px; font-weight: 500;">${escapeHtml(region || 'Not specified')}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Message -->
                            <div style="background-color: #ffffff; border: 2px solid #e9ecef; border-radius: 10px; padding: 25px;">
                                <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px; font-weight: 600; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
                                    💬 Message
                                </h3>
                                <div style="color: #34495e; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
                                    ${safeMessage}
                                </div>
                            </div>
                            
                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="mailto:${safeEmail}?subject=Re: ${safeService} Inquiry" style="display: inline-block; background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);">
                                    ✉️ Reply to ${safeName}
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2c3e50; padding: 25px 40px; text-align: center;">
                            <p style="margin: 0; color: #bdc3c7; font-size: 13px;">
                                This email was sent from the EasyWaste website contact form.
                            </p>
                            <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 12px;">
                                © ${new Date().getFullYear()} EasyWaste. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
    
    const emailText = `
═══════════════════════════════════════════════════════
    � EasyWaste - New Contact Form Submission
═══════════════════════════════════════════════════════

📅 Date: ${formattedDate}

${serviceIcons[service] || '📋'} Service: ${safeService}

👤 Contact Information:
   Name: ${name}
   Email: ${email}
   ${phone ? `Phone: ${phone}` : ''}
   Region: ${region || 'Not specified'}

💬 Message:
${message}

═══════════════════════════════════════════════════════
Reply to: ${email}
═══════════════════════════════════════════════════════
    `;
    
    const mailOptions = {
        from: `"EasyWaste Website" <${emailConfig.auth.user}>`,
        to: contactEmail,
        replyTo: email,
        subject: `🗑️ New Inquiry: ${safeService} - ${safeName}`,
        text: emailText,
        html: emailHtml,
        attachments: attachments.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }))
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
}

// Database functions
async function initDatabase() {
    try {
        // Helpful early error if password is required but missing
        if (!process.env.DB_PASSWORD) {
            console.warn(
                "⚠️ DB_PASSWORD is empty. If your MySQL root user has a password (common with Docker/MySQL), " +
                "create backend/.env from backend/.env.example and set DB_PASSWORD, then rerun `npm start`."
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
    // First, check if table exists and if region column exists
    try {
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'region'
        `, [dbConfig.database]);
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp BIGINT NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(254) NOT NULL,
                phone VARCHAR(20),
                service VARCHAR(50) NOT NULL,
                region VARCHAR(20),
                message TEXT NOT NULL,
                images MEDIUMTEXT,
                read_status BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_timestamp (timestamp DESC),
                INDEX idx_read_status (read_status),
                INDEX idx_email (email),
                INDEX idx_region (region)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await pool.query(createTableSQL);
        
        // Add region column if it doesn't exist
        if (columns.length === 0) {
            await pool.query(`
                ALTER TABLE messages 
                ADD COLUMN region VARCHAR(20) AFTER service,
                ADD INDEX idx_region (region)
            `);
            console.log('✅ Added region column to messages table');
        }

        // Check if images column exists
        const [imagesCol] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'images'
        `, [dbConfig.database]);

        if (imagesCol.length === 0) {
            await pool.query(`ALTER TABLE messages ADD COLUMN images MEDIUMTEXT AFTER message`);
            console.log('✅ Added images column to messages table');
        } else {
            // Upgrade existing images column to MEDIUMTEXT for base64 storage
            await pool.query(`ALTER TABLE messages MODIFY COLUMN images MEDIUMTEXT`);
        }
        
        // Create visitors table for tracking
        const createVisitorsTableSQL = `
            CREATE TABLE IF NOT EXISTS visitors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45),
                user_agent TEXT,
                page VARCHAR(255) DEFAULT '/',
                referrer VARCHAR(500),
                visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_visited_at (visited_at DESC),
                INDEX idx_ip (ip_address)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await pool.query(createVisitorsTableSQL);
        
        console.log('✅ Table created/verified successfully');
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        throw error;
    }
}

// API Routes

// Parse positive integer from string; return null if invalid
function parseId(id) {
    const n = parseInt(id, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

// GET all messages (with pagination: ?page=1&limit=50) - requires API key if API_SECRET_KEY is set
app.get('/api/messages', requireApiKey, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM messages');
        const total = countResult[0].total;

        const messages = rows.map(row => ({
            id: row.id,
            timestamp: row.timestamp,
            data: {
                name: row.name,
                email: row.email,
                phone: row.phone,
                service: row.service,
                region: row.region || null,
                message: row.message,
                images: row.images ? JSON.parse(row.images) : []
            },
            read: row.read_status || false
        }));

        res.json({
            messages,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST new message - rate limited, saves to database AND sends email
app.post('/api/messages', messageCreateLimiter, upload.array('images', 5), async (req, res) => {
    try {
        // Parse data from FormData or JSON
        let timestamp, data;
        if (req.body.data && typeof req.body.data === 'string') {
            // FormData submission
            data = JSON.parse(req.body.data);
            timestamp = req.body.timestamp;
        } else {
            // JSON submission (backward compatible)
            timestamp = req.body.timestamp;
            data = req.body.data;
        }

        if (!timestamp || !data || !data.name || !data.email || !data.service || !data.message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!ALLOWED_SERVICES.includes(data.service)) {
            return res.status(400).json({ error: 'Invalid service. Must be one of: ' + ALLOWED_SERVICES.join(', ') });
        }

        const formData = {
            name: String(data.name).substring(0, 100),
            email: String(data.email).substring(0, 254),
            phone: data.phone ? String(data.phone).substring(0, 20) : null,
            service: data.service,
            region: data.region ? String(data.region).substring(0, 20) : null,
            message: String(data.message).substring(0, 2000)
        };

        // Store images as base64 data URIs (no files on disk)
        const imageDataArray = (req.files || []).map(f => ({
            name: f.originalname,
            type: f.mimetype,
            data: `data:${f.mimetype};base64,${f.buffer.toString('base64')}`
        }));

        const [result] = await pool.query(
            `INSERT INTO messages (timestamp, name, email, phone, service, region, message, images, read_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [timestamp, formData.name, formData.email, formData.phone, formData.service, formData.region, formData.message, imageDataArray.length > 0 ? JSON.stringify(imageDataArray) : null, false]
        );

        // Build attachments from memory buffers for email
        const emailAttachments = (req.files || []).map(f => ({
            originalname: f.originalname,
            buffer: f.buffer,
            mimetype: f.mimetype
        }));
        try {
            await sendContactEmail(formData, emailAttachments);
        } catch (emailError) {
            console.error('⚠️ Email sending failed, but message saved to database:', emailError.message);
        }

        res.status(201).json({
            id: result.insertId,
            message: 'Message saved successfully'
        });
    } catch (error) {
        console.error('Error saving message:', error.message);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// PATCH update message read status - requires API key if API_SECRET_KEY is set
app.patch('/api/messages/:id', requireApiKey, async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return res.status(400).json({ error: 'Invalid message id' });
        }
        const { read } = req.body;

        if (typeof read !== 'boolean') {
            return res.status(400).json({ error: 'read field must be boolean' });
        }

        const [result] = await pool.query(
            'UPDATE messages SET read_status = ? WHERE id = ?',
            [read, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Message updated successfully' });
    } catch (error) {
        console.error('Error updating message:', error.message);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// DELETE message - requires API key if API_SECRET_KEY is set
app.delete('/api/messages/:id', requireApiKey, async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return res.status(400).json({ error: 'Invalid message id' });
        }

        const [result] = await pool.query('DELETE FROM messages WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error.message);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Health check (database + email config status)
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        const dbStatus = 'connected';
        const emailConfigured = !!(emailConfig.auth.user && emailConfig.auth.pass);
        res.json({
            status: 'ok',
            database: dbStatus,
            emailConfigured
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// POST track visitor - public endpoint for visitor tracking
app.post('/api/visitors', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const { page, referrer } = req.body;

        await pool.query(
            'INSERT INTO visitors (ip_address, user_agent, page, referrer) VALUES (?, ?, ?, ?)',
            [ip.substring(0, 45), userAgent.substring(0, 1000), (page || '/').substring(0, 255), (referrer || '').substring(0, 500)]
        );

        res.status(201).json({ message: 'Visit tracked' });
    } catch (error) {
        console.error('Error tracking visitor:', error.message);
        res.status(500).json({ error: 'Failed to track visit' });
    }
});

// GET dashboard stats - requires API key
app.get('/api/dashboard', requireApiKey, async (req, res) => {
    try {
        // Total visitors
        const [totalVisitors] = await pool.query('SELECT COUNT(*) AS total FROM visitors');
        
        // Unique visitors (by IP)
        const [uniqueVisitors] = await pool.query('SELECT COUNT(DISTINCT ip_address) AS total FROM visitors');
        
        // Today's visitors
        const [todayVisitors] = await pool.query(
            'SELECT COUNT(*) AS total FROM visitors WHERE DATE(visited_at) = CURDATE()'
        );
        
        // This week's visitors
        const [weekVisitors] = await pool.query(
            'SELECT COUNT(*) AS total FROM visitors WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        );
        
        // Total messages
        const [totalMessages] = await pool.query('SELECT COUNT(*) AS total FROM messages');
        
        // Unread messages
        const [unreadMessages] = await pool.query('SELECT COUNT(*) AS total FROM messages WHERE read_status = FALSE');
        
        // Messages by service
        const [messagesByService] = await pool.query(
            'SELECT service, COUNT(*) AS count FROM messages GROUP BY service ORDER BY count DESC'
        );
        
        // Visitors per day (last 7 days)
        const [visitorsPerDay] = await pool.query(`
            SELECT DATE(visited_at) AS date, COUNT(*) AS count 
            FROM visitors 
            WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(visited_at) 
            ORDER BY date ASC
        `);
        
        // Recent messages (last 10)
        const [recentMessages] = await pool.query(
            'SELECT id, timestamp, name, email, phone, service, region, message, images, read_status, created_at FROM messages ORDER BY timestamp DESC LIMIT 10'
        );

        res.json({
            visitors: {
                total: totalVisitors[0].total,
                unique: uniqueVisitors[0].total,
                today: todayVisitors[0].total,
                thisWeek: weekVisitors[0].total,
                perDay: visitorsPerDay
            },
            messages: {
                total: totalMessages[0].total,
                unread: unreadMessages[0].total,
                byService: messagesByService,
                recent: recentMessages.map(row => ({
                    id: row.id,
                    timestamp: row.timestamp,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    service: row.service,
                    region: row.region,
                    message: row.message,
                    images: row.images ? JSON.parse(row.images) : [],
                    read: row.read_status,
                    createdAt: row.created_at
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error.message);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Serve index.html explicitly for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Images are stored as base64 in the database - no file serving needed

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
    // Initialize database
    await initDatabase();

    // Verify email configuration
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('⚠️ Email configuration missing. Please set SMTP_USER and SMTP_PASS in .env file');
    } else {
        console.log('✅ Email configuration loaded');
    }

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
        console.log(`📧 Email configured: ${contactEmail}`);
        console.log(`\nAvailable endpoints:`);
        console.log(`  GET    /api/messages     - Get all messages`);
        console.log(`  POST   /api/messages     - Create new message (saves to DB + sends email)`);
        console.log(`  PATCH  /api/messages/:id - Update message read status`);
        console.log(`  DELETE /api/messages/:id - Delete message`);
        console.log(`  GET    /api/health       - Health check\n`);
    });
}

startServer().catch(console.error);
