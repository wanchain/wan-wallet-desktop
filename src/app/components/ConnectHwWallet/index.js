import React, { Component } from 'react';
import { Button, Card, Modal, Table, message } from 'antd';
// import './index.less';
import HwWallet from 'utils/HwWallet';


class Connect extends Component {
  constructor(props) {
    super(props);
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
    this.props.getPublicKey((err, result) => {
      if (err) {
        let msg = 'Get public key error';
        console.log(msg, err);
        message.warn(msg);
      } else {
        this.publicKey = result.publicKey;
        this.chainCode = result.chainCode;
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
    let wallet = new HwWallet(this.publicKey, this.chainCode, this.props.dPath);
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
        <Card title="Connect a Hardware Wallet" bordered={false}>
          <this.props.Instruction />
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




