import path from 'path';
import { remote, ipcRenderer } from 'electron';
const mainProcess = remote.require(path.join(__dirname, '../controllers/index.js'));
const currentWindow = remote.getCurrentWindow();


const helper = {
  hasMnemonic: () =>{
    return new Promise((resolve, reject) =>{
      ipcRenderer.on('phrase-exist', (event, ret) => {
        return resolve(ret);
      })
      mainProcess.hasPhrase(currentWindow);
    });
  },
};

export default helper;