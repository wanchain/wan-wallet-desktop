
import { observable, action, computed } from 'mobx';

class SendTransParams {
    @observable transParams = {};

}

const self = new SendTransParams();
export default self;
