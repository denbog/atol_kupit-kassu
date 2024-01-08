import '@/scss/main.scss'
//import '@tarekraafat/autocomplete.js/dist/css/autoComplete.css'

import tingle from 'tingle.js'
import { MaskInput } from "maska"
import autoComplete from "@tarekraafat/autocomplete.js"
import Cookies from 'js-cookie'

const header = document.querySelector('header')

document.addEventListener("scroll", (event) => {
    header.classList.toggle('is-fixed', window.scrollY > 300)
})

new MaskInput('input[name="phone"]', { mask: "+7 (###) ###-##-##" })

const autoCompleteJS = new autoComplete({
    selector: 'input[name="city"]',
    debounce: 500,
    threshold: 2,
    searchEngine: 'loose',
    data: {
        src: async (query) => {
            try {
                const resp = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                    method: 'post',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Token 4808f665f589bfae7380e2f522dff85fe8d80ef3'
                    },
                    body: JSON.stringify({
                        query: query,
                        from_bound: { value: "city" },
                        to_bound: { value: "city" }  
                    })
                })

                const json = await resp.json()

                return json.suggestions
            } catch (error) {
                return error
            }
        },
        keys: ['value']
    },
    events: {
        input: {
            focus: (event) => {
                console.log("Input Field in focus!");
            }
        }
    }
})

autoCompleteJS.input.addEventListener('selection', function (event) {
    const selection = event.detail.selection.value

    autoCompleteJS.input.blur()
    autoCompleteJS.input.value = selection.value

    document.querySelector('input[name="place"]').value = selection.data.region_with_type || ''
})

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
    const formData = new FormData(form)

    formData.set('question', (formData.get('question') ? formData.get('question')+"\n\n" : '')+"КУПИ КАССУ")
    formData.set('clientid', Cookies.get('_ym_uid') || '')

    let response = await fetch('/bitrix/services/main/ajax.php?mode=ajax&c=atol:form.landing&action=submit', {
        method: 'POST',
		headers: {
			"X-Bitrix-Csrf-Token": window.csrfToken || ''
		},
        body: formData
    });
  
    let result = await response.json()

    if ('error' == result.status) {
        document.querySelector('#form-callback .js-form-error').classList.remove('hide')
    } else {
        form.classList.add('hide')
        document.querySelector('#form-callback .js-form-success').classList.remove('hide')
    }
})