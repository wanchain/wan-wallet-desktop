import path from 'path';
import { remote, ipcRenderer } from 'electron';
const mainProcess = remote.require(path.join(__dirname, '../controllers/index.js'));
const currentWindow = remote.getCurrentWindow();


const helper = {
  unlockHDWallet: (pwd) =>{
    return new Promise((resolve, reject) =>{
      ipcRenderer.on('wallet-unlocked', (event, ret) => {
        return resolve(ret);
      })
      mainProcess.unlockHDWallet(currentWindow, '123');
    });
  },
  getPhrase: (pwd) => {
    mainProcess.revealPhrase(currentWindow, pwd);
  },
  generatePhrase: (pwd) => {
    mainProcess.generatePhrase(currentWindow, pwd);
  },
  hasMnemonic: () => {
    return new Promise((resolve, reject) =>{
      ipcRenderer.on('phrase-exist', (event, ret) => {
        return resolve(ret);
      })
      mainProcess.hasPhrase(currentWindow);
    });
  },
  createWanAccount: (targetWindow, start, end) => {
    mainProcess.getAddress(targetWindow, 1, 'WAN', start, end);
  }
};

export default helper;