import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';

import totalImg from 'static/image/btc.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import BTCTrans from 'components/CrossChain/SendCrossChainTrans/BTCTrans';
import CrossBTCHistory from 'components/CrossChain/CrossChainTransHistory/CrossBTCHistory';

const CHAINTYPE = 'BTC';
@inject(stores => ({
  tokensList: stores.tokens.tokensList,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.btcAddress.getAddrList,
  getAmount: stores.btcAddress.getNormalAmount,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams,
  updateTransHistory: () => stores.btcAddress.updateTransHistory(),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr)
}))

@observer
class CrossBTC extends Component {
  constructor (props) {
    super(props);
    this.props.setCurrSymbol('BTC');
    this.props.setCurrToken(null, 'BTC');
    this.props.changeTitle('Common.crossChain');
  }

  componentDidMount() {
    let tokenAddr = Object.keys(this.props.tokensList).find(item => this.props.tokensList[item].symbol === 'BTC');
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateTokensBalance(tokenAddr);
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  inboundHandleSend = () => {
    let transParams = this.props.BTCCrossTransParams;
    let input = {
      from: transParams.from,
      value: transParams.value,
      feeRate: transParams.feeRate,
      changeAddress: transParams.changeAddress,
      smgBtcAddr: transParams.smgBtcAddr,
      storeman: transParams.storeman,
      wanAddress: transParams.wanAddress,
      gasPrice: transParams.gasPrice,
      gas: transParams.gas,
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossBTC', { input, source: 'BTC', destination: 'WAN', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crossChain_lockBTC:', err);
          message.warn(intl.get('Common.sendFailed'));
          return reject(err);
        } else {
          console.log(JSON.stringify(ret, null, 4));
          return resolve(ret)
        }
      })
    })
  }

  outboundHandleSend = () => {
    let transParams = this.props.BTCCrossTransParams;
    let input = {
      from: transParams.from,
      amount: transParams.amount,
      crossAddr: transParams.crossAddr,
      gasPrice: transParams.gasPrice,
      gas: transParams.gas,
      txFeeRatio: transParams.txFeeRatio,
      storeman: transParams.storeman
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossBTC', { input, source: 'WAN', destination: 'BTC', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crossChain_lockWBTC:', err);
          message.warn(intl.get('Common.sendFailed'));
          return reject(err);
        } else {
          console.log(JSON.stringify(ret, null, 4));
          return resolve(ret)
        }
      })
    })
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
      width: '30%',
      ellipsis: true,
      sorter: (a, b) => a.balance - b.balance,
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
      render: (text, record) => <div><BTCTrans from={record.address} path={record.path} handleSend={this.outboundHandleSend} chainType={CHAINTYPE} direction={OUTBOUND}/></div>
    }
  ];

  render () {
    const { getAddrList, getTokensListInfo } = this.props;
    let from = getAddrList.length ? getAddrList[0].address : '';

    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">BTC </span></Col>
          <Col span={12} className="col-right">
            <BTCTrans from={from} handleSend={this.inboundHandleSend} direction={INBOUND} chainType={CHAINTYPE}/>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={getAddrList} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">WBTC </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossBTCHistory name={['normal']} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default CrossBTC;
