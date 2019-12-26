
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Select, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
import intl from 'react-intl-universal';

import style from './index.less';
import { toWei } from 'utils/support';
import { DEFAULT_GAS, TRANSTYPE, PRIVATE_TX_AMOUNT_SELECTION } from 'utils/settings';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';
import { checkWanAddr, getBalanceByAddr, checkAmountUnit, formatAmount, encodeTransferInput } from 'utils/helper';
import { isValidChecksumOTAddress } from 'wanchain-util';

const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);
const { Option } = Select;
const PrivateTxGasLimit = 100000;

@inject(stores => ({
  settings: stores.session.settings,
  tokensList: stores.tokens.tokensList,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  from: stores.sendTransParams.currentFrom,
  tokensBalance: stores.tokens.tokensBalance,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  transParams: stores.sendTransParams.transParams,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
  updateGasLimit: gasLimit => stores.sendTransParams.updateGasLimit(gasLimit),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class NormalTransForm extends Component {
  state = {
    gasFee: 0,
    advanced: false,
    confirmVisible: false,
    disabledAmount: false,
    advancedVisible: false,
    isPrivate: false,
    needSplitAmount: false,
  }

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return false;
    };
  }

  onAdvanced = () => {
    console.log(this.props);
    let { form, updateTransParams } = this.props;
    let from = form.getFieldValue('from');
    form.validateFields(['from', 'to'], err => {
      if (err) return;
      updateTransParams(from, { to: form.getFieldValue('to') });
      this.setState({
        advancedVisible: true,
      });
    });
  }

  handleAdvancedCancel = () => {
    this.setState({
      advancedVisible: false,
    });
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
    let { form, addrInfo, transType } = this.props;
    let from = form.getFieldValue('from');
    this.setState({
      advancedVisible: false,
      advanced: true,
    }, () => {
      if (!(transType === TRANSTYPE.tokenTransfer) && this.state.disabledAmount) {
        let fee = form.getFieldValue('fee');
        form.setFieldsValue({
          amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(fee).toString(10)
        });
      }
    });
  }

  handleNext = () => {
    const { updateTransParams, addrInfo, settings, transType } = this.props;
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
      let to = form.getFieldValue('mode') === 'private' ? 'toPrivate' : 'to';

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
            if (transType === TRANSTYPE.tokenTransfer) {
              updateTransParams(from, { to: form.getFieldValue('to'), amount: formatAmount(sendAmount), transferTo: form.getFieldValue('transferTo'), token: form.getFieldValue('token') })
            } else {
              updateTransParams(from, { to: form.getFieldValue(to), amount: formatAmount(sendAmount) });
            }
            this.setState({ advanced: false, confirmVisible: true });
          }
        })
      } else {
        if (transType === TRANSTYPE.tokenTransfer) {
          updateTransParams(from, { to: form.getFieldValue('to'), amount: formatAmount(sendAmount), transferTo: form.getFieldValue('transferTo'), token: form.getFieldValue('token') })
        } else {
          updateTransParams(from, { to: form.getFieldValue(to), amount: formatAmount(sendAmount) });
        }

        this.setState({ advanced: false, confirmVisible: true });
      }
    });
  }

  sendTrans = (splitAmount) => {
    this.props.onSend(this.props.from, splitAmount);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, fee) => {
    let { form, addrInfo, transType } = this.props;
    let from = form.getFieldValue('from');
    this.props.updateTransParams(this.props.from, { gasLimit, gasPrice, nonce });
    this.setState({
      gasFee: fee
    })
    if (!(transType === TRANSTYPE.tokenTransfer) && this.state.disabledAmount) {
      form.setFieldsValue({
        amount: (new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(fee))).toString(10)
      });
    }
  }

  updateGasLimit = () => {
    let val;
    let { form, transType, tokensList, updateTransParams, updateGasLimit, transParams } = this.props;
    let mode = form.getFieldValue('mode');
    let from = form.getFieldValue('from');
    try {
      val = toWei((form.getFieldValue('amount') || 0).toString(10))
    } catch (err) {
      return;
    }
    if (transType === TRANSTYPE.tokenTransfer) {
      if (form.getFieldValue('transferTo')) {
        let tokenAmount = form.getFieldValue('token');
        let decimals = tokensList[form.getFieldValue('to')].decimals;
        updateTransParams(from, { data: encodeTransferInput(form.getFieldValue('transferTo'), decimals, tokenAmount) });
      }
    }
    let tx = {
      from: from,
      value: val,
      data: transParams[from].data,
      gas: DEFAULT_GAS
    };
    if (mode === 'private') {
      tx.to = form.getFieldValue('toPrivate');
    } else {
      tx.to = form.getFieldValue('to');
    }
    let { chainType } = transParams[from];
    wand.request('transaction_estimateGas', { chainType, tx }, (err, gasLimit) => {
      if (err) {
        message.warn(intl.get('NormalTransForm.estimateGasFailed'));
      } else {
        updateTransParams(from, { gasLimit });
        updateGasLimit(gasLimit);
      }
    });
  }

  checkToWanAddr = (rule, value, callback) => {
    let { transType, form, tokenAddr } = this.props;
    if (transType === TRANSTYPE.tokenTransfer) {
      if (form.getFieldValue('transferTo').toLowerCase() === tokenAddr.toLowerCase()) {
        callback(intl.get('NormalTransForm.invalidAddress'));
      }
    }
    checkWanAddr(value).then(ret => {
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

  checkToWanPrivateAddr = (rule, value, callback) => {
    if (/^0x[0-9a-f]{132}$/.test(value)) {
      callback();
    } else if (/^0x[0-9A-F]{132}$/.test(value)) {
      callback();
    } else if (isValidChecksumOTAddress(value)) {
      callback();
    } else {
      callback(intl.get('NormalTransForm.invalidPrivateAddress'));
    }
  }

  checkAmount = (rule, value, callback) => {
    if (this.state.isPrivate) {
      this.checkPrivateAmount(rule, value, callback);
    } else {
      this.checkNormalAmount(rule, value, callback);
    }
  }

  checkNormalAmount = (rule, value, callback) => {
    if (new BigNumber(value).gte(0) && checkAmountUnit(18, value)) {
      if (!this.state.advanced) {
        this.updateGasLimit();
      }
      callback();
    } else {
      callback(intl.get('Common.invalidAmount'));
    }
  }

  checkPrivateAmount = (rule, value, callback) => {
    if (!this.state.advanced) {
      let { form } = this.props;
      let from = form.getFieldValue('from');
      this.props.updateTransParams(from, { gasLimit: PrivateTxGasLimit });
      this.props.updateGasLimit(PrivateTxGasLimit);
    }
    if (!PRIVATE_TX_AMOUNT_SELECTION.includes(value)) {
      if (new BigNumber(value).mod(10).eq(0)) {
        callback();
      } else {
        callback(intl.get('NormalTransForm.shouldBe10Times'));
      }
    } else {
      callback();
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

  modeChange = (v) => {
    this.setState({
      isPrivate: v !== 'normal',
    });
  }

  render() {
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, balance } = this.props;
    const { advancedVisible, confirmVisible, advanced, disabledAmount, isPrivate } = this.state;
    const { gasPrice, gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;
    let savedFee = advanced ? new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)) : '';

    return (
      <div>
        <Modal
          visible
          wrapClassName={style.normalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('NormalTransForm.transaction')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
              <Form.Item label={intl.get('Common.from')}>
                {getFieldDecorator('from', { initialValue: from })
                  (<Input disabled={true} placeholder={intl.get('NormalTransForm.senderAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.balance')}>
                {getFieldDecorator('balance', { initialValue: balance })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.mode')}>
                {getFieldDecorator('mode', { initialValue: isPrivate ? 'private' : 'normal' })
                  (<Select onChange={this.modeChange} disabled={this.props.disablePrivateTx}><Option value="normal">{intl.get('NormalTransForm.normalTransaction')}</Option><Option value="private">{intl.get('NormalTransForm.privateTransaction')}</Option></Select>)}
              </Form.Item>

              {
                isPrivate
                  ? <Form.Item label={intl.get('NormalTransForm.to')}>
                    {getFieldDecorator('toPrivate', { rules: [{ required: true, message: intl.get('NormalTransForm.privateAddressIsIncorrect'), validator: this.checkToWanPrivateAddr }] })
                      (<Input placeholder={intl.get('NormalTransForm.recipientPrivateAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
                  </Form.Item>
                  : <Form.Item label={intl.get('NormalTransForm.to')}>
                    {getFieldDecorator('to', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkToWanAddr }] })
                      (<Input placeholder={intl.get('NormalTransForm.recipientAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
                  </Form.Item>
              }

              <Form.Item label={intl.get('Common.amount')}>
                {getFieldDecorator('amount', { rules: [{ required: true, validator: this.checkAmount }] })
                  (<Input disabled={disabledAmount} />)}
                {!isPrivate && (<Checkbox onChange={this.sendAllAmount}>{intl.get('NormalTransForm.sendAll')}</Checkbox>)}
              </Form.Item>

              {
                settings.reinput_pwd && <Form.Item label={intl.get('NormalTransForm.password')}>
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
              <p className="onAdvancedT" onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</p>
            </Form>
          </Spin>

        </Modal>

        <AdvancedOption transType={this.props.transType} visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} from={from} />
        {
          confirmVisible &&
          <Confirm visible={true} tokenAddr={this.props.tokenAddr} transType={this.props.transType} isPrivate={isPrivate} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        }
      </div>
    );
  }
}

export default NormalTransForm;
