import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message, Avatar } from 'antd';

import style from './index.less';
import CopyAndQrcode from 'components/CopyAndQrcode';
import TransHistory from 'components/TransHistory/ETHTransHistory';
import SendNormalTrans from 'components/SendNormalTrans/SendETHNormalTrans';
import { checkAddrType } from 'utils/helper';
import { WALLETID, TRANSTYPE, MAIN, TESTNET } from 'utils/settings';

const CHAINTYPE = 'ETH';

message.config({
  duration: 2,
  maxCount: 1
});

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.tokens.getE20TokenAmount,
  transParams: stores.sendTransParams.transParams,
  getE20TokensListInfo: stores.tokens.getE20TokensInfo,
  updateTransHistory: () => stores.ethAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  getTokenIcon: (tokenScAddr) => stores.tokens.getTokenIcon(tokenScAddr),
  updateE20TokensBalance: tokenScAddr => stores.tokens.updateE20TokensBalance(tokenScAddr)
}))

@observer
class E20TokenTrans extends Component {
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
      render: (text, record) => <div><SendNormalTrans balance={record.balance} tokenAddr={this.props.tokenAddr} from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE} transType={TRANSTYPE.tokenTransfer} /></div>
    }
  ];

  constructor(props) {
    super(props);
    this.img = this.props.getTokenIcon(this.props.tokenAddr);
    this.props.setCurrToken(this.props.tokenAddr);
    this.props.changeTitle('WanAccount.wallet');
    this.props.updateTransHistory();
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateE20TokensBalance(this.props.tokenAddr);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  handleSend = from => {
    const { transParams, addrInfo, tokenAddr } = this.props;
    let params = transParams[from];
    let walletID = checkAddrType(from, addrInfo) === 'normal' ? WALLETID.NATIVE : WALLETID.KEYSTOREID;
    let trans = {
      walletID: walletID,
      chainType: CHAINTYPE,
      symbol: CHAINTYPE,
      path: params.path,
      to: tokenAddr.toLowerCase(),
      amount: '0',
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
      nonce: params.nonce,
      data: params.data,
      satellite: {
        transferTo: params.to.toLowerCase(),
        token: params.amount
      }
    };
    return new Promise((resolve, reject) => {
      wand.request('transaction_normal', trans, (err, txHash) => {
        if (err) {
          message.warn(intl.get('WanAccount.sendTransactionFailed'));
          console.log('transaction_normal:', err);
          reject(false); // eslint-disable-line prefer-promise-reject-errors
        } else {
          this.props.updateTransHistory();
          console.log('Tx hash: ', txHash);
          resolve(txHash)
        }
      });
    })
  }

  onClickRow = () => {
    let { chainId, tokenAddr } = this.props;
    let href = chainId === 1 ? `${MAIN}/token/${tokenAddr}` : `${TESTNET}/token/${tokenAddr}`
    wand.shell.openExternal(href);
  }

  render() {
    const { getAmount, getE20TokensListInfo, symbol, tokenAddr } = this.props;

    this.props.language && this.columns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><Avatar className="avatarSty" src={this.img} /> <span className="wanTotal">{getAmount}</span><span className="wanTex">{symbol}</span></Col>
          <Col span={12} className="col-right">
            <span className={style.tokenTxt}>{intl.get('Common.tokenAddr')}: <span className={style.tokenAddr} onClick={this.onClickRow}>{tokenAddr}</span></span>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={getE20TokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TransHistory name={['normal']} transType={TRANSTYPE.tokenTransfer} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default props => <E20TokenTrans {...props} symbol={props.match.params.symbol} key={props.match.params.tokenAddr} tokenAddr={props.match.params.tokenAddr} />;
