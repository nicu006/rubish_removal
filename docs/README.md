# EasyWaste Removal Website

A modern, responsive website for a rubbish removal company built with HTML, CSS, and JavaScript.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **Smooth Scrolling**: Navigation with smooth scroll effects
- **Contact Form**: Interactive contact form for customer inquiries
- **Mobile Menu**: Hamburger menu for mobile navigation
- **Eco-Friendly Theme**: Green color scheme reflecting environmental responsibility
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

## Backend Setup (Required)

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
