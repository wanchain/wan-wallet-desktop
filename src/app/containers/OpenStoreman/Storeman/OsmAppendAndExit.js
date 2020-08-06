import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message } from 'antd';

import { toWei } from 'utils/support.js';
import PwdForm from 'componentUtils/PwdForm';
import { WALLETID } from 'utils/settings';
import { signTransaction } from 'componentUtils/trezor';
import StoremanConfirmForm from './StoremanConfirmForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import style from 'components/Staking/MyValidatorsList/index.less';
import { getStoremanContractData, getContractAddr, getNonce, getGasPrice, getChainId, getValueByAddrInfo, checkAmountUnit } from 'utils/helper';

const MINAMOUNT = 100;
const pu = require('promisefy-util');
const Confirm = Form.create({ name: 'StoremanConfirmForm' })(StoremanConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class ModifyForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectType: '',
      confirmVisible: false,
      confirmLoading: false,
      isExit: props.modifyType === 'exit',
    }
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  showConfirmForm = () => {
    let { form, settings } = this.props;
    form.validateFields(err => {
      if (err) return;
      let pwd = form.getFieldValue('pwd');
      if (!settings.reinput_pwd) {
        this.setState({ confirmVisible: true });
      } else {
        wand.request('phrase_checkPwd', { pwd }, err => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            this.setState({ confirmVisible: true });
          }
        })
      }
    })
  }

  onSend = async () => {
    this.setState({ confirmLoading: true });
    let { record, form } = this.props;
    let { type, path, addr: from } = record.myAddress;
    let action = this.state.isExit ? 'stakeOut' : 'stakeAppend';
    let amount = this.state.isExit ? '0' : form.getFieldValue('amount');
    let walletID = type !== 'normal' ? WALLETID[type.toUpperCase()] : WALLETID.NATIVE;
    let tx = {
      from,
      amount,
      walletID,
      wAddr: record.wAddr,
      BIP44Path: record.myAddress.path,
    };

    if (walletID === WALLETID.LEDGER) {
      message.info(intl.get('Ledger.signTransactionInLedger'));
    }

    if (WALLETID.TREZOR === walletID) {
      await this.trezorStoremanUpdate(path, from, action, amount);
      this.setState({ confirmVisible: false });
      this.props.onSend(walletID);
    } else {
      wand.request('storeman_openStoremanAction', { tx, action }, (err, ret) => {
        if (err) {
          message.warn(intl.get('ValidatorRegister.updateFailed'));
        } else {
          console.log('validatorModify ret:', ret);
        }
        this.setState({ confirmVisible: false, confirmLoading: false });
        this.props.onSend();
      });
    }
  }

  trezorStoremanUpdate = async (path, from, action, value) => {
    let { record } = this.props;
    try {
      let { chainId, nonce, gasPrice, data, to } = await Promise.all([getChainId(), getNonce(from, 'wan'), getGasPrice('wan'), getStoremanContractData(action, record.wAddr, value), getContractAddr()])
      let rawTx = {
        to,
        from,
        data,
        chainId,
        Txtype: 1,
        value: toWei(value),
        nonce: '0x' + nonce.toString(16),
        gasLimit: '0x' + Number(200000).toString(16),
        gasPrice: toWei(gasPrice, 'gwei'),
      };

      let raw = await pu.promisefy(signTransaction, [path, rawTx], this);// Trezor sign
      // Send modify validator info
      let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);

      let params = {
        txHash,
        from: from.toLowerCase(),
        to: rawTx.to,
        value: rawTx.value,
        gasPrice: rawTx.gasPrice,
        gasLimit: rawTx.gasLimit,
        nonce: rawTx.nonce,
        srcSCAddrKey: 'WAN',
        srcChainType: 'WAN',
        tokenSymbol: 'WAN',
        status: 'Sending',
      };
      let satellite = {
        wAddr: record.wAddr,
        annotate: action === 'stakeAppend' ? 'StoremanStakeAppend' : 'StoremanStakeOut'
      }

      // save register validator history into DB
      await pu.promisefy(wand.request, ['storeman_insertStoremanTransToDB', { tx: params, satellite }], this);
      // Update stake info & history
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    } catch (error) {
      console.log(error);
      message.error(intl.get('ValidatorRegister.updateFailed'));
    }
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false, confirmLoading: false });
  }

  checkAmount = (rule, value, callback) => {
    let { form } = this.props;
    let balance = form.getFieldValue('balance');
    if (value === undefined || !checkAmountUnit(18, value)) {
      callback(intl.get('Common.invalidAmount'));
    }
    if (new BigNumber(value).minus(MINAMOUNT).lt(0)) {
      callback(intl.get('ValidatorRegister.stakeTooLow'));
      return;
    }
    if (new BigNumber(value).minus(balance).gte(0)) {
      callback(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    callback();
  }

  render () {
    const { isExit } = this.state;
    const { onCancel, form, settings, record, addrInfo } = this.props;
    let title = isExit ? 'Storeman Exit' : 'Storeman Top-up';
    let balance = getValueByAddrInfo(record.myAddress.addr, 'balance', addrInfo)
    let showConfirmItem = { groupId: true, crosschain: true, account: true, amount: !isExit };

    return (
      <div>
        <Modal visible closable={false} destroyOnClose={true} title={title} className="validator-register-modal"
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.showConfirmForm}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <div className="validator-bg">
            <div className="stakein-title">Storeman Account</div>
            <CommonFormItem form={form} formName='crosschain' disabled={true}
              options={{ initialValue: record.crosschain, rules: [{ required: true }] }}
              title='Cross Chain'
            />
            <CommonFormItem form={form} formName='groupId' disabled={true}
              options={{ initialValue: record.groupId, rules: [{ required: true }] }}
              title='Group ID'
            />
          </div>
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.myAccount')}</div>
            <CommonFormItem form={form} formName='myAccount' disabled={true}
              options={{ initialValue: record.account }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.address')}
            />
            <CommonFormItem form={form} formName='balance' disabled={true}
              options={{ initialValue: balance }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.balance')}
            />
            {
              !isExit &&
              <CommonFormItem form={form} formName='amount'
                options={{ initialValue: MINAMOUNT, rules: [{ required: true, validator: this.checkAmount }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('ValidatorRegister.balance')}
              />
            }
            {settings.reinput_pwd && <PwdForm form={form} />}
          </div>
        </Modal>
        {this.state.confirmVisible && <Confirm confirmLoading={this.state.confirmLoading} showConfirmItem={showConfirmItem} onCancel={this.onConfirmCancel} onSend={this.onSend} record={Object.assign({}, record, { amount: form.getFieldValue('amount') })} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} />}
      </div>
    );
  }
}

const StoremanModifyForm = Form.create({ name: 'ModifyForm' })(ModifyForm);
class OsmAppendAndExit extends Component {
  state = {
    visible: false
  }

  handleStateToggle = () => {
    this.setState(state => ({ visible: !state.visible }));
  }

  handleSend = () => {
    this.setState({ visible: false });
  }

  render () {
    return (
      <div>
        <Button className={style.modifyTopUpBtn} onClick={this.handleStateToggle} />
        { this.state.visible &&
          <StoremanModifyForm onCancel={this.handleStateToggle} onSend={this.handleSend} record={this.props.record} modifyType={this.props.modifyType} />
        }
      </div>
    );
  }
}

export default OsmAppendAndExit;
