import { observable, action, computed } from 'mobx';

class Mnemonic {
  @observable pwd = '';
  @observable prev;
  @observable current = 0;
  @observable confirmPwd = '';
  @observable mnemonic;

  @action setPwd(pwd) {
    self.pwd = pwd;
  }
  @action setconfirmPwd(pwd) {
    self.confirmPwd = pwd;
  }

  @action setIndex(step) {
    self.current = step;
  }

  @computed get isSamePwd() {
    return (self.pwd !== '') && (self.pwd === self.confirmPwd);
  }

}

const self = new Mnemonic();
export default self;
