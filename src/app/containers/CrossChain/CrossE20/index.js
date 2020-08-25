import intl from 'react-intl-universal';
import React, { Component, message } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col } from 'antd';

import totalImg from 'static/image/eth.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import ETHTrans from 'components/CrossChain/SendCrossChainTrans/ETHTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory/CrossETHHistory';

const CHAINTYPE = 'ETH';
const WANCHAIN = 'WAN';

@inject(stores => ({
  tokensList: stores.tokens.formatTokensList,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.ethAddress.getNormalAmount,
  tokenIconList: stores.tokens.tokenIconList,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  getE20TokensListInfo: stores.tokens.getE20TokensListInfo,
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  getTokenIcon: tokenScAddr => stores.tokens.getTokenIcon(tokenScAddr),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr),
  updateE20TokensBalance: tokenScAddr => stores.tokens.updateE20TokensBalance(tokenScAddr)
}))

@observer
class CrossE20 extends Component {
  constructor (props) {
    super(props);
    this.props.changeTitle('Common.crossChain');
    this.props.setCurrSymbol(this.props.symbol);
    this.props.setCurrToken(this.props.tokenAddr);
    if (!this.props.tokenIconList[this.props.tokenAddr]) {
      this.props.getTokenIcon(this.props.tokenAddr);
    }
  }

  componentDidMount() {
    let tokenOrigAddr = this.props.tokensList[this.props.tokenAddr].tokenOrigAddr;
    this.timer = setInterval(() => {
      this.props.updateTokensBalance(this.props.tokenAddr);
      this.props.updateE20TokensBalance(tokenOrigAddr);
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
      wand.request('crossChain_crossErc20', { input, tokenScAddr: this.props.tokensList[this.props.tokenAddr].tokenOrigAddr, source: 'ETH', destination: 'WAN', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('ERC-20 inbound lock:', err);
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
      wand.request('crossChain_crossErc20', { input, tokenScAddr: this.props.tokensList[this.props.tokenAddr].tokenOrigAddr, source: 'WAN', destination: 'ETH', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('ERC-20 outbound lock:', err);
          if (err instanceof Object && err.desc && err.desc instanceof Array && err.desc.includes('ready')) {
            message.warn(intl.get('Common.networkError'));
          } else {
            message.warn(intl.get('Common.sendFailed'));
          }
          return reject(err);
        } else {
          return resolve(ret);
        }
      })
    })
  }

  inboundColumns = [
    {
      dataIndex: 'name',
      width: '20%',
      ellipsis: true,
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
      render: (text, record) => <div><ETHTrans balance={record.balance} symbol={this.props.symbol} decimals={this.props.tokensList[this.props.tokenAddr].decimals} tokenAddr={this.props.tokensList[this.props.tokenAddr].tokenOrigAddr} from={record.address} path={record.path} handleSend={this.inboundHandleSend} chainType={CHAINTYPE} type={INBOUND}/></div>
    }
  ];

  outboundColumns = [
    {
      dataIndex: 'name',
      width: '20%',
      ellipsis: true,
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
      render: (text, record) => <div><ETHTrans balance={record.balance} symbol={this.props.symbol} decimals={this.props.tokensList[this.props.tokenAddr].decimals} tokenAddr={this.props.tokensList[this.props.tokenAddr].tokenOrigAddr} from={record.address} path={record.path} handleSend={this.outboundHandleSend} chainType={WANCHAIN} type={OUTBOUND}/></div>
    }
  ];

  render () {
    const { getE20TokensListInfo, getTokensListInfo, symbol } = this.props;
    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={this.props.tokenIconList[this.props.tokenAddr]} /><span className="wanTotal">{symbol} </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={getE20TokensListInfo} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={this.props.tokenIconList[this.props.tokenAddr]} /><span className="wanTotal">{`W${symbol}`} </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossChainTransHistory name={['normal']} symbol={symbol}/>
          </Col>
        </Row>
      </div>
    );
  }
}

export default props => <CrossE20 {...props} symbol={props.match.params.symbol} key={props.match.params.tokenAddr} tokenAddr={props.match.params.tokenAddr} />;
