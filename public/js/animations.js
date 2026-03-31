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

const revealSectionOptions = { threshold: 0.08, rootMargin: '0px 0px -24px 0px' };

function observeSectionReveal(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            el.classList.add('is-revealed');
            obs.unobserve(el);
        });
    }, revealSectionOptions);
    obs.observe(el);
}

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

    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach((stat) => observer.observe(stat));

    observeSectionReveal('section.pricing');
    observeSectionReveal('section.coverage');
    observeSectionReveal('section.about');
    observeSectionReveal('section.faq');
    observeSectionReveal('section.contact');

    observeSectionReveal('section.services');
    observeSectionReveal('.why-choose-us');

    const footerEl = document.querySelector('footer.footer');
    if (footerEl) {
        const footerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    footerEl.classList.add('is-revealed');
                    footerObserver.unobserve(footerEl);
                });
            },
            { threshold: 0.06, rootMargin: '0px 0px -16px 0px' }
        );
        footerObserver.observe(footerEl);
    }
}
