/**
 * Validation, sanitization, rate limiting, notifications and injected styles.
 */

export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    let sanitized = div.innerHTML;
    sanitized = sanitized
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '')
        .trim();
    return sanitized;
}

export function validateFormData(formData) {
    const errors = [];
    const dangerousPatterns = /<script|javascript:|onerror=|onload=|eval\(|document\.cookie/i;

    if (!formData.name || formData.name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    }
    if (formData.name && formData.name.length > 100) {
        errors.push({ field: 'name', message: 'Name is too long (max 100 characters)' });
    }
    if (dangerousPatterns.test(formData.name)) {
        errors.push({ field: 'name', message: 'Invalid characters detected in name' });
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (formData.email && formData.email.length > 254) {
        errors.push({ field: 'email', message: 'Email is too long' });
    }

    if (formData.phone) {
        const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
        const irishPhoneRegex = /^(\+353|00353|0)?[1-9]\d{7,9}$/;
        if (cleanPhone.length < 8 || cleanPhone.length > 15) {
            errors.push({ field: 'phone', message: 'Phone number must be between 8 and 15 digits' });
        } else if (!irishPhoneRegex.test(cleanPhone)) {
            errors.push({ field: 'phone', message: 'Please enter a valid Irish phone number' });
        } else if (formData.phone.length > 20) {
            errors.push({ field: 'phone', message: 'Phone number is too long (max 20 characters)' });
        }
    }

    const allowedServices = ['residential', 'commercial', 'bulk', 'recycling'];
    if (!formData.service || !allowedServices.includes(formData.service)) {
        errors.push({ field: 'service', message: 'Please select a valid service' });
    }
    if (!formData.region || formData.region.trim() === '') {
        errors.push({ field: 'region', message: 'Please select a Dublin region' });
    }
    if (!formData.message || formData.message.trim().length < 10) {
        errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
    }
    if (formData.message && formData.message.length > 2000) {
        errors.push({ field: 'message', message: 'Message is too long (max 2000 characters)' });
    }
    if (dangerousPatterns.test(formData.message)) {
        errors.push({ field: 'message', message: 'Invalid characters detected in message' });
    }
    return errors;
}

export const MIN_SUBMISSION_INTERVAL = 5000;
const MAX_SUBMISSIONS_PER_HOUR = 10;
let lastSubmission = 0;
const submissionTimes = [];

export function checkRateLimit() {
    const now = Date.now();
    if (now - lastSubmission < MIN_SUBMISSION_INTERVAL) {
        const remainingTime = Math.ceil((MIN_SUBMISSION_INTERVAL - (now - lastSubmission)) / 1000);
        return { allowed: false, message: `Please wait ${remainingTime} seconds before submitting again.` };
    }
    const oneHourAgo = now - (60 * 60 * 1000);
    while (submissionTimes.length > 0 && submissionTimes[0] < oneHourAgo) {
        submissionTimes.shift();
    }
    if (submissionTimes.length >= MAX_SUBMISSIONS_PER_HOUR) {
        return { allowed: false, message: 'Too many submissions. Please try again later.' };
    }
    return { allowed: true };
}

export function recordSubmission() {
    const now = Date.now();
    lastSubmission = now;
    submissionTimes.push(now);
}

export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    if (message.includes('\n')) {
        message.split('\n').forEach((line) => {
            const div = document.createElement('div');
            div.style.marginBottom = '0.3rem';
            if (/^[\s]*[✅❌⚠️]/.test(line.trim())) div.style.fontWeight = 'bold';
            div.textContent = line;
            notification.appendChild(div);
        });
    } else {
        notification.textContent = message;
    }
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    const duration = type === 'error' ? 8000 : 4000;
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) document.body.removeChild(notification);
        }, 300);
    }, duration);
}

const INJECTED_STYLES = `
    .nav-link.active { color: var(--primary-color); }
    .nav-link.active::after { width: 100%; }
    .form-group input.error, .form-group select.error, .form-group textarea.error {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15);
        animation: shake 0.3s ease;
    }
    .form-group input.valid {
        border-color: #27ae60;
        box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.15);
    }
    .email-validation-message, .phone-validation-message {
        display: none; margin-top: 0.5rem; font-size: 0.875rem;
        min-height: 0; height: auto; transition: all 0.3s ease; overflow: hidden;
    }
    .email-validation-message:not(:empty), .phone-validation-message:not(:empty) { display: block; }
    .email-validation-message.error, .phone-validation-message.error { color: var(--accent-color); }
    .email-validation-message.success, .phone-validation-message.success { color: #27ae60; font-weight: 500; }
    .phone-input-wrapper {
        display: flex; align-items: stretch; border: 2px solid #e9ecef; border-radius: 8px;
        background-color: #ffffff; transition: all 0.3s ease; overflow: hidden; margin: 0;
    }
    .phone-input-wrapper:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.15);
    }
    .phone-input-wrapper.error { border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15); }
    .phone-input-wrapper.valid { border-color: #27ae60; box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.15); }
    .phone-prefix {
        display: flex; align-items: center; padding: 0.875rem 1rem; background-color: #f8f9fa;
        color: var(--text-dark); font-weight: 600; border-right: 2px solid #e9ecef;
        border-radius: 8px 0 0 8px; white-space: nowrap; font-size: 1rem; margin: 0; line-height: 1.5;
    }
    .phone-input-wrapper input {
        flex: 1; border: none; outline: none; padding: 0.875rem 1rem; margin: 0; font-size: 1rem;
        background: transparent; min-width: 0; border-radius: 0 8px 8px 0;
    }
    .phone-input-wrapper input:focus { box-shadow: none; }
    .phone-input-wrapper input::placeholder { color: #adb5bd; }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    .notification {
        position: fixed; top: 100px; right: 20px; padding: 1.2rem 1.5rem; border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2); z-index: 10000; transform: translateX(400px);
        transition: transform 0.3s ease; max-width: 320px; font-size: 0.95rem; line-height: 1.5; word-wrap: break-word;
    }
    .notification.show { transform: translateX(0); }
    .notification.success { background: var(--primary-color); color: white; border-left: 4px solid var(--primary-dark); }
    .notification.error { background: var(--accent-color); color: white; border-left: 4px solid #c0392b; }
    @media (max-width: 768px) {
        .notification { right: 15px; left: 15px; max-width: none; top: 80px; transform: translateY(-100px); }
        .notification.show { transform: translateY(0); }
    }
`;

export function injectStyles() {
    const style = document.createElement('style');
    style.textContent = INJECTED_STYLES;
    document.head.appendChild(style);
}
