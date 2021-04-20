import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Select, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
import intl from 'react-intl-universal';
import { toWei } from 'utils/support';
import { DEFAULT_GAS, PRIVATE_TX_AMOUNT_SELECTION } from 'utils/settings';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';
import { checkWanAddr, checkETHAddr, getBalanceByAddr, checkAmountUnit, formatAmount, estimateGasForNormalTrans } from 'utils/helper';
import { isValidChecksumOTAddress } from 'wanchain-util';
import style from './index.less';

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
    this.setState = () => false;
  }

  onAdvanced = () => {
    this.props.form.validateFields(['to', 'amount'], {
      force: true
    }, errors => {
      if (!errors) {
        this.setState({
          advancedVisible: true,
        });
      }
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
    let { form, balance, from, minGasPrice, transParams } = this.props;
    const { gasPrice, gasLimit } = transParams[from];
    let savedFee = new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);
    this.setState({
      gasFee: savedFee,
      advancedVisible: false,
      advanced: true,
    }, () => {
      if (this.state.disabledAmount) {
        form.setFieldsValue({
          amount: new BigNumber(balance).minus(savedFee).toString(10)
        });
      }
    });
  }

  handleNext = () => {
    const { form, from, updateTransParams, addrInfo, settings } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext', err);
        return;
      };
      let { pwd, amount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      let addrAmount = getBalanceByAddr(from, addrInfo);
      if (new BigNumber(addrAmount).minus(this.state.gasFee).lt(amount)) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd: pwd }, (err) => {
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

  sendTrans = (splitAmount) => {
    this.props.onSend(this.props.from, splitAmount);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, gasFee) => {
    let { form, from, balance } = this.props;
    this.props.updateTransParams(from, { gasLimit, gasPrice, nonce });
    this.setState({ gasFee });
    if (this.state.disabledAmount) {
      form.setFieldsValue({
        amount: new BigNumber(balance).minus(gasFee).toString(10)
      });
    }
  }

  updateGasLimit = () => {
    let val;
    let { form, updateTransParams, updateGasLimit, transParams } = this.props;
    let from = form.getFieldValue('from');
    try {
      val = toWei((form.getFieldValue('amount') || 0).toString(10));
    } catch (err) {
      return;
    }
    let tx = {
      from: from,
      value: val,
      data: transParams[from].data,
      gas: DEFAULT_GAS
    };
    tx.to = form.getFieldValue('to');
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

  estimateGasInAdvancedOptionForm = async (inputs) => {
    const { transParams, form, walletID } = this.props;
    const { from, to, amount } = form.getFieldsValue(['from', 'to', 'amount']);
    const { chainType, path } = transParams[from];
    let params = {
      walletID,
      chainType,
      symbol: chainType,
      path,
      to,
      amount,
      nonce: inputs.nonce,
      data: inputs.inputData,
    }
    return estimateGasForNormalTrans(params);
  }

  checkAddr = async (rule, value, callback) => {
    let isNormalAddress = await this.checkToWanAddr(value);
    let isPrivate = this.state.isPrivate;
    if (isNormalAddress) {
      this.setState({
        isPrivate: false
      }, () => {
        if (isPrivate) {
          this.props.form.validateFields(['amount']);
        }
      });
      callback();
    } else if (this.props.disablePrivateTx) {
      callback(intl.get('NormalTransForm.invalidAddress'));
    } else {
      let isPrivateAddress = this.checkToWanPrivateAddr(value);
      if (isPrivateAddress) {
        this.setState({
          isPrivate: true
        }, () => {
          if (!isPrivate) {
            this.props.form.validateFields(['amount']);
          }
        });
        callback();
      } else {
        callback(intl.get('NormalTransForm.invalidAddress'));
      }
    }
  }

  checkToWanAddr = (value) => {
    return new Promise((resolve, reject) => {
      Promise.all([checkWanAddr(value), checkETHAddr(value)]).then(results => {
        if (results[0] || results[1]) {
          if (!this.state.advanced) {
            this.updateGasLimit();
          }
          resolve(true);
        } else {
          resolve(false);
        }
      }).catch(() => {
        resolve(false);
      });
    });
  }

  checkToWanPrivateAddr = (value) => {
    if (isValidChecksumOTAddress(value) || /^0x[0-9a-f]{132}$/i.test(value) || /^0x[0-9A-F]{132}$/i.test(value)) {
      return true;
    } else {
      return false;
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
    let { form, balance } = this.props;
    if (e.target.checked) {
      form.setFieldsValue({
        amount: new BigNumber(balance).minus(this.state.gasFee).toString(10)
      });
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

  render() {
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, balance } = this.props;
    const { advancedVisible, confirmVisible, advanced, disabledAmount, isPrivate } = this.state;
    if (!this.props.transParams[from]) {
      return false;
    }
    const { gasPrice, gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;
    let savedFee = advanced ? new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)) : '';

    return (
      <div>
        <Modal
          visible={true}
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
          <Spin spinning={this.props.spin} size="large" /* tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} */ className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
              <Form.Item label={intl.get('Common.from')}>
                {getFieldDecorator('from', { initialValue: from })
                  (<Input disabled={true} placeholder={intl.get('NormalTransForm.senderAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.balance')}>
                {getFieldDecorator('balance', { initialValue: balance + ' WAN' })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('to', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkAddr }] })
                  (<Input placeholder={intl.get('NormalTransForm.recipientAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.mode')}>
                {getFieldDecorator('mode', { initialValue: !this.props.disablePrivateTx && isPrivate ? 'private' : 'normal' })
                  (<Select disabled={true} showArrow={false} className={style.modeSelection}><Option value="normal">{intl.get('NormalTransForm.normalTransaction')}</Option><Option value="private">{intl.get('NormalTransForm.privateTransaction')}</Option></Select>)}
              </Form.Item>
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
                    {getFieldDecorator('fixedFee', { initialValue: this.state.gasFee, rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                      <Input disabled={true} className="colorInput" />
                    )}
                  </Form.Item>
                  : <Form.Item label={intl.get('NormalTransForm.fee')}>
                    {getFieldDecorator('fee', { rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                      <Radio.Group>
                        <Radio.Button onClick={e => this.handleClick(e, minGasPrice, gasLimit, nonce, minFee)} value="minFee"><p>{intl.get('NormalTransForm.slow')}</p>{minFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                        <Radio.Button onClick={e => this.handleClick(e, averageGasPrice, gasLimit, nonce, averageFee)} value="averageFee"><p>{intl.get('NormalTransForm.average')}</p>{averageFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                        <Radio.Button onClick={e => this.handleClick(e, maxGasPrice, gasLimit, nonce, maxFee)} value="maxFee"><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                      </Radio.Group>
                    )}
                  </Form.Item>
              }
              <p className="onAdvancedT"><span onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</span></p>
            </Form>
          </Spin>
        </Modal>

        <AdvancedOption visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} estimateGas={this.estimateGasInAdvancedOptionForm} from={from} />
        {
          confirmVisible &&
          <Confirm visible={true} isPrivate={isPrivate} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        }
      </div>
    );
  }
}

export default NormalTransForm;
