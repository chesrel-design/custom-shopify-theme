document.querySelectorAll('dialog').forEach(dialog => {

    dialog.addEventListener('click', (event) => {
        if (event.target == dialog) {
            dialog.close()
        }
    })

    dialog.querySelectorAll('a').forEach(link => {

        link.addEventListener('click', ()=> {

            dialog.close()

        })

    })

})