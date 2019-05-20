import React, { Component } from 'react';
import { Table, message, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import TransHistory from 'components/TransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans';

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class Accounts extends Component {
  columns = [
    { title: "NAME", dataIndex: "name" },
    { title: "ADDRESS", dataIndex: "address", render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>},
    { title: "BALANCE", dataIndex: "balance" },
    { title: "ACTION", dataIndex: "action", render: (text, record) => <div><SendNormalTrans path={record.path} from={record.address} handleSend={this.handleSend} chainType={this.props.chainType} /></div> }
  ];

  handleSend = (from, rawTx) => {
    let params = this.props.transParams[from];
    this.props.signTransaction(params.path, rawTx, raw => {
      wand.request('transaction_raw', { raw, chainType: 'WAN' }, (err, txHash) => {
        if (err) {
          message.warn("Send transaction failed. Please try again");
          console.log(err);
        } else {
          let params = {
            txHash,
            from: from.toLowerCase(),
            srcSCAddrKey: 'WAN',
            srcChainType: 'WAN',
            tokenSymbol: 'ETH',
            ...rawTx
          }
          console.log(params, 'paramsparamsparamsparams')
          wand.request('transaction_insertTransToDB', {rawTx: params}, () => {
            this.props.updateTransHistory();
          })
          console.log("TxHash:", txHash);
        }
      });
    });

    this.setState({ visible: true });
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