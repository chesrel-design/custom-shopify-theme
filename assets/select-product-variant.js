const selectors = {
    variantData: '#product-variants',
    productSection: '.product',
    productForm: 'form[data-product-form]',
    fallbackForm: 'form',
    optionInputs: 'input[type="radio"][data-option-position]',
    variantIdInput: '[data-variant-id-input]',
    addToCartButton: '[data-product-atc-button]',
    addToCartText: '[data-product-atc-text]',
    priceElement: '.product__atc-button-price',
    quantityInput: '[data-quantity-input]',
    optionItem: '[data-option-item]'
};

const dataAttrs = {
    optionPosition: 'data-option-position',
    selectedClass: 'selectedClass',
    disabledClass: 'disabledClass',
    disabledButtonClass: 'disabledClass',
    availableText: 'availableText',
    unavailableText: 'unavailableText',
    moneyFormat: 'data-money-format'
};

const events = {
    selectMedia: 'product:select-media',
    mediaSelected: 'product:media-selected'
};

function initProductVariantSelector() {
    const variantDataElement = document.querySelector(selectors.variantData);
    if (!variantDataElement) return;

    const rawVariantData = variantDataElement.textContent.trim();
    if (!rawVariantData) return;

    let variants;
    try {
        variants = JSON.parse(rawVariantData);
    } catch (error) {
        console.error('Failed to parse product variants JSON.', error);
        return;
    }
    if (!Array.isArray(variants) || variants.length === 0) return;

    const productSection = document.querySelector(selectors.productSection);
    if (!productSection) return;

    const productForm =
        productSection.querySelector(selectors.productForm) ||
        productSection.querySelector(selectors.fallbackForm);
    if (!productForm) return;

    const optionInputs = Array.from(productForm.querySelectorAll(selectors.optionInputs));
    if (optionInputs.length === 0) return;

    const variantIdInput = productForm.querySelector(selectors.variantIdInput);
    if (!variantIdInput) return;

    const addToCartButton = productForm.querySelector(selectors.addToCartButton);
    const addToCartDisabledClass = addToCartButton?.dataset[dataAttrs.disabledButtonClass] || '';
    const addToCartText = addToCartButton?.querySelector(selectors.addToCartText) || null;
    const priceElement = productForm.querySelector(selectors.priceElement);
    const quantityInput = productForm.querySelector(selectors.quantityInput);
    const moneyFormat = variantDataElement.getAttribute(dataAttrs.moneyFormat) || '';
    const optionInputsByPosition = new Map();
    const optionMetadataByPosition = new Map();
    const optionPositions = [];

    optionInputs.forEach(input => {
        const position = Number(input.getAttribute(dataAttrs.optionPosition));
        if (!Number.isNaN(position)) {
            if (!optionInputsByPosition.has(position)) {
                optionInputsByPosition.set(position, []);
                optionPositions.push(position);
            }
            optionInputsByPosition.get(position).push(input);
            if (!optionMetadataByPosition.has(position)) {
                const optionFieldset = input.closest('[data-product-option-fieldset]');
                const optionName = optionFieldset?.dataset?.optionName || '';
                optionMetadataByPosition.set(position, { name: optionName });
            }
        }
    });

    if (optionPositions.length === 0) return;
    optionPositions.sort((a, b) => a - b);

    const hasAvailableVariant = variants.some(variant => Boolean(variant?.available));
    let currentVariantId = null;
    let currentVariant = null;
    let currentMediaId = null;

    function parseSelectionFromInputs() {
        const selection = {};
        optionInputs.forEach(input => {
            if (input.checked) {
                const position = input.getAttribute(dataAttrs.optionPosition);
                selection[position] = input.value;
            }
        });
        return selection;
    }

    function resolveVariant(selection) {
        const selectionEntries = Object.entries(selection).filter(([, value]) => value);
        const selectedPositions = selectionEntries.map(([position]) => Number(position));

        const matchingAvailableVariant = variants.find(variant => {
            if (!variant?.available) return false;
            return selectedPositions.every(position => {
                const key = `option${position}`;
                const expectedValue = selection[String(position)];
                return expectedValue ? variant[key] === expectedValue : true;
            });
        });
        if (matchingAvailableVariant) return matchingAvailableVariant;

        const preferMatchedPositions = (currentMatchedPositions = [], candidateMatchedPositions = []) => {
            const candidateMatchesColor = candidateMatchedPositions.some(position => isColorOption(position));
            const currentMatchesColor = currentMatchedPositions.some(position => isColorOption(position));
            if (candidateMatchesColor === currentMatchesColor) return false;
            return candidateMatchesColor && !currentMatchesColor;
        };

        let bestAvailableMatch = null;
        variants.forEach(variant => {
            if (!variant?.available) return;

            const matchedPositions = selectedPositions.filter(position => {
                const key = `option${position}`;
                const expectedValue = selection[String(position)];
                if (!expectedValue) return false;
                return variant[key] === expectedValue;
            });
            const matchCount = matchedPositions.length;
            if (matchCount === 0) return;

            const shouldUpdateBestMatch =
                !bestAvailableMatch ||
                matchCount > bestAvailableMatch.count ||
                (matchCount === bestAvailableMatch.count &&
                    preferMatchedPositions(bestAvailableMatch.matchedPositions, matchedPositions));

            if (shouldUpdateBestMatch) {
                bestAvailableMatch = { variant, count: matchCount, matchedPositions };
            }
        });
        if (bestAvailableMatch && bestAvailableMatch.count > 0) {
            return bestAvailableMatch.variant;
        }

        const firstAvailableVariant = variants.find(variant => Boolean(variant?.available));
        if (firstAvailableVariant) return firstAvailableVariant;

        const matchingVariant = variants.find(variant => {
            return selectedPositions.every(position => {
                const key = `option${position}`;
                const expectedValue = selection[String(position)];
                return expectedValue ? variant[key] === expectedValue : true;
            });
        });
        if (matchingVariant) return matchingVariant;

        return variants[0] || null;
    }

    function applyVariantToInputs(variant) {
        if (!variant) return;
        optionPositions.forEach(position => {
            const key = `option${position}`;
            const value = variant[key];
            const inputs = optionInputsByPosition.get(position) || [];
            inputs.forEach(input => {
                input.checked = input.value === value;
            });
        });
    }

    function buildSelectionFromVariant(variant) {
        const selection = {};
        if (!variant) return selection;
        optionPositions.forEach(position => {
            const key = `option${position}`;
            if (variant[key]) {
                selection[String(position)] = variant[key];
            }
        });
        return selection;
    }

    function normalizeOptionName(name) {
        return (name || '').trim().toLowerCase();
    }

    function isColorOption(position) {
        const metadata = optionMetadataByPosition.get(position);
        if (!metadata?.name) return false;
        const normalizedName = normalizeOptionName(metadata.name);
        return normalizedName === 'color' || normalizedName === 'colour';
    }

    function getAvailableValues(position, selection) {
        const availableVariants = variants.filter(variant => {
            if (!variant?.available) return false;
            return optionPositions.every(otherPosition => {
                if (otherPosition === position) return true;
                const key = `option${otherPosition}`;
                const selectionValue = selection[String(otherPosition)];
                if (!selectionValue) return true;
                return variant[key] === selectionValue;
            });
        });
        const values = availableVariants
            .map(variant => variant[`option${position}`])
            .filter(Boolean);
        return Array.from(new Set(values));
    }

    function updateOptionAvailability(selection) {
        optionPositions.forEach(position => {
            const inputs = optionInputsByPosition.get(position) || [];
            const availableValues = getAvailableValues(position, selection);
            const hasAvailableValues = availableValues.length > 0;

            inputs.forEach(input => {
                const value = input.value;
                const isAvailable = hasAvailableValues ? availableValues.includes(value) : false;
                let shouldDisable = hasAvailableValues ? !isAvailable : !hasAvailableVariant;

                if (shouldDisable && isColorOption(position)) {
                    shouldDisable = false;
                }

                input.disabled = shouldDisable;
            });
        });
    }

    function updateOptionItemStates() {
        optionInputs.forEach(input => {
            const optionItem = input.closest(selectors.optionItem);
            if (!optionItem) return;
            const selectedClass = optionItem.dataset[dataAttrs.selectedClass];
            const disabledClass = optionItem.dataset[dataAttrs.disabledClass];
            if (selectedClass) {
                optionItem.classList.toggle(selectedClass, input.checked);
            }
            if (disabledClass) {
                optionItem.classList.toggle(disabledClass, input.disabled);
            }
        });
    }

    function updateVariantId(variant) {
        if (!variantIdInput) return;
        variantIdInput.value = variant ? variant.id : '';
    }

    function formatMoney(amountInCents) {
        const amount = Number(amountInCents);
        if (Number.isNaN(amount)) return '';

        if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
            return Shopify.formatMoney(amount, moneyFormat || Shopify.money_format);
        }

        const format = moneyFormat || '$ {{amount}}';
        const amountValue = (amount / 100).toFixed(2);
        const amountNoDecimals = Math.round(amount / 100).toString();
        const amountWithComma = amountValue.replace('.', ',');
        const amountNoDecimalsComma = amountNoDecimals.replace('.', ',');

        return format
            .replace(/{{\s*amount_no_decimals_with_comma_separator\s*}}/g, amountNoDecimalsComma)
            .replace(/{{\s*amount_no_decimals\s*}}/g, amountNoDecimals)
            .replace(/{{\s*amount_with_comma_separator\s*}}/g, amountWithComma)
            .replace(/{{\s*amount\s*}}/g, amountValue);
    }

    function getQuantityValue() {
        if (!quantityInput) return 1;
        const parsedValue = Number.parseInt(quantityInput.value, 10);
        if (Number.isNaN(parsedValue) || parsedValue < 1) return 1;
        return parsedValue;
    }

    function updatePrice(variant) {
        if (!priceElement) return;
        if (!variant) {
            priceElement.textContent = '';
            return;
        }
        const quantity = getQuantityValue();
        const totalPrice = Number.isFinite(quantity) ? variant.price * quantity : variant.price;
        priceElement.textContent = formatMoney(totalPrice);
    }

    function updateAddToCart(variant) {
        if (!addToCartButton) return;
        const availableText = addToCartButton.dataset[dataAttrs.availableText] || addToCartButton.textContent.trim();
        const unavailableText = addToCartButton.dataset[dataAttrs.unavailableText] || availableText;
        const isAvailable = Boolean(variant?.available);

        addToCartButton.disabled = !isAvailable;
        if (isAvailable) {
            addToCartButton.removeAttribute('aria-disabled');
        } else {
            addToCartButton.setAttribute('aria-disabled', 'true');
        }

        if (addToCartDisabledClass) {
            addToCartButton.classList.toggle(addToCartDisabledClass, !isAvailable);
        }

        if (addToCartText) {
            addToCartText.textContent = isAvailable ? availableText : unavailableText;
        }
    }

    function getVariantMediaId(variant) {
        if (!variant) return null;
        if (variant.featured_media?.id) return variant.featured_media.id;
        if (variant.featured_image?.id) return variant.featured_image.id;
        if (variant.image_id) return variant.image_id;
        return null;
    }

    function updateMedia(variant, force = false) {
        const mediaId = getVariantMediaId(variant);
        if (!mediaId) return;
        if (!force && String(mediaId) === String(currentMediaId)) return;
        currentMediaId = mediaId;
        document.dispatchEvent(new CustomEvent(events.selectMedia, {
            detail: { mediaId }
        }));
    }

    function updateVariant(variant, { forceMediaUpdate = false } = {}) {
        currentVariantId = variant ? variant.id : null;
        currentVariant = variant || null;
        if (!variant) currentMediaId = null;
        applyVariantToInputs(variant);
        const selection = buildSelectionFromVariant(variant);
        updateOptionAvailability(selection);
        updateOptionItemStates();
        updateVariantId(variant);
        updateAddToCart(variant);
        updatePrice(variant);
        updateMedia(variant, forceMediaUpdate);
    }

    function handleSelectionChange() {
        const selection = parseSelectionFromInputs();
        const resolvedVariant = resolveVariant(selection);
        if (!resolvedVariant) {
            updateVariant(null, { forceMediaUpdate: true });
            return;
        }
        const variantChanged = String(resolvedVariant.id) !== String(currentVariantId);
        updateVariant(resolvedVariant, { forceMediaUpdate: variantChanged });
    }

    function handleQuantityChange() {
        const triggerUpdate = () => {
            updatePrice(currentVariant);
        };
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(triggerUpdate);
        } else {
            setTimeout(triggerUpdate, 0);
        }
    }

    optionInputs.forEach(input => {
        input.addEventListener('change', handleSelectionChange);
    });

    if (quantityInput) {
        ['change', 'input'].forEach(eventName => {
            quantityInput.addEventListener(eventName, handleQuantityChange);
        });
    }

    document.addEventListener(events.mediaSelected, event => {
        const mediaId = event.detail?.mediaId;
        if (!mediaId) return;
        currentMediaId = mediaId;
    });

    handleSelectionChange();
}

document.addEventListener('DOMContentLoaded', initProductVariantSelector);
