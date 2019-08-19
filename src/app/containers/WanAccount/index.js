import wanUtil from 'wanchain-util';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Row, Col, message, Tooltip, Icon } from 'antd';

import './index.less';
import totalImg from 'static/image/wan.png';
import { WANPATH, WALLETID } from 'utils/settings';
import TransHistory from 'components/TransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans';
import { checkAddrType, hasSameName } from 'utils/helper';
import { EditableFormRow, EditableCell } from 'components/Rename';
import arrow from 'static/image/arrow.png';

const CHAINTYPE = 'WAN';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.wanAddress.getAddrList,
  getAmount: stores.wanAddress.getNormalAmount,
  transParams: stores.sendTransParams.transParams,
  addAddress: newAddr => stores.wanAddress.addAddress(newAddr),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateName: (arr, type) => stores.wanAddress.updateName(arr, type),
}))

@observer
class WanAccount extends Component {
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
      editable: true,
      width: '15%'
    },
    {
      dataIndex: 'address',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>,
      width: '50%'
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
      width: '20%'
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><SendNormalTrans buttonClassName='actionButton' from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE} /></div>,
      width: '10%'
    },
    {
      dataIndex: '',
      key: 'expand',
      width: '5%'
    }
  ];

  columnsTree = this.columns.map((col) => {
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
    const { addrInfo, addAddress } = this.props;
    const addrLen = Object.keys(addrInfo['normal']).length;
    this.setState({
      bool: false
    });

    if (this.state.bool) {
      let path = `${WANPATH}${addrLen}`;
      wand.request('address_getOne', { walletID: WALLETID.NATIVE, chainType: CHAINTYPE, path: path }, (err, val_address_get) => {
        if (!err) {
          wand.request('account_create', { walletID: WALLETID.NATIVE, path: path, meta: { name: `Account${addrLen + 1}`, addr: `0x${val_address_get.address}` } }, (err, val_account_create) => {
            if (!err && val_account_create) {
              let addressInfo = {
                start: addrLen,
                address: wanUtil.toChecksumAddress(`0x${val_address_get.address}`)
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
      this.props.updateName(row, 'normal');
    }
  }

  customExpandIcon = props => {
    let text;
    if (props.expanded) {
      text = 'arrow-down';
    } else {
      text = 'arrow-right';
    }
    return (
      <img
        src={arrow}
        onClick={e => props.onExpand(props.record, e)}
        className={text}
        style={{ width: '12px', height: '10px', cursor: 'pointer' }}
      />
    );
  }

  expandContent = record => {
    const privateAddress = "0x022b49af7f2a4fd132acee36ce22a81e89f5abc9c824e2cee5e193f8c3b43c314d02aefe897a20968f424dbef269e4aad165a631097548e9fb20c4932beb152e9d32";
    return (
      <table style={{ width: 'calc(100% + 32px)', position: 'relative', left: '-16px' }}>
        <tbody>
          <tr>
            <td style={{ width: '15%', padding: '0px 16px' }}></td>
            <td style={{ width: '50%', padding: '0px 16px' }}>
              <div className="addrText">
                <p className="privateAddress">
                  <Tooltip placement="bottomLeft" title={privateAddress} overlayStyle={{width: 400}} >{privateAddress}</Tooltip>
                  {privateAddress}
                </p>
                <CopyAndQrcode addr={privateAddress} />
                <Tooltip placement="bottom" title={'Question'}><Icon type="question-circle" style={{marginLeft: '5px'}} /></Tooltip>
              </div>
            </td>
            <td style={{ width: '20%', padding: '0px 16px' }}>100.00</td>
            <td style={{ width: '10%', padding: '0px 16px' }}><Button className="redeemButton" type="primary">{intl.get('WanAccount.redeem')}</Button></td>
            <td style={{ width: '5%', padding: '0px 16px' }}></td>
          </tr>
        </tbody>
      </table>
    )
  };

  render() {
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
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} alt={intl.get('WanAccount.wanchain')} /><span className="wanTotal">{getAmount}</span><span className="wanTex">{intl.get('WanAccount.wan')}</span></Col>
          <Col span={12} className="col-right">
            <Button className="creatBtn" type="primary" shape="round" size="large" onClick={this.creatAccount}>{intl.get('WanAccount.create')}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getAddrList}
              expandedRowRender={this.expandContent} expandIconAsCell={false} expandIconColumnIndex={4} expandIcon={this.customExpandIcon} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TransHistory name={['normal', 'import']} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;
