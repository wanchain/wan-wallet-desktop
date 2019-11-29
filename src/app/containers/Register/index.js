import React, { Component } from 'react';
import { Button, message, Steps } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import InputPwd from 'components/Mnemonic/InputPwd';
import ShowPhrase from 'components/Mnemonic/ShowPhrase';
import ConfirmPhrase from 'components/Mnemonic/ConfirmPhrase';

import { createFirstAddr, createBTCAddr } from 'utils/helper';
import { WANPATH, ETHPATH, WALLETID, BTCPATH_MAIN } from 'utils/settings';
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
  addWANAddress: newAddr => stores.wanAddress.addAddress(newAddr),
  addETHAddress: newAddr => stores.ethAddress.addAddress(newAddr),
  addBTCAddress: newAddr => stores.btcAddress.addAddress(newAddr),
  setMnemonicStatus: ret => stores.session.setMnemonicStatus(ret)
}))

@observer
class Register extends Component {
  state = {
    loading: false,
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

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  next = () => {
    const { current, isSamePwd, isAllEmptyPwd, setIndex, pwd, method, mnemonic } = this.props;
    if (current === 0) {
      if (isAllEmptyPwd) {
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
    const { mnemonic, newPhrase, pwd, addWANAddress, addETHAddress, addBTCAddress } = this.props;
    if (newPhrase.join(' ') === mnemonic) {
      this.setState({ loading: true });
      wand.request('phrase_import', { phrase: mnemonic, pwd }, err => {
        if (err) {
          message.error(intl.get('Register.writeSeedPhraseToDatabaseFailed'));
          this.setState({ loading: false });
          return;
        }
        wand.request('wallet_unlock', { pwd: pwd }, async (err, val) => {
          if (err) {
            console.log(intl.get('Register.unlockWalletFailed'), err);
            this.setState({ loading: false });
          } else {
            try {
              let [wanAddrInfo, ethAddrInfo, btcMainAddInfo] = await Promise.all([
                createFirstAddr(WALLETID.NATIVE, 'WAN', `${WANPATH}0`, 'Account1'),
                createFirstAddr(WALLETID.NATIVE, 'ETH', `${ETHPATH}0`, 'ETH-Account1'),
                createBTCAddr(BTCPATH_MAIN, 0),
              ]);
              addWANAddress(wanAddrInfo);
              addETHAddress(ethAddrInfo);
              addBTCAddress(btcMainAddInfo);
              this.props.setMnemonicStatus(true);
              this.props.setAuth(true);
              this.setState({ loading: false });
            } catch (err) {
              console.log('createFirstAddr:', err);
              this.setState({ loading: false });
              message.warn(intl.get('Register.createFirstAddr'));
            }
          }
        })
      });
    } else {
      message.error(intl.get('Register.seedPhraseMismatched'));
    }
  }

  render () {
    const { steps } = this.state;
    const { current } = this.props;

    return (
      <div className={style.zContent}>
        <div className={style.registerContent}>
          <div className={style['steps-content']}>{steps[current].content}</div>
          <div className={style['steps-action']}>
            {
              current < steps.length - 1 && <Button type="primary" onClick={this.next}>{intl.get('Register.next')}</Button>
            }
            {
              current > 1 && (<Button onClick={this.prev} className="cancel">{intl.get('Register.previous')}</Button>)
            }
            {
              current === steps.length - 1 && <Button loading={this.state.loading} style={{ marginLeft: 8 }} type="primary" onClick={this.done}>{intl.get('Register.done')}</Button>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default Register;
