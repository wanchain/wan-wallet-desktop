import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { toJS } from 'mobx';
import { Table, Row, Col, message } from 'antd';
import totalImg from 'static/image/wan.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import WANTrans from 'components/CrossChain/SendCrossChainTrans/WANTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory/CrossWANHistory';
import { formatNum } from 'utils/support';
import { getCrossChainContractData } from 'utils/helper';
import { BigNumber } from 'bignumber.js';
import { signTransaction as trezorSignTransaction } from 'componentUtils/trezor';
import { signTransaction as ledgerSignTransaction } from 'componentUtils/ledger';
import style from './index.less';

const pu = require('promisefy-util');
const CHAINTYPE = 'WAN';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  getNormalAddrList: stores.wanAddress.getNormalAddrList,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  getAmount: stores.wanAddress.getNormalAmount,
  getCCTokensListInfo: stores.tokens.getCCTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  rawTx: stores.sendCrossChainParams.rawTx,
  tokenPairs: stores.crossChain.tokenPairs,
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: addr => stores.tokens.setCurrToken(addr),
  setCurrTokenChain: chain => stores.tokens.setCurrTokenChain(chain),
  updateTokensBalance: (...args) => stores.tokens.updateTokensBalance(...args),
  setCurrTokenPairId: id => stores.crossChain.setCurrTokenPairId(id),
  updateCrossTrans: () => stores.crossChain.updateCrossTrans(),
}))

@observer
class CrossWAN extends Component {
  constructor(props) {
    super(props);
    const { tokenPairs, match } = props;
    let tokenPairID = match.params.tokenPairId;
    this.props.setCurrSymbol(CHAINTYPE);
    this.props.changeTitle('Common.crossChain');
    this.props.setCurrTokenPairId(tokenPairID);
    this.info = tokenPairs[tokenPairID];
    this.props.setCurrToken(this.info.toAccount);
    this.props.setCurrTokenChain(this.info.toChainSymbol);
  }

  componentDidMount() {
    this.props.updateTokensBalance(this.info.toAccount, this.info.toChainSymbol);
    this.timer = setInterval(() => {
      this.props.updateTokensBalance(this.info.toAccount, this.info.toChainSymbol);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  HWSendCrossChainTx = async from => {
    let sendSuccessfully = false;
    try {
      const { rawTx, transParams, match, tokenPairs } = this.props;
      let tokenPairID = match.params.tokenPairId;
      let info = tokenPairs[tokenPairID];
      if (rawTx === false) {
        message.warn(intl.get('Common.sendFailed'));
        return;
      }
      let params = toJS(transParams[from]);
      let fromWID = Number(params.from.walletID);
      let input = {
        from,
        to: params.to,
        amount: params.amount,
        gasPrice: params.gasPrice,
        gasLimit: params.gasLimit,
        storeman: params.storeman,
        tokenPairID: tokenPairID,
        crossType: params.crossType
      };
      let cd = await getCrossChainContractData({ input, tokenPairID, sourceSymbol: info.fromChainSymbol, sourceAccount: info.fromAccount, destinationSymbol: info.toChainSymbol, destinationAccount: info.toAccount, type: 'LOCK' });
      console.log('cd:', cd);
      let data = cd.result;
      if (data === false) {
        message.warn(intl.get('CrossChain.getContractDataFailed'));
        return false;
      }

      let approveZeroTxHash, approveTxHash, lockTxHash;
      let addNonce = 0;

      if ('approveZeroTx' in cd) {
        const { to, value, data, nonce, gasLimit, gasPrice, Txtype } = cd.approveZeroTx;
        let rawParam = {
          to,
          value: '0x' + new BigNumber(value).toString(16),
          data,
          chainId: rawTx.chainId,
          nonce: '0x' + new BigNumber(nonce).toString(16),
          gasLimit: '0x' + new BigNumber(gasLimit).toString(16),
          gasPrice: '0x' + new BigNumber(gasPrice).toString(16),
          Txtype: Number(Txtype)
        }
        let raw = await pu.promisefy(fromWID === 3 ? trezorSignTransaction : ledgerSignTransaction, [params.from.path, rawParam], this);
        let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);
        approveZeroTxHash = txHash;
        addNonce++;
      }

      if ('approveTx' in cd) {
        const { to, value, data, nonce, gasLimit, gasPrice, Txtype } = cd.approveTx;
        let rawParam = {
          to,
          value: '0x' + new BigNumber(value).toString(16),
          data,
          chainId: rawTx.chainId,
          nonce: '0x' + new BigNumber(nonce).plus(addNonce).toString(16),
          gasLimit: '0x' + new BigNumber(gasLimit).toString(16),
          gasPrice: '0x' + new BigNumber(gasPrice).toString(16),
          Txtype: Number(Txtype)
        }
        let raw = await pu.promisefy(fromWID === 3 ? trezorSignTransaction : ledgerSignTransaction, [params.from.path, rawParam], this);
        let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);
        approveTxHash = txHash;
        addNonce++;
      }

      if ('result' in cd) {
        const { to, value, data, nonce, gasLimit, gasPrice, Txtype } = cd.result;
        let rawParam = {
          to,
          value: value,
          data,
          chainId: rawTx.chainId,
          nonce: '0x' + new BigNumber(nonce).plus(addNonce).toString(16),
          gasLimit: '0x' + new BigNumber(gasLimit).toString(16),
          gasPrice: '0x' + new BigNumber(gasPrice).toString(16),
          Txtype: Number(Txtype)
        }
        let raw = await pu.promisefy(fromWID === 3 ? trezorSignTransaction : ledgerSignTransaction, [params.from.path, rawParam], this);
        let sendTime = parseInt(Date.now() / 1000);
        let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);
        lockTxHash = txHash;

        // Insert cross chain tx history into local DB.
        let historyParam = {
          rawTx: {
            from: params.from,
            fromAddr: from,
            to: params.to,
            toAddr: params.toAddr,
            storeman: params.storeman,
            tokenPairID: tokenPairID,
            value,
            contractValue: `0x${new BigNumber(params.amount).times(new BigNumber(10).pow(info.ancestorDecimals)).toString(16)}`,
            gasPrice: params.gasPrice,
            gasLimit: params.gasLimit,
            nonce: new BigNumber(params.nonce).plus(addNonce).toNumber(),
            sendTime: sendTime,
            srcSCAddrKey: info.fromAccount,
            dstSCAddrKey: info.toAccount,
            srcChainType: info.fromChainSymbol,
            dstChainType: info.toChainSymbol,
            crossMode: 'Mint',
            crossType: 'FAST',
            approveTxHash,
            approveZeroTxHash,
            txHash: lockTxHash,
            redeemTxHash: '',
            revokeTxHash: '',
            buddyLockTxHash: '',
            tokenSymbol: info.fromTokenSymbol,
            tokenStand: 'WAN',
            htlcTimeOut: '',
            buddyLockedTimeOut: '',
            status: 'LockSent',
            source: 'external'
          }
        };
        wand.request('transaction_insertCrossTxToDB', historyParam, (...args) => {});
      }
      sendSuccessfully = true;
    } catch (e) {
      console.log('HW send cross chain tx failed:', e)
      sendSuccessfully = e;
    }

    return new Promise((resolve, reject) => {
      if (sendSuccessfully === true) {
        resolve();
      } else {
        reject(sendSuccessfully);
      }
    });
  }

  inboundHandleSend = from => {
    let transParams = this.props.transParams[from];
    let fromWID = Number(transParams.from.walletID);
    if (fromWID === 2 || fromWID === 3) { // 2:Ledger, 3:trezor,
      return this.HWSendCrossChainTx(from);
    }
    const { match } = this.props;
    let tokenPairID = match.params.tokenPairId;
    let info = this.info;
    let input = toJS({
      from: fromWID === 2 ? from : transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      tokenPairID: tokenPairID,
      crossType: transParams.crossType
    });
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossChain', { input, tokenPairID, sourceSymbol: info.fromChainSymbol, sourceAccount: info.fromAccount, destinationSymbol: info.toChainSymbol, destinationAccount: info.toAccount, type: 'LOCK' }, (err, ret) => {
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
      tokenPairID: tokenPairID,
      crossType: transParams.crossType
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossChain', { input, tokenPairID, sourceSymbol: info.toChainSymbol, sourceAccount: info.toAccount, destinationSymbol: info.fromChainSymbol, destinationAccount: info.fromAccount, type: 'LOCK' }, (err, ret) => {
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
      render: num => formatNum(num),
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><WANTrans balance={record.balance} from={record.address} record={record} chainPairId={this.props.match.params.tokenPairId} path={record.path} handleSend={this.inboundHandleSend} chainType={this.info.fromChainSymbol} type={INBOUND} /></div>
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
      render: num => formatNum(num),
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><WANTrans balance={record.balance} from={record.address} record={record} chainPairId={this.props.match.params.tokenPairId} path={record.path} handleSend={this.outboundHandleSend} chainType={this.info.toChainSymbol} type={OUTBOUND} /></div>
    }
  ];

  render() {
    const { getNormalAddrList, ledgerAddrList, trezorAddrList, getCCTokensListInfo } = this.props;
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
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{info.fromTokenSymbol} </span><span className={style.chain}>{info.fromChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={getNormalAddrList.concat(ledgerAddrList, trezorAddrList)} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{info.toTokenSymbol} </span><span className={style.chain}>{info.toChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getCCTokensListInfo} />
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

export default CrossWAN;
