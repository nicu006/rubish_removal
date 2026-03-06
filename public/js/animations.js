/**
 * Animated counters and IntersectionObserver for fade-in / stats.
 */

export function animateCounter(element, target, duration = 2000) {
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

const observerOptions = { threshold: 0.01, rootMargin: '0px' };

export function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            if (entry.target.classList.contains('stat-number')) {
                const target = entry.target.textContent;
                entry.target.setAttribute('data-target', target);
                entry.target.textContent = '0';
                let value = parseInt(target.replace(/\D/g, ''), 10);
                if (target.includes('K+')) {
                    value = parseInt(target.replace(/\D/g, ''), 10) * 1000;
                }
                animateCounter(entry.target, value);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.service-card, .feature-card, .pricing-card, section');
    const statNumbers = document.querySelectorAll('.stat-number');
    animatedElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        observer.observe(el);
    });
    statNumbers.forEach((stat) => observer.observe(stat));
}
