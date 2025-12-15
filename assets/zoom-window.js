import { breakpoints } from './constants.js'

const selectors = {
    openZoom: {
        button: '[data-open-zoom-button]',
        imageTag: 'data-open-zoom-image-tag'
    },

    zoomWindow: {
        dialog: '.zoom-window',
        image: '[data-zoom-window-image]',
        buttons: {
            zoomIn: '[data-zoom-window-zoom-in]',
            zoomOut: '[data-zoom-window-zoom-out]'
        }
    }
}

const zoomWindow = document.querySelector(selectors.zoomWindow.dialog);

document.querySelectorAll(selectors.openZoom.button).forEach(openButton => {
    openButton.onclick = () => {
        zoomWindow.showModal()

        const imageTag = openButton.getAttribute(selectors.openZoom.imageTag);

        const zoomWindowImageWrapper = zoomWindow.querySelector(selectors.zoomWindow.image);
        zoomWindowImageWrapper.innerHTML = imageTag;
        const zoomWindowImage = zoomWindowImageWrapper.querySelector('img');

        if (window.innerWidth > breakpoints.tablet) {
            const controls = {};

            controls.zoomIn = zoomWindow.querySelector(selectors.zoomWindow.buttons.zoomIn);
            controls.zoomOut = zoomWindow.querySelector(selectors.zoomWindow.buttons.zoomOut);

            let currentZoom = 1;
            zoomWindowImage.style.transform = `scale(${currentZoom})`;

            controls.zoomIn.onclick = () => {
                if (currentZoom < 4) {
                    currentZoom += 0.4;
                    zoomWindowImage.style.transform = `scale(${currentZoom})`;
                }
            };

            controls.zoomOut.onclick = () => {
                if (currentZoom > 1) {
                    currentZoom -= 0.4;
                    zoomWindowImage.style.transform = `scale(${currentZoom})`;
                }
            };

            zoomWindowImage.onmousemove = (event) => {
                const rect = zoomWindowImage.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                let percentX = (x / rect.width) * 100;
                let percentY = (y / rect.height) * 100;

                const buffer = 10;

                percentX = Math.max(buffer, Math.min(100 - buffer, percentX));
                percentY = Math.max(buffer, Math.min(100 - buffer, percentY));

                zoomWindowImage.style.transformOrigin = `${percentX}% ${percentY}%`;
            };


        }
    }
})