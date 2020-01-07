const { ipcRenderer } = require('electron');
const uuid = require('uuid/v1');

class Web3Eth {
  constructor() {
    this._callback = {}; //Save all callback funcs
    ipcRenderer.on('dapp-message', this.dexMessageHandler.bind(this));
  }

  // ---------------------------------
  // Functions called by DEX
  // function name same to web3 protocol
  getAccounts(cb) {
    const msg = {
      method: "getAddresses",
      id: uuid(),
      cb: cb
    };

    this.saveCb(msg);
    this.sendToHost([msg.method, msg.id]);
  }

  sign(message, address, cb) {
    const msg = {
      method: "signPersonalMessage",
      id: uuid(),
      cb: cb,
      message: message,
      address: address
    };

    this.saveCb(msg);
    this.sendToHost([msg.method, msg.id, msg.message, msg.address]);
  }

  sendTransaction(tx, cb) {
    const msg = {
      method: "sendTransaction",
      id: uuid(),
      cb: cb,
      message: tx,
    };

    this.saveCb(msg);
    this.sendToHost([msg.method, msg.id, msg.message]);
  }

  getChainId(cb) {
    const msg = {
      method: "loadNetworkId",
      id: uuid(),
      cb: cb
    };

    this.saveCb(msg);
    this.sendToHost([msg.method, msg.id]);
  }
  // -------------------------------

  // -------------------------------
  // Functions used for internal data transfer
  sendToHost(obj) {
    ipcRenderer.sendToHost('dapp-message', obj);
  }

  saveCb(msg) {
    this._callback[msg.method + '#' + msg.id] = {};
    this._callback[msg.method + '#' + msg.id].cb = msg.cb;
  }

  runCb(msg) {
    if (this._callback[msg.method + '#' + msg.id] &&
      this._callback[msg.method + '#' + msg.id].cb) {
      this._callback[msg.method + '#' + msg.id].cb(msg.err, msg.val);
      this.removeCb(msg);
    } else {
      console.log('can not found cb.');
    }
  }

  removeCb(msg) {
    delete this._callback[msg.method + '#' + msg.id];
  }

  dexMessageHandler(event, data) {
    const msg = data;
    this.runCb(msg);
  }
  // --------------------------------
}

window.web3 = { eth: new Web3Eth() };
window.injectWeb3 = true;