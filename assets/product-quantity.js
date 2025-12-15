(function () {
  function parseInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  function initializeQuantitySelector(container) {
    const input = container.querySelector('[data-quantity-input]');
    if (!input) {
      return;
    }

    const indicator = container.querySelector('[data-quantity-indicator]');
    const buttons = Array.from(container.querySelectorAll('[data-quantity-button]'));

    const minValue = parseInteger(input.getAttribute('min'), 1);
    const stepValue = Math.max(parseInteger(input.getAttribute('step'), 1), 1);
    const maxAttribute = input.getAttribute('max');
    const maxValue = maxAttribute !== null ? parseInteger(maxAttribute, null) : null;

    function clampValue(value) {
      let clamped = Number.isNaN(value) ? minValue : value;
      clamped = Math.max(clamped, minValue);
      if (maxValue !== null) {
        clamped = Math.min(clamped, maxValue);
      }
      return clamped;
    }

    function updateIndicator(value) {
      if (indicator) {
        indicator.textContent = String(value);
      }
    }

    function setValue(value, options) {
      const { emitEvents = true } = options || {};
      const clampedValue = clampValue(value);
      const previousValue = input.value;
      input.value = clampedValue;
      updateIndicator(clampedValue);
      if (emitEvents && previousValue !== String(clampedValue)) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    function modifyQuantity(direction) {
      const currentValue = clampValue(parseInteger(input.value, minValue));
      const delta = direction === 'increase' ? stepValue : -stepValue;
      setValue(currentValue + delta);
    }

    buttons.forEach(button => {
      const direction = button.getAttribute('data-quantity-button');
      if (!direction) {
        return;
      }
      button.addEventListener('click', () => {
        modifyQuantity(direction);
      });
    });

    input.addEventListener('change', () => {
      setValue(parseInteger(input.value, minValue), { emitEvents: false });
    });

    setValue(parseInteger(input.value, minValue), { emitEvents: false });
  }

  function initializeProductQuantities() {
    const selectors = document.querySelectorAll('[data-quantity-selector]');
    selectors.forEach(container => {
      initializeQuantitySelector(container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProductQuantities);
  } else {
    initializeProductQuantities();
  }
})();
