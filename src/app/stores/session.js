
import { observable, action } from 'mobx';
import { remote } from 'electron';

// import storage from 'utils/storage';
const { hasMnemonic } = remote.require('./controllers')

class Session {
    @observable hasMnemonicOrNot;

    @action getMnemonic () {
        let result = hasMnemonic();
        // await storage.set('hasMnemonic', hasMnemonic);
        self.hasMnemonicOrNot = result;
        return result;
    }

}

const self = new Session();
export default self;
