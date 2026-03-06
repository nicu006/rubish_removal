/**
 * Price calculator: waste type, amount, urgency, sorting.
 */

export function initCalculator() {
    const wasteTypeSelect = document.getElementById('wasteType');
    const wasteAmountInput = document.getElementById('wasteAmount');
    const wasteAmountRange = document.getElementById('wasteAmountRange');
    const urgencySelect = document.getElementById('urgency');
    const sortingCheckbox = document.getElementById('sorting');
    const calculatedPriceElement = document.getElementById('calculatedPrice');

    if (!wasteTypeSelect || !calculatedPriceElement) return;

    function calculatePrice() {
        const wasteType = wasteTypeSelect.value;
        const amount = parseFloat(wasteAmountInput?.value) || 1;
        const urgency = urgencySelect?.value || 'standard';
        const sorting = sortingCheckbox?.checked || false;

        const basePrices = {
            general: 100,
            furniture: 120,
            appliances: 150,
            garden: 80,
            construction: 130,
            mixed: 110
        };
        const urgencyMultipliers = { standard: 1, priority: 1.3, express: 1.6 };
        let price = (basePrices[wasteType] || 100) * amount;
        price *= urgencyMultipliers[urgency] || 1;
        if (sorting) price += 30;
        price = Math.max(price, 99);
        price = Math.round(price);
        calculatedPriceElement.textContent = price;
    }

    if (wasteAmountRange) {
        wasteAmountRange.addEventListener('input', (e) => {
            if (wasteAmountInput) wasteAmountInput.value = e.target.value;
            calculatePrice();
        });
    }
    if (wasteAmountInput) {
        wasteAmountInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value >= 0.1 && value <= 10) {
                if (wasteAmountRange) wasteAmountRange.value = value;
                calculatePrice();
            }
        });
    }
    wasteTypeSelect.addEventListener('change', calculatePrice);
    if (urgencySelect) urgencySelect.addEventListener('change', calculatePrice);
    if (sortingCheckbox) sortingCheckbox.addEventListener('change', calculatePrice);
    calculatePrice();
}
