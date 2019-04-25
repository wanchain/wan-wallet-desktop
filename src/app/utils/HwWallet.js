const HDKey = require('hdkey');
const wanUtil = require('wanchainjs-util');

class HwWallet {
  constructor(publicKey, chainCode, path) {
    this.hdk = new HDKey();
    this.hdk.publicKey = Buffer.from(publicKey, 'hex');
    this.hdk.chainCode = Buffer.from(chainCode, 'hex');
    this.dPath = path;
  }

  getHdKeys(start, limit) {
    let addresses = [];
    for (let i = start; i < start + limit; i++) {
      let derivedKey = this.hdk.derive('m/' + i);
      derivedKey.address = '0x' + wanUtil.publicToAddress(derivedKey.publicKey, true).toString('hex');
      derivedKey.path = this.dPath + '/' + i;
      addresses.push(derivedKey);
    }
    return addresses;
  }

}

export default HwWallet;