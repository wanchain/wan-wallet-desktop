import React, { Component } from 'react';
import { Table, message, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import TransHistory from 'components/TransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans';

@inject(stores => ({
  rawTx: stores.sendTransParams.rawTx,
  transParams: stores.sendTransParams.transParams,
  language: stores.session.language,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class Accounts extends Component {
  columns = [
    { title: intl.get('HwWallet.Accounts.name'), dataIndex: "name" },
    { title: intl.get('HwWallet.Accounts.address'), dataIndex: "address", render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>},
    { title: intl.get('HwWallet.Accounts.balance'), dataIndex: "balance" },
    { title: intl.get('HwWallet.Accounts.action'), dataIndex: "action", render: (text, record) => <div><SendNormalTrans path={record.path} from={record.address} handleSend={this.handleSend} chainType={this.props.chainType} /></div> }
  ];

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
 
    return (
      <div className="account">
        <Row className="mainBody">
          <Col>
            <Table pagination={false} columns={this.columns} dataSource={addresses}></Table>
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