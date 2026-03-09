/**
 * Custom dropdown replacement for native <select> elements.
 * Builds a styled dropdown that syncs its value with the hidden native select.
 */

export function initCustomSelects() {
    document.querySelectorAll('.form-group select').forEach(buildDropdown);

    // Close all dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });
}

function buildDropdown(select) {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown';

    // Trigger
    const trigger = document.createElement('div');
    trigger.className = 'custom-dropdown__trigger';
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.textContent = select.options[0]?.text || 'Select';

    // Options list
    const list = document.createElement('ul');
    list.className = 'custom-dropdown__list';
    list.setAttribute('role', 'listbox');

    Array.from(select.options).forEach((opt, i) => {
        const li = document.createElement('li');
        li.className = 'custom-dropdown__item';
        li.setAttribute('role', 'option');
        li.setAttribute('data-value', opt.value);
        li.textContent = opt.text;

        if (!opt.value) li.classList.add('placeholder');

        li.addEventListener('click', (e) => {
            e.stopPropagation();
            if (li.classList.contains('placeholder')) return;

            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));

            trigger.textContent = opt.text;
            trigger.classList.add('has-value');

            list.querySelectorAll('.custom-dropdown__item').forEach(el => el.classList.remove('selected'));
            li.classList.add('selected');

            wrapper.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        });

        list.appendChild(li);
    });

    // Toggle open/close
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            if (d !== wrapper) d.classList.remove('open');
        });
        const opening = !wrapper.classList.contains('open');
        wrapper.classList.toggle('open');
        trigger.setAttribute('aria-expanded', opening);
    });

    // Keyboard support
    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
        if (e.key === 'Escape') { wrapper.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }
        if (wrapper.classList.contains('open')) {
            const items = [...list.querySelectorAll('.custom-dropdown__item:not(.placeholder)')];
            const cur = items.findIndex(el => el.classList.contains('selected'));
            if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(cur + 1, items.length - 1)]?.click(); }
            if (e.key === 'ArrowUp')   { e.preventDefault(); items[Math.max(cur - 1, 0)]?.click(); }
        }
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(list);
    select.parentNode.insertBefore(wrapper, select.nextSibling);
}

/** Reset all custom dropdowns back to placeholder state */
export function resetCustomSelects() {
    document.querySelectorAll('.custom-dropdown').forEach(wrapper => {
        const select = wrapper.previousElementSibling;
        if (!select || select.tagName !== 'SELECT') return;
        const trigger = wrapper.querySelector('.custom-dropdown__trigger');
        trigger.textContent = select.options[0]?.text || 'Select';
        trigger.classList.remove('has-value');
        wrapper.querySelectorAll('.custom-dropdown__item').forEach(el => el.classList.remove('selected'));
        wrapper.classList.remove('open');
    });
}
