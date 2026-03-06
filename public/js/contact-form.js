/**
 * Contact form submit: sanitize, validate, rate limit, save to backend, reset, notifications.
 */

import { saveMessageToBackend } from './api.js';
import {
    sanitizeInput,
    validateFormData,
    checkRateLimit,
    recordSubmission,
    showNotification,
    MIN_SUBMISSION_INTERVAL
} from './utils.js';

export function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const serviceInput = document.getElementById('service');
        const regionInput = document.getElementById('region');
        const messageInput = document.getElementById('message');

        [nameInput, emailInput, phoneInput, serviceInput, regionInput, messageInput].forEach((input) => {
            if (input) {
                input.classList.remove('error', 'valid');
                if (input.id === 'phone') {
                    const wrapper = input.closest('.phone-input-wrapper');
                    if (wrapper) wrapper.classList.remove('error', 'valid');
                }
            }
        });

        const rateLimitCheck = checkRateLimit();
        if (!rateLimitCheck.allowed) {
            showNotification(rateLimitCheck.message, 'error');
            return;
        }

        let phoneValue = phoneInput?.value ? sanitizeInput(phoneInput.value.trim()) : '';
        if (phoneValue) {
            phoneValue = phoneValue.replace(/^(\+353|00353|\+353\s*)/i, '').replace(/^0/, '');
            phoneValue = '+353 ' + phoneValue;
        }

        const formData = {
            name: sanitizeInput(nameInput?.value ?? ''),
            email: sanitizeInput(emailInput?.value ?? ''),
            phone: phoneValue,
            service: serviceInput?.value ?? '',
            region: regionInput?.value ?? '',
            message: sanitizeInput(messageInput?.value ?? '')
        };

        const validationErrors = validateFormData(formData);
        if (validationErrors.length > 0) {
            const firstError = validationErrors[0];
            showNotification(firstError.message, 'error');
            const fieldMap = {
                name: nameInput,
                email: emailInput,
                phone: phoneInput,
                service: serviceInput,
                region: regionInput,
                message: messageInput
            };
            validationErrors.forEach((err) => {
                if (fieldMap[err.field]) fieldMap[err.field].classList.add('error');
            });
            const firstEl = fieldMap[firstError.field];
            if (firstEl) {
                firstEl.focus({ preventScroll: false });
                const liveRegion = document.getElementById('form-error-announcer');
                if (liveRegion) liveRegion.textContent = firstError.message;
            }
            return;
        }

        recordSubmission();
        const messageData = { timestamp: Date.now(), data: formData, read: false };

        const submitButton = contactForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending…';
        }
        const formLiveRegion = document.getElementById('form-error-announcer');
        if (formLiveRegion) formLiveRegion.textContent = '';

        saveMessageToBackend(messageData)
            .then(() => {
                showNotification('Thank you for your message! We will get back to you soon.', 'success');
                contactForm.reset();
                [nameInput, emailInput, phoneInput, serviceInput, regionInput, messageInput].forEach((input) => {
                    if (input) {
                        input.classList.remove('error', 'valid');
                        input.style.borderColor = '';
                        input.style.boxShadow = '';
                        if (input.id === 'phone') {
                            const wrapper = input.closest('.phone-input-wrapper');
                            if (wrapper) {
                                wrapper.classList.remove('error', 'valid');
                                wrapper.style.borderColor = '';
                                wrapper.style.boxShadow = '';
                            }
                        }
                    }
                });
                const emailValidationMessage = document.getElementById('emailValidationMessage');
                const phoneValidationMessage = document.getElementById('phoneValidationMessage');
                if (emailValidationMessage) {
                    emailValidationMessage.textContent = '';
                    emailValidationMessage.className = 'email-validation-message';
                    emailValidationMessage.classList.remove('error', 'success');
                    emailValidationMessage.style.display = 'none';
                }
                if (phoneValidationMessage) {
                    phoneValidationMessage.textContent = '';
                    phoneValidationMessage.className = 'phone-validation-message';
                    phoneValidationMessage.classList.remove('error', 'success');
                    phoneValidationMessage.style.display = 'none';
                }
                const messageCount = document.getElementById('messageCount');
                if (messageCount) {
                    messageCount.textContent = '0 / 2000 characters';
                    messageCount.style.color = 'var(--text-light)';
                }
                if (submitButton) {
                    submitButton.textContent = 'Send Message';
                    setTimeout(() => { submitButton.disabled = false; }, MIN_SUBMISSION_INTERVAL);
                }
                if (formLiveRegion) formLiveRegion.textContent = '';
            })
            .catch((error) => {
                console.error('Error saving message:', error);
                if (submitButton) {
                    submitButton.textContent = 'Send Message';
                    submitButton.disabled = false;
                }
                let msg = "We couldn't send your message. Please check your connection and try again.";
                if (error.message && (error.message.includes('timeout') || error.message.includes('Too many'))) {
                    msg = error.message;
                }
                showNotification(msg, 'error');
            });
    });
}
