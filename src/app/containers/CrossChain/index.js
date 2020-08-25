import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND, WALLET_CHAIN } from 'utils/settings';
import Trans from 'components/CrossChain/SendCrossChainTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory';
import wanLogo from 'static/image/wan.png';
import ethLogo from 'static/image/eth.png';
import btcLogo from 'static/image/btc.png';
import eosLogo from 'static/image/eos.png';
import style from './index.less';

const CHAINTYPE = 'ETH';
// const CHAINTYPE = 'BTC';
const WANCHAIN = 'WAN';

@inject(stores => ({
  tokenIconList: stores.tokens.tokenIconList,
  language: stores.languageIntl.language,
  getNormalAddrList: stores.ethAddress.getNormalAddrList,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  tokensBalance: stores.tokens.tokensBalance,
  tokensBalance_2way: stores.tokens.tokensBalance_2way,
  stores: stores,
  transParams: stores.sendCrossChainParams.transParams,
  tokenPairs: stores.crossChain.tokenPairs,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  getTokenIcon: (tokenScAddr) => stores.tokens.getTokenIcon(tokenScAddr),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: (...args) => stores.tokens.updateTokensBalance(...args),
  getTokensListInfo_2way: (...args) => stores.tokens.getTokensListInfo_2way(...args),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  setCurrChainId: id => stores.crossChain.setCurrChainId(id),
}))

@observer
class CrossChain extends Component {
  constructor(props) {
    super(props);
    const tokenPairId = props.match.params.tokenPairId;
    const fromAccount = props.tokenPairs[tokenPairId].fromAccount;
    this.props.changeTitle('Common.crossChain');
    this.props.setCurrToken(fromAccount);
    this.props.setCurrChainId(tokenPairId);
    this.state = {
      inboundData: [],
      outboundData: [],
    }
    this.props.setCurrSymbol(props.tokenPairs[tokenPairId].ancestorSymbol);
  }

  componentDidMount() {
    const { match, tokenPairs, updateTokensBalance } = this.props;
    const tokenPairId = match.params.tokenPairId;
    const info = Object.assign({}, tokenPairs[tokenPairId]);
    this.timer = setInterval(() => {
      updateTokensBalance(info.fromAccount, info.fromChainSymbol);
      updateTokensBalance(info.tokenAddress, info.toChainSymbol);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  inboundHandleSend = from => {
    const { tokenPairs, match } = this.props;
    let tokenPairID = match.params.tokenPairId;
    let info = tokenPairs[tokenPairID];
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      tokenPairID: tokenPairID,
      crossType: transParams.crossType
    };
    // console.log({ input, tokenPairID, sourceSymbol: info.fromChainSymbol, sourceAccount: info.fromAccount, destinationSymbol: info.toChainSymbol, destinationAccount: info.tokenAddress, type: 'LOCK' });
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossChain', { input, tokenPairID, sourceSymbol: info.fromChainSymbol, sourceAccount: info.fromAccount, destinationSymbol: info.toChainSymbol, destinationAccount: info.tokenAddress, type: 'LOCK' }, (err, ret) => {
        console.log('inbound result:', err, ret);
        if (err) {
          if (err instanceof Object && err.desc && err.desc instanceof Array && err.desc.includes('ready')) {
            message.warn(intl.get('Common.networkError'));
          } else {
            message.warn(intl.get('Common.sendFailed'));
          }
          return reject(err);
        } else {
          if (ret.code) {
            message.success(intl.get('Send.transSuccess'));
            return resolve(ret);
          } else {
            message.warn(intl.get('Common.sendFailed'));
            return reject(ret);
          }
        }
      })
    });
  }

  outboundHandleSend = from => {
    const { tokenPairs, match } = this.props;
    let tokenPairID = match.params.tokenPairId;
    let info = tokenPairs[tokenPairID];
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      tokenPairID: tokenPairID,
      crossType: transParams.crossType
    };
    // console.log('input:', input);
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossChain', { input, tokenPairID, sourceSymbol: info.toChainSymbol, sourceAccount: info.tokenAddress, destinationSymbol: info.fromChainSymbol, destinationAccount: info.fromAccount, type: 'LOCK' }, (err, ret) => {
        console.log('outbound result:', err, ret);
        if (err) {
          if (err instanceof Object && err.desc && err.desc instanceof Array && err.desc.includes('ready')) {
            message.warn(intl.get('Common.networkError'));
          } else {
            message.warn(intl.get('Common.sendFailed'));
          }
          return reject(err);
        } else {
          if (ret.code) {
            message.success(intl.get('Send.transSuccess'));
            return resolve(ret);
          } else {
            message.success(intl.get('Common.sendFailed'));
            return reject(ret);
          }
        }
      })
    })
  }

  getCoinImage = (text, addr = false) => {
    let img;
    switch (text.toUpperCase()) {
      case 'WAN':
        img = wanLogo;
        break;
      case 'ETH':
        img = ethLogo;
        break;
      case 'BTC':
        img = btcLogo;
        break;
      case 'EOS':
        img = eosLogo;
        break;
      default:
        if (addr) {
          if (!this.props.tokenIconList[addr]) {
            this.props.getTokenIcon(addr);
          }
          img = this.props.tokenIconList[addr];
        }
    }
    return <img className="totalImg" src={img} />;
  }

  inboundColumns = [
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
      render: (text, record) => <div><Trans balance={record.balance} from={record.address} account={record.name} path={record.path} handleSend={this.inboundHandleSend} type={INBOUND} chainPairId={this.props.match.params.tokenPairId} /></div>
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
      render: (text, record) => <div><Trans balance={record.balance} from={record.address} account={record.name} path={record.path} handleSend={this.outboundHandleSend} type={OUTBOUND} chainPairId={this.props.match.params.tokenPairId} /></div>
    }
  ];

  render() {
    const { getNormalAddrList, getTokensListInfo, getTokensListInfo_2way, tokenPairs } = this.props;
    const { inboundData, outboundData } = this.state;
    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    const tokenPairId = this.props.match.params.tokenPairId;
    let info = Object.assign({}, tokenPairs[tokenPairId]);

    let fromAddresses = getTokensListInfo_2way(info.fromChainSymbol, info.fromChainID, info.fromAccount);
    let toAddresses = getTokensListInfo_2way(info.toChainSymbol, info.toChainID, info.tokenAddress);

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left">{this.getCoinImage(info.ancestorSymbol, info.tokenAddress)}<span className="wanTotal">{info.ancestorSymbol}</span><span className={style.chain}>{info.fromChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={fromAddresses} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left">{this.getCoinImage(info.ancestorSymbol, info.tokenAddress)}<span className="wanTotal">{info.ancestorSymbol}</span><span className={style.chain}>{info.toChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={toAddresses} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossChainTransHistory />
          </Col>
        </Row>
      </div>
    );
  }
}

export default CrossChain;
