const varName = '--headerGroupHeight';
const scrolledPastClass = 'sticky-header-group--scrolled-past'
const headerGroup = document.querySelector('.sticky-header-group');
const headerHeight = headerGroup.offsetHeight;
headerGroup.style.setProperty(varName, `-${headerHeight}px`);

let prevY = window.scrollY;

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.intersectionRatio === 0 && entry.boundingClientRect.top < 0) {
            headerGroup.classList.add(scrolledPastClass);
            window.addEventListener('scroll', onScroll);
        }

        else {
            headerGroup.classList.remove(scrolledPastClass);

            if (window.scrollY === 0) {
                headerGroup.style.setProperty(varName, 'none');
                window.removeEventListener('scroll', onScroll);
            }
        }
    });
}, { threshold: [0] });

observer.observe(headerGroup);

function onScroll() {
    const currentY = window.scrollY;
    if (currentY < prevY) {
        headerGroup.style.setProperty(varName, '0');
    }

    else {
        headerGroup.style.setProperty(varName, `-${headerHeight}px`);
    }
    prevY = currentY;
}
