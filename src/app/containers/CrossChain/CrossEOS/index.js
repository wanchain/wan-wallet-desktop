import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';
import totalImg from 'static/image/eos.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import EOSTrans from 'components/CrossChain/SendCrossChainTrans/EOSTrans';
import CrossEOSHistory from 'components/CrossChain/CrossChainTransHistory/CrossEOSHistory';
import style from './index.less';

const CHAINTYPE = 'EOS';

@inject(stores => ({
  tokensList: stores.tokens.formatTokensList,
  language: stores.languageIntl.language,
  addrInfo: stores.eosAddress.accountInfo,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  getNormalAccountListWithBalance: stores.eosAddress.getNormalAccountListWithBalance,
  tokenPairs: stores.crossChain.tokenPairs,
  currTokenPairId: stores.crossChain.currTokenPairId,
  updateTransHistory: () => stores.eosAddress.updateTransHistory(),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  setCurrTokenChain: chain => stores.tokens.setCurrTokenChain(chain),
  updateTokensBalance: (...args) => stores.tokens.updateTokensBalance(...args),
  setCurrTokenPairId: id => stores.crossChain.setCurrTokenPairId(id),
}))

@observer
class CrossEOS extends Component {
  constructor(props) {
    super(props);
    const { tokenPairs, match } = props;
    const tokenPairID = match.params.tokenPairId;
    this.props.setCurrSymbol(CHAINTYPE);
    this.props.changeTitle('Common.crossChain');
    this.props.setCurrTokenPairId(tokenPairID);
    this.info = tokenPairs[tokenPairID];
    this.props.setCurrToken(this.info.toAccount);
    this.props.setCurrTokenChain(this.info.toChainSymbol);
    this.props.updateTransHistory();
    this.state = {
      error: false,
    }
  }

  componentDidMount() {
    this.props.updateTransHistory();
    this.props.updateTokensBalance(this.info.toAccount, this.info.toChainSymbol);
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateTokensBalance(this.info.toAccount, this.info.toChainSymbol);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidCatch(err, info) {
    this.setState({
      error: true,
    });
    console.log('Caught an error in this component.', err, info);
  }

  inboundHandleSend = from => {
    const { tokenPairs, currTokenPairId, addrInfo } = this.props;
    let { to, amount, storeman, txFeeRatio } = this.props.transParams[from];
    let input = { from: { walletID: 1, address: from, path: addrInfo[from].path }, to, amount, storeman, txFeeRatio };
    let info = tokenPairs[currTokenPairId];
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossEOS2WAN', { sourceAccount: info.fromAccount, sourceSymbol: info.fromChainSymbol, destinationAccount: info.toAccount, destinationSymbol: info.toChainSymbol, type: 'LOCK', input, currTokenPairId }, (err, ret) => {
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
    const { tokenPairs, currTokenPairId, addrInfo } = this.props;
    let { to, amount, storeman, txFeeRatio, gasPrice, gasLimit, from: fromParams } = this.props.transParams[from];
    let input = { from: fromParams, to, amount, storeman, txFeeRatio, gasPrice, gasLimit };
    let info = tokenPairs[currTokenPairId];
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossEOS2WAN', { sourceAccount: info.toAccount, sourceSymbol: info.toChainSymbol, destinationAccount: info.fromAccount, destinationSymbol: info.fromChainSymbol, type: 'LOCK', input, currTokenPairId }, (err, ret) => {
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
      render: (text, record) => <div><EOSTrans tokenOrigAddr={this.info.toAccount} record={record} from={record.address} decimals={this.info.ancestorDecimals} handleSend={this.inboundHandleSend} direction={INBOUND} /></div>
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
      render: (text, record) => {
        return <div><EOSTrans tokenOrigAddr={this.info.toAccount} record={record} from={record.address} path={record.path} decimals={this.info.ancestorDecimals} handleSend={this.outboundHandleSend} direction={OUTBOUND} /></div>
      }
    }
  ];

  render() {
    const { getNormalAccountListWithBalance, getTokensListInfo } = this.props;

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
    return this.state.error ? <div className="errorComponent">An error occurred in this component.</div> : (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{this.info.fromTokenSymbol} </span><span className={style.chain}>{this.info.fromChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} rowKey="account" columns={this.inboundColumns} dataSource={data} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{this.info.toTokenSymbol} </span><span className={style.chain}>{this.info.toChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossEOSHistory name={['normal']} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default CrossEOS;
