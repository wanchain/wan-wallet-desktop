import React, { Component } from "react";
import { Table, message } from "antd";
import "./index.less";
import SendNormalTrans from 'components/SendNormalTrans';
import TrezorConnect from 'trezor-connect';
import BigNumber from "bignumber.js";


class Accounts extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      { title: "Name", dataIndex: "name" },
      { title: "Address", dataIndex: "address" },
      { title: "Balance", dataIndex: "balance" },
      { title: "Action", render: (record) => <div> <SendNormalTrans path={record.path} from={record.address} handleSend={this.handleSend} /> </div> }
    ];
  }

  handleSend = (params) => {
    console.log("account", params)
    // wand.request('address_getNonce', { addr: params.from, chainType: 'WAN' }, (err, val) => {
    //   console.log(this.props.from)
    //   console.log(val);
    //   console.log("err", err)
    // });
    let transaction = {
      to: params.to,
      value: new BigNumber(params.amount).times(BigNumber(10).pow(18)).toString(16),
      data: '',
      chainId: 1,
      nonce: "0x0",
      gasLimit: params.gasLimit.toString(16),
      gasPrice: new BigNumber(params.gasPrice).times(BigNumber(10).pow(9)).toString(16),
      txType: 1,
    };
    // let transaction = {
    //   to: "0xeD1Baf7289c0acef52dB0c18E1198768EB06247e",
    //   value: "0x06f05b59d3b20000",
    //   data: '',
    //   chainId: 1,
    //   nonce: "0x0",
    //   gasLimit: "0x5208",
    //   gasPrice: "0x2a600b9c00",
    //   txType: 1,
    // };

    console.log("trans", transaction)

    TrezorConnect.ethereumSignTransaction({
      path: params.path,
      transaction: transaction
    }).then((result) => {
      console.log(result)
      if (!result.success) {
        message.warn("Sign transaction failed. Please try again");
        return;
      }

      transaction.v = result.payload.v;
      transaction.r = result.payload.r;
      transaction.s = result.payload.s;
      let eTx = new ethUtil.Tx(transaction);
      // rawTx.rawTx = JSON.stringify(rawTx);
      let signedTx = '0x' + eTx.serialize().toString('hex')
    });
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