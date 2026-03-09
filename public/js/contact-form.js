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

    // Image upload handling
    const imageInput = document.getElementById('images');
    const imagePreview = document.getElementById('imagePreview');
    let selectedFiles = [];

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', (e) => {
            handleImageFiles(Array.from(e.target.files));
        });
    }

    // Camera capture handling
    const cameraBtn = document.getElementById('cameraBtn');
    const cameraInput = document.getElementById('cameraInput');
    
    if (cameraBtn && cameraInput) {
        cameraBtn.addEventListener('click', () => {
            cameraInput.click();
        });
        
        cameraInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            // Clone files from camera to prevent invalidation on mobile browsers
            // when input.value is reset
            try {
                const clonedFiles = await Promise.all(files.map(async file => {
                    const arrayBuffer = await file.arrayBuffer();
                    return new File([arrayBuffer], file.name || `photo_${Date.now()}.jpg`, { 
                        type: file.type || 'image/jpeg', 
                        lastModified: file.lastModified || Date.now() 
                    });
                }));
                handleImageFiles(clonedFiles);
            } catch (err) {
                console.error('Error processing camera photo:', err);
                // Fallback: try with original files
                handleImageFiles(files);
            }
            cameraInput.value = ''; // Reset for next capture
        });
    }

    function handleImageFiles(newFiles) {
        // Validate file count
        if (selectedFiles.length + newFiles.length > 5) {
            showNotification('Maximum 5 images allowed', 'error');
            return;
        }
        
        // Validate each file
        for (const file of newFiles) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification(`${file.name} is too large. Max 5MB per image.`, 'error');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                showNotification(`${file.name} is not a supported image format.`, 'error');
                return;
            }
        }
        
        selectedFiles = [...selectedFiles, ...newFiles];
        updateImagePreview();
    }

    function updateImagePreview() {
        if (!imagePreview) return;
        imagePreview.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="preview-remove" data-index="${index}">&times;</button>
                `;
                imagePreview.appendChild(div);
                
                div.querySelector('.preview-remove').addEventListener('click', () => {
                    selectedFiles.splice(index, 1);
                    updateImagePreview();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    function clearImageUpload() {
        selectedFiles = [];
        if (imagePreview) imagePreview.innerHTML = '';
        if (imageInput) imageInput.value = '';
        if (cameraInput) cameraInput.value = '';
    }

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
            submitButton.textContent = selectedFiles.length > 0 ? 'Uploading…' : 'Sending…';
        }
        const formLiveRegion = document.getElementById('form-error-announcer');
        if (formLiveRegion) formLiveRegion.textContent = '';

        saveMessageToBackend(messageData, selectedFiles)
            .then(() => {
                showNotification('Thank you for your message! We will get back to you soon.', 'success');
                contactForm.reset();
                clearImageUpload();
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
