/**
 * Mobile nav, navbar scroll state, progress bar, section highlighting, smooth scroll, back-to-top.
 */

let scrollTick = false;

function getScrollHeight() {
    const d = document.documentElement;
    return d.scrollHeight - d.clientHeight;
}

let cachedScrollHeight = 0;
window.addEventListener('resize', () => { cachedScrollHeight = 0; });

function onScrollTick() {
    scrollTick = false;
    const scrollY = window.pageYOffset;
    const navbar = document.querySelector('.navbar');
    const scrollProgress = document.getElementById('scrollProgress');
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionBounds = window.__sectionBounds || [];

    if (navbar) {
        if (scrollY > 100) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }
    if (scrollProgress) {
        if (cachedScrollHeight <= 0) cachedScrollHeight = getScrollHeight();
        const pct = cachedScrollHeight > 0 ? (scrollY / cachedScrollHeight) * 100 : 0;
        scrollProgress.style.transform = 'scaleX(' + (pct / 100) + ')';
    }
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        if (scrollY > 300) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');
    }
    function hrefMatchesSection(href, sectionId) {
        if (!href || !sectionId) return false;
        const hashIdx = href.indexOf('#');
        const hash = hashIdx >= 0 ? href.slice(hashIdx + 1) : '';
        return hash === sectionId;
    }

    let found = false;
    for (let i = 0; i < sectionBounds.length; i++) {
        const b = sectionBounds[i];
        if (scrollY > b.top && scrollY <= b.top + b.height) {
            navLinks.forEach((link) => {
                link.classList.toggle('active', hrefMatchesSection(link.getAttribute('href'), b.id));
            });
            found = true;
            break;
        }
    }
    if (!found) navLinks.forEach((link) => link.classList.remove('active'));
}

function scrollThrottle() {
    if (!scrollTick) {
        scrollTick = true;
        requestAnimationFrame(onScrollTick);
    }
}

function initServicesDropdown() {
    const dropdowns = document.querySelectorAll('.nav-item--dropdown');
    if (!dropdowns.length) return;

    function closeAll(except) {
        dropdowns.forEach((item) => {
            if (item === except) return;
            item.classList.remove('is-open');
            const t = item.querySelector('.nav-dropdown-toggle');
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    }

    dropdowns.forEach((item) => {
        const toggle = item.querySelector('.nav-dropdown-toggle');
        if (!toggle) return;
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = !item.classList.contains('is-open');
            closeAll(open ? item : null);
            item.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });

    document.addEventListener('click', () => {
        closeAll(null);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll(null);
    });
}

export function initNavScroll() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    initServicesDropdown();

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    function closeMobileMenu() {
        if (navMenu) navMenu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    }
    navLinks.forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
    });
    document.querySelectorAll('.nav-sublink').forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
    });

    function updateSectionBounds() {
        window.__sectionBounds = Array.from(sections).map((section) => ({
            id: section.getAttribute('id'),
            top: section.offsetTop - 100,
            height: section.offsetHeight
        }));
    }
    updateSectionBounds();
    window.addEventListener('resize', updateSectionBounds);

    window.addEventListener('scroll', scrollThrottle, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

    const backToTopButton = document.getElementById('backToTop');
    if (backToTopButton) {
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
