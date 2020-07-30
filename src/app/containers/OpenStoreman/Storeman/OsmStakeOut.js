import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message } from 'antd';

import { toWei } from 'utils/support.js';
import PwdForm from 'componentUtils/PwdForm';
import { WANPATH, WALLETID } from 'utils/settings';
import { signTransaction } from 'componentUtils/trezor';
import StoremanConfirmForm from './StoremanConfirmForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import style from 'components/Staking/MyValidatorsList/index.less';
import { getContractData, getContractAddr, getNonce, getGasPrice, getChainId, getValueByAddrInfo, checkAmountUnit } from 'utils/helper';

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
  state = {
    selectType: '',
    confirmVisible: false,
    confirmLoading: false,
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
    let { form, record, addrInfo, modifyType } = this.props;
    let from = record.myAddress.addr;
    let type = record.myAddress.type;
    let walletID = type !== 'normal' ? WALLETID[type.toUpperCase()] : WALLETID.NATIVE;
    let path = type !== 'normal' ? addrInfo[type][from].path : WANPATH + addrInfo[type][from].path;
    let tx = {
      from: from,
      amount: 0,
      BIP44Path: path,
      walletID: walletID,
      minerAddr: record.validator.address
    };

    if (walletID === WALLETID.LEDGER) {
      message.info(intl.get('Ledger.signTransactionInLedger'));
    }

    if (modifyType === 'exit') {
      let type = 'stakeUpdate';
      if (WALLETID.TREZOR === walletID) {
        await this.trezorValidatorUpdate(path, from, type);
        this.setState({ confirmVisible: false });
        this.props.onSend(walletID);
      } else {
        wand.request('staking_validatorUpdate', { tx }, (err, ret) => {
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
  }

  trezorValidatorUpdate = async (path, from, func, value) => {
    let { record } = this.props;
    let chainId = await getChainId();
    try {
      let nonce = await getNonce(from, 'wan');
      let gasPrice = await getGasPrice('wan');
      let address = record.validator.address;
      let data = await getContractData(func, address, value);
      let amountWei = toWei('0');
      const cscContractAddr = await getContractAddr();
      let rawTx = {};
      rawTx.from = from;
      rawTx.to = cscContractAddr;
      rawTx.value = amountWei;
      rawTx.data = data;
      rawTx.nonce = '0x' + nonce.toString(16);
      rawTx.gasLimit = '0x' + Number(200000).toString(16);
      rawTx.gasPrice = toWei(gasPrice, 'gwei');
      rawTx.Txtype = Number(1);
      rawTx.chainId = chainId;
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
        status: 'Sent',
      };
      let satellite = {
        secPk: record.publicKey1,
        annotate: func === 'stakeUpdate' ? 'StakeUpdate' : 'StakeUpdateFeeRate'
      }

      // save register validator history into DB
      await pu.promisefy(wand.request, ['staking_insertRegisterValidatorToDB', { tx: params, satellite }], this);
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
    const { onCancel, form, settings, record, modifyType, addrInfo } = this.props;
    let title = modifyType === 'exit' ? 'Storeman Exit' : 'Storeman Top-up';
    let balance = getValueByAddrInfo(record.account, 'balance', addrInfo)
    let showConfirmItem = { groupId: true, crosschain: true, account: true, amount: modifyType !== 'exit' };

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
              modifyType !== 'exit' &&
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
class OsmStakeOut extends Component {
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

export default OsmStakeOut;
