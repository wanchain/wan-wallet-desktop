import React, { Component } from "react";
import { Table, message } from "antd";
import "./index.less";
import SendNormalTrans from 'components/SendNormalTrans';
import TrezorConnect from 'trezor-connect';
import BigNumber from "bignumber.js";
const wanTx = require('wanchainjs-tx');
import { observer, inject } from 'mobx-react';


@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  updateGasPrice: (addr, gasPrice) => stores.sendTransParams.updateGasPrice(addr, gasPrice),
  updateGasLimit: (addr, gasLimit) => stores.sendTransParams.updateGasLimit(addr, gasLimit),
  updateNonce: (addr, nonce) => stores.sendTransParams.updateNonce(addr, nonce)
}))

@observer
class Accounts extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      { title: "NAME", dataIndex: "name" },
      { title: "ADDRESS", dataIndex: "address" },
      { title: "BALANCE", dataIndex: "balance" },
      { title: "ACTION", render: (record) => <div> <SendNormalTrans path={record.path} from={record.address} handleSend={this.handleSend} /> </div> }
    ];
  }

  handleSend = (from) => {
    let params = this.props.transParams[from];
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
    
    TrezorConnect.ethereumSignTransaction({
      path: params.path,
      transaction: {
        to: rawTx.to,
        value: rawTx.value,
        data: rawTx.data,
        chainId: rawTx.chainId,
        nonce: rawTx.nonce,
        gasLimit: rawTx.gasLimit,
        gasPrice: rawTx.gasPrice,
        txType: rawTx.Txtype,
      },
    }).then((result) => {
      if (!result.success) {
        message.warn("Sign transaction failed. Please try again");
        console.log(result);
        return;
      }

      rawTx.v = result.payload.v;
      rawTx.r = result.payload.r;
      rawTx.s = result.payload.s;
      console.log("trans", rawTx)
      let eTx = new wanTx(rawTx);
      let signedTx = '0x' + eTx.serialize().toString('hex');
      console.log(signedTx);
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
    return (
      <div>
        <Table
          rowSelection={this.rowSelection}
          pagination={false}
          columns={this.columns}
          dataSource={this.props.addresses}>
        </Table>
      </div>
    )
  }
}

export default Accounts;