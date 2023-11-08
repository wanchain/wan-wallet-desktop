import React, { Component } from 'react';
import { Button, Card, Modal, Table, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import wanUtil from 'wanchain-util';
import style from './index.less';
import HwWallet from 'utils/HwWallet';
import { getBalance } from 'utils/helper';
import { toChecksumAddress } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  selectAddrColumns: stores.languageIntl.selectAddrColumns,
}))

@observer
class Connect extends Component {
  constructor (props) {
    super(props);
    this.state = {
      visible: false,
      addresses: [],
    };
    this.page = 0;
    this.pageSize = 5;
    this.selectedAddrs = [];
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
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

  handleCancel = () => {
    this.resetStateVal();
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }

  handleOk = () => {
    this.props.setAddresses(this.selectedAddrs);
  }

  showDefaultPageAddrsFromHd = () => {
    this.props.getPublicKey((err, result) => {
      if (err) {
        message.warn(intl.get('HwWallet.Connect.connectFailed'));
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

  deriveAddresses = (start, limit, visible = false) => {
    let wallet = new HwWallet(this.publicKey, this.chainCode, this.props.dPath);
    let hdKeys = wallet.getHdKeys(start, limit);
    let addresses = [];
    hdKeys.forEach(hdKey => {
      addresses.push({ key: hdKey.address, address: toChecksumAddress(hdKey.address), balance: 0, path: hdKey.path });
    });
    visible ? this.setState({ visible: true, addresses: addresses }) : this.setState({ addresses: addresses });
    getBalance(addresses.map(item => item.address), 'WAN').then(res => {
      if (res && Object.keys(res).length) {
        let addresses = this.state.addresses;
        addresses.forEach(item => {
          let found = Object.keys(res).find(addr => addr.toLowerCase() === item.address.toLowerCase());
          if (found !== undefined) {
            item.balance = res[found];
          }
        })
        this.setState({
          addresses
        })
      }
    }).catch(err => {
      console.log('Derive addresses failed:', err);
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
        this.selectedAddrs.push({ ...record });
      } else {
        this.delAddr(record);
      }
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      if (selected) {
        this.selectedAddrs.push(...changeRows.map(item => ({ ...item })));
      } else {
        changeRows.forEach(item => { this.delAddr(item) });
      }
    },
  };

  render () {
    const { visible, addresses } = this.state;

    return (
      <div>
        <Card title={intl.get('HwWallet.Connect.connectAHardwareWallet')} bordered={false}>
          <this.props.Instruction />
          <Button type="primary" onClick={this.showDefaultPageAddrsFromHd}>{intl.get('HwWallet.Connect.continue')}</Button>
          <Modal wrapClassName={style.connectModal} destroyOnClose={true} title={intl.get('HwWallet.Connect.selectAddress')} visible={visible} onOk={this.handleOk} onCancel={this.handleCancel} okText={intl.get('Common.ok')} cancelText={intl.get('Common.cancel')} className={style.popTable}>
            <div>
              <Table scroll={{ x: 540 }} rowSelection={this.rowSelection} pagination={false} columns={this.props.selectAddrColumns} dataSource={addresses}></Table>
              <div className={style.rollPage}>
                {this.page !== 0
                  ? <p onClick={this.showPreviousPageAddrs} className={style.previousPage}>{intl.get('HwWallet.Connect.previousAddresses')}</p>
                  : ''
                }
                <p onClick={this.showNextPageAddrs} className={style.nextPage}>{intl.get('HwWallet.Connect.nextAddresses')}</p>
              </div>
            </div>
          </Modal>
        </Card>
      </div>
    );
  }
}

export default Connect;
