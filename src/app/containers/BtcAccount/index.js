import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Row, Col, message } from 'antd';

import './index.less';
import totalImg from 'static/image/btc.png';
import { WALLETID } from 'utils/settings';
import TransHistory from 'components/TransHistory/EthTransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans/SendETHNormalTrans';
import { checkAddrType, hasSameName, createBTCAddr } from 'utils/helper';
import { EditableFormRow, EditableCell } from 'components/Rename';

const CHAINTYPE = 'BTC';

@inject(stores => ({
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.btcAddress.getAddrList,
  getAmount: stores.btcAddress.getNormalAmount,
  transParams: stores.sendTransParams.transParams,
  addAddress: newAddr => stores.btcAddress.addAddress(newAddr),
  updateTransHistory: () => stores.btcAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateName: (arr, type) => stores.btcAddress.updateName(arr, type),
}))

@observer
class BtcAccount extends Component {
  state = {
    bool: true,
    isUnlock: false,
  }

  constructor (props) {
    super(props);
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
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><SendNormalTrans from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE}/></div>
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
    let walletID = checkAddrType(from, this.props.addrInfo) === 'normal' ? WALLETID.NATIVE : WALLETID.KEYSTOREID;
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
    const { addrInfo, addAddress, btcPath } = this.props;
    const addrLen = Object.keys(addrInfo.normal).length;
    this.setState({
      bool: false
    });

    if (this.state.bool) {
      createBTCAddr(btcPath, addrLen).then(addressInfo => {
        addAddress(addressInfo);
        this.setState({
          bool: true
        });
      }).catch(err => {
        console.log(err);
      })
    }
  }

  handleSave = row => {
    if (hasSameName('normal', row, this.props.addrInfo)) {
      message.warn(intl.get('WanAccount.notSameName'));
    } else {
      this.props.updateName(row, 'normal');
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
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} alt={intl.get('WanAccount.wanchain')} /> <span className="wanTotal">{getAmount}</span><span className="wanTex">{intl.get('menuConfig.btc')}</span></Col>
          <Col span={12} className="col-right">
          <Button className="creatBtn" type="primary" shape="round" size="large" onClick={this.creatAccount}>{intl.get('WanAccount.create')}</Button>
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

export default BtcAccount;