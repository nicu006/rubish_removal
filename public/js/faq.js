/**
 * FAQ accordion.
 */

export function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question');
        if (!question) return;
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach((faqItem) => faqItem.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
}
