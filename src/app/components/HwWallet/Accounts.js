import React, { Component } from 'react';
import { Table, message, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import TransHistory from 'components/TransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans';
import { EditableFormRow, EditableCell } from 'components/Rename';

@inject(stores => ({
  rawTx: stores.sendTransParams.rawTx,
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class Accounts extends Component {
  columns = [
    { 
      dataIndex: "name", 
      editable: true 
    },
    { 
      dataIndex: "address", 
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    { 
      dataIndex: "balance" 
    },
    { 
      dataIndex: "action", 
      render: (text, record) => <div><SendNormalTrans path={record.path} from={record.address} handleSend={this.handleSend} chainType={this.props.chainType} /></div> 
    }
  ];

  columnsTree = this.columns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: record => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: this.handleSave,
      }),
    };
  });

  handleSave = row => {
    console.log(row, 'handleSave')
  }

  handleSend = from => {
    const { rawTx } = this.props;
    let params = this.props.transParams[from];
    return new Promise((resolve, reject)=> {
      this.props.signTransaction(params.path, rawTx, (err, raw) => {
        wand.request('transaction_raw', { raw, chainType: 'WAN' }, (err, txHash) => {
          if (err) {
            message.warn(intl.get('HwWallet.Accounts.sendTransactionFailed'));
            console.log(err);
            reject();
          } else {
            let params = {
              txHash,
              from: from.toLowerCase(),
              srcSCAddrKey: 'WAN',
              srcChainType: 'WAN',
              tokenSymbol: 'WAN',
              ...rawTx
            }
            wand.request('transaction_insertTransToDB', {rawTx: params}, () => {
              this.props.updateTransHistory();
            })
            resolve();
            console.log("TxHash:", txHash);
          }
        });
      });
    })
  }

  render() {
    const { name, addresses } = this.props;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    this.props.language && this.columnsTree.forEach(col => {
      col.title = intl.get(`HwWallet.Accounts.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} pagination={false} columns={this.columnsTree} dataSource={addresses}></Table>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TransHistory name={name}/>
          </Col>
        </Row>
      </div>
    )
  }
}

export default Accounts;