import React, { Component } from 'react';
import { Button, Card, Modal, Table, message } from 'antd';
import './index.less';
import HwWallet from 'utils/HwWallet';


class Connect extends Component {
  constructor(props) {
    super(props);
    this.wanPath = "m/44'/60'/0'";
    this.walletId = 0x02;
    this.columns = [{ title: "Address", dataIndex: "address" }, { title: "Balance", dataIndex: "balance" }];
    this.pageSize = 5;
    this.page = 0;
    this.selectedAddrs = [];
    this.state = {
      visible: false,
      addresses: [],
    };
  }

  resetStateVal = () => {
    this.page = 0;
    this.selectedAddrs = [];
    this.setState({
      visible: false,
      addresses: [],
    });
  }

  handleOk = () => {
    this.props.setAddresses(this.selectedAddrs);
    this.resetStateVal();
  }

  handleCancel = () => {
    this.resetStateVal();
  }

  showDefaultPageAddrsFromHd = () => {
    wand.request('address_getPublicKey', { walletId: this.walletId, path: this.wanPath }, (err, result) => {
      if (err) {
        let msg = 'Get public key error';
        console.log(msg, err);
        message.warn(msg);
      } else {
        this.publicKey = result.payload.publicKey;
        let addresses = this.deriveAddresses(this.page * this.pageSize, this.pageSize);
        this.setState({ visible: true, addresses: addresses });
      }
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
    let wallet = new HwWallet(this.publicKey, this.wanPath);
    let hdKeys = wallet.getHdKeys(start, limit);
    let addresses = [];
    hdKeys.forEach(hdKey => {
      addresses.push({ key: hdKey.address, address: hdKey.address, balance: 0, path: hdKey.path });
    });
    return addresses;
  }

  delAddr = (array, addr) => {
    let index = array.findIndex(item => item.address === addr.address);
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  rowSelection = {
    onSelect: (record, selected, selectedRows) => {
      if (selected) {
        this.selectedAddrs.push(record);
      } else {
        this.delAddr(this.selectedAddrs, record);
      }
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      if (selected) {
        this.selectedAddrs = this.selectedAddrs.concat(changeRows);
      } else {
        for (let i = 0; i < changeRows.length; i++) {
          this.delAddr(this.selectedAddrs, changeRows[i]);
        }
      }
    },
  };


  render() {
    return (
      <div>
        <Card title="Connect a Ledger Wallet" bordered={false}>
          <h1 className="com-yellow">Please follow the below instructions to connect your Ledger wallet:</h1>
          <h2 className="com-white">1. Connect your Ledger wallet directly to your computer.</h2>
          <h2 className="com-white">2. Enter pin code to unlock your Ledger wallet.</h2>
          <h2 className="com-white">3. Navigate to Wanchain APP and enter into it.</h2>
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

export default Connect;




