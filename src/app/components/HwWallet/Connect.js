import React, { Component } from 'react';
import { Button, Card, Modal, Table, message } from 'antd';

import HwWallet from 'utils/HwWallet';
import { getBalance } from 'utils/helper';

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
  }

  handleCancel = () => {
    this.resetStateVal();
  }

  showDefaultPageAddrsFromHd = () => {
    this.props.getPublicKey((err, result) => {
      if (err) {
        let msg = 'Connect failed';
        console.log(msg, err);
        message.warn(msg);
      } else {
        this.publicKey = result.publicKey;
        this.chainCode = result.chainCode;
        this.deriveAddresses(this.page * this.pageSize, this.pageSize, true);
      }
    });
  }

  showNextPageAddrs = () => {
    this.page++;
    this.deriveAddresses(this.page * this.pageSize, this.pageSize);
  }

  showPreviousPageAddrs = () => {
    if (this.page === 0) {
      return;
    }
    this.page--;
    this.deriveAddresses(this.page * this.pageSize, this.pageSize);
  }

  deriveAddresses =  (start, limit, visible = false) => {
    let wallet = new HwWallet(this.publicKey, this.chainCode, this.props.dPath);
    let hdKeys = wallet.getHdKeys(start, limit);
    let addresses = [];
    hdKeys.forEach(hdKey => {
      addresses.push({ key: hdKey.address, address: hdKey.address, balance: 0, path: hdKey.path });
    });
    getBalance(addresses.map(item => item.address)).then(res => {
      let addrList = Object.keys(res)
      if (res && addrList.length) {
        addresses.forEach(item => {
          if(addrList.includes(item.address)) {
            item.balance = res[item.address].balance;
          }
        })
        console.log(addresses, 'addressesaddressesaddressesaddresses')
        if(visible) {
          this.setState({ visible: true, addresses: addresses });
        } else {
          this.setState({ addresses: addresses });
        }
      }
    }).catch(err => {
      console.log(err);
    })
  }

  delAddr = (array, addr) => {
    if (array.indexOf(addr) !== -1) {
      array.splice(index, 1);
    }
  }

  rowSelection = {
    onSelect: (record, selected) => {
      if (selected) {
        this.selectedAddrs.push(record.address);
      } else {
        this.delAddr(this.selectedAddrs, record.address);
      }
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      if (selected) {
        this.selectedAddrs = this.selectedAddrs.concat(changeRows.map(item => item.address));
      } else {
        for (let i = 0; i < changeRows.length; i++) {
          this.delAddr(this.selectedAddrs, changeRows[i].address);
        }
      }
    },
  };


  render() {
    const { visible, addresses } = this.state;

    return (
      <div>
        <Card title="Connect a Hardware Wallet" bordered={false}>
          <this.props.Instruction />
          <Button type="primary" onClick={this.showDefaultPageAddrsFromHd}>Continue</Button>
          <Modal destroyOnClose={true} title="Please select the addresses" visible={visible} onOk={this.handleOk} onCancel={this.handleCancel} className="popTable">
            <div>
              <Table rowSelection={this.rowSelection} pagination={false} columns={this.columns} dataSource={addresses}></Table>
              <div className='rollPage'>
                { this.page !== 0 ? <p onClick={this.showPreviousPageAddrs} className="previousPage">Previous addresses</p> : ''}
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




