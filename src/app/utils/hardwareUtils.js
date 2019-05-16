const ethUtil = require('ethereumjs-util');

export const wanTx = require('wanchainjs-tx');

export class WanRawTx {
  constructor(data) {
    const fields = [{
      name: 'Txtype',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'nonce',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'gasPrice',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'gasLimit',
      alias: 'gas',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'to',
      allowZero: true,
      length: 20,
      default: new Buffer([])
    }, {
      name: 'value',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'data',
      alias: 'input',
      allowZero: true,
      default: new Buffer([])
    }, {
      name: 'chainId',
      length: 32,
      allowLess: true,
      default: new Buffer([0x01])
    }, {
      name: 'dumb1',
      length: 32,
      allowLess: true,
      allowZero: false,
      default: new Buffer([0x00])
    }, {
      name: 'dumb2',
      length: 32,
      allowLess: true,
      allowZero: false,
      default: new Buffer([0x00])
    }]

    ethUtil.defineProperties(this, fields, data)
  }
}