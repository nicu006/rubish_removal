/**
 * Entry point: inits nav, form, FAQ, animations; health check; live validation; test backend.
 */

import { API_BASE_URL, setBackendAvailable } from './config.js';
import { initNavScroll } from './nav-scroll.js';
import { initContactForm } from './contact-form.js';
import { initFAQ } from './faq.js';
import { initAnimations } from './animations.js';
import { showNotification, injectStyles } from './utils.js';

injectStyles();

document.addEventListener('DOMContentLoaded', () => {
    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    initNavScroll();
    initAnimations();
    initFAQ();
    initContactForm();

    // Track visitor
    const visitorUrl = API_BASE_URL.startsWith('/')
        ? `${window.location.origin}${API_BASE_URL}/visitors`
        : `${API_BASE_URL}/visitors`;
    fetch(visitorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            page: window.location.pathname,
            referrer: document.referrer || ''
        })
    }).catch(() => { /* silent fail */ });

    const healthUrl = API_BASE_URL.startsWith('/') 
        ? `${window.location.origin}${API_BASE_URL}/health`
        : `${API_BASE_URL}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: { Accept: 'application/json' },
        signal: controller.signal
    })
        .then((response) => {
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then((data) => {
            setBackendAvailable(data.status === 'ok');
        })
        .catch(() => {
            clearTimeout(timeoutId);
            setBackendAvailable(false);
        });

    // Live email validation
    const emailInput = document.getElementById('email');
    const emailValidationMessage = document.getElementById('emailValidationMessage');
    if (emailInput && emailValidationMessage) {
        let emailValidationTimeout;
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        function validateEmailLive(email) {
            emailInput.classList.remove('valid', 'error');
            emailValidationMessage.className = 'email-validation-message';
            if (email.length === 0) {
                emailValidationMessage.textContent = '';
                emailValidationMessage.style.display = 'none';
                return;
            }
            emailValidationMessage.style.display = 'block';
            if (email.length > 254) {
                emailInput.classList.add('error');
                emailValidationMessage.textContent = 'Email is too long (max 254 characters)';
                emailValidationMessage.classList.add('error');
                return;
            }
            if (!emailRegex.test(email)) {
                emailInput.classList.add('error');
                emailValidationMessage.textContent = 'Please enter a valid email address';
                emailValidationMessage.classList.add('error');
                return;
            }
            emailInput.classList.add('valid');
            emailValidationMessage.textContent = '✓ Valid email address';
            emailValidationMessage.classList.add('success');
        }

        emailInput.addEventListener('input', () => {
            clearTimeout(emailValidationTimeout);
            const email = emailInput.value.trim();
            if (email === '') {
                emailInput.classList.remove('valid', 'error');
                emailValidationMessage.textContent = '';
                emailValidationMessage.className = 'email-validation-message';
                emailValidationMessage.style.display = 'none';
                return;
            }
            emailValidationMessage.style.display = 'block';
            emailValidationTimeout = setTimeout(() => validateEmailLive(email), 300);
        });
        emailInput.addEventListener('blur', () => {
            clearTimeout(emailValidationTimeout);
            if (emailInput.value.trim() !== '') validateEmailLive(emailInput.value.trim());
        });
    }

    // Live phone validation
    const phoneInput = document.getElementById('phone');
    const phoneValidationMessage = document.getElementById('phoneValidationMessage');
    const phoneWrapper = phoneInput ? phoneInput.closest('.phone-input-wrapper') : null;
    if (phoneInput && phoneValidationMessage) {
        let phoneValidationTimeout;
        const irishPhoneRegex = /^0?[1-9]\d{7,9}$/;

        function validatePhoneLive(phone) {
            if (phoneWrapper) phoneWrapper.classList.remove('valid', 'error');
            phoneInput.classList.remove('valid', 'error');
            phoneValidationMessage.className = 'phone-validation-message';
            if (phone.length === 0) {
                phoneValidationMessage.textContent = '';
                phoneValidationMessage.style.display = 'none';
                return;
            }
            phoneValidationMessage.style.display = 'block';
            const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
            if (phone.length > 15) {
                if (phoneWrapper) phoneWrapper.classList.add('error');
                phoneInput.classList.add('error');
                phoneValidationMessage.textContent = 'Phone number is too long';
                phoneValidationMessage.classList.add('error');
                return;
            }
            if (cleanPhone.length < 8 || cleanPhone.length > 10) {
                if (phoneWrapper) phoneWrapper.classList.add('error');
                phoneInput.classList.add('error');
                phoneValidationMessage.textContent = 'Phone number must be 8-10 digits (e.g., 85 123 4567)';
                phoneValidationMessage.classList.add('error');
                return;
            }
            if (!irishPhoneRegex.test(cleanPhone)) {
                if (phoneWrapper) phoneWrapper.classList.add('error');
                phoneInput.classList.add('error');
                phoneValidationMessage.textContent = 'Please enter a valid Irish phone number (e.g., 85 123 4567)';
                phoneValidationMessage.classList.add('error');
                return;
            }
            if (phoneWrapper) phoneWrapper.classList.add('valid');
            phoneInput.classList.add('valid');
            phoneValidationMessage.textContent = '✓ Valid Irish phone number';
            phoneValidationMessage.classList.add('success');
        }

        phoneInput.addEventListener('keypress', (e) => {
            if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                (e.keyCode === 65 && e.ctrlKey) || (e.keyCode === 67 && e.ctrlKey) ||
                (e.keyCode === 86 && e.ctrlKey) || (e.keyCode === 88 && e.ctrlKey)) return;
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 32) {
                e.preventDefault();
            }
        });
        phoneInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const filtered = paste.replace(/[^0-9\s]/g, '').substring(0, 13);
            phoneInput.value = filtered;
            phoneInput.dispatchEvent(new Event('input'));
        });
        phoneInput.addEventListener('input', (e) => {
            let value = phoneInput.value.replace(/[^0-9]/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            let formatted = '';
            if (value.length > 0) {
                if (value.startsWith('0') && value.length > 3) {
                    formatted = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6);
                } else if (value.length > 3) {
                    formatted = value.substring(0, 2) + ' ' + value.substring(2, 5) + ' ' + value.substring(5);
                } else if (value.length > 2) {
                    formatted = value.substring(0, 2) + ' ' + value.substring(2);
                } else {
                    formatted = value;
                }
            }
            phoneInput.value = formatted;
            clearTimeout(phoneValidationTimeout);
            const phone = phoneInput.value.trim();
            if (phone === '') {
                if (phoneWrapper) phoneWrapper.classList.remove('valid', 'error');
                phoneInput.classList.remove('valid', 'error');
                phoneValidationMessage.textContent = '';
                phoneValidationMessage.className = 'phone-validation-message';
                phoneValidationMessage.style.display = 'none';
                return;
            }
            phoneValidationMessage.style.display = 'block';
            phoneValidationTimeout = setTimeout(() => validatePhoneLive(phone), 300);
        });
        phoneInput.addEventListener('blur', () => {
            clearTimeout(phoneValidationTimeout);
            if (phoneInput.value.trim() !== '') validatePhoneLive(phoneInput.value.trim());
        });
    }

    // Message character counter
    const messageInput = document.getElementById('message');
    const messageCount = document.getElementById('messageCount');
    if (messageInput && messageCount) {
        messageInput.addEventListener('input', () => {
            const length = messageInput.value.length;
            messageCount.textContent = `${length} / 2000 characters`;
            messageCount.style.color = length > 1800 ? 'var(--accent-color)' : 'var(--text-light)';
        });
    }

    // Test backend button
    const testBackendBtn = document.getElementById('testBackendBtn');
    if (testBackendBtn) {
        testBackendBtn.addEventListener('click', async () => {
            testBackendBtn.disabled = true;
            testBackendBtn.textContent = '🔄 Testing...';
            const healthUrl = API_BASE_URL.startsWith('/')
                ? `${window.location.origin}${API_BASE_URL}/health`
                : `${API_BASE_URL}/health`;
            const testResult = {
                backendUrl: API_BASE_URL,
                healthUrl,
                hostname: window.location.hostname,
                port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
                protocol: window.location.protocol,
                fullUrl: window.location.href
            };
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const response = await fetch(healthUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
            const resultText = `
🔍 Backend Connection Test Results:
Status: ${testResult.status}
Message: ${testResult.message}
📍 Backend URL: ${testResult.backendUrl}
Health: ${testResult.healthUrl}
Page: ${testResult.fullUrl}
${testResult.data ? `✅ Response: ${JSON.stringify(testResult.data, null, 2)}` : ''}
${testResult.error ? `❌ Error: ${testResult.error}` : ''}
💡 Make sure backend is running: cd backend && npm start
            `.trim();
            alert(resultText);
            testBackendBtn.disabled = false;
            testBackendBtn.textContent = '🔍 Test Backend Connection';
        });
    }
});
