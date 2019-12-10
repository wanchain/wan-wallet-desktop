import React, { Component } from 'react';
import { Button, Modal, Form, Input, Icon, Radio, message, Spin } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import PrivateTransactionTable from './PrivateTransactionTable.js';
import { BigNumber } from 'bignumber.js';
import style from './index.less';

const privateTxGasLimit = 300000;
@inject(stores => ({
  settings: stores.session.settings,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
}))

@observer
class RedeemFromPrivateForm extends Component {
  state = {
    gasPrice: 0,
    redeemCount: 1
  }

  handleSend = () => {
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
    const { handleSpin } = this.props;
    handleSpin(true);
    let form = this.props.form;
    let refundList = form.getFieldValue('privateRefundList');
    let refunds = [];
    for (let i = 0; i < refundList.length; i++) {
      let ota = refundList[i];
      let input = {
        from: ota.from,
        amount: ota.value,
        otaTxHash: ota.txHash,
        OTA: ota.toPrivateAddr,
        gasPrice: this.state.gasPrice,
        gasLimit: privateTxGasLimit,
        BIP44Path: this.props.path,
        walletID: this.props.wid
      }
      refunds.push(input);
    }
    wand.request('transaction_refund', { input: refunds }, (err, res) => {
      handleSpin(false);
      if (err) {
        message.warn(err.desc);
      } else {
        this.onCancel();
      }
    });
  }

  onCancel = () => {
    this.props.onCancel();
  }

  handleCheck = (arr) => {
    this.setState({
      redeemCount: arr.length === 0 ? 1 : arr.length
    });
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
          wrapClassName={style.redeemFromPrivateFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('RedeemFromPrivateForm.redeem')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleSend}>{intl.get('Common.send')}</Button>,
          ]}
        >

          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>

              <Form.Item label={intl.get('Common.from')}>
                {getFieldDecorator('from', { initialValue: from })
                  (<Input disabled={true} placeholder={intl.get('NormalTransForm.senderAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>

              <Form.Item label={intl.get('RedeemFromPrivateForm.PrivateAddresses')}>
                {getFieldDecorator('privateRefundList', { rules: [{ type: 'array', required: true, message: intl.get('RedeemFromPrivateForm.Required') }] })
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
                    <Radio.Button onClick={e => this.handleClick(e, minGasPrice)} value={minFee}><p>{intl.get('NormalTransForm.slow')}</p>{new BigNumber(minFee).times(this.state.redeemCount).toString(10) } {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button onClick={e => this.handleClick(e, averageGasPrice)} value={averageFee}><p>{intl.get('NormalTransForm.average')}</p>{new BigNumber(averageFee).times(this.state.redeemCount).toString(10)} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button onClick={e => this.handleClick(e, maxGasPrice)} value={maxFee}><p>{intl.get('NormalTransForm.fast')}</p>{new BigNumber(maxFee).times(this.state.redeemCount).toString(10)} {intl.get('NormalTransForm.wan')}</Radio.Button>
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

export default RedeemFromPrivateForm;
