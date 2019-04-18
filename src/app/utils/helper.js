import path from 'path';
import { remote, ipcRenderer } from 'electron';
const mainProcess = remote.require(path.join(__dirname, '../controllers/index.js'));
const { unlockHDWallet, revealPhrase } = remote.require('./controllers');
const currentWindow = remote.getCurrentWindow();

const helper = {
  unlockHDWallet,
  getPhrase: pwd => revealPhrase(currentWindow, pwd),
  generatePhrase: pwd => generatePhrase(currentWindow, pwd),
  hasMnemonic: () => {
    return new Promise((resolve, reject) =>{
      ipcRenderer.once('phrase_exist', (event, ret) => {
        return resolve(ret);
      })
      mainProcess.hasPhrase(currentWindow);
    });
  },
  createWanAccount: (targetWindow, start, end) => {
    mainProcess.getAddress(targetWindow, 1, 'WAN', start, end);
  },
  getWanBalance: (addr) => {
    let currAddr = addr;
    return new Promise((resolve, reject) =>{
      ipcRenderer.once('balance_got', (event, ret) => {
        return resolve(ret);
      })
      mainProcess.getBalance(currentWindow, 'WAN', addr);
    });
  }
};

export default helper;