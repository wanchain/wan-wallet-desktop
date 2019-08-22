import React, { Component } from 'react';
import { Button, Select, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import PrivateTransactionTable from './PrivateTransactionTable.js';
import './index.less';
import { getNonce, getGasPrice, getBalanceByAddr, estimateGas, getChainId } from 'utils/helper';

const privateTxGasLimit = 800000;
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
    gasFee: 0,
    confirmVisible: false,
    disabledAmount: false,
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
            this.handleSend(form);
          }
        })
      } else {}
    });
  }

  handleSend = form => {
    // console.log('handleSend');
    let refundList = form.getFieldValue('privateRefundList');
    let gasPrice = form.getFieldValue('fixFee');
    let refunds = [];
    for (let i = 0; i < refundList.length; i++) {
      let ota = refundList[i];
      let input = {
        from: ota.from,
        amount: ota.value,
        otaTxHash: ota.txhash,
        OTA: ota.toOTA,
        gasPrice: gasPrice,
        gasLimit: privateTxGasLimit,
        BIP44Path: this.props.path,
        walletID: this.props.wid
      }
      refunds.push(input);
    }
    console.log('refunds:', refunds);
    wand.request('transaction_refund', { input: refunds }, (err, res) => {
      if (err) {
        console.log('not ok');
        message.warn('Refund private transaction balances failed.');
      } else {
        console.log('ok');
        console.log(res);
        this.onCancel();
      }
    });
  }

  onCancel = () => {
    this.props.onCancel();
  }

  // Refund tx check
  handleCheck = (arr) => {
    console.log('check:', arr);
    let { form } = this.props;
    form.setFieldsValue({
      privateRefundList: arr
    });
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
                    <Radio.Button value={minFee}><p>{intl.get('NormalTransForm.slow')}</p>{minFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button value={averageFee}><p>{intl.get('NormalTransForm.average')}</p>{averageFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button value={maxFee}><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                  </Radio.Group>
                )}
              </Form.Item>

            </Form>
          </Spin>

        </Modal>

      </div>
    );
  }
}

export default RedeemFromOTASForm;
