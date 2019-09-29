import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Icon, Checkbox, message, Spin } from 'antd';

import './index.less';
import { toWei, fromWei } from 'utils/support';
import { DEFAULT_GAS } from 'utils/settings';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/CrossChainConfirmForm';
import { checkETHAddr, getBalanceByAddr, checkAmountUnit, formatAmount } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossChainConfirmForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  from: stores.sendCrossChainParams.currentFrom,
  transParams: stores.sendCrossChainParams.transParams,
  updateGasLimit: gasLimit => stores.sendCrossChainParams.updateGasLimit(gasLimit),
  updateLockAccounts: lockAccount => stores.sendCrossChainParams.updateLockAccounts(lockAccount),
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
}))

@observer
class CrossETHForm extends Component {
  state = {
    balance: 0,
    gasFee: 0,
    advanced: false,
    confirmVisible: false,
    disabledAmount: false,
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  onCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    let { form, addrInfo } = this.props;
    let from = form.getFieldValue('from');
    this.setState({
      advanced: true,
    }, () => {
      if (this.state.disabledAmount) {
        let fee = form.getFieldValue('fee');
        form.setFieldsValue({
          amount: getBalanceByAddr(from, addrInfo) - fee
        });
      }
    });
  }

  handleNext = () => {
    const { updateTransParams, addrInfo, settings } = this.props;
    let form = this.props.form;
    let from = this.props.from;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext', err);
        return;
      };
      let pwd = form.getFieldValue('pwd');
      let addrAmount = getBalanceByAddr(from, addrInfo);
      let sendAmount = form.getFieldValue('amount');
      let curFee = this.state.advanced ? form.getFieldValue('fee') : form.getFieldValue('fixFee');
      if (new BigNumber(addrAmount).minus(new BigNumber(curFee)).lt(new BigNumber(sendAmount))) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: form.getFieldValue('to'), amount: formatAmount(sendAmount) });
            this.setState({ advanced: false, confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: form.getFieldValue('to'), amount: formatAmount(sendAmount) });
        this.setState({ advanced: false, confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, fee) => {
    let { form, addrInfo } = this.props;
    let from = form.getFieldValue('from');
    this.props.updateTransParams(this.props.from, { gasLimit, gasPrice, nonce });
    this.setState({
      gasFee: fee
    })
    if (this.state.disabledAmount) {
      form.setFieldsValue({
        amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(fee))
      });
    }
  }

  updateGasLimit = () => {
    let val;
    let { form } = this.props;
    let from = form.getFieldValue('from');
    try {
      val = toWei((form.getFieldValue('amount') || 0).toString(10))
    } catch (err) {
      return;
    }
    let tx = {
      from: from,
      to: form.getFieldValue('to'),
      value: val,
      data: this.props.transParams[from].data,
      gas: DEFAULT_GAS
    };
    let { chainType } = this.props.transParams[from];
    wand.request('transaction_estimateGas', { chainType, tx }, (err, gasLimit) => {
      if (err) {
        message.warn(intl.get('NormalTransForm.estimateGasFailed'));
      } else {
        console.log('Update gas limit:', gasLimit);
        this.props.updateTransParams(from, { gasLimit });
        this.props.updateGasLimit(gasLimit);
      }
    });
  }

  checkToWanAddr = (rule, value, callback) => {
    checkETHAddr(value).then(ret => {
      if (ret) {
        if (!this.state.advanced) {
          this.updateGasLimit();
        }
        callback();
      } else {
        callback(intl.get('NormalTransForm.invalidAddress'));
      }
    }).catch((err) => {
      callback(err);
    })
  }

  checkAmount = (rule, value, callback) => {
    if (value >= 0 && checkAmountUnit(18, value)) {
      if (!this.state.advanced) {
        this.updateGasLimit();
      }
      callback();
    } else {
      callback(intl.get('NormalTransForm.invalidAmount'));
    }
  }

  sendAllAmount = e => {
    let { form, addrInfo } = this.props;
    let from = form.getFieldValue('from');
    if (e.target.checked) {
      if (this.state.advanced) {
        let fee = form.getFieldValue('fee');
        form.setFieldsValue({
          amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(fee))
        });
      } else {
        form.setFieldsValue({
          amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(this.state.gasFee)).toString(10)
        });
      }

      this.setState({
        disabledAmount: true,
      })
    } else {
      form.setFieldsValue({
        amount: 0
      });
      this.setState({
        gasFee: 0,
        disabledAmount: false,
      })
    }
  }

  onToAddrChange = val => {
    let from = this.props.form.getFieldValue('from');
    this.props.updateTransParams(from, { to: val })
  }

  getWanAddrInfo = val => {
    return this.props.wanAddrInfo.normal[val].balance;
  }

  getLockedAccountInfo = val => {
    let inboundQuota = (this.props.smgList.filter(item => item.ethAddress === val).shift()).inboundQuota;
    return fromWei(inboundQuota.toString());
  }

  render () {
    const { confirmVisible, disabledAmount } = this.state;
    const { loading, form, from, settings, smgList, wanAddrInfo, updateLockAccounts } = this.props;

    let defaultSelectVal, capacity, inboundQuota;
    if (smgList.length === 0) {
      defaultSelectVal = '';
      inboundQuota = capacity = '0';
    } else {
      defaultSelectVal = smgList[0].ethAddress;
      capacity = fromWei(smgList[0].quota);
      inboundQuota = fromWei(smgList[0].inboundQuota);
    }

    return (
      <div>
        <Modal visible destroyOnClose={true} closable={false} title={intl.get('CrossChainTransForm.transaction')} onCancel={this.onCancel} className="cross-chain-modal"
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <div className="validator-bg">
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='from'
                disabled={true}
                options={{ initialValue: from }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('NormalTransForm.from')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='lockedAccount'
                initialValue={defaultSelectVal}
                selectedList={smgList.map(val => val.ethAddress)}
                handleChange={updateLockAccounts}
                getValByInfoList={this.getLockedAccountInfo}
                formMessage={'CrossChainTransForm.lockedAccount'}
                placeholder={'CrossChainTransForm.selectLockAccount'}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='capacity'
                disabled={true}
                options={{ initialValue: capacity }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.capacity')}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='inboundQuota'
                disabled={true}
                options={{ initialValue: inboundQuota }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.inboundQuota')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='to'
                selectedList={Object.keys(wanAddrInfo.normal)}
                handleChange={this.onToAddrChange}
                getValByInfoList={this.getWanAddrInfo}
                formMessage={'NormalTransForm.to'}
                placeholder={'NormalTransForm.to'}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='amount'
                disabled={disabledAmount}
                options={{ initialValue: 0, rules: [{ required: true, validator: this.checkAmount }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('NormalTransForm.amount')}
                sbiling={<Checkbox onChange={this.sendAllAmount}>{intl.get('NormalTransForm.sendAll')}</Checkbox>}
              />
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6}/>}
            </div>
          </Spin>
        </Modal>
        <Confirm visible={confirmVisible} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
      </div>
    );
  }
}

export default CrossETHForm;
