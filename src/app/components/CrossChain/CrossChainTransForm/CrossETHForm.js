import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin, Select } from 'antd';

import './index.less';
import { toWei, fromWei } from 'utils/support';
import { DEFAULT_GAS } from 'utils/settings';
import AddrSelectForm from 'componentUtils/AddrSelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/CrossChainConfirmForm';
import { checkETHAddr, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo } from 'utils/helper';

const Option = Select.Option;
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  from: stores.sendCrossChainParams.currentFrom,
  gasFeeArr: stores.sendCrossChainParams.gasFeeArr,
  transParams: stores.sendCrossChainParams.transParams,
  minGasPrice: stores.sendCrossChainParams.minGasPrice,
  maxGasPrice: stores.sendCrossChainParams.maxGasPrice,
  averageGasPrice: stores.sendCrossChainParams.averageGasPrice,
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
    this.setState({
      advanced: false
    });
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

  onLockAccountChange = val => {
    this.props.updateLockAccounts(val);
  }

  onToAddrChange = val => {
    let from = this.props.form.getFieldValue('from');
    this.props.updateTransParams(from, { to: val })
  }

  getValueByAddrInfoArgs = (...args) => {
    return getValueByAddrInfo(...args, this.props.wanAddrInfo);
  }

  onChangeETHAddrSelect = value => {
    this.setState(() => {
      let balance = value ? this.getValueByAddrInfoArgs(value, 'balance') : 0;
      return { balance }
    })
  }

  render () {
    const { confirmVisible, advanced, disabledAmount } = this.state;
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, smgList, wanAddrInfo } = this.props;
    const { gasPrice, gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;

    let defaultSelectVal, capacity, inboundQuota;
    if (smgList.length === 0) {
      defaultSelectVal = '';
      inboundQuota = capacity = '0';
    } else {
      defaultSelectVal = smgList[0].ethAddress;
      capacity = fromWei(smgList[0].quota);
      inboundQuota = fromWei(smgList[0].inboundQuota);
    }

    let savedFee = advanced ? new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)) : '';

    return (
      <div>
        <Modal visible destroyOnClose={true} closable={false} title={intl.get('CrossChainTransForm.transaction')} onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm" id="Select">
              <Form.Item label={intl.get('NormalTransForm.from')}>
                {getFieldDecorator('from', { initialValue: from })
                  (<Input disabled={true} placeholder={intl.get('NormalTransForm.senderAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('CrossChainTransForm.lockedAccount')} className="lockAccountSelect">
                {getFieldDecorator('lockedAccount', { rules: [{ required: false }], initialValue: defaultSelectVal })(
                  <Select
                    showSearch
                    placeholder={intl.get('CrossChainTransForm.selectLockAccount')}
                    optionFilterProp="children"
                    onChange={this.onLockAccountChange}
                    getPopupContainer={() => document.getElementById('Select')}
                  >
                    {smgList.map((item, index) => <Option value={item} key={index}>{item}</Option>)}
                  </Select>
                )}
              </Form.Item>
              <Form.Item label={intl.get('CrossChainTransForm.capacity')}>
                {getFieldDecorator('capacity', { initialValue: capacity })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('CrossChainTransForm.inboundQuota')}>
              {getFieldDecorator('inboundQuota', { initialValue: inboundQuota })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <div className="validator-bg">
                <div className="validator-line">
                  <AddrSelectForm form={form} addrSelectedList={Object.keys(wanAddrInfo.normal)} handleChange={this.onChangeETHAddrSelect} getValueByAddrInfoArgs={this.getValueByAddrInfoArgs} />
                </div>
              </div>
              <Form.Item label={intl.get('NormalTransForm.amount')}>
                {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkAmount }] })
                  (<Input disabled={disabledAmount} min={0} placeholder='0' prefix={<Icon type="credit-card" className="colorInput" />} />)}
                {<Checkbox onChange={this.sendAllAmount}>{intl.get('NormalTransForm.sendAll')}</Checkbox>}
              </Form.Item>
              {
                settings.reinput_pwd &&
                <Form.Item label={intl.get('NormalTransForm.password')}>
                  {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                  (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                </Form.Item>
              }
              {
              advanced
              ? <Form.Item label={intl.get('NormalTransForm.fee')}>
                  {getFieldDecorator('fee', { initialValue: savedFee.toString(10), rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                    <Input disabled={true} className="colorInput" />
                  )}
                </Form.Item>
              : <Form.Item label={intl.get('NormalTransForm.fee')}>
                  {getFieldDecorator('fixFee', { rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                    <Radio.Group>
                      <Radio.Button onClick={e => this.handleClick(e, minGasPrice, gasLimit, nonce, minFee)} value="minFee"><p>{intl.get('NormalTransForm.slow')}</p>{minFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                      <Radio.Button onClick={e => this.handleClick(e, averageGasPrice, gasLimit, nonce, averageFee)} value="averageFee"><p>{intl.get('NormalTransForm.average')}</p>{averageFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                      <Radio.Button onClick={e => this.handleClick(e, maxGasPrice, gasLimit, nonce, maxFee)} value="maxFee"><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    </Radio.Group>
                  )}
                </Form.Item>
              }
            </Form>
          </Spin>
        </Modal>
        <Confirm visible={confirmVisible} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
      </div>
    );
  }
}

export default CrossETHForm;
