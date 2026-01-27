// Mobile Navigation Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Scroll Progress Indicator
const scrollProgress = document.getElementById('scrollProgress');
if (scrollProgress) {
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Security: Input sanitization function
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remove HTML tags
    const div = document.createElement('div');
    div.textContent = input;
    let sanitized = div.innerHTML;
    
    // Remove potentially dangerous characters
    sanitized = sanitized
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .replace(/data:/gi, '') // Remove data: protocol
        .trim();
    
    return sanitized;
}

// Security: Enhanced validation
function validateFormData(formData) {
    const errors = [];
    
    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    }
    if (formData.name && formData.name.length > 100) {
        errors.push({ field: 'name', message: 'Name is too long (max 100 characters)' });
    }
    
    // Check for dangerous patterns in name
    const dangerousPatterns = /<script|javascript:|onerror=|onload=|eval\(|document\.cookie/i;
    if (dangerousPatterns.test(formData.name)) {
        errors.push({ field: 'name', message: 'Invalid characters detected in name' });
    }
    
    // Email validation (more strict)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (formData.email && formData.email.length > 254) {
        errors.push({ field: 'email', message: 'Email is too long' });
    }
    
    // Phone validation
    if (formData.phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(formData.phone) || formData.phone.length > 20) {
            errors.push({ field: 'phone', message: 'Invalid phone number format' });
        }
    }
    
    // Service validation
    const allowedServices = ['residential', 'commercial', 'bulk', 'recycling'];
    if (!formData.service || !allowedServices.includes(formData.service)) {
        errors.push({ field: 'service', message: 'Please select a valid service' });
    }
    
    // Message validation
    if (!formData.message || formData.message.trim().length < 10) {
        errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
    }
    if (formData.message && formData.message.length > 2000) {
        errors.push({ field: 'message', message: 'Message is too long (max 2000 characters)' });
    }
    
    // Check for potential XSS in message
    if (dangerousPatterns.test(formData.message)) {
        errors.push({ field: 'message', message: 'Invalid characters detected in message' });
    }
    
    return errors;
}

// Security: Rate limiting
let lastSubmission = 0;
const MIN_SUBMISSION_INTERVAL = 5000; // 5 seconds
let submissionCount = 0;
const MAX_SUBMISSIONS_PER_HOUR = 10;
const submissionTimes = [];

function checkRateLimit() {
    const now = Date.now();
    
    // Check minimum interval between submissions
    if (now - lastSubmission < MIN_SUBMISSION_INTERVAL) {
        const remainingTime = Math.ceil((MIN_SUBMISSION_INTERVAL - (now - lastSubmission)) / 1000);
        return { allowed: false, message: `Please wait ${remainingTime} seconds before submitting again.` };
    }
    
    // Remove submissions older than 1 hour
    const oneHourAgo = now - (60 * 60 * 1000);
    while (submissionTimes.length > 0 && submissionTimes[0] < oneHourAgo) {
        submissionTimes.shift();
    }
    
    // Check hourly limit
    if (submissionTimes.length >= MAX_SUBMISSIONS_PER_HOUR) {
        return { allowed: false, message: 'Too many submissions. Please try again later.' };
    }
    
    return { allowed: true };
}

