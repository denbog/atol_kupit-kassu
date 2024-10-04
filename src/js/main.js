import '@/scss/main.scss'
//import '@tarekraafat/autocomplete.js/dist/css/autoComplete.css'

import Tabby from 'tabbyjs'
import tingle from 'tingle.js'
import { MaskInput } from "maska"
import autoComplete from "@tarekraafat/autocomplete.js"
import Cookies from 'js-cookie'

new MaskInput('input[name="phone"]', { mask: "+7 (###) ###-##-##" })

if (document.querySelector('[data-tabs]')) {
    new Tabby('[data-tabs]')
}

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

/*const header = document.querySelector('header')

document.addEventListener("scroll", (event) => {
    header.classList.toggle('is-fixed', window.scrollY > 300)
})*/

let formModal
let productModal
let productSelected = ''


const openForm = (type = 'default') => {
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
    if (productModal) {
        productModal.close()
    }
    
    document.querySelectorAll('#form-callback [data-type]').forEach((item) => {
        item.classList.toggle('hide', type !== item.getAttribute('data-type'))
    })

    formModal.open()
}

const closest = (function () {
    const el = HTMLElement.prototype,
        matches =
            el.matches ||
            el.webkitMatchesSelector ||
            el.mozMatchesSelector ||
            el.msMatchesSelector;

    return function closest(el, selector) {
        return matches.call(el, selector)
            ? el
            : el.parentElement
                ? closest(el.parentElement, selector)
                : null;
    };
})();

const live = function (selector, eventType, callback, context) {
    (context || document).addEventListener(eventType, function (event) {
        const listener = closest(event.target, selector);

        if (listener) {
            callback.call(listener, event);
        }
    });
};

live('.js-open-form', 'click', (event) => {
    event.preventDefault()

    openForm(event.target.getAttribute('data-type') || 'default')
})

document.querySelectorAll('.js-buy-set').forEach((el) => {
    el.addEventListener('click', (event) => {
        event.preventDefault()

        let products = []

        closest(el, '.row').querySelectorAll('[data-key]').forEach((item) => {
            const id = 'product-'+item.getAttribute('data-key')
            const tpl = document.getElementById(id)

            products.push(tpl.getAttribute('data-name'))
        })

        productSelected = products.join(", ")
        openForm()
    })
})

document.querySelectorAll('.js-product').forEach((el) => {
    el.addEventListener('click', (event) => {
        event.preventDefault()

        const tpl = document.querySelector(event.currentTarget.getAttribute('href'))
        const className = 'tingle-' + tpl.getAttribute('data-type')

        productSelected = tpl.getAttribute('data-name')

        productModal = new tingle.modal({
            closeMethods: ['overlay', 'button', 'escape'],
            closeLabel: "Закрыть",
            cssClass: [className],
            onOpen: function () {
                setTimeout(() => productModal.checkOverflow(), 500)
            },
            onClose: function () {
                productModal.destroy()
                productModal = null
            }
        })

        productModal.setContent(tpl.content.cloneNode(true))
        productModal.open()
    })
})

document.querySelector('#form-callback form').addEventListener('submit', (event) => {
    event.preventDefault()
})

window.onSubmit = async function (token) 
{
    const form = document.querySelector('#form-callback form')
    if (!form.checkValidity()) {
        form.classList.add('js-validity')
        grecaptcha.reset()
        return
    }

    const formData = new FormData(form)

    formData.set('question', (formData.get('question') ? formData.get('question') + "\n\n" : '') + "КУПИ КАССУ")
    formData.set('product', productSelected)
    formData.set('g-recaptcha-response', token)
    formData.set('clientid', Cookies.get('_ym_uid') || '')
    formData.set('back_url', window.location.href)

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
        grecaptcha.reset()
    } else {
        form.classList.add('hide')
        document.querySelector('#form-callback .js-form-success').classList.remove('hide')
    }
}