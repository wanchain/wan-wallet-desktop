import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
import intl from 'react-intl-universal';

import style from '../index.less';
import { TRANSTYPE } from 'utils/settings';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';
import { checkETHAddr, getBalanceByAddr, checkAmountUnit, formatAmount, encodeTransferInput } from 'utils/helper';

const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  settings: stores.session.settings,
  tokensList: stores.tokens.formatTokensList,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  from: stores.sendTransParams.currentFrom,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  transParams: stores.sendTransParams.transParams,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  E20TokensBalance: stores.tokens.E20TokensBalance,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
  updateGasLimit: gasLimit => stores.sendTransParams.updateGasLimit(gasLimit),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class ETHNormalTransForm extends Component {
  state = {
    gasFee: 0,
    advanced: false,
    confirmVisible: false,
    disabledAmount: false,
    advancedVisible: false,
  }

  constructor(props) {
    super(props);
    let { tokensList, tokenAddr } = props;
    this.decimals = (Object.values(tokensList).find(item => item.tokenOrigAddr === tokenAddr)).decimals || 18;
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  onAdvanced = () => {
    this.props.form.validateFields(['to', 'amount'], err => {
      if (err) return;
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
    const { form, transType, balance, from, minGasPrice, transParams } = this.props;
    const { gasPrice, gasLimit } = transParams[from];
    let savedFee = new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);
    this.setState({
      gasFee: savedFee,
      advancedVisible: false,
      advanced: true,
    }, () => {
      if (!(transType === TRANSTYPE.tokenTransfer) && this.state.disabledAmount) {
        form.setFieldsValue({
          amount: new BigNumber(balance).minus(savedFee).toString(10)
        });
      }
    });
  }

  handleNext = () => {
    const { form, from, updateTransParams, addrInfo, settings, balance, tokenAddr } = this.props;

    form.validateFields(err => {
      if (err) {
        console.log('handleNext', err);
        return;
      };
      let { pwd, amount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      let addrAmount = getBalanceByAddr(from, addrInfo);
      if (new BigNumber(addrAmount).minus(this.state.gasFee).lt(tokenAddr ? '0' : amount)) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }
      if (tokenAddr && new BigNumber(balance).lt(amount)) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd }, err => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to, amount: formatAmount(amount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to, amount: formatAmount(amount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, gasFee) => {
    let { form, transType, from, balance } = this.props;
    this.props.updateTransParams(from, { gasLimit, gasPrice, nonce });
    this.setState({ gasFee })
    if (!(transType === TRANSTYPE.tokenTransfer) && this.state.disabledAmount) {
      form.setFieldsValue({
        amount: new BigNumber(balance).minus(gasFee).toString(10)
      });
    }
  }

  updateGasLimit = () => {
    let data = '0x';
    let { form, transType, from, tokenAddr } = this.props;
    let { to, amount } = form.getFieldsValue(['to', 'amount']);

    if (transType === TRANSTYPE.tokenTransfer) {
      if (to) {
        data = encodeTransferInput(to, this.decimals, amount || 0);
        this.props.updateTransParams(from, { data });
      }
    }
    let tx = { from, to: tokenAddr, data, value: '0x0' };
    wand.request('transaction_estimateGas', { chainType: 'ETH', tx }, (err, gasLimit) => {
      if (err) {
        message.warn(intl.get('NormalTransForm.estimateGasFailed'));
      } else {
        console.log('Update Gas Limit:', gasLimit);
        this.props.updateTransParams(from, { gasLimit });
        this.props.updateGasLimit(gasLimit);
      }
    });
  }

  checkToETHAddr = (rule, value, callback) => {
    let { tokenAddr } = this.props;
    if (value === undefined) {
      callback(rule.message);
      return;
    }
    if (tokenAddr && value.toLowerCase() === tokenAddr.toLowerCase()) {
      callback(rule.message);
    }
    checkETHAddr(value).then(ret => {
      if (ret) {
        if (!this.state.advanced) {
          this.updateGasLimit();
        }
        callback();
      } else {
        callback(rule.message);
      }
    }).catch(err => {
      console.log('checkToETHAddr:', err)
      callback(intl.get('network.down'));
    })
  }

  checkAmount = (rule, value, callback) => {
    let { tokenAddr, balance } = this.props;
    if (value === undefined) {
      callback(rule.message);
      return;
    }
    if (new BigNumber(value).lte(0) || !checkAmountUnit(this.decimals, value)) {
      callback(rule.message);
      return;
    }
    if (tokenAddr && new BigNumber(value).gt(balance)) {
      callback(intl.get('NormalTransForm.overBalance'));
      return;
    }
    if (!this.state.advanced) {
      this.updateGasLimit();
    }

    callback();
  }

  sendAllAmount = e => {
    let { form, balance, tokenAddr } = this.props;
    if (e.target.checked) {
      if (tokenAddr) {
        form.setFieldsValue({
          amount: balance
        });
      } else {
        form.setFieldsValue({
          amount: new BigNumber(balance).minus(this.state.advanced ? form.getFieldValue('fixedFee') : this.state.gasFee).toString(10)
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
        disabledAmount: false,
      })
    }
  }

  render () {
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, balance } = this.props;
    const { advancedVisible, confirmVisible, advanced, disabledAmount } = this.state;
    const { gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;

    return (
      <div>
        <Modal
          visible
          wrapClassName={style.ETHNormalTransFormModal}
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
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.balance')}>
                {getFieldDecorator('balance', { initialValue: balance })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('to', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkToETHAddr }] })
                  (<Input placeholder={intl.get('NormalTransForm.recipientAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.amount')}>
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
                  {getFieldDecorator('fixedFee', { initialValue: this.state.gasFee, rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                    <Input disabled={true} className="colorInput" />
                  )}
                </Form.Item>
              : <Form.Item label={intl.get('NormalTransForm.fee')}>
                  {getFieldDecorator('fee', { rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                    <Radio.Group>
                      <Radio.Button onClick={e => this.handleClick(e, minGasPrice, gasLimit, nonce, minFee)} value="minFee"><p>{intl.get('NormalTransForm.slow')}</p>{minFee} ETH</Radio.Button>
                      <Radio.Button onClick={e => this.handleClick(e, averageGasPrice, gasLimit, nonce, averageFee)} value="averageFee"><p>{intl.get('NormalTransForm.average')}</p>{averageFee} ETH</Radio.Button>
                      <Radio.Button onClick={e => this.handleClick(e, maxGasPrice, gasLimit, nonce, maxFee)} value="maxFee"><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} ETH</Radio.Button>
                    </Radio.Group>
                  )}
                </Form.Item>
              }
              <p className="onAdvancedT" onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</p>
            </Form>
          </Spin>
        </Modal>
        <AdvancedOption visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} from={from} chain='ETH' />
        {
          confirmVisible &&
          <Confirm chain='ETH' visible={true} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
        }
      </div>
    );
  }
}

export default ETHNormalTransForm;
