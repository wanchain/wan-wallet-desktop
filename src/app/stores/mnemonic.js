import { observable, action, computed, makeObservable } from 'mobx';

class Mnemonic {
  @observable pwd = '';

  @observable method = 'create';

  @observable current = 0;

  @observable confirmPwd = '';

  @observable mnemonic = '';

  @observable newPhrase = [];

  constructor() {
    makeObservable(this);
  }

  @action setPwd (pwd) {
    self.pwd = pwd;
  }

  @action setconfirmPwd (pwd) {
    self.confirmPwd = pwd;
  }

  @action setMnemonic (val) {
    self.mnemonic = val;
  }

  @action setMethod (val) {
    self.method = val;
  }

  @action setIndex (step) {
    self.current = step;
  }

  @action setNewPhrase (newphrase) {
    self.newPhrase = newphrase;
  }

  @computed get isSamePwd () {
    return (self.pwd !== '') && (self.pwd === self.confirmPwd);
  }

  @computed get isAllEmptyPwd () {
    return self.pwd === '' && self.confirmPwd === '';
  }
}

const self = new Mnemonic();
export default self;
