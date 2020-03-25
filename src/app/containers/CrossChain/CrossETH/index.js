import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';

import totalImg from 'static/image/eth.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import ETHTrans from 'components/CrossChain/SendCrossChainTrans/ETHTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory';

const CHAINTYPE = 'ETH';
const WANCHAIN = 'WAN';

@inject(stores => ({
  tokensList: stores.tokens.formatTokensList,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  getNormalAddrList: stores.ethAddress.getNormalAddrList,
  getAmount: stores.ethAddress.getNormalAmount,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr)
}))

@observer
class CrossETH extends Component {
  constructor (props) {
    super(props);
    this.props.setCurrSymbol('ETH');
    this.props.setCurrToken(null, 'ETH');
    this.props.changeTitle('Common.crossChain');
  }

  componentDidMount() {
    let tokenAddr = Object.keys(this.props.tokensList).find(item => this.props.tokensList[item].symbol === 'ETH');
    this.timer = setInterval(() => {
      this.props.updateTokensBalance(tokenAddr);
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
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
          if (err.desc.includes('ready')) {
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
          if (err.desc.includes('ready')) {
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
      render: (text, record) => <div><ETHTrans balance={record.balance} from={record.address} path={record.path} handleSend={this.inboundHandleSend} chainType={CHAINTYPE} type={INBOUND}/></div>
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
      render: (text, record) => <div><ETHTrans balance={record.balance} from={record.address} path={record.path} handleSend={this.outboundHandleSend} chainType={WANCHAIN} type={OUTBOUND}/></div>
    }
  ];

  render () {
    const { getNormalAddrList, getTokensListInfo } = this.props;

    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">ETH </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={getNormalAddrList} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">WETH </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getTokensListInfo} />
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

export default CrossETH;