// Form submission handler with enhanced security
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form elements
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const serviceInput = document.getElementById('service');
        const messageInput = document.getElementById('message');
        
        // Remove previous error classes
        [nameInput, emailInput, phoneInput, serviceInput, messageInput].forEach(input => {
            if (input) input.classList.remove('error');
        });
        
        // Check rate limiting
        const rateLimitCheck = checkRateLimit();
        if (!rateLimitCheck.allowed) {
            showNotification(rateLimitCheck.message, 'error');
            return;
        }
        
        // Sanitize all inputs
        const formData = {
            name: sanitizeInput(nameInput.value),
            email: sanitizeInput(emailInput.value),
            phone: phoneInput.value ? sanitizeInput(phoneInput.value) : '',
            service: serviceInput.value,
            message: sanitizeInput(messageInput.value)
        };
        
        // Validate form data
        const validationErrors = validateFormData(formData);
        
        if (validationErrors.length > 0) {
            // Show first error
            showNotification(validationErrors[0].message, 'error');
            
            // Highlight error fields
            validationErrors.forEach(error => {
                const fieldMap = {
                    'name': nameInput,
                    'email': emailInput,
                    'phone': phoneInput,
                    'service': serviceInput,
                    'message': messageInput
                };
                if (fieldMap[error.field]) {
                    fieldMap[error.field].classList.add('error');
                }
            });
            return;
        }
        
        // Update rate limiting
        const now = Date.now();
        lastSubmission = now;
        submissionTimes.push(now);
        
        // Store submission to backend database
        const messageData = {
            timestamp: now,
            data: formData,
            read: false
        };
        
        // Save to backend API
        saveMessageToBackend(messageData).then(() => {
            // Show success message
            showNotification('Thank you for your message! We will get back to you soon.', 'success');
            
            // Reset form
            contactForm.reset();
            
            // Disable submit button temporarily
            const submitButton = contactForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                setTimeout(() => {
                    submitButton.disabled = false;
                }, MIN_SUBMISSION_INTERVAL);
            }
        }).catch(error => {
            console.error('Error saving message:', error);
            
            // Show detailed error message
            let errorMessage = 'Error saving message. ';
            if (error.message) {
                errorMessage += error.message + '. ';
            }
            
            showNotification(errorMessage, 'error');
        });
        
        return; // Exit early since we handle success/error in promise
    });
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Handle multi-line messages
    if (message.includes('\n')) {
        const lines = message.split('\n');
        notification.innerHTML = lines.map(line => {
            if (line.trim().startsWith('✅') || line.trim().startsWith('❌') || line.trim().startsWith('⚠️')) {
                return `<div style="font-weight: bold; margin-bottom: 0.3rem;">${line}</div>`;
            }
            return `<div>${line}</div>`;
        }).join('');
    } else {
        notification.textContent = message;
    }
    
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Show longer for error messages
    const duration = type === 'error' ? 8000 : 4000;
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Price Calculator
function initCalculator() {
    const wasteTypeSelect = document.getElementById('wasteType');
    const wasteAmountInput = document.getElementById('wasteAmount');
    const wasteAmountRange = document.getElementById('wasteAmountRange');
    const urgencySelect = document.getElementById('urgency');
    const sortingCheckbox = document.getElementById('sorting');
    const calculatedPriceElement = document.getElementById('calculatedPrice');
    
    function calculatePrice() {
        const wasteType = wasteTypeSelect.value;
        const amount = parseFloat(wasteAmountInput.value) || 1;
        const urgency = urgencySelect.value;
        const sorting = sortingCheckbox.checked;
        
        // Base prices per ton by waste type
        const basePrices = {
            general: 100,
            furniture: 120,
            appliances: 150,
            garden: 80,
            construction: 130,
            mixed: 110
        };
        
        // Urgency multipliers
        const urgencyMultipliers = {
            standard: 1,
            priority: 1.3,
            express: 1.6
        };
        
        // Calculate base price
        let price = basePrices[wasteType] * amount;
        
        // Apply urgency multiplier
        price *= urgencyMultipliers[urgency];
        
        // Add sorting fee
        if (sorting) {
            price += 30;
        }
        
        // Minimum price
        price = Math.max(price, 99);
        
        // Round to nearest integer
        price = Math.round(price);
        
        calculatedPriceElement.textContent = price;
    }
    
    // Sync range slider with number input
    wasteAmountRange.addEventListener('input', (e) => {
        wasteAmountInput.value = e.target.value;
        calculatePrice();
    });
    
    wasteAmountInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (value >= 0.1 && value <= 10) {
            wasteAmountRange.value = value;
            calculatePrice();
        }
    });
    
    wasteTypeSelect.addEventListener('change', calculatePrice);
    urgencySelect.addEventListener('change', calculatePrice);
    sortingCheckbox.addEventListener('change', calculatePrice);
    
    // Initial calculation
    calculatePrice();
}

