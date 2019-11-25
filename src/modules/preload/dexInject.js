const { ipcRenderer } = require('electron');
const uuid = require('uuid/v1');

class LightWallet {
  constructor() {
    this._callback = {}; //Save all callback funcs
    ipcRenderer.on('dex-message', this.dexMessageHandler.bind(this));
  }

  getAddresses(cb) {
    const msg = {
      method: "getAddresses",
      id: uuid(),
      cb: cb
    };

    this.saveCb(msg);
    this.sendToHost([msg.method, msg.id]);
  }

  signPersonalMessage(message, address, cb) {
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

  sendTransaction(tx, address, cb) {
    const msg = {
      method: "sendTransaction",
      id: uuid(),
      cb: cb,
      message: tx,
      address: address
    };

    this.saveCb(msg);
    this.sendToHost([msg.method, msg.id, msg.message, msg.address]);
  }

  loadNetworkId(cb) {
    const msg = {
      method: "loadNetworkId",
      id: uuid(),
      cb: cb
    };

    this.saveCb(msg);
    this.sendToHost([msg.method, msg.id]);
  }

  sendToHost(obj) {
    ipcRenderer.sendToHost('dex-message', obj);
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
}

window.lightWallet = new LightWallet();