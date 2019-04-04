const i18n =  require('i18next')
const backend = require('i18next-node-fs-backend')
const { LANGUAGES, FALLBACK_LANG } = require('../common')

export const i18nOptions = {
    backend: {
        // path where resources get loaded from
        loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
        // path to post missing resources
        addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json',
        // jsonIndent to use when storing json files
        jsonIndent: 2
    },
    interpolation: {
        escapeValue: false,
        // prefix: '__', 
        // suffix: '__'
    },
    saveMissing: true,
    fallbackLng: FALLBACK_LANG,
    whitelist: LANGUAGES,
    react: {
        wait: false
    }
}

i18n
    .use(backend)

export default i18n

