import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import BTCTrans from 'components/CrossChain/SendCrossChainTrans/BTCTrans';
import CrossBTCHistory from 'components/CrossChain/CrossChainTransHistory/CrossBTCHistory';
import wanLogo from 'static/image/wan.png';
import ethLogo from 'static/image/eth.png';
import btcLogo from 'static/image/btc.png';
import eosLogo from 'static/image/eos.png';
import style from './index.less';

// const CHAINTYPE = 'ETH';
const CHAINTYPE = 'BTC';
const WANCHAIN = 'WAN';

@inject(stores => ({
  tokenIconList: stores.tokens.tokenIconList,
  language: stores.languageIntl.language,
  getNormalAddrList: stores.btcAddress.getNormalAddrList,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class CrossChain extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Common.crossChain');
  }

  inboundHandleSend = () => { }

  outboundHandleSend = () => { }

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
      render: (text, record) => <div><BTCTrans from={record.address} handleSend={this.inboundHandleSend} chainType={CHAINTYPE} direction={INBOUND} /></div>
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
      render: (text, record) => <div><BTCTrans from={record.address} path={record.path} handleSend={this.outboundHandleSend} chainType={CHAINTYPE} direction={OUTBOUND} /></div>
    }
  ];

  render() {
    const { getNormalAddrList, getTokensListInfo } = this.props;
    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })
    let pairs = this.props.match.params.key.split('-');
    let symbols = this.props.match.params.symbol.split('-');
    // console.log('pairs:', pairs);
    // console.log('params:', this.props.match.params);

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left">{this.getCoinImage('BTC')}<span className="wanTotal">{symbols[0]}</span><span className={style.chain}>{pairs[0]}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={getNormalAddrList} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left">{this.getCoinImage('BTC')}<span className="wanTotal">{symbols[1]}</span><span className={style.chain}>{pairs[1]}</span></Col>
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

export default CrossChain;
