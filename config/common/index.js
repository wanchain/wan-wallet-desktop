import CHAN from './channels'

export const WDS_PORT = 7000
export const isDev = process.env.NODE_ENV === 'development' 
export const STATIC_PATH = '/static'

export const APP_ROOT = 'root'
export const APP_NAME = 'Wan Wallet'

export const LANGUAGES = ['en', 'zh']
export const FALLBACK_LANG = 'en'
export const NAMESPACE = 'translation'

export const BIP44PATH = {
    WAN: "m/44'/5718350'/0'/0/"
}

export const CHANNELS = CHAN