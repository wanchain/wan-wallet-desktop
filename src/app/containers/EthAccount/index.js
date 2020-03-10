import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Row, Col, message } from 'antd';

import totalImg from 'static/image/eth.png';
import { ETHPATH, WALLETID } from 'utils/settings';
import TransHistory from 'components/TransHistory/ETHTransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans/SendETHNormalTrans';
import { checkAddrType, hasSameName, getWalletIdByType } from 'utils/helper';
import { EditableFormRow, EditableCell } from 'components/Rename';

const CHAINTYPE = 'ETH';

@inject(stores => ({
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.ethAddress.getAddrList,
  getAmount: stores.ethAddress.getNormalAmount,
  transParams: stores.sendTransParams.transParams,
  addAddress: newAddr => stores.ethAddress.addAddress(newAddr),
  updateTransHistory: () => stores.ethAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateName: (arr, type) => stores.ethAddress.updateName(arr, type),
}))

@observer
class EthAccount extends Component {
  constructor (props) {
    super(props);
    this.state = {
      bool: true,
      isUnlock: false,
    }
    this.props.updateTransHistory();
    this.props.changeTitle('WanAccount.wallet');
  }

  columns = [
    {
      dataIndex: 'name',
      editable: true
    },
    {
      dataIndex: 'address',
      render: (text, record) => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} type={CHAINTYPE} path={record.path} wid={record.wid} name={record.name} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><SendNormalTrans balance={record.balance} from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE}/></div>
    }
  ];

  columnsTree = this.columns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: record => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: this.handleSave,
      }),
    };
  });

  componentDidMount () {
    this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  handleSend = from => {
    let params = this.props.transParams[from];
    let walletID = getWalletIdByType(checkAddrType(from, this.props.addrInfo));
    let trans = {
      walletID: walletID,
      chainType: CHAINTYPE,
      symbol: CHAINTYPE,
      path: params.path,
      to: params.to,
      amount: params.amount,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
      nonce: params.nonce,
      data: params.data
    };
    return new Promise((resolve, reject) => {
      wand.request('transaction_normal', trans, function (err, txHash) {
        if (err) {
          message.warn(intl.get('WanAccount.sendTransactionFailed'));
          console.log(err);
          reject(false); // eslint-disable-line prefer-promise-reject-errors
        } else {
          this.props.updateTransHistory();
          console.log('Tx hash: ', txHash);
          resolve(txHash)
        }
      }.bind(this));
    })
  }

  creatAccount = () => {
    const { addrInfo, addAddress } = this.props;
    const addrLen = Object.keys(addrInfo['normal']).length;
    this.setState({
      bool: false
    });

    if (this.state.bool) {
      let path = `${ETHPATH}${addrLen}`;
      wand.request('address_getOne', { walletID: WALLETID.NATIVE, chainType: CHAINTYPE, path: path }, (err, val_address_get) => {
        if (!err) {
          wand.request('account_create', { walletID: WALLETID.NATIVE, path: path, meta: { name: `ETH-Account${addrLen + 1}`, addr: `0x${val_address_get.address}` } }, (err, val_account_create) => {
            if (!err && val_account_create) {
              let addressInfo = {
                start: addrLen,
                address: `0x${val_address_get.address}`
              }
              addAddress(addressInfo);
              this.setState({
                bool: true
              });
            }
          });
        }
      });
    }
  }

  handleSave = row => {
    if (hasSameName('normal', row, this.props.addrInfo)) {
      message.warn(intl.get('WanAccount.notSameName'));
    } else {
      this.props.updateName(row, row.wid);
    }
  }

  render () {
    const { getAmount, getAddrList } = this.props;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    this.props.language && this.columnsTree.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} alt={intl.get('WanAccount.wanchain')} /> <span className="wanTotal">{getAmount}</span><span className="wanTex">ETH</span></Col>
          <Col span={12} className="col-right">
          <Button className="createBtn" type="primary" shape="round" size="large" onClick={this.creatAccount}>{intl.get('Common.create')}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getAddrList} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TransHistory name={['normal']} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default EthAccount;
