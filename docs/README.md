# EcoClean Rubbish Removal Website

A modern, responsive website for a rubbish removal company built with HTML, CSS, and JavaScript.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **Smooth Scrolling**: Navigation with smooth scroll effects
- **Contact Form**: Interactive contact form for customer inquiries
- **Mobile Menu**: Hamburger menu for mobile navigation
- **Eco-Friendly Theme**: Green color scheme reflecting environmental responsibility
- **Admin Dashboard**: Secure admin panel for managing customer messages
- **Backend API**: Node.js/Express backend with MySQL database
- **Database Storage**: Messages stored in MySQL database (runs locally)

## Sections

1. **Hero Section**: Eye-catching introduction with call-to-action buttons
2. **Services**: Four main service categories (Residential, Commercial, Bulk, Recycling)
3. **Why Choose Us**: Six key features highlighting company benefits
4. **Pricing**: Transparent pricing packages with calculator
5. **Coverage**: Service areas map and coverage information
6. **About**: Company information and statistics
7. **FAQ**: Frequently asked questions with accordion
8. **Contact**: Contact form and business information
9. **Footer**: Quick links and social media

## How to Use

1. **Start Backend**: 
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Open Frontend**: 
   - Option 1: Open `index.html` directly in browser
   - Option 2: Use a local server (recommended):
     ```bash
     python -m http.server 8000
     # Then open http://localhost:8000
     ```

3. Customize the content, colors, and information as needed

## Admin Dashboard

### Accessing the Admin Dashboard

The admin dashboard allows you to view and manage all customer messages submitted through the contact form.

#### First Time Access:

1. Open your browser and navigate to:
   ```
   dashboard.html?key==4WatRWY0IDMy4WYlx2YvNWZ
   ```

2. After the first successful access, the key is saved automatically

3. For subsequent visits, you can simply access:
   ```
   dashboard.html
   ```

#### Changing the Secret Key:

To change the secret key for security:

1. Open `dashboard.html` in a code editor
2. Find the line:
   ```javascript
   const SECRET_KEY = btoa('ecoclean2024admin').split('').reverse().join('');
   ```
3. Replace `'ecoclean2024admin'` with your own secret phrase
4. To generate the new key, open browser console (F12) and run:
   ```javascript
   btoa('YOUR_NEW_SECRET').split('').reverse().join('')
   ```
5. Use the generated key in the URL: `dashboard.html?key=GENERATED_KEY`

#### Dashboard Features:

- **View Messages**: See all customer inquiries with full details
- **Statistics**: Total messages, unread count, today's messages, weekly messages
- **Search**: Search messages by name, email, phone, or content
- **Filter**: Filter by All, Unread, or Read messages
- **Mark as Read**: Mark messages as read/unread
- **Delete**: Remove messages from the database
- **Auto-refresh**: Dashboard refreshes every 30 seconds

#### Backend & Database:

- **Backend**: Node.js/Express API server
- **Database**: MySQL (runs locally on your computer)
- **No external accounts**: Everything runs on your machine
- **Full control**: You have complete control over your data

#### Backend Setup (Required):

The backend is required for the website to function. Follow these steps:

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/)
2. **Install MySQL**: 
   - Option 1: Install MySQL Server
   - Option 2: Use XAMPP/WAMP/MAMP (easier for beginners)
3. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MySQL credentials
   npm start
   ```
4. **Verify**: Open http://localhost:3000/api/health

**Detailed Instructions**: See `BACKEND-SETUP.md` for complete step-by-step guide.

**Benefits of Local Backend**:
- ✅ No external accounts needed
- ✅ Real MySQL database (not localStorage)
- ✅ Complete data control
- ✅ Free - no cloud costs
- ✅ Works offline
- ✅ Privacy - data stays on your machine

## Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2ecc71;
    --primary-dark: #27ae60;
    --secondary-color: #34495e;
    /* ... */
}
```

### Content
- Update company name, contact information, and services in `index.html`
- Modify the form submission handler in `script.js` to connect to your backend

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Free to use and modify for your business needs.
