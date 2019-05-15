import React, { Component } from "react";
import { Table, message, Row, Col } from "antd";
import BigNumber from "bignumber.js";
import { observer, inject } from 'mobx-react';

import TransHistory from 'components/TransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans';

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  updateNonce: (addr, nonce) => stores.sendTransParams.updateNonce(addr, nonce),
  updateGasPrice: (addr, gasPrice) => stores.sendTransParams.updateGasPrice(addr, gasPrice),
  updateGasLimit: (addr, gasLimit) => stores.sendTransParams.updateGasLimit(addr, gasLimit),
}))

@observer
class Accounts extends Component {
  columns = [
    { title: "NAME", dataIndex: "name" },
    { title: "ADDRESS", dataIndex: "address", render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>},
    { title: "BALANCE", dataIndex: "balance" },
    { title: "ACTION", render: record => <div><SendNormalTrans path={record.path} from={record.address} handleSend={this.handleSend} chainType={this.props.chainType} /></div> }
  ];

  handleSend = from => {
    console.log("from", from)
    let params = this.props.transParams[from];
    console.log(params);
    let rawTx = {
      to: params.to,
      value: '0x' + new BigNumber(params.amount).times(BigNumber(10).pow(18)).toString(16),
      data: params.data,
      chainId: params.chainId,
      nonce: '0x' + params.nonce.toString(16),
      gasLimit: '0x' + params.gasLimit.toString(16),
      gasPrice: '0x' + new BigNumber(params.gasPrice).times(BigNumber(10).pow(9)).toString(16),
      Txtype: params.txType
    };
    console.log("raw", rawTx)

    this.props.signTransaction(params.path, rawTx, (signedTx) => {
      console.log('signedTx', signedTx)
      wand.request('transaction_raw', { raw: signedTx, chainType: 'WAN' }, (err, val) => {
        if (err) {
          message.warn("Send transaction failed. Please try again");
          console.log(err);
        } else {
          console.log("TxHash:", val);
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
            <Table rowSelection={this.rowSelection} pagination={false} columns={this.columns} dataSource={addresses}></Table>
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