import React, { Component } from 'react';
import { Button, Modal, Form, Input, Table } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';

import style from './index.less';
import { formatNum } from 'utils/support';
import { TRANSTYPE } from 'utils/settings';
import { getSplitAmountToArray } from 'utils/helper';

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
}))

@observer
class ConfirmForm extends Component {
  state = {
    dataSource: []
  }

  componentDidMount() {
    this.dataSource();
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    if (this.props.isPrivate) {
      this.props.sendTrans(this.state.dataSource);
    } else {
      this.props.sendTrans();
    }
  }

  dataSource = () => {
    const { from, isPrivate, transParams } = this.props;
    const { amount, gasLimit, gasPrice } = transParams[from];
    let fee = new BigNumber(gasPrice).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);
    let dataSource = [];
    if (!isPrivate) return;
    let splitArray = getSplitAmountToArray(amount);
    Object.keys(splitArray).forEach(v => {
      dataSource.push({
        face: v,
        count: splitArray[v],
        fee: new BigNumber(fee).times(splitArray[v]).toString(10)
      })
    });
    dataSource.reverse();
    this.setState({
      dataSource: dataSource
    });
  }

  columns = () => [
    {
      title: intl.get('NormalTransForm.ConfirmForm.faceValue'),
      dataIndex: 'face',
    },
    {
      title: intl.get('NormalTransForm.ConfirmForm.count'),
      dataIndex: 'count',
    },
    {
      title: intl.get('NormalTransForm.ConfirmForm.fee'),
      dataIndex: 'fee',
    },
  ];

  render() {
    const { form, from, loading, isPrivate, transParams, transType, chain, visible } = this.props;
    const { getFieldDecorator } = form;
    const { to, amount, gasLimit, gasPrice, nonce, data, transferTo, token } = transParams[from];
    let fee = new BigNumber(gasPrice).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);
    let initialTo = transType === TRANSTYPE.tokenTransfer ? transferTo : to;
    let initialAmount = transType === TRANSTYPE.tokenTransfer ? token : amount;

    return (
      <Modal
        destroyOnClose
        closable={false}
        visible={visible}
        title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={this.handleSave}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
          <Form.Item label={intl.get('Common.from')}>
            {getFieldDecorator('from', { initialValue: from })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.to')}>
            {getFieldDecorator('to', { initialValue: initialTo })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount')}>
            {getFieldDecorator('amount', { initialValue: formatNum(initialAmount) })
              (<Input disabled={true} />)}
          </Form.Item>

          {
            isPrivate ? (
              <Table className={style.splitAmountTable} rowKey={'face'} dataSource={this.state.dataSource} columns={this.columns()} pagination={false} />
            ) : (
                <div>
                  <Form.Item label={intl.get('NormalTransForm.ConfirmForm.gasPrice') + ' (' + (chain === 'ETH' ? 'Gwei' : intl.get('AdvancedOptionForm.gwin')) + ')'}> {
                    getFieldDecorator(
                      'gasPrice', { initialValue: gasPrice })
                      (<Input disabled={true} />)
                  }
                  </Form.Item>
                  <Form.Item label={intl.get('NormalTransForm.ConfirmForm.gasLimit')}>
                    {getFieldDecorator(
                      'gasLimit', { initialValue: formatNum(gasLimit) })
                      (<Input disabled={true} />)}
                  </Form.Item>
                  <Form.Item label={intl.get('NormalTransForm.ConfirmForm.nonce')}>
                    {getFieldDecorator(
                      'nonce', { initialValue: nonce })
                      (<Input disabled={true} />)}
                  </Form.Item>
                  <Form.Item label={intl.get('NormalTransForm.ConfirmForm.fee')}>
                    {getFieldDecorator('fee', { initialValue: fee })(
                      <Input disabled={true} />
                    )}
                  </Form.Item>
                  {
                    data !== '0x' &&
                    <Form.Item label={intl.get('NormalTransForm.ConfirmForm.inputData')}>
                      {
                        getFieldDecorator('inputData', { initialValue: data })(
                          <Input.TextArea disabled={true} />
                        )
                      }
                    </Form.Item>
                  }
                </div>
              )
          }
        </Form>
      </Modal>
    );
  }
}

export default ConfirmForm;
