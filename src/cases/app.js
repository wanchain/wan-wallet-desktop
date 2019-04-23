import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { BIP44PATH } from '../../config/common'

const rootEl = document.getElementById('root');
const addrOffset = 9

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            phrase: 'I am just a placeholder :-)',
            has: '',
            status: '',
            address: '',
            balance: 0,
            nonce: '',
            accountCreateResult: '',
            accountName: '',
            accountNumber: '',
            txWanNormalResult: ''
        }
    }

    generatePhrase = () => {
        wand.request('phrase_generate', {pwd: 'wanglu123'}, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                phrase: val
            })
        }.bind(this))

    }

    hasPhrase = () => {
        wand.request('phrase_has', function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                has: val === true ? 'Yes' : 'No'
            })
        }.bind(this))

    }

    revealPhrase = () => {
        wand.request('phrase_reveal', {pwd: 'wanglu123'}, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                phrase: val
            })
        }.bind(this))

    }

    lockWallet = () => {
        wand.request('wallet_lock', function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                status: val === true ? 'Locked' : ''
            })
        }.bind(this))
    }

    unlockWallet = () => {
        wand.request('wallet_unlock', { pwd: 'wanglu123' }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                status: val === true ? 'Unlocked' : 'Locked'
            })
        }.bind(this))
    }

    getAddress = () => {
        wand.request('address_get', { walletID: 1, chainType: 'WAN', start: 0, end: 2 }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            console.log(val)
            const address = val.addresses[0].address
            this.setState({
                address: address
            })
        }.bind(this))
    }

    getBalance = () => {
        wand.request('address_balance', { addr: this.state.address }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                balance: val
            })
        }.bind(this))
    }

    getNonce = () => {
        wand.request('address_getNonce', { addr: `0x${this.state.address}`, chainType: 'WAN' }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                nonce: val
            })
        }.bind(this))
    }

    createAccount = () => {
        wand.request('account_create', { walletID: 1, path: `${BIP44PATH.WAN}${addrOffset}`, meta: {name: `WanAccount_${addrOffset}`} }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                accountCreateResult: val === false ? 'Failed': 'Succeed'
            })
        }.bind(this))
    }

    getAccount = () => {
        wand.request('account_get', { walletID: 1, path: `${BIP44PATH.WAN}${addrOffset}` }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                accountName: val.name 
            })
        }.bind(this))
    }

    getAccounts = () => {
        wand.request('account_getAll', { chainID: 5718350 }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            console.log(val)
            this.setState({
                accountNumber: val.length
            })
        }.bind(this))
    }

    updateAccount = () => {

        wand.request('account_update', { walletID: 1, path: `${BIP44PATH.WAN}${addrOffset}`, meta: {name: `I have a new name again`} }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            this.setState({
                accountCreateResult: val === false ? 'Failed': 'Succeed'
            })
        }.bind(this))
    }

    deleteAccount = () => {
        wand.request('account_delete', { walletID: 1, path: `${BIP44PATH.WAN}${addrOffset}` }, function(err, val) {
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            console.log(val)
            this.setState({
                accountDeleteResult: val === false ? 'Failed': 'Succeed'
            })
        }.bind(this))
    }

    txNormal = () => {
        wand.request('transaction_normal', { 
            walletID: 1, 
            chainType: 'WAN',
            symbol: 'WAN',  
            path: `${BIP44PATH.WAN}${0}`,
            // from: '0xa1e7f6c21b7441626e0b37d40d352475b17c425a', 
            to: '0xe8adbf32deb5899763c57e45f8edc70b218bd904', 
            amount: 0.02, 
            gasPrice: 200, 
            gasLimit: 200000 
        }, function(err, val) {
            console.log('here')
            if (err) { 
                console.log('error printed inside callback: ', err)
                return
            }
            console.log(val)
            this.setState({
                txWanNormalResult: val.code === false ? 'Failed': 'Succeed',
                txWanNormalHash: val.result
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
                <h1>Nonce: {this.state.nonce}</h1>
                <h1>AccountCreateResult: {this.state.accountCreateResult}</h1>
                <h1>AccountUpdateResult: {this.state.accountUpdateResult}</h1>
                <h1>AccountDeleteResult: {this.state.accountDeleteResult}</h1>
                <h1>TxWanNormalResult: {this.state.txWanNormalResult}</h1>
                <h1>TxWanNormalHash: {this.state.txWanNormalHash}</h1>
                <h1>Account name: {this.state.accountName}</h1>
                <button onClick={this.generatePhrase}>Generate a phrase !!!</button>
                <button onClick={this.revealPhrase}>Reveal my phrase !!!</button>
                <button onClick={this.hasPhrase}>Has a phrase ???</button>
                <button onClick={this.lockWallet}>Lock my wallet !!!</button>
                <button onClick={this.unlockWallet}>Unlock my wallet !!!</button>
                <button onClick={this.getAddress}>Give me address !!!</button>
                <button onClick={this.getNonce}>Show my nonce !!!</button>
                <button onClick={this.createAccount}>Create account !!!</button>
                <button onClick={this.getAccount}>Show my account detail !!!</button>
                <button onClick={this.getAccounts}>Show my accounts !!!</button>
                <button onClick={this.updateAccount}>Update account name !!!</button>
                <button onClick={this.deleteAccount}>Delete an account !!!</button>
                <button onClick={this.getBalance}>Show my balance !!!</button>
                <button onClick={this.txNormal}>Send wan coin !!!</button>
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
