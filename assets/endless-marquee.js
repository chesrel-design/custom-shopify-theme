const marquees = document.querySelectorAll('.marquee')

function adaptMarquees() {

    marquees.forEach(marquee => {

        const list = marquee.querySelector('.marquee__list')
        var totalWidth = list.scrollWidth
        var childrenAmount = marquee.children.length

        while (marquee.clientWidth * 2 > totalWidth || childrenAmount < 2) {
            const clone = list.cloneNode(true)
            clone.style.animation = `marquee 30s linear infinite`;
            clone.setAttribute('aria-hidden', 'true')
            marquee.appendChild(clone)
            totalWidth = marquee.scrollWidth
            childrenAmount = marquee.children.length
        }

        list.style.animation = `marquee 30s linear infinite`
    })

}

adaptMarquees()

window.addEventListener('resize', ()=> {
    adaptMarquees()
})