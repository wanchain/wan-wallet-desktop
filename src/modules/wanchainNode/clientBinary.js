import EventEmitter from 'events'

const trigger = new EventEmitter()

const init = (msg) => {
    console.log('init event fired!!!')
    console.log(msg)
    trigger.emit('advice', `${msg} is great!!!`)
}

trigger.on('init', init)

export default trigger