import React, { Component } from 'react';
import { Button, Modal, Table } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';

import './index.less';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
}))

@observer
class RefundOTAConfirmForm extends Component {
  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    this.props.sendTrans();
  }

  columns = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 100,
    },
    {
      title: 'Gas Price',
      dataIndex: 'gasPrice',
      width: 120,
    },
    {
      title: 'Gas Limit',
      dataIndex: 'gasLimit',
      width: 120,
    },
    {
      title: 'Fee',
      dataIndex: 'fee',
      width: 120,
      render: (text, record, index) => {
        return new BigNumber(record.gasPrice).times(record.gasLimit).div(BigNumber(10).pow(9)).toString(10);
      }
    },
    {
      title: 'From',
      dataIndex: 'from',
      width: 400,
    },
    {
      title: 'OTA',
      dataIndex: 'OTA',
    },
  ];

  render() {
    const { visible, form, sendTrans, data } = this.props;
    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title={'Refund confirm'}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('NormalTransForm.ConfirmForm.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" onClick={sendTrans}>{intl.get('NormalTransForm.ConfirmForm.send')}</Button>,
        ]}
      >
        <div className="selectPrivateTransactionTable">
          <Table columns={this.columns} dataSource={data} rowKey={record => record.OTA} pagination={false} style={{ minWidth: 2000 }} />
        </div>
      </Modal>
    );
  }
}

export default RefundOTAConfirmForm;
