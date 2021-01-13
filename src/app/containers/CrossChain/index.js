import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { toJS } from 'mobx';
import { Table, Row, Col, message } from 'antd';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND, COIN_ACCOUNT } from 'utils/settings';
import Trans from 'components/CrossChain/SendCrossChainTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory';
import { formatNum } from 'utils/support';
import { getCrossChainContractData } from 'utils/helper';
import { BigNumber } from 'bignumber.js';
import { signTransaction as trezorSignTransaction } from 'componentUtils/trezor';
import { signTransaction as ledgerSignTransaction } from 'componentUtils/ledger';
import style from './index.less';
const pu = require('promisefy-util');

@inject(stores => ({
  language: stores.languageIntl.language,
  stores: stores,
  transParams: stores.sendCrossChainParams.transParams,
  rawTx: stores.sendCrossChainParams.rawTx,
  tokenPairs: stores.crossChain.tokenPairs,
  currTokenPairId: stores.crossChain.currTokenPairId,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: addr => stores.tokens.setCurrToken(addr),
  updateTokensBalance: (...args) => stores.tokens.updateTokensBalance(...args),
  getCoinsListInfo_2way: (...args) => stores.tokens.getCoinsListInfo_2way(...args),
  getTokensListInfo_2way: (...args) => stores.tokens.getTokensListInfo_2way(...args),
  getCoinImage: (...args) => stores.tokens.getCoinImage(...args),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  setCurrTokenPairId: id => stores.crossChain.setCurrTokenPairId(id),
  updateCrossTrans: () => stores.crossChain.updateCrossTrans(),
}))

@observer
class CrossChain extends Component {
  constructor(props) {
    super(props);
    const { match, changeTitle } = this.props;
    changeTitle('Common.crossChain');
    const tokenPairId = match.params.tokenPairId;
    this.init(tokenPairId);
    this.state = {
      error: false,
    }
  }

  init = (id) => {
    const { tokenPairs, setCurrToken, setCurrTokenPairId, setCurrSymbol } = this.props;
    const { fromAccount, ancestorSymbol } = tokenPairs[id];
    setCurrToken(fromAccount);
    setCurrTokenPairId(id);
    setCurrSymbol(ancestorSymbol);
  }

  componentWillReceiveProps(newProps) {
    let id = newProps.match.params.tokenPairId;
    if (id !== this.props.currTokenPairId) {
      this.init(id);
    }
  }

