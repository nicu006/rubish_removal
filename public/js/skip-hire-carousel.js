/**
 * Horizontal scroll for skip hire cards: drag (mouse), wheel → horizontal, touch native.
 * Smooth scroll + snap-to-card after drag when motion is allowed.
 */

const DRAG_THRESHOLD_PX = 4;

function isInteractiveTarget(target) {
    return Boolean(
        target.closest('a[href], button, input, textarea, select, label, [role="button"]')
    );
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function snapCarouselToNearestCard(el) {
    const cards = el.querySelectorAll('.skip-hire-card');
    if (!cards.length) return;
    let bestLeft = 0;
    let bestDist = Infinity;
    cards.forEach((card) => {
        const left = card.offsetLeft;
        const dist = Math.abs(el.scrollLeft - left);
        if (dist < bestDist) {
            bestDist = dist;
            bestLeft = left;
        }
    });
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    el.scrollTo({ left: bestLeft, behavior });
}

export function initSkipHireCarouselDrag() {
    const el = document.querySelector('.skip-hire-cards');
    if (!el) return;

    let activePointerId = null;
    let startX = 0;
    let startScrollLeft = 0;
    let isDragging = false;

    el.addEventListener(
        'click',
        (e) => {
            if (el.dataset.suppressClick === '1') {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        true
    );

    /** Vertical wheel (and trackpad) → smooth horizontal scroll */
    el.addEventListener(
        'wheel',
        (e) => {
            const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (dx === 0) return;
            const max = el.scrollWidth - el.clientWidth;
            if (max <= 0) return;
            const next = el.scrollLeft + dx;
            if ((next <= 0 && el.scrollLeft <= 0) || (next >= max && el.scrollLeft >= max)) {
                return;
            }
            e.preventDefault();
            const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
            const clamped = Math.max(0, Math.min(max, next));
            el.scrollTo({ left: clamped, behavior });
        },
        { passive: false }
    );

    function onDocPointerMove(e) {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        const dx = e.clientX - startX;
        if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
            isDragging = true;
            el.classList.add('skip-hire-cards--is-dragging');
        }
        if (isDragging) {
            el.scrollLeft = startScrollLeft - dx;
            e.preventDefault();
        }
    }

    function onDocPointerEnd(e) {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        const pid = activePointerId;
        const wasDrag = isDragging;
        activePointerId = null;
        isDragging = false;
        el.classList.remove('skip-hire-cards--is-dragging');
        document.removeEventListener('pointermove', onDocPointerMove);
        document.removeEventListener('pointerup', onDocPointerEnd);
        document.removeEventListener('pointercancel', onDocPointerEnd);
        try {
            el.releasePointerCapture(pid);
        } catch {
            /* ignore */
        }
        if (wasDrag) {
            snapCarouselToNearestCard(el);
            el.dataset.suppressClick = '1';
            setTimeout(() => {
                delete el.dataset.suppressClick;
            }, 0);
        }
    }

    el.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        if (isInteractiveTarget(e.target)) return;

        activePointerId = e.pointerId;
        startX = e.clientX;
        startScrollLeft = el.scrollLeft;
        isDragging = false;
        document.addEventListener('pointermove', onDocPointerMove);
        document.addEventListener('pointerup', onDocPointerEnd);
        document.addEventListener('pointercancel', onDocPointerEnd);
        try {
            el.setPointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
    });
}
