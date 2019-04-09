
import { observable, action } from 'mobx';

import helper from 'utils/helper';
// import storage from 'utils/storage';

class Session {
    @observable hasMnemonic;

    @action async getMnemonic () {
        let hasMnemonic = await helper.hasMnemonic();
        // await storage.set('hasMnemonic', hasMnemonic);
        self.hasMnemonic = hasMnemonic;
        return hasMnemonic;
    }

}

const self = new Session();
export default self;
