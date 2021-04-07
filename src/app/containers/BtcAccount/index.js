import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Row, Col, message, Tag } from 'antd';

import './index.less';
import { formatNum } from 'utils/support';
import totalImg from 'static/image/btc.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import TransHistory from 'components/TransHistory/BTCTransHistory';
import SendNormalTrans from 'components/SendNormalTrans/SendBTCNormalTrans';
import { hasSameName, createBTCAddr, getNewPathIndex } from 'utils/helper';
import { BTCPATH_MAIN, BTCCHAINID, WALLETID } from 'utils/settings';
import { EditableFormRow, EditableCell } from 'components/Rename';
import WarningExistAddress from 'components/WarningExistAddress';

@inject(stores => ({
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.btcAddress.getAddrList,
  getAmount: stores.btcAddress.getAllAmount,
  transParams: stores.sendTransParams.BTCTransParams,
  addAddress: newAddr => stores.btcAddress.addAddress(newAddr),
  updateTransHistory: () => stores.btcAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateName: (arr, type) => stores.btcAddress.updateName(arr, type),
  updateChainBalanceList: chain => stores.tokens.updateChainBalanceList(chain),
}))

@observer
class BtcAccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isUnlock: false,
      normalTransVisiable: false,
      isExist: false,
      address: undefined,
    }
    this.canCreate = true;
    this.props.updateTransHistory();
  }

  columns = [
    {
      dataIndex: 'name',
      editable: true
    },
    {
      dataIndex: 'address',
      render: (text, record) => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} type={'BTC'} path={record.path} wid={record.wid} name={record.name} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
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

  componentDidMount() {
    this.props.updateChainBalanceList('BTC');
    this.props.changeTitle('WanAccount.wallet');
    this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.props.updateChainBalanceList();
  }

  handleSend = () => {
    let params = this.props.transParams;
    return new Promise((resolve, reject) => {
      wand.request('transaction_BTCNormal', params, (err, txHash) => {
        if (err) {
          message.warn(intl.get('WanAccount.sendTransactionFailed'));
          console.log(err);
          reject(false); // eslint-disable-line prefer-promise-reject-errors
        } else {
          console.log('Tx hash: ', txHash);
          if (txHash.code === false) {
            message.warn(intl.get('WanAccount.sendTransactionFailed'));
            reject(txHash.result);
          } else {
            resolve(txHash)
          }
        }
      });
    })
  }

  createAccount = async () => {
    const { addAddress, getAddrList, btcPath } = this.props;

    if (this.canCreate) {
      try {
        this.canCreate = false;
        let checkDuplicate = address => {
          if (getAddrList.find(obj => obj.address === address)) {
            this.setState({ address, isExist: true });
            return true;
          }
          return false;
        }
        const CHAINID = btcPath === BTCPATH_MAIN ? BTCCHAINID.MAIN : BTCCHAINID.TEST;
        let index = await getNewPathIndex(CHAINID, btcPath, WALLETID.NATIVE);
        createBTCAddr(btcPath, index, checkDuplicate).then(addressInfo => {
          addAddress(addressInfo);
          this.canCreate = true;
          message.success(intl.get('WanAccount.createAccountSuccess'));
        }).catch((e) => {
          this.canCreate = true;
          if (e.message === 'exist') {
            return;
          }
          message.warn(intl.get('WanAccount.createAccountFailed'));
        });
      } catch (e) {
        console.log('err:', e);
        this.canCreate = true;
        message.warn(intl.get('WanAccount.createAccountFailed'));
      };
    }
  }

  handleSave = row => {
    if (hasSameName('normal', row, this.props.addrInfo)) {
      message.warn(intl.get('WanAccount.notSameName'));
    } else {
      this.props.updateName(row, row.wid);
    }
  }

  onCloseModal = () => {
    this.setState({ isExist: false })
  }

  render() {
    const { getAmount, getAddrList } = this.props;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    let from = getAddrList.length ? getAddrList[0].address : '';

    this.props.language && this.columnsTree.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} alt={intl.get('WanAccount.wanchain')} />
            <span className="wanTotal">{formatNum(getAmount)}</span>
            <span className="wanTex">BTC</span>
            <Tag className="symbol">{'BITCOIN'}</Tag>
          </Col>
          <Col span={12} className="col-right">
            <Button className="createBtn" type="primary" shape="round" size="large" onClick={this.createAccount}>{intl.get('Common.create')}</Button>
            <SendNormalTrans from={from} handleSend={this.handleSend} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getAddrList} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TransHistory name={['normal', 'rawKey']} />
          </Col>
        </Row>
        {
          this.state.isExist && <WarningExistAddress title={intl.get('Common.warning')} address={this.state.address} onCloseModal={this.onCloseModal} text={intl.get('WanAccount.newAddressExistInImportedList')} />
        }
      </div>
    );
  }
}

export default BtcAccount;
