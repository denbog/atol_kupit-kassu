import '@/scss/main.scss'

import tingle from 'tingle.js'
import baguetteBox from 'baguettebox.js'
import { MaskInput } from "maska"

const header = document.querySelector('header')

document.addEventListener("scroll", (event) => {
    header.classList.toggle('is-fixed', window.scrollY > 300)
})

new MaskInput('input[name="phone"]', { mask: "+7 (###) ###-##-##" })

let formModal;
document.querySelectorAll('.js-open-form').forEach((el) => {
    el.addEventListener('click', (event) => {
        event.preventDefault()

        if (!formModal) {
            formModal = new tingle.modal({
                closeMethods: ['overlay', 'button', 'escape'],
                closeLabel: "Закрыть",
                cssClass: ['tingle-popup'],
                onClose: function () {
                    formModal.close();
                }
            })

            formModal.setContent(document.getElementById('form-callback'))
        }

        formModal.open()
    })
})

document.querySelector('#form-callback form').addEventListener('submit', async (event) => {
    event.preventDefault()

    const form = event.currentTarget

    let response = await fetch('/bitrix/services/main/ajax.php?mode=ajax&c=atol:form.checkout&action=submit', {
        method: 'POST',
		headers: {
			"X-Bitrix-Csrf-Token": window.csrfToken || ''
		},
        body: new FormData(form)
    });
  
    let result = await response.json();
    console.log(form)

    if ('error' == result.status) {
        document.querySelector('#form-callback .js-form-error').classList.remove('hide')
    } else {
        form.classList.add('hide')
        document.querySelector('#form-callback .js-form-success').classList.remove('hide')
    }
})