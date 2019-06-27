import wanUtil from "wanchain-util";
import React, { Component } from 'react';
import { Button, message, Steps } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import InputPwd from 'components/Mnemonic/InputPwd';
import ShowPhrase from 'components/Mnemonic/ShowPhrase';
import ConfirmPhrase from 'components/Mnemonic/ConfirmPhrase';

import { checkCryptographic, checkPhrase } from 'utils/support';

const Step = Steps.Step;

@inject(stores => ({
  pwd: stores.mnemonic.pwd,
  method: stores.mnemonic.method,
  current: stores.mnemonic.current,
  mnemonic: stores.mnemonic.mnemonic,
  newPhrase: stores.mnemonic.newPhrase,
  isSamePwd: stores.mnemonic.isSamePwd,
  language: stores.languageIntl.language,
  isAllEmptyPwd: stores.mnemonic.isAllEmptyPwd,
  setAuth: val => stores.session.setAuth(val),
  setIndex: index => stores.mnemonic.setIndex(index),
  setMnemonic: val => stores.mnemonic.setMnemonic(val),
  addAddress: newAddr => stores.wanAddress.addAddress(newAddr),
  setMnemonicStatus: ret => stores.session.setMnemonicStatus(ret)
}))

@observer
class Register extends Component {
  state = {
    steps: [{
      title: intl.get('Register.createPassword'),
      content: <InputPwd />,
    }, {
      title: intl.get('Register.secretBackupPhrase'),
      content: <ShowPhrase />,
    }, {
      title: intl.get('Register.confirmSecretBackupPhrase'),
      content: <ConfirmPhrase />,
    }]
  }

  next = () => {
    const { current, isSamePwd, isAllEmptyPwd, setIndex, pwd, method, mnemonic } = this.props;
    if (current === 0) {
      if(isAllEmptyPwd) {
        message.error(intl.get('Register.passwordsEmpty'));
        return;
      }
      if (isSamePwd) {
        if (checkCryptographic(pwd)) {
          if (method === 'create') {
            wand.request('phrase_generate', { pwd: pwd }, (err, val) => {
              if (err) {
                message.error(intl.get('Register.createSeedPhraseFailed'));
                return;
              }
              this.props.setMnemonic(val);
              setIndex(1);
            });
          } else {
            setIndex(1);
          }
        } else {
          message.error(intl.get('Register.passwordTip'));
        }
      } else {
        message.error(intl.get('Register.passwordsMismatched'));
      }
    } else if (current === 1 && method === 'import') {
      if (checkPhrase(mnemonic)) {
        this.props.setMnemonic(mnemonic);
        setIndex(current + 1);
      } else {
        message.error(intl.get('Register.seedPhraseIsInvalid'));
      }
    } else {
      setIndex(current + 1);
    }
  }

  prev = () => {
    const { setIndex, current } = this.props;
    setIndex(current - 1);
  }

  done = () => {
    const { mnemonic, newPhrase, pwd, addAddress } = this.props;
    if (newPhrase.join(' ') === mnemonic) {
      wand.request('phrase_import', { phrase: mnemonic, pwd }, (err) => {
        if (err) {
          message.error(intl.get('Register.writeSeedPhraseToDatabaseFailed'));
          return;
        }
        wand.request('wallet_unlock', { pwd: pwd }, (err, val) => {
          if (err) {
            console.log(intl.get('Register.unlockWalletFailed'), err)
          } else {
            let path = "m/44'/5718350'/0'/0/0";
            wand.request('address_getOne', { walletID: 1, chainType: 'WAN', path: path }, (err, val_address_get) => {
              if (!err) {
                wand.request('account_create', { walletID: 1, path: path, meta: { name: 'Account1', addr: `0x${val_address_get.address}` } }, (err, val_account_create) => {
                  if (!err && val_account_create) {
                    let addressInfo = {
                      start: 0,
                      address: wanUtil.toChecksumAddress(`0x${val_address_get.address}`)
                    }
                    addAddress(addressInfo);
                    this.props.setMnemonicStatus(true);
                    this.props.setAuth(true);
                  }
                });
              }
            });
          }
        })
      });
    } else {
      message.error(intl.get('Register.seedPhraseMismatched'));
    }
  }

  render() {
    const { steps } = this.state;
    const { current } = this.props;

    return (
      <div className="zContent">
        <div className="registerContent">
          <div className="steps-content">{steps[current].content}</div>
          <div className="steps-action">
            {
              current < steps.length - 1
              && <Button type="primary" onClick={this.next}>{intl.get('Register.next')}</Button>
            }
            {
              current > 1 && (<Button onClick={this.prev} className="cancel">{intl.get('Register.previous')}</Button>)
            }
            {
              current === steps.length - 1
              && <Button style={{ marginLeft: 8 }} type="primary" onClick={this.done}>{intl.get('Register.done')}</Button>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default Register;