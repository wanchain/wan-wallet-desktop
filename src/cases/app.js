import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
const rootEl = document.getElementById('root');

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            phrase: 'I am just a placeholder :-)',
            has: '',
            status: '',
            address: '',
            balance: 0
        }
    }

    generatePhrase = () => {
        wand.request('phrase_generate', {pwd: 'wanglu123'}, function(err, val) {
            if (err) console.log('error printed inside callback: ', err)
            this.setState({
                phrase: val
            })
        }.bind(this))

    }

    hasPhrase = () => {
        wand.request('phrase_has', function(err, val) {
            if (err) console.log('error printed inside callback: ', err)
            this.setState({
                has: val === true ? 'Yes' : 'No'
            })
        }.bind(this))

    }

    revealPhrase = () => {
        wand.request('phrase_reveal', {pwd: 'wanglu123'}, function(err, val) {
            if (err) console.log('error printed inside callback: ', err)
            this.setState({
                phrase: val
            })
        }.bind(this))

    }

    lockWallet = () => {
        wand.request('wallet_lock', function(err, val) {
            if (err) console.log('error printed inside callback: ', err)
            this.setState({
                status: val === true ? 'Locked' : ''
            })
        }.bind(this))
    }

    unlockWallet = () => {
        wand.request('wallet_unlock', { pwd: 'wanglu123' }, function(err, val) {
            if (err) console.log('error printed inside callback: ', err)
            this.setState({
                status: val === true ? 'Unlocked' : 'Locked'
            })
        }.bind(this))
    }

    getAddress = () => {
        wand.request('address_get', { walletID: 1, chainType: 'WAN', start: 0, end: 2 }, function(err, val) {
            if (err) console.log('error printed inside callback: ', err)
            const address = val.addresses[0].address
            this.setState({
                address: address
            })
        }.bind(this))
    }

    getBalance = () => {
        wand.request('address_balance', { addr: this.state.address }, function(err, val) {
            if (err) console.log('error printed inside callback: ', err)
            this.setState({
                balance: val
            })
        }.bind(this))
    }

    render() {
        return (
            <div>
                <h1>Phrase: {this.state.phrase}</h1>
                <h1>Has phrase: {this.state.has}</h1>
                <h1>Wallet Status: {this.state.status}</h1>
                <h1>Wallet addresses: {this.state.address}</h1>
                <h1>Balance: {this.state.balance}</h1>
                <button onClick={this.generatePhrase}>Generate a phrase !!!</button>
                <button onClick={this.revealPhrase}>Reveal my phrase !!!</button>
                <button onClick={this.hasPhrase}>Has a phrase ???</button>
                <button onClick={this.lockWallet}>Lock my wallet !!!</button>
                <button onClick={this.unlockWallet}>Unlock my wallet !!!</button>
                <button onClick={this.getAddress}>Give me address !!!</button>
                <button onClick={this.getBalance}>Show me my balance !!!</button>
            </div>
        );
    }
}

const wrapApp = AppComponent =>
  <AppContainer>
    <AppComponent />
  </AppContainer>

render(wrapApp(App), rootEl)

if (module.hot) {
  module.hot.accept('./app', () => {
    const NextApp = require('./app').default
		render(wrapApp(NextApp), rootEl)
  })
}
