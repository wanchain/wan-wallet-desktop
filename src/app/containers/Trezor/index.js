import React, { Component } from 'react';
import { Button, Card, Modal, Input, Checkbox, Table } from 'antd';
import './index.less';
import TrezorConnect from 'trezor-connect';
const { TRANSPORT_EVENT, UI, UI_EVENT, DEVICE_EVENT, DEVICE } = require('trezor-connect');
import HwWallet from 'utils/HwWallet';
const CheckboxGroup = Checkbox.Group;

// Initialize TrezorConnect 
TrezorConnect.init({
  // connectSrc: 'file://' + __dirname + '/trezor-connect/', // for trezor-connect hosted locally set endpoint to application files (ignore this field for connect hosted online, connect.trezor.io will be used by default)
  connectSrc: 'https://sisyfos.trezor.io/connect-electron/',
  popup: true, // use trezor-connect UI, set it to "false" to get "trusted" mode and get more UI_EVENTs to render your own UI
  webusb: false, // webusb is not supported in electron
  debug: true, // see whats going on inside iframe
  lazyLoad: true, // set to "false" if you want to start communication with bridge on application start (and detect connected device right away)
  // or set it to true, then trezor-connect not will be initialized unless you call some TrezorConnect.method() (this is useful when you dont know if you are dealing with Trezor user)
  manifest: {
    email: 'email@developer.com',
    appUrl: 'electron-app-boilerplate'
  }
})
  .then(() => {
    console.log("TrezorConnect is ready! Enjoy")
  })
  .catch(error => {
    console.error('TrezorConnect init error', error)
  });

class Trezor extends Component {
  constructor(props) {
    super(props);
    this.wanPath = "m/44'/5718350'/0'/0";
    this.columns = [{ title: "Address", dataIndex: "address" }, { title: "Balance", dataIndex: "balance" }];
    this.pageSize = 5;
    this.page = 0;
    this.state = {
      visible: false,
      addresses: [],
    };
  }

  resetStateVal = () => {
    this.page = 0;
    this.setState({
      visible: false,
      addresses: [],
    });
  }

  handleOk = () => {
    this.resetStateVal();
  }

  handleCancel = () => {
    this.resetStateVal();
  }

  showDefaultPageAddrsFromHd = () => {
    TrezorConnect.getPublicKey({
      path: this.wanPath
    }).then((result) => {
      this.publicKey = result.payload.publicKey;
      this.chainCode = result.payload.chainCode;
      let addresses = this.deriveAddresses(this.page * this.pageSize, this.pageSize);
      this.setState({ visible: true, addresses: addresses });
    }).catch(error => {
      console.error('get public key error', error)
    });
  }

  showNextPageAddrs = () => {
    this.page++;
    let addresses = this.deriveAddresses(this.page * this.pageSize, this.pageSize);
    this.setState({ addresses: addresses });
  }

  showPreviousPageAddrs = () => {
    if (this.page === 0) {
      return;
    }
    this.page--;
    let addresses = this.deriveAddresses(this.page * this.pageSize, this.pageSize);
    this.setState({ addresses: addresses });
  }

  deriveAddresses = (start, limit) => {
    let wallet = new HwWallet(this.publicKey, this.chainCode, this.wanPath);
    let HdKeys = wallet.getHdKeys(start, limit);
    let addresses = [];
    HdKeys.forEach(address => {
      addresses.push({ key: address.address, address: address.address, balance: 0 });
    });
    return addresses;
  }

  rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
  };


  render() {
    return (
      <div>
        <Card title="Connect a Trezor Wallet" bordered={false}>
          <p>Please connect your Trezor wallet directly to your computer</p>
          <br />
          <Button type="primary" onClick={() => this.showDefaultPageAddrsFromHd()}>Continue</Button>
          <Modal
            destroyOnClose={true}
            title="Please select the addresses"
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <div>
              {/* <Table rowSelection={this.rowSelection} pagination={{defaultPageSize: this.pageSize, onChange: this.pageChange}} columns={this.columns} dataSource={this.state.addresses}></Table> */}
              <Table rowSelection={this.rowSelection} pagination={false} columns={this.columns} dataSource={this.state.addresses}></Table>
              <div className='rollPage'>
                {this.page !== 0 ? <p onClick={this.showPreviousPageAddrs} className="previousPage">Previous addresses</p> : ''}
                <p onClick={this.showNextPageAddrs} className="nextPage">Next addresses</p>
              </div>
            </div>
          </Modal>
        </Card>
      </div>
    );
  }
}

export default Trezor;