// FAQ Accordion
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');
if (backToTopButton) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Animated Counters
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            const value = Math.floor(current);
            const text = element.textContent;
            if (text.includes('+')) {
                element.textContent = value + '+';
            } else if (text.includes('K+')) {
                element.textContent = (value / 1000).toFixed(0) + 'K+';
            } else if (text.includes('%')) {
                element.textContent = value + '%';
            } else {
                element.textContent = value;
            }
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = element.getAttribute('data-target');
        }
    };

    updateCounter();
}

// Intersection Observer for fade-in animations and counters
const observerOptions = {
    threshold: 0.01,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            
            // Animate counters
            if (entry.target.classList.contains('stat-number')) {
                const target = entry.target.textContent;
                entry.target.setAttribute('data-target', target);
                entry.target.textContent = '0';
                
                let value = parseInt(target.replace(/\D/g, ''));
                if (target.includes('K+')) {
                    value = parseInt(target.replace(/\D/g, '')) * 1000;
                }
                
                animateCounter(entry.target, value);
            }
        }
    });
}, observerOptions);

// Observe service cards, feature cards, sections, and stat numbers
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.service-card, .feature-card, .pricing-card, section');
    const statNumbers = document.querySelectorAll('.stat-number');
    
    animatedElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.3s ease, transform 0.3s ease`;
        observer.observe(el);
    });
    
    // Observe stat numbers separately
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
    
    // Check backend availability and show status
    // Use absolute URL for health check
    const healthUrl = API_BASE_URL.startsWith('/') 
        ? `${window.location.origin}${API_BASE_URL}/health`
        : `${API_BASE_URL}/health`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'Accept': 'application/json'
        },
        signal: controller.signal
    })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok') {
                backendAvailable = true;
            } else {
                backendAvailable = false;
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            backendAvailable = false;
        });
    
    // Initialize calculator and FAQ
    initCalculator();
    initFAQ();
    
    // Character counter for message field
    const messageInput = document.getElementById('message');
    const messageCount = document.getElementById('messageCount');
    if (messageInput && messageCount) {
        messageInput.addEventListener('input', () => {
            const length = messageInput.value.length;
            messageCount.textContent = `${length} / 2000 characters`;
            if (length > 1800) {
                messageCount.style.color = 'var(--accent-color)';
            } else {
                messageCount.style.color = 'var(--text-light)';
            }
        });
    }
    
    // Test backend connection button
    const testBackendBtn = document.getElementById('testBackendBtn');
    if (testBackendBtn) {
        testBackendBtn.addEventListener('click', async () => {
            testBackendBtn.disabled = true;
            testBackendBtn.textContent = '🔄 Testing...';
            
            const healthUrl = `${API_BASE_URL}/health`;
            const testResult = {
                backendUrl: API_BASE_URL,
                healthUrl: healthUrl,
                hostname: window.location.hostname,
                port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
                protocol: window.location.protocol,
                fullUrl: window.location.href
            };
            
            try {
                // Add timeout for mobile devices
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const response = await fetch(healthUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'ok') {
                    testResult.status = '✅ SUCCESS';
                    testResult.message = 'Backend is connected and working!';
                    testResult.data = data;
                    showNotification('✅ Backend connection successful!', 'success');
                } else {
                    testResult.status = '⚠️ WARNING';
                    testResult.message = 'Backend responded but status is not OK';
                    testResult.data = data;
                    showNotification('⚠️ Backend responded but status is not OK', 'error');
                }
            } catch (error) {
                testResult.status = '❌ ERROR';
                testResult.message = error.message;
                testResult.error = error.toString();
                showNotification('❌ Cannot connect to backend!', 'error');
            }
            
            // Show detailed result in alert
            const resultText = `
🔍 Backend Connection Test Results:

Status: ${testResult.status}
Message: ${testResult.message}

📍 Connection Details:
Backend URL: ${testResult.backendUrl}
Health Check: ${testResult.healthUrl}
Current Page: ${testResult.fullUrl}
Hostname: ${testResult.hostname}
Port: ${testResult.port}
Protocol: ${testResult.protocol}

