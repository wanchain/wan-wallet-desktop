import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';

import totalImg from 'static/image/eos.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import EOSTrans from 'components/CrossChain/SendCrossChainTrans/EOSTrans';
import CrossEOSHistory from 'components/CrossChain/CrossChainTransHistory/CrossEOSHistory';

const CHAINTYPE = 'EOS';
const EOSSYMBOL = '0x01800000c2656f73696f2e746f6b656e3a454f53'

@inject(stores => ({
  tokensList: stores.tokens.formatTokensList,
  language: stores.languageIntl.language,
  addrInfo: stores.eosAddress.accountInfo,
  wanAddrInfo: stores.wanAddress.addrInfo,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  getNormalAccountListWithBalance: stores.eosAddress.getNormalAccountListWithBalance,
  updateTransHistory: () => stores.eosAddress.updateTransHistory(),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr)
}))

@observer
class CrossEOS extends Component {
  constructor(props) {
    super(props);
    this.props.setCurrSymbol(props.symbol);
    this.props.setCurrToken(null, props.symbol);
    this.props.changeTitle('Common.crossChain');
    this.tokenAddr = Object.keys(props.tokensList).find(item => props.tokensList[item].symbol === props.symbol);
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateTokensBalance(this.tokenAddr);
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  inboundHandleSend = from => {
    let { to, amount, storeman, txFeeRatio } = this.props.transParams[from];
    let input = { from: { walletID: 1, address: from, path: this.props.addrInfo[from].path }, to, amount, storeman, txFeeRatio };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossEOS', { input, tokenScAddr: this.props.tokenOrigAddr, source: 'EOS', destination: 'WAN', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crossChain_lockEOS:', err);
          message.warn(intl.get('common.sendFailed'));
          return reject(err);
        } else {
          return resolve(ret)
        }
      });
    });
  }

  outboundHandleSend = from => {
    let { to, amount, storeman, txFeeRatio, gasPrice, gasLimit, from: fromParams } = this.props.transParams[from];
    let input = { from: fromParams, to, amount, storeman, txFeeRatio, gasPrice, gasLimit };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossEOS', { input, tokenScAddr: this.props.tokenOrigAddr, source: 'WAN', destination: 'EOS', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crossChain_lockWEOS:', err);
          message.warn(intl.get('common.sendFailed'));
          return reject(err);
        } else {
          return resolve(ret)
        }
      })
    })
  }

  inboundColumns = [
    {
      dataIndex: 'address',
      width: '70%'
    },
    {
      dataIndex: 'balance',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><EOSTrans symbol={this.props.symbol} tokenOrigAddr={this.props.tokenOrigAddr} record={record} from={record.address} decimals={this.props.tokensList[this.tokenAddr].decimals} handleSend={this.inboundHandleSend} direction={INBOUND} /></div>
    }
  ];

  outboundColumns = [
    {
      dataIndex: 'name',
      width: '20%',
      ellipsis: true
    },
    {
      dataIndex: 'address',
      width: '50%',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><EOSTrans symbol={this.props.symbol} tokenOrigAddr={this.props.tokenOrigAddr} record={record} from={record.address} path={record.path} decimals={this.props.tokensList[this.tokenAddr].decimals} handleSend={this.outboundHandleSend} direction={OUTBOUND} /></div>
    }
  ];

  render() {
    const { getNormalAccountListWithBalance, getTokensListInfo, symbol } = this.props;

    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    let data = getNormalAccountListWithBalance.map((v) => {
      let obj = Object.assign({}, v);
      if (obj.balance === undefined) {
        obj.balance = 0;
      }
      return obj;
    });

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{symbol} </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} rowKey="account" columns={this.inboundColumns} dataSource={data} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{`W${symbol}`} </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossEOSHistory name={['normal']} symbol={symbol} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default props => <CrossEOS {...props} symbol={props.match.params.symbol || CHAINTYPE} key={props.match.params.tokenAddr || EOSSYMBOL} tokenOrigAddr={props.match.params.tokenAddr || EOSSYMBOL} />;
