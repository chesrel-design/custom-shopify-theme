import { breakpoints } from './constants.js';

const selectors = {
    imagesContainer: '[data-product-images-container]',
    thumbnailsContainer: '[data-product-images-thumbnails]',
    thumbnailsButton: '[data-product-images-thumbnails-button]',
    thumbnailsList: '[data-product-images-thumbnails-list]',
    currentImageWrapper: '[data-product-images-current-image-wrapper]',
    thumbnail: '.product__thumbnail',
    thumbnailImage: '.product__thumbnail-image',
    currentImage: '.product__current-image',
    zoomButton: '[data-open-zoom-button]'
};

const cssVariables = {
    currentImageHeight: '--currentImageHeight'
};

const dataValues = {
    thumbnailsButton: {
        first: 'first',
        second: 'second'
    }
};

const cssClasses = {
    hidden: 'display-none',
    disabled: 'product__thumbnails-button--disabled',
    thumbnailSelected: 'product__thumbnail--selected'
};

const eventNames = {
    selectMedia: 'product:select-media',
    mediaSelected: 'product:media-selected'
};

const SCROLL_TOLERANCE = 1;

const imagesContainers = document.querySelectorAll(selectors.imagesContainer);

imagesContainers.forEach(imagesContainer => {
    const thumbnailsContainer = imagesContainer.querySelector(selectors.thumbnailsContainer);
    const thumbnailsButtons = thumbnailsContainer?.querySelectorAll(selectors.thumbnailsButton) || [];
    const thumbnailsList = thumbnailsContainer?.querySelector(selectors.thumbnailsList);
    const currentImageWrapper = imagesContainer.querySelector(selectors.currentImageWrapper);
    const zoomButton = imagesContainer.querySelector(selectors.zoomButton);
    const currentImage = currentImageWrapper?.querySelector(selectors.currentImage);
    const thumbnails = thumbnailsList?.querySelectorAll(selectors.thumbnail) || [];

    if (!thumbnailsContainer || !thumbnailsList || thumbnailsButtons.length === 0 || !currentImageWrapper || !currentImage || thumbnails.length === 0) {
        return;
    }

    const buttonAttributeName = selectors.thumbnailsButton.slice(1, -1);
    const tabletMedia = window.matchMedia(`(max-width: ${breakpoints.tablet}px)`);
    let activeThumbnail;

    function isDesktop() {
        return !tabletMedia.matches;
    }

    function setCssHeightVar() {
        if (isDesktop()) {
            const imageHeight = currentImageWrapper.getBoundingClientRect().height;
            if (imageHeight > 0) {
                thumbnailsContainer.style.setProperty(cssVariables.currentImageHeight, imageHeight + 'px');
                thumbnailsList.scrollTop = 0;
            }
        }
        else {
            thumbnailsContainer.style.removeProperty(cssVariables.currentImageHeight);
            thumbnailsList.scrollLeft = 0;
        }
    }

    function scrollByStep(button) {
        const direction = button.getAttribute(buttonAttributeName);
        if (!direction) return;

        const firstThumbnail = thumbnailsList.firstElementChild;
        if (!firstThumbnail) return;

        const step = isDesktop()
            ? firstThumbnail.getBoundingClientRect().height
            : firstThumbnail.getBoundingClientRect().width;

        if (step <= 0) return;

        if (isDesktop()) {
            thumbnailsList.scrollBy({
                top: direction === dataValues.thumbnailsButton.first ? -step : step,
                behavior: 'smooth'
            });
        }
        else {
            thumbnailsList.scrollBy({
                left: direction === dataValues.thumbnailsButton.first ? -step : step,
                behavior: 'smooth'
            });
        }

        updateButtonsState();
    }

    function updateButtonsVisibility() {
        const hasOverflow = isDesktop()
            ? thumbnailsList.scrollHeight > thumbnailsList.clientHeight
            : thumbnailsList.scrollWidth > thumbnailsList.clientWidth;

        thumbnailsButtons.forEach(button => {
            button.classList.toggle(cssClasses.hidden, !hasOverflow);
        });
    }

    function setButtonDisabledState(button, isDisabled) {
        button.classList.toggle(cssClasses.disabled, isDisabled);
        button.disabled = isDisabled;
        if (isDisabled) {
            button.setAttribute('aria-disabled', 'true');
        }
        else {
            button.removeAttribute('aria-disabled');
        }
    }

    function updateButtonsState() {
        if (isDesktop()) {
            const maxScroll = thumbnailsList.scrollHeight - thumbnailsList.clientHeight;

            thumbnailsButtons.forEach(button => {
                const direction = button.getAttribute(buttonAttributeName);
                if (direction === dataValues.thumbnailsButton.first) {
                    const isDisabled = thumbnailsList.scrollTop <= SCROLL_TOLERANCE;
                    setButtonDisabledState(button, isDisabled);
                }
                else if (direction === dataValues.thumbnailsButton.second) {
                    const isDisabled = thumbnailsList.scrollTop >= maxScroll - SCROLL_TOLERANCE;
                    setButtonDisabledState(button, isDisabled);
                }
            });
        }
        else {
            const maxScroll = thumbnailsList.scrollWidth - thumbnailsList.clientWidth;

            thumbnailsButtons.forEach(button => {
                const direction = button.getAttribute(buttonAttributeName);
                if (direction === dataValues.thumbnailsButton.first) {
                    const isDisabled = thumbnailsList.scrollLeft <= SCROLL_TOLERANCE;
                    setButtonDisabledState(button, isDisabled);
                }
                else if (direction === dataValues.thumbnailsButton.second) {
                    const isDisabled = thumbnailsList.scrollLeft >= maxScroll - SCROLL_TOLERANCE;
                    setButtonDisabledState(button, isDisabled);
                }
            });
        }
    }

    function selectThumbnail(thumbnail) {
        if (activeThumbnail) {
            activeThumbnail.classList.remove(cssClasses.thumbnailSelected);
            activeThumbnail.removeAttribute('aria-current');
        }
        thumbnail.classList.add(cssClasses.thumbnailSelected);
        thumbnail.setAttribute('aria-current', 'true');
        activeThumbnail = thumbnail;
        const thumbnailImage = thumbnail.querySelector(selectors.thumbnailImage);
        const html = thumbnailImage.innerHTML;
        currentImage.innerHTML = html;
        if (zoomButton) {
            zoomButton.setAttribute('data-open-zoom-image-tag', html);
        }
        const mediaId = thumbnailImage.getAttribute('data-media-id');
        if (mediaId) {
            currentImage.setAttribute('data-media-id', mediaId);
            document.dispatchEvent(new CustomEvent(eventNames.mediaSelected, {
                detail: { mediaId }
            }));
        }
    }

    function findThumbnailByMediaId(mediaId) {
        if (!mediaId) return null;
        const normalizedId = String(mediaId);
        return Array.from(thumbnails).find(thumbnail => thumbnail.querySelector(selectors.thumbnailImage).getAttribute('data-media-id') === normalizedId) || null;
    }

    function selectThumbnailByMediaId(mediaId) {
        const thumbnail = findThumbnailByMediaId(mediaId);
        if (!thumbnail) {
            return false;
        }
        selectThumbnail(thumbnail);
        thumbnail.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        updateButtonsState();
        return true;
    }

    function setup() {
        setCssHeightVar();
        updateButtonsVisibility();
        updateButtonsState();

        if (isDesktop() && activeThumbnail) {
        activeThumbnail.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
    }

    thumbnailsButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled || button.classList.contains(cssClasses.disabled)) {
                return;
            }
            scrollByStep(button);
        });
    });

    thumbnailsList.addEventListener('scroll', updateButtonsState);

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            selectThumbnail(thumbnail);
        });
    });

    tabletMedia.addEventListener('change', setup);

    const imageObserver = new ResizeObserver(() => {
        setup();
    });
    imageObserver.observe(currentImageWrapper);

    selectThumbnail(thumbnails[0]);
    setup();

    document.addEventListener(eventNames.selectMedia, event => {
        const mediaId = event.detail?.mediaId;
        if (!mediaId) return;
        selectThumbnailByMediaId(mediaId);
    });
});
