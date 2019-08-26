import React, { Component } from 'react';
import { Button, Select, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import PrivateTransactionTable from './PrivateTransactionTable.js';
import RefundOTAConfirmForm from './RefundOTAConfirmForm.js';
import './index.less';

const privateTxGasLimit = 800000;
const Confirm = Form.create({ name: 'RefundOTAForm' })(RefundOTAConfirmForm);
@inject(stores => ({
  settings: stores.session.settings,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
}))

@observer
class RedeemFromOTASForm extends Component {
  state = {
    gasPrice: 0,
    confirmVisible: false,
    sendData: []
  }

  handleNext = () => {
    const { settings } = this.props;
    let form = this.props.form;
    form.validateFields(err => {
      if (err) return;
      let pwd = form.getFieldValue('pwd');
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd: pwd }, (err) => {
          if (err) {
            console.log('not ok');
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            this.setSendData();
          }
        });
      } else {
        this.setSendData();
      }
    });
  }

  setSendData = () => {
    let form = this.props.form;
    let refundList = form.getFieldValue('privateRefundList');
    let refunds = [];
    for (let i = 0; i < refundList.length; i++) {
      let ota = refundList[i];
      let input = {
        from: ota.from,
        amount: ota.value,
        otaTxHash: ota.txhash,
        OTA: ota.toOTA,
        gasPrice: this.state.gasPrice,
        gasLimit: privateTxGasLimit,
        BIP44Path: this.props.path,
        walletID: this.props.wid
      }
      refunds.push(input);
    }
    this.setState({
      sendData: refunds,
      confirmVisible: true,
    });
  }

  handleSend = form => {
    wand.request('transaction_refund', { input: this.state.sendData }, (err, res) => {
      console.log(err, res);
      if (err) {
        console.log('not ok');
        message.warn(err.desc);
      } else {
        console.log('ok');
        // console.log(res);
        this.onCancel();
      }
    });
  }

  onCancel = () => {
    this.props.onCancel();
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  // Refund tx check
  handleCheck = (arr) => {
    let { form } = this.props;
    form.setFieldsValue({
      privateRefundList: arr
    });
  }

  handleClick = (e, gasPrice) => {
    this.setState({ gasPrice });
  }

  render() {
    const { form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, balanceData } = this.props;
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;

    return (
      <div>

        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={intl.get('NormalTransForm.transaction')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleNext}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >

          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">

              <Form.Item label={intl.get('NormalTransForm.from')}>
                {getFieldDecorator('from', { initialValue: from })
                  (<Input disabled={true} placeholder={intl.get('NormalTransForm.senderAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>

              <Form.Item label={'Private Refund'}>
                {getFieldDecorator('privateRefundList', { rules: [{ type: 'array', required: true, message: 'Please select private transaction!' }] })
                  (<Input hidden={true} disabled={true} />)}
              </Form.Item>

              <PrivateTransactionTable balanceData={balanceData} handleCheck={this.handleCheck}/>

              {settings.reinput_pwd
                ? <Form.Item label={intl.get('NormalTransForm.password')}>
                    {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                    (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                  </Form.Item>
                : ''
              }

              <Form.Item label={intl.get('NormalTransForm.fee')}>
                {getFieldDecorator('fixFee', { rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                  <Radio.Group>
                    <Radio.Button onClick={e => this.handleClick(e, minGasPrice)} value={minFee}><p>{intl.get('NormalTransForm.slow')}</p>{minFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button onClick={e => this.handleClick(e, averageGasPrice)} value={averageFee}><p>{intl.get('NormalTransForm.average')}</p>{averageFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button onClick={e => this.handleClick(e, maxGasPrice)} value={maxFee}><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                  </Radio.Group>
                )}
              </Form.Item>

            </Form>
          </Spin>

        </Modal>

        <Confirm visible={this.state.confirmVisible} onCancel={this.handleConfirmCancel} sendTrans={this.handleSend} data={this.state.sendData} />

      </div>
    );
  }
}

export default RedeemFromOTASForm;
