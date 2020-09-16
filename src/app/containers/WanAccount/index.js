/* eslint-disable prefer-promise-reject-errors */
import wanUtil, { toChecksumOTAddress } from 'wanchain-util';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Row, Col, message, Tooltip, Icon, Tag } from 'antd';

import style from './index.less';
import totalImg from 'static/image/wan.png';
import { WANPATH, WALLETID } from 'utils/settings';
import WANTransHistory from 'components/WANTransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans';
import RedeemFromPrivate from 'components/RedeemFromPrivate';

import { hasSameName, checkAddrType, getWalletIdByType, createWANAddr } from 'utils/helper';
import { EditableFormRow, EditableCell } from 'components/Rename';
import arrow from 'static/image/arrow.png';

const CHAINTYPE = 'WAN';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.wanAddress.getAddrList,
  getAmount: stores.wanAddress.getAllAmount,
  transParams: stores.sendTransParams.transParams,
  addAddress: newAddr => stores.wanAddress.addAddress(newAddr),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateName: (arr, type) => stores.wanAddress.updateName(arr, type),
}))

@observer
class WanAccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bool: true,
      isUnlock: false,
      expanded: false,
      expandedRows: []
    }
    this.props.updateTransHistory();
    this.props.changeTitle('WanAccount.wallet');
  }

  columns = [
    {
      dataIndex: 'name',
      editable: true,
      width: '20%'
    },
    {
      dataIndex: 'address',
      render: (text, record) => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} type={CHAINTYPE} path={record.path} wid={record.wid} name={record.name} /></div>,
      width: '42%'
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
      width: '20%'
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><SendNormalTrans balance={record.balance} buttonClassName={style.actionButton} from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE} /></div>,
      width: '13%'
    },
    {
      dataIndex: 'blank',
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

  componentDidMount() {
    this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  createAccount = () => {
    const { addAddress } = this.props;
    this.setState({
      bool: false
    });
    if (this.state.bool) {
      try {
        createWANAddr().then(addressInfo => {
          addAddress(addressInfo);
          this.setState({
            bool: true
          });
          wand.request('address_scanMultiOTA', { path: [[WALLETID.NATIVE, addressInfo.path]] }, function (err, res) {
            if (err) {
              console.log('Open OTA scanner failed:', err);
            }
          });
          message.success(intl.get('WanAccount.createAccountSuccess'));
        });
      } catch (e) {
        console.log('err:', e);
        message.warn(intl.get('WanAccount.createAccountFailed'));
      };
    }
  }

  handleSend = (from, splitAmount) => {
    if (splitAmount && splitAmount instanceof Array) {
      return this.onSendPrivateTransaction(from, splitAmount);
    } else {
      return this.onSendNormalTransaction(from);
    }
  }

  onSendNormalTransaction = (from) => {
    let params = this.props.transParams[from];
    let type = checkAddrType(from, this.props.addrInfo);
    let walletID = getWalletIdByType(type);
    let trans = {
      walletID: walletID,
      chainType: CHAINTYPE,
      path: params.path,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
      to: params.to,
      amount: params.amount,
      symbol: CHAINTYPE,
      nonce: params.nonce,
      data: params.data,
    };
    console.log('wan trans:', trans);
    return new Promise((resolve, reject) => {
      wand.request('transaction_normal', trans, (err, txHash) => {
        if (err) {
          message.warn(intl.get('WanAccount.sendTransactionFailed'));
          console.log('Send transaction failed:', err);
          reject(err);
        } else {
          message.success(intl.get('WanAccount.sendTransactionSuccessFully'));
          resolve();
          this.props.updateTransHistory();
          console.log('Tx hash: ', txHash);
        }
      });
    });
  }

  onSendPrivateTransaction = (from, splitAmount = []) => {
    let params = this.props.transParams[from];
    let type = checkAddrType(from, this.props.addrInfo);
    let walletID = getWalletIdByType(type);
    let trans = {
      walletID: walletID,
      chainType: CHAINTYPE,
      path: params.path,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
      to: toChecksumOTAddress(params.to),
      amount: splitAmount,
    };
    return new Promise((resolve, reject) => {
      wand.request('transaction_private', trans, (err, txHash) => {
        if (err) {
          message.warn(intl.get('WanAccount.sendBatchTransactionFailed'));
          console.log('Send transaction failed:', err);
          reject(err);
        } else {
          message.success(intl.get('WanAccount.sendTransactionSuccessFully'));
          resolve();
          this.props.updateTransHistory();
        }
      });
    });
  }

  handleSave = row => {
    if (hasSameName('normal', row, this.props.addrInfo)) {
      message.warn(intl.get('WanAccount.notSameName'));
    } else {
      this.props.updateName(row, row.wid);
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
    const privateAddress = record.waddress;
    const privateBalance = record.wbalance;
    return (
      <table style={{ width: 'calc(100% + 32px)', position: 'relative', left: '-16px' }}>
        <tbody>
          <tr>
            <td style={{ width: '20%', padding: '0px 16px' }}></td>
            <td style={{ width: '42%', padding: '0px 16px' }}>
              <div className="addrText">
                <p className={style.privateAddress}>
                  <Tooltip placement="bottomLeft" title={privateAddress} overlayStyle={{ width: 400 }} >{privateAddress}</Tooltip>
                </p>
                {privateAddress && <CopyAndQrcode addr={privateAddress} />}
                {privateAddress && <Tooltip placement="bottom" title={intl.get('WanAccount.privateTxReceiverAddress')}><Icon type="question-circle" style={{ marginLeft: '5px' }} /></Tooltip>}
              </div>
            </td>
            <td style={{ width: '20%', padding: '0px 16px' }}>{privateBalance}</td>
            <td style={{ width: '13%', padding: '0px 16px' }}><RedeemFromPrivate from={record.address} wid={record.wid} path={record.path} chainType={CHAINTYPE} /></td>
            <td style={{ width: '5%', padding: '0px 16px' }}></td>
          </tr>
        </tbody>
      </table>
    )
  }

  toggleExpand = () => {
    if (this.state.expanded) {
      this.setState({
        expandedRows: []
      });
    } else {
      this.setState({
        expandedRows: this.props.getAddrList.map(r => r.key)
      });
    }
    this.setState({ expanded: !this.state.expanded });
  }

  onExpand = (expanded, record) => {
    try {
      if (expanded) {
        this.setState({
          expandedRows: [...this.state.expandedRows, record.key]
        });
      } else {
        let list = [...this.state.expandedRows];
        list.splice(list.findIndex(n => n === record.key), 1);
        this.setState({
          expandedRows: list
        });
        if (list.length === 0) {
          this.setState({ expanded: false });
        }
      }
    } catch (err) {
      console.log('expand error:', err);
    }
  }

  render() {
    const { getAmount, getAddrList } = this.props;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    this.props.language && this.columnsTree.forEach(col => {
      if (col.dataIndex !== 'blank') {
        col.title = intl.get(`WanAccount.${col.dataIndex}`);
      } else {
        col.title = <img
          src={arrow}
          onClick={this.toggleExpand}
          className={this.state.expanded ? style['arrow-down'] : style['arrow-right']}
          style={{ width: '12px', height: '10px', cursor: 'pointer' }}
        />;
      }
    });

    return (
      <div className="account">
        <Row className={style.title + ' title'}>
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} alt={intl.get('WanAccount.wanchain')} />
            <span className="wanTotal">{getAmount}</span>
            <span className="wanTex">{intl.get('WanAccount.wan')}</span>
            <Tag className="symbol">{'WANCHAIN'}</Tag>
          </Col>
          <Col span={12} className="col-right">
            <Button className="createBtn" type="primary" shape="round" size="large" onClick={this.createAccount}>{intl.get('Common.create')}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table components={components} expandedRowKeys={this.state.expandedRows} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getAddrList}
              expandedRowRender={this.expandContent} onExpand={this.onExpand} expandIconAsCell={false} expandIconColumnIndex={4} expandIcon={this.customExpandIcon} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <WANTransHistory name={['normal', 'import', 'rawKey']} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;
