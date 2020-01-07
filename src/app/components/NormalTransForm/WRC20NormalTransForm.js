import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';

import style from './index.less';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';
import { checkWanAddr, getBalanceByAddr, checkAmountUnit, encodeTransferInput } from 'utils/helper';

const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  settings: stores.session.settings,
  tokensList: stores.tokens.formatTokensList,
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
class WRC20NormalTransForm extends Component {
  state = {
    gasFee: 0,
    advanced: false,
    confirmVisible: false,
    disabledAmount: false,
    advancedVisible: false,
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  onAdvanced = () => {
    this.props.form.validateFields(['transferTo', 'amount'], err => {
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
    const { from, minGasPrice, transParams } = this.props;
    const { gasPrice, gasLimit } = transParams[from];
    let savedFee = new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);

    this.setState({
      gasFee: savedFee,
      advancedVisible: false,
      advanced: true,
    });
  }

  handleNext = () => {
    const { updateTransParams, addrInfo, settings, balance, tokenAddr, form, from } = this.props;

    form.validateFields(err => {
      if (err) {
        console.log('WRC20NormalTransForm_handleNext', err);
        return;
      };
      let { pwd, amount: token, transferTo } = form.getFieldsValue(['pwd', 'amount', 'transferTo']);

      let addrAmount = getBalanceByAddr(from, addrInfo);
      if (new BigNumber(addrAmount).lt(this.state.gasFee) || new BigNumber(balance).lt(token)) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }

      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: tokenAddr, transferTo, token })
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: tokenAddr, transferTo, token })
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, gasFee) => {
    const { updateTransParams, from } = this.props;

    this.setState({ gasFee });
    updateTransParams(from, { gasLimit, gasPrice, nonce });
  }

  updateGasLimit = () => {
    let data = '0x';
    let { form, tokensList, tokenAddr: to, from } = this.props;
    let { transferTo, amount } = form.getFieldsValue(['transferTo', 'amount']);

    if (transferTo) {
      let decimals = tokensList[to].decimals;
      data = encodeTransferInput(transferTo, decimals, amount || 0)
      this.props.updateTransParams(from, { data });
    }

    let tx = { from, to, data, value: '0x0' };
    wand.request('transaction_estimateGas', { chainType: 'WAN', tx }, (err, gasLimit) => {
      if (err) {
        message.warn(intl.get('NormalTransForm.estimateGasFailed'));
      } else {
        console.log('Update gas limit:', gasLimit);
        this.props.updateTransParams(from, { gasLimit });
        this.props.updateGasLimit(gasLimit)
      }
    });
  }

  checkToWANAddr = (rule, value, callback) => {
    let { tokenAddr } = this.props;
    if (value === undefined) {
      callback(rule.message);
      return;
    }
    if (value.toLowerCase() === tokenAddr.toLowerCase()) {
      callback(rule.message);
    }
    checkWanAddr(value).then(ret => {
      if (ret) {
        if (!this.state.advanced) {
          this.updateGasLimit();
        }
        callback();
      } else {
        callback(rule.message);
      }
    }).catch(err => {
      console.log('checkToWANAddr:', err)
      callback(intl.get('network.down'));
    })
  }

  checkTokenAmount = (rule, value, callback) => {
    let { tokensList, tokenAddr, balance } = this.props;
    let decimals = tokensList[tokenAddr].decimals;
    if (value === undefined) {
      callback(rule.message);
      return;
    }
    if (new BigNumber(value).lte(0) || !checkAmountUnit(decimals, value)) {
      callback(rule.message)
      return;
    }
    if (new BigNumber(value).gt(balance)) {
      callback(intl.get('NormalTransForm.overBalance'));
      return;
    }
    if (!this.state.advanced) {
      this.updateGasLimit();
    }

    callback();
  }

  sendAllTokenAmount = e => {
    let { form, balance } = this.props;
    if (e.target.checked) {
      form.setFieldsValue({
        amount: balance
      });
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
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.balance')}>
                {getFieldDecorator('balance', { initialValue: balance })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('transferTo', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkToWANAddr }] })
                  (<Input placeholder={intl.get('NormalTransForm.recipientAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.amount')}>
                {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkTokenAmount }] })
                  (<Input disabled={disabledAmount} min={0} placeholder='0' prefix={<Icon type="credit-card" className="colorInput" />} />)}
                <Checkbox onChange={this.sendAllTokenAmount}>{intl.get('NormalTransForm.sendAll')}</Checkbox>
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
          <Confirm tokenAddr={this.props.tokenAddr} transType={this.props.transType} visible={true} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
        }
      </div>
    );
  }
}

export default WRC20NormalTransForm;
