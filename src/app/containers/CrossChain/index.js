import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND, WALLET_CHAIN } from 'utils/settings';
// import BTCTrans from 'components/CrossChain/SendCrossChainTrans/BTCTrans';
// import CrossBTCHistory from 'components/CrossChain/CrossChainTransHistory/CrossBTCHistory';
import ETHTrans from 'components/CrossChain/SendCrossChainTrans/ETHTrans';
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
  stores: stores,
  transParams: stores.sendCrossChainParams.transParams,
  tokenPairs: stores.crossChain.tokenPairs,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  getTokenIcon: (tokenScAddr) => stores.tokens.getTokenIcon(tokenScAddr),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr)
}))

@observer
class CrossChain extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Common.crossChain');
    this.state = {
      inboundData: [],
      outboundData: [],
    }
    console.log('WALLET_CHAIN:', WALLET_CHAIN)
    const { from, to } = Object.assign({}, props.tokenPairs[props.match.params.tokenPairId]);
    console.log('from: ', from);
    console.log('to: ', to);
    if (WALLET_CHAIN.includes(from)) {

    }
  }

  inboundHandleSend = from => {
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      txFeeRatio: transParams.txFeeRatio
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossETH', { input, source: 'ETH', destination: 'WAN', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('ETH inbound lock:', err);
          if (err instanceof Object && err.desc && err.desc instanceof Array && err.desc.includes('ready')) {
            message.warn(intl.get('Common.networkError'));
          } else {
            message.warn(intl.get('Common.sendFailed'));
          }
          return reject(err);
        } else {
          return resolve(ret)
        }
      })
    })
  }

  outboundHandleSend = from => {
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      txFeeRatio: transParams.txFeeRatio
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossETH', { input, source: 'WAN', destination: 'ETH', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('ETH outbound lock:', err);
          if (err instanceof Object && err.desc && err.desc instanceof Array && err.desc.includes('ready')) {
            message.warn(intl.get('Common.networkError'));
          } else {
            message.warn(intl.get('Common.sendFailed'));
          }
          return reject(err);
        } else {
          return resolve(ret)
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
      render: (text, record) => <div><ETHTrans balance={record.balance} from={record.address} path={record.path} handleSend={this.inboundHandleSend} chainType={CHAINTYPE} type={INBOUND} /></div>
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
      render: (text, record) => <div><ETHTrans balance={record.balance} from={record.address} path={record.path} handleSend={this.outboundHandleSend} chainType={WANCHAIN} type={OUTBOUND} /></div>
    }
  ];

  render() {
    const { getNormalAddrList, getTokensListInfo, tokenPairs } = this.props;
    const { inboundData, outboundData } = this.state;
    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    let info = Object.assign({}, tokenPairs[this.props.match.params.tokenPairId]);
    console.log('info:', info);
    console.log('From: ', info.fromChainSymbol);
    console.log('To: ', info.toChainSymbol);
    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left">{this.getCoinImage(info.ancestorSymbol, info.tokenAddress)}<span className="wanTotal">{info.ancestorSymbol}</span><span className={style.chain}>{info.fromChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={inboundData} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left">{this.getCoinImage(info.ancestorSymbol, info.tokenAddress)}<span className="wanTotal">{info.ancestorSymbol}</span><span className={style.chain}>{info.toChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={outboundData} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossChainTransHistory name={['normal']} symbol='ETH' />
          </Col>
        </Row>
      </div>
    );
  }
}

export default CrossChain;
