import React, { Component } from 'react';
import { Button, Card, Modal, Table, message } from 'antd';

import HwWallet from 'utils/HwWallet';
import { getBalance } from 'utils/helper';

class Connect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      addresses: [],
    };
    this.page = 0;
    this.pageSize = 5;
    this.selectedAddrs = [];
    this.columns = [{ title: 'Address', dataIndex: 'address' }, { title: 'Balance', dataIndex: 'balance' }];
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

  showDefaultPageAddrsFromHd = () => {
    this.props.getPublicKey((err, result) => {
      if (err) {
        message.warn('Connect failed');
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
      if (res && Object.keys(res).length) {
        addresses.forEach(item => {
          if(Object.keys(res).includes(item.address)) {
            item.balance = res[item.address];
          }
        })
        visible ? this.setState({ visible: true, addresses: addresses }) : this.setState({ addresses: addresses });
      }
    }).catch(err => {
      console.log('err', err);
    })
  }

  delAddr = addrInfo => {
    let index = this.selectedAddrs.findIndex(item => item.address === addrInfo.address);
    if (index !== -1) {
      this.selectedAddrs.splice(index, 1);
    }
  }

  rowSelection = {
    onSelect: (record, selected) => {
      if (selected) {
        this.selectedAddrs.push({...record});
      } else {
        this.delAddr(record);
      }
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      if (selected) {
        this.selectedAddrs.push(...changeRows.map(item => ({...item})));
      } else {
        changeRows.forEach(item => { this.delAddr(item) });
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
          <Modal destroyOnClose={true} title="Please select the addresses" visible={visible} onOk={this.handleOk} onCancel={this.resetStateVal} className="popTable">
            <div>
              <Table rowSelection={this.rowSelection} pagination={false} columns={this.columns} dataSource={addresses}></Table>
              <div className="rollPage">
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




