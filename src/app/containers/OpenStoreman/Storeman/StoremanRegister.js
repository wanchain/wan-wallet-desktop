import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { checkAmountUnit, getValueByAddrInfo, getNonce, getGasPrice, getChainId, getContractAddr, getStoremanContractData } from 'utils/helper';
import { Button, Modal, Form, Icon, message } from 'antd';
import { signTransaction } from 'componentUtils/trezor';
import { toWei } from 'utils/support.js';

import PwdForm from 'componentUtils/PwdForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import AddrSelectForm from 'componentUtils/AddrSelectForm';
import StoremanConfirmForm from './StoremanConfirmForm';
import { WALLETID } from 'utils/settings'

const pu = require('promisefy-util');
const Confirm = Form.create({ name: 'StoremanConfirmForm' })(StoremanConfirmForm);
const MINAMOUNT = 50000

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.wanAddress.addrInfo,
  addrSelectedList: stores.wanAddress.addrSelectedList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class StoremanRegister extends Component {
  state = {
    balance: 0,
    confirmVisible: false,
    initAmount: MINAMOUNT,
    confirmLoading: false,
  };

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return false;
    };
  }

  getValueByAddrInfoArgs = (...args) => {
    return getValueByAddrInfo(...args, this.props.addrInfo);
  }

  onChangeAddrSelect = value => {
    this.setState(() => {
      let balance = value ? this.getValueByAddrInfoArgs(value, 'balance') : 0;
      return { balance }
    })
  }

  checkPublicKey = (rule, value, callback) => {
    if (value === undefined) {
      callback(intl.get('ValidatorRegister.publicKeyIsWrong'));
      return;
    }
    if (value.startsWith('0x') && value.length === 130) {
      callback();
    } else {
      callback(intl.get('ValidatorRegister.publicKeyIsWrong'));
    }
  }

  checkEnodeId = (rule, value, callback) => {
    if (value === undefined) {
      callback(intl.get('ValidatorRegister.publicKeyIsWrong'));
      return;
    }
    if (value.startsWith('0x') && value.length === 130) {
      callback();
    } else {
      callback(intl.get('ValidatorRegister.publicKeyIsWrong'));
    }
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

  showConfirmForm = () => {
    let { form, settings } = this.props;
    form.validateFields(err => {
      if (err) return;
      if (new BigNumber(this.state.balance).minus(form.getFieldValue('amount')).lte(0)) {
        message.error(intl.get('NormalTransForm.overBalance'));
        return;
      }

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

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false, confirmLoading: false });
  }

  onSend = async () => {
    this.setState({ confirmLoading: true });
    let { form, group } = this.props;
    let { myAddr: from, amount } = form.getFieldsValue(['myAddr', 'amount']);
    let path = this.getValueByAddrInfoArgs(from, 'path');
    let walletID = from.indexOf(':') !== -1 ? WALLETID[from.split(':')[0].toUpperCase()] : WALLETID.NATIVE;

    from = from.indexOf(':') === -1 ? from : from.split(':')[1].trim();

    let tx = {
      from,
      walletID,
      amount: amount.toString(),
      BIP44Path: path,
      wPk: form.getFieldValue('publicKey'),
      groupId: group.groupId,
      enodeID: group.enodeID,
      delegateFee: group.delegateFee,
    }
    if (walletID === WALLETID.LEDGER) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }
    if (walletID === WALLETID.TREZOR) {
      await this.trezorRegisterValidator(path, from, (form.getFieldValue('amount') || 0).toString(), tx.secPk, tx.bn256Pk, tx.lockEpoch, tx.feeRate, tx.maxFeeRate);
      this.setState({ confirmVisible: false });
      this.props.onSend(walletID);
    } else {
      wand.request('storeman_openStoremanAction', { tx, action: 'stakeIn' }, (err, ret) => {
        if (err) {
          message.warn(intl.get('ValidatorRegister.registerFailed'));
        }
        this.setState({ confirmVisible: false, confirmLoading: false });
        this.props.onSend();
      });
    }
  }

  trezorRegisterValidator = async (path, from, value, wPk, enodeID, feeRate) => {
    let chainId = await getChainId();
    let func = 'stakeRegister';// abi function
    try {
      let nonce = await getNonce(from, 'wan');
      let gasPrice = await getGasPrice('wan');
      let data = await getStoremanContractData(func, wPk, enodeID, feeRate);

      let amountWei = toWei(value);
      const cscContractAddr = await getContractAddr();
      let rawTx = {
        data,
        from,
        chainId,
        value: amountWei,
        to: cscContractAddr,
        nonce: '0x' + nonce.toString(16),
        gasLimit: '0x' + Number(200000).toString(16),
        gasPrice: toWei(gasPrice, 'gwei'),
        Txtype: Number(1),
      };

      let raw = await pu.promisefy(signTransaction, [path, rawTx], this);// Trezor sign

      // Send register validator
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
        status: 'Sent',
      };
      let satellite = {
        wPk,
        enodeID,
        annotate: 'StakeRegister'
      }
      // save register validator history into DB
      await pu.promisefy(wand.request, ['staking_insertRegisterValidatorToDB', { tx: params, satellite }], this);
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    } catch (error) {
      console.log(error);
      message.error(intl.get('ValidatorRegister.registerFailed'));
    }
  }

  render() {
    const { form, settings, addrSelectedList, onCancel, group } = this.props;
    let record = form.getFieldsValue(['publicKey', 'enodeID', 'myAddr', 'amount', 'crosschain']);
    let showConfirmItem = { groupId: true, publicKey: true, enodeID: true, crosschain: true, account: true, amount: true };

    return (
      <div>
        <Modal visible closable={false} destroyOnClose={true} title="Storeman Registration" className="validator-register-modal"
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.showConfirmForm}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <div className="validator-bg">
            <div className="stakein-title">Storeman Account</div>
            <CommonFormItem form={form} formName='groupId' disabled={true}
              options={{ initialValue: group.groupId }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title='Group ID'
            />
            <CommonFormItem form={form} formName='crosschain' disabled={true}
              options={{ initialValue: group.crosschain }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title='Cross Chain'
            />
            <CommonFormItem form={form} formName='publicKey'
              options={{ rules: [{ required: true, validator: this.checkPublicKey }] }}
              prefix={<Icon type="wallet" className="colorInput" />}
              title='Public Key'
              placeholder='Enter Public Key'
            />
            <CommonFormItem form={form} formName='enodeID'
              options={{ rules: [{ required: true, validator: this.checkEnodeId }] }}
              prefix={<Icon type="wallet" className="colorInput" />}
              title='Enode ID'
              placeholder='Enter Enode ID'
            />
          </div>
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.myAccount')}</div>
            <div className="validator-line">
              <AddrSelectForm form={form} addrSelectedList={addrSelectedList} handleChange={this.onChangeAddrSelect} getValueByAddrInfoArgs={this.getValueByAddrInfoArgs} />
            </div>
            <CommonFormItem form={form} formName='balance' disabled={true}
              options={{ initialValue: this.state.balance }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.balance')}
            />
            <CommonFormItem form={form} formName='amount'
              options={{ initialValue: this.state.initAmount, rules: [{ required: true, validator: this.checkAmount }] }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('Common.amount')}
            />
            {settings.reinput_pwd && <PwdForm form={form} />}
          </div>
        </Modal>
        {this.state.confirmVisible && <Confirm confirmLoading={this.state.confirmLoading} showConfirmItem={showConfirmItem} onCancel={this.onConfirmCancel} onSend={this.onSend} record={Object.assign(record, { groupId: group.groupId, account: record.myAddr })} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} />}
      </div>
    );
  }
}

export default StoremanRegister;