  componentDidMount() {
    let updateBalance = () => {
      const { updateTokensBalance, tokenPairs, match } = this.props;
      const tokenPairId = match.params.tokenPairId;
      const { fromAccount, toAccount, fromChainSymbol, toChainSymbol } = tokenPairs[tokenPairId];
      if (fromAccount !== COIN_ACCOUNT) {
        updateTokensBalance(fromAccount, fromChainSymbol);
      }
      if (toAccount !== COIN_ACCOUNT) {
        updateTokensBalance(toAccount, toChainSymbol);
      }
    }
    updateBalance();
    this.timer = setInterval(updateBalance, 5000);
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

  HWSendCrossChainTx = async (from, type) => {
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
      let param = type === INBOUND ? { input, tokenPairID, sourceSymbol: info.fromChainSymbol, sourceAccount: info.fromAccount, destinationSymbol: info.toChainSymbol, destinationAccount: info.toAccount, type: 'LOCK' } : { input, tokenPairID, sourceSymbol: info.toChainSymbol, sourceAccount: info.toAccount, destinationSymbol: info.fromChainSymbol, destinationAccount: info.fromAccount, type: 'LOCK' };
      let cd = await getCrossChainContractData(param);
      console.log('cd:', cd);
      if (cd.code === false) {
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
            srcSCAddrKey: type === INBOUND ? info.fromAccount : info.toAccount,
            dstSCAddrKey: type === INBOUND ? info.toAccount : info.fromAccount,
            srcChainType: type === INBOUND ? info.fromChainSymbol : info.toChainSymbol,
            dstChainType: type === INBOUND ? info.toChainSymbol : info.fromChainSymbol,
            crossMode: type === INBOUND ? 'Mint' : 'Burn',
            crossType: 'FAST',
            approveTxHash,
            approveZeroTxHash,
            txHash: lockTxHash,
            redeemTxHash: '',
            revokeTxHash: '',
            buddyLockTxHash: '',
            tokenSymbol: type === INBOUND ? info.fromTokenSymbol : info.toTokenSymbol,
            tokenStand: 'TOKEN',
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
    const { tokenPairs, match } = this.props;
    let tokenPairID = match.params.tokenPairId;
    let info = tokenPairs[tokenPairID];
    let transParams = this.props.transParams[from];
    let fromWID = Number(transParams.from.walletID);
    if (info.fromChainSymbol === 'WAN' && (fromWID === 2 || fromWID === 3)) {
      return this.HWSendCrossChainTx(from, INBOUND);
    }

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
            if (ret.includes('insufficient funds')) {
              message.warn(intl.get('Common.sendFailedForInsufficientFunds'));
            } else {
              message.warn(intl.get('Common.sendFailed'));
            }
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
    let fromWID = Number(transParams.from.walletID);
    if (info.toChainSymbol === 'WAN' && (fromWID === 2 || fromWID === 3)) {
      return this.HWSendCrossChainTx(from, OUTBOUND);
    }

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
            if (ret.includes('insufficient funds')) {
              message.warn(intl.get('Common.sendFailedForInsufficientFunds'));
            } else {
              message.warn(intl.get('Common.sendFailed'));
            }
            return reject(ret);
          }
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
      render: num => formatNum(num),
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => {
        return <div><Trans balance={record.balance} record={record} from={record.address} account={record.name} path={record.path} handleSend={this.inboundHandleSend} type={INBOUND} chainPairId={this.props.match.params.tokenPairId} /></div>;
      }
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
      render: (text, record) => {
        return <div><Trans balance={record.balance} record={record} from={record.address} account={record.name} path={record.path} handleSend={this.outboundHandleSend} type={OUTBOUND} chainPairId={this.props.match.params.tokenPairId} /></div>;
      }
    }
  ];

  render() {
    const { getTokensListInfo_2way, getCoinsListInfo_2way, tokenPairs, match, getCoinImage } = this.props;
    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });
    let tokenPairID = match.params.tokenPairId;
    let info = tokenPairs[tokenPairID];
    let fromAddresses = info.fromAccount === COIN_ACCOUNT ? getCoinsListInfo_2way(info.fromChainSymbol, info.fromChainID) : getTokensListInfo_2way(info.fromChainSymbol, info.fromChainID, info.fromAccount);
    let toAddresses = info.toAccount === COIN_ACCOUNT ? getCoinsListInfo_2way(info.toChainSymbol, info.toChainID) : getTokensListInfo_2way(info.toChainSymbol, info.toChainID, info.toAccount);

    return this.state.error ? <div className="errorComponent">An error occurred in this component.</div> : (<div className="account">
      <Row className="title">
        <Col span={12} className="col-left"><img className="totalImg" src={getCoinImage(info.ancestorSymbol, info.fromAccount)} /><span className="wanTotal">{info.fromTokenSymbol}</span><span className={style.chain}>{info.fromChainName}</span></Col>
      </Row>
      <Row className="mainBody">
        <Col>
          <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={fromAddresses} />
        </Col>
      </Row>
      <Row className="title">
        <Col span={12} className="col-left"><img className="totalImg" src={getCoinImage(info.ancestorSymbol, info.toAccount)} /><span className="wanTotal">{info.toTokenSymbol}</span><span className={style.chain}>{info.toChainName}</span></Col>
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
    </div>)
  }
}

export default CrossChain;
