const BASE_SIZE = 10;

const selectors = {
  footer: '.footer',
  jumboTitle: '.footer__jumbo-title',
}

const cssVariables = {
  jumboTitleFontSize: '--jumboTitleFontSize'
}

const footers = document.querySelectorAll(selectors.footer);

footers.forEach(footer => {
  const jumboTitle = footer.querySelector(selectors.jumboTitle);
  if (!jumboTitle) return;

  const container = footer;

  function resizeTitle() {
    const containerW = container.clientWidth;
    if (!containerW) return;

    const clone = jumboTitle.cloneNode(true);
    Object.assign(clone.style, {
      position: 'absolute',
      left: '-9999px',
      visibility: 'hidden',
      whiteSpace: 'nowrap',
      fontSize: BASE_SIZE + 'px',
      width: 'auto',
      maxWidth: 'none'
    });
    container.appendChild(clone);
    const textW = clone.scrollWidth || 1;
    clone.remove();

    const targetPx = BASE_SIZE * (containerW / textW);
    const vw = (targetPx / window.innerWidth) * 100;

    jumboTitle.style.setProperty(cssVariables.jumboTitleFontSize, vw + 'vw');
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resizeTitle);
  } else {
    resizeTitle();
  }

  window.addEventListener('resize', resizeTitle);
  new ResizeObserver(resizeTitle).observe(container);
});