${testResult.data ? `✅ Response: ${JSON.stringify(testResult.data, null, 2)}` : ''}
${testResult.error ? `❌ Error: ${testResult.error}` : ''}

💡 Tips:
1. Make sure backend is running: cd backend && npm start
2. Check you're on the same WiFi network
3. Try accessing: ${testResult.healthUrl}
            `.trim();
            
            alert(resultText);
            
            testBackendBtn.disabled = false;
            testBackendBtn.textContent = '🔍 Test Backend Connection';
        });
    }
});

// Backend API Configuration
// Auto-detect: use localhost for desktop, or set your computer's local IP for mobile devices
// To find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
// Example: const API_BASE_URL = 'http://192.168.1.7:3000/api';

// Detect if running on mobile device or if accessing from different device
function getBackendURL() {
    // Check if we're on localhost (desktop) or need to use IP (mobile/other devices)
    const hostname = window.location.hostname;
    const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    
    // Debug logging
    console.log('🌐 Detected hostname:', hostname);
    console.log('🌐 Detected port:', port);
    console.log('🌐 Full URL:', window.location.href);
    
    // Use relative URL - frontend is served from backend on same port
    // This avoids CORS issues on mobile devices
    const url = '/api';
    
    console.log('✅ Using backend URL (relative):', url);
    console.log('✅ Full URL will be:', window.location.origin + url);
    
    return url;
}

const API_BASE_URL = getBackendURL();
console.log('🔗 API_BASE_URL:', API_BASE_URL);

// Update debug info in page
document.addEventListener('DOMContentLoaded', () => {
    // Debug info removed
});

// Check if backend is available (will be checked on first request)
let backendAvailable = true;

// Backend API Functions

// Save message to backend API
async function saveMessageToBackend(messageData) {
    // Use absolute URL for fetch
    const url = API_BASE_URL.startsWith('/') 
        ? `${window.location.origin}${API_BASE_URL}/messages`
        : `${API_BASE_URL}/messages`;
    
    console.log('📤 Attempting to save message to:', url);
    console.log('📤 Full URL:', url);
    console.log('📤 Message data:', messageData);
    
    // Show loading state
    // Sending message (no notification)
    
    const requestBody = {
        timestamp: messageData.timestamp,
        data: messageData.data,
        read: false
    };
    
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
    
    // Try primary URL first, then fallback if needed
    const trySave = async (urlToTry, isFallback = false) => {
        // Add timeout for mobile devices
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            const response = await fetch(urlToTry, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestBody),
                mode: 'cors', // Explicit CORS mode
                credentials: 'omit', // Don't send cookies
                signal: controller.signal,
                cache: 'no-cache',
                redirect: 'follow'
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    };
    
    try {
        const response = await trySave(url);
        
        console.log('📥 Response received');
        console.log('📥 Response status:', response.status);
        console.log('📥 Response statusText:', response.statusText);
        console.log('📥 Response ok:', response.ok);
        
        // Get response text first to see what we got
        const responseText = await response.text();
        console.log('📥 Response text:', responseText);
        
        if (!response.ok) {
            console.error('❌ Error response:', responseText);
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
            }
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Invalid JSON response: ' + responseText);
        }
        
        console.log('✅ Message saved to backend:', result);
        backendAvailable = true;
        return result;
    } catch (error) {
        console.error('❌ Error saving to backend:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ URL tried:', url);
        
        // More detailed error for user
        let userErrorMessage = 'Error saving message please try again';
        
        if (error.name === 'AbortError') {
            userErrorMessage = 'Request timeout. Server took too long to respond. ';
            userErrorMessage += 'Check: 1) Server running 2) Network connection';
        } else if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Load failed') || error.message.includes('Failed to fetch'))) {
            userErrorMessage = 'Cannot connect to server. ';
            userErrorMessage += '\n\nPossible causes:\n';
            userErrorMessage += '1. Server not available\n';
            userErrorMessage += '2. Network connection issue\n';
        } else {
            userErrorMessage = error.message || 'Unknown error';
        }
        
        backendAvailable = false;
        throw new Error(userErrorMessage);
    }
}

// Get all messages from backend API
async function getAllMessagesFromDatabase() {
    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch messages');
        }
        
        const messages = await response.json();
        backendAvailable = true;
        return messages;
    } catch (error) {
        console.error('Error reading from backend:', error);
        backendAvailable = false;
        throw error;
    }
}

// Update message read status via backend API
async function updateMessageReadStatus(id, read) {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ read: read })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update message');
        }
        
        backendAvailable = true;
        return true;
    } catch (error) {
        console.error('Error updating message status:', error);
        backendAvailable = false;
        throw error;
    }
}

// Delete message via backend API
async function deleteMessageFromDatabase(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete message');
        }
        
        backendAvailable = true;
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        backendAvailable = false;
        throw error;
    }
}

// Fallback: Save to localStorage
function saveMessageToLocalStorage(timestamp, formData) {
    try {
        const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
        submissions.push({
            id: Date.now(), // Generate ID
            timestamp: timestamp,
            data: formData,
            read: false
        });
        // Keep only last 1000 submissions
        if (submissions.length > 1000) {
            submissions.shift();
        }
        localStorage.setItem('formSubmissions', JSON.stringify(submissions));
    } catch (e) {
        console.error('Could not save to localStorage:', e);
    }
}

// Fallback: Get all messages from localStorage
function getAllMessagesFromLocalStorage() {
    try {
        const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
        const readMessages = JSON.parse(localStorage.getItem('readMessages') || '[]');
        
        // Mark messages as read based on readMessages array
        return submissions.map(msg => ({
            ...msg,
            read: readMessages.includes(msg.id) || readMessages.includes(msg.timestamp)
        }));
    } catch (e) {
        console.error('Could not load from localStorage:', e);
        return [];
    }
}

// Fallback: Update read status in localStorage
function updateMessageReadStatusLocalStorage(id, read) {
    try {
        const readMessages = JSON.parse(localStorage.getItem('readMessages') || '[]');
        if (read && !readMessages.includes(id)) {
            readMessages.push(id);
            localStorage.setItem('readMessages', JSON.stringify(readMessages));
        } else if (!read && readMessages.includes(id)) {
            const filtered = readMessages.filter(msgId => msgId !== id);
            localStorage.setItem('readMessages', JSON.stringify(filtered));
        }
    } catch (e) {
        console.error('Could not update read status:', e);
    }
}

// Fallback: Delete message from localStorage
function deleteMessageFromLocalStorage(id) {
    try {
        const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
        const filtered = submissions.filter(s => s.id !== id && s.timestamp !== id);
        localStorage.setItem('formSubmissions', JSON.stringify(filtered));
        
        // Remove from read messages too
        const readMessages = JSON.parse(localStorage.getItem('readMessages') || '[]');
        const filteredRead = readMessages.filter(msgId => msgId !== id);
        localStorage.setItem('readMessages', JSON.stringify(filteredRead));
    } catch (e) {
        console.error('Could not delete from localStorage:', e);
    }
}

// Add active class to nav link based on scroll position
const sections = document.querySelectorAll('section[id]');

function activateNavLink() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', activateNavLink);

// Add active class styling
const style = document.createElement('style');
style.textContent = `
    .nav-link.active {
        color: var(--primary-color);
    }
    .nav-link.active::after {
        width: 100%;
    }
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15);
        animation: shake 0.3s ease;
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1.2rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 320px;
        font-size: 0.95rem;
        line-height: 1.5;
        word-wrap: break-word;
    }
    .notification.show {
        transform: translateX(0);
    }
    .notification.success {
        background: var(--primary-color);
        color: white;
        border-left: 4px solid var(--primary-dark);
    }
    .notification.error {
        background: var(--accent-color);
        color: white;
        border-left: 4px solid #c0392b;
    }
    @media (max-width: 768px) {
        .notification {
            right: 15px;
            left: 15px;
            max-width: none;
            top: 80px;
            transform: translateY(-100px);
        }
        .notification.show {
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
