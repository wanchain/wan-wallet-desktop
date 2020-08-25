import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';

import totalImg from 'static/image/eth.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import ETHTrans from 'components/CrossChain/SendCrossChainTrans/ETHTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory/CrossETHHistory';
import style from './index.less';

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
  tokenPairs: stores.crossChain.tokenPairs,
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr),
  setCurrChainId: id => stores.crossChain.setCurrChainId(id),
}))

@observer
class CrossETH extends Component {
  constructor (props) {
    super(props);
    const { tokenPairs, match } = props;
    let tokenPairID = match.params.tokenPairId;
    this.props.setCurrSymbol('ETH');
    this.props.changeTitle('Common.crossChain');
    this.props.setCurrChainId(tokenPairID);
    this.info = tokenPairs[tokenPairID];
    this.props.setCurrToken(this.info.tokenAddress);
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.props.updateTokensBalance(this.info.tokenAddress);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  inboundHandleSend = from => {
    const { tokenPairs, match } = this.props;
    let tokenPairID = match.params.tokenPairId;
    let info = this.info;
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      // txFeeRatio: transParams.txFeeRatio
      tokenPairID: tokenPairID,
      crossType: transParams.crossType
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossChain', { input, tokenPairID, sourceSymbol: info.fromChainSymbol, sourceAccount: info.fromAccount, destinationSymbol: info.toChainSymbol, destinationAccount: info.tokenAddress, type: 'LOCK' }, (err, ret) => {
        // console.log('ETH inbound result:', err, ret);
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
    let info = this.info;
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      // txFeeRatio: transParams.txFeeRatio
      tokenPairID: tokenPairID,
      crossType: transParams.crossType
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossChain', { input, tokenPairID, sourceSymbol: info.toChainSymbol, sourceAccount: info.tokenAddress, destinationSymbol: info.fromChainSymbol, destinationAccount: info.fromAccount, type: 'LOCK' }, (err, ret) => {
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
      render: (text, record) => <div><ETHTrans balance={record.balance} from={record.address} chainPairId={this.props.match.params.tokenPairId} path={record.path} handleSend={this.inboundHandleSend} chainType={CHAINTYPE} type={INBOUND}/></div>
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
      render: (text, record) => <div><ETHTrans balance={record.balance} from={record.address} chainPairId={this.props.match.params.tokenPairId} path={record.path} handleSend={this.outboundHandleSend} chainType={WANCHAIN} type={OUTBOUND}/></div>
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

    let info = this.info;

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">ETH </span><span className={style.chain}>{info.fromChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={getNormalAddrList} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">WETH </span><span className={style.chain}>{info.toChainName}</span></Col>
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
