import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message, Tag } from 'antd';

import style from './index.less';
import TokenTransHistory from 'components/TransHistory/TokenTransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendTokenNormalTrans from 'components/SendNormalTrans/SendTokenNormalTrans';
import { WanTx, WanRawTx } from 'utils/hardwareUtils'
import { checkAddrType, getWalletIdByType, getFullChainName } from 'utils/helper';
import { WALLETID, TRANSTYPE, MAIN, TESTNET, BTCMAIN, BTCTESTNET, ETHMAIN, ETHTESTNET } from 'utils/settings';
import { signTransaction } from 'componentUtils/trezor'

message.config({
  duration: 2,
  maxCount: 1
});

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  getTokenAmount: stores.tokens.getTokenAmount,
  currTokenAddr: stores.tokens.currTokenAddr,
  transParams: stores.sendTransParams.transParams,
  tokenIconList: stores.tokens.tokenIconList,
  tokensList: stores.tokens.tokensList,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  currTokenChain: stores.tokens.currTokenChain,
  setCurrToken: addr => stores.tokens.setCurrToken(addr),
  setCurrTokenChain: chain => stores.tokens.setCurrTokenChain(chain),
  setTokenIcon: (tokenScAddr) => stores.tokens.setTokenIcon(tokenScAddr),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateTokensBalance: (...args) => stores.tokens.updateTokensBalance(...args),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
  getChainStoreInfoByChain: chain => stores.tokens.getChainStoreInfoByChain(chain),
}))

@observer
class TokenTrans extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('WanAccount.wallet');
    this.init(props.tokenAddr, props.chain);
  }

  init = (tokenAddr, chain) => {
    this.props.setCurrToken(tokenAddr);
    this.props.setCurrTokenChain(chain);
    this.props.getChainStoreInfoByChain(chain).updateTransHistory();
    if (!this.props.tokenIconList[tokenAddr]) {
      this.props.setTokenIcon(tokenAddr);
    }
  }

  componentDidMount() {
    this.props.getChainStoreInfoByChain(this.props.chain).updateTransHistory();
    this.props.updateTokensBalance(this.props.tokenAddr, this.props.chain);
    this.timer = setInterval(() => {
      this.props.getChainStoreInfoByChain(this.props.chain).updateTransHistory(); // Don't delete this.props.
      this.props.updateTokensBalance(this.props.tokenAddr, this.props.chain);
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentWillReceiveProps(newProps) {
    let addr = newProps.match.params.tokenAddr;
    let chain = newProps.match.params.chain;
    if (addr !== this.props.currTokenAddr) {
      this.init(addr, chain);
    }
  }

  sendLedgerTrans = (path, tx) => {
    message.info(intl.get('Ledger.signTransactionInLedger'));
    let rawTx = {
      to: tx.to,
      value: 0,
      data: tx.data,
      chainId: this.props.chainId,
      nonce: '0x' + tx.nonce.toString(16),
      gasLimit: tx.gasLimit,
      gasPrice: '0x' + new BigNumber(tx.gasPrice).times(BigNumber(10).pow(9)).toString(16),
      Txtype: 1
    }
    return new Promise((resolve, reject) => {
      wand.request('wallet_signTransaction', { walletID: WALLETID.LEDGER, path, rawTx: new WanRawTx(rawTx).serialize() }, (err, sig) => {
        if (err) {
          message.warn(intl.get('Ledger.signTransactionFailed'));
          reject(err);
          console.log(`signLedgerTransaction: ${err}`);
        } else {
          console.log('Signature: ', sig)
          rawTx.v = sig.v;
          rawTx.r = sig.r;
          rawTx.s = sig.s;
          resolve('0x' + new WanTx(rawTx).serialize().toString('hex'));
        }
      });
    })
  }

  columns = [
    {
      dataIndex: 'name',
      editable: true
    },
    {
      dataIndex: 'address',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      render: (text, record) => {
        return <div><SendTokenNormalTrans balance={typeof (record.balance) === 'string' ? record.balance.replace(/,/g, '') : record.balance} tokenAddr={this.props.tokenAddr} from={record.address} path={record.path} handleSend={this.handleSend} chainType={this.props.chain} transType={TRANSTYPE.tokenTransfer} /></div>
      }
    }
  ];

  handleSend = from => {
    let params = this.props.transParams[from];
    const { chain, symbol, getChainAddressInfoByChain } = this.props;
    let addrInfo = getChainAddressInfoByChain(chain);
    if (addrInfo === undefined) {
      message.warn(intl.get('Unknown token type')); // To do : i18n
      return;
    }

    let type = checkAddrType(from, addrInfo);
    let walletID = getWalletIdByType(type);
    let trans = {
      walletID,
      chainType: chain,
      symbol: symbol,
      path: params.path,
      to: params.to,
      amount: params.token,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
      nonce: params.nonce,
      data: params.data,
      satellite: {
        transferTo: params.transferTo.toLowerCase(),
        token: params.token
      }
    };
    return new Promise((resolve, reject) => {
      switch (type) {
        case 'ledger':
          this.sendLedgerTrans(params.path, trans).then(raw => {
            wand.request('transaction_raw', { raw, chainType: 'WAN' }, (err, txHash) => {
              if (err) {
                message.warn(intl.get('HwWallet.Accounts.sendTransactionFailed'));
                reject(false); // eslint-disable-line prefer-promise-reject-errors
              } else {
                wand.request('transaction_insertTransToDB', {
                  rawTx: {
                    txHash,
                    value: trans.amount,
                    from: from.toLowerCase(),
                    srcSCAddrKey: 'WAN',
                    srcChainType: 'WAN',
                    tokenSymbol: 'WAN',
                    ...trans
                  },
                  satellite: trans.satellite
                }, () => {
                  this.props.getChainStoreInfoByChain(this.props.chain).updateTransHistory();
                })
                console.log('TxHash:', txHash);
                message.success(intl.get('Send.transSuccess'));
                resolve(txHash);
              }
            });
          }).catch(() => { reject(false) }); // eslint-disable-line prefer-promise-reject-errors
          break;
        case 'trezor':
          signTransaction(params.path, {
            Txtype: 1,
            value: '0x',
            chainId: this.props.chainId,
            to: trans.to,
            data: trans.data,
            nonce: '0x' + trans.nonce.toString(16),
            gasLimit: trans.gasLimit,
            gasPrice: '0x' + new BigNumber(trans.gasPrice).times(BigNumber(10).pow(9)).toString(16),
          }, (_err, raw) => {
            if (_err) {
              console.log('signTrezorTransaction:', _err)
              return;
            }
            wand.request('transaction_raw', { raw, chainType: 'WAN' }, (err, txHash) => {
              if (err) {
                message.warn(intl.get('HwWallet.Accounts.sendTransactionFailed'));
                reject(err);
              } else {
                wand.request('transaction_insertTransToDB', {
                  rawTx: {
                    txHash,
                    value: trans.amount,
                    from: from.toLowerCase(),
                    srcSCAddrKey: 'WAN',
                    srcChainType: 'WAN',
                    tokenSymbol: 'WAN',
                    ...trans
                  },
                  satellite: trans.satellite
                }, () => {
                  this.props.getChainStoreInfoByChain(this.props.chain).updateTransHistory();
                })
                message.success(intl.get('Send.transSuccess'));
                resolve(txHash);
              }
            });
          });
          break;
        case 'normal':
        case 'import':
        case 'rawKey':
          wand.request('transaction_tokenNormal', trans, (err, txHash) => {
            if (err) {
              message.warn(intl.get('WanAccount.sendTransactionFailed'));
              reject(false); // eslint-disable-line prefer-promise-reject-errors
            } else {
              this.props.getChainStoreInfoByChain(this.props.chain).updateTransHistory();
              console.log('Tx hash: ', txHash);
              message.success(intl.get('Send.transSuccess'));
              resolve(txHash)
            }
          });
          break;
      }
    })
  }

  onClickTokenAddress = () => {
    let { chainId, tokenAddr, currTokenChain } = this.props;
    let prefix = '';
    switch (currTokenChain) {
      case 'WAN':
        prefix = chainId === 1 ? MAIN : TESTNET;
        break;
      case 'ETH':
        prefix = chainId === 1 ? ETHMAIN : ETHTESTNET;
        break;
      case 'BTC':
        prefix = chainId === 1 ? BTCMAIN : BTCTESTNET;
        break;
      default:
        prefix = chainId === 1 ? MAIN : TESTNET;
    }
    wand.shell.openExternal(`${prefix}/token/${tokenAddr}`);
  }

  render() {
    const { getTokenAmount, getTokensListInfo, symbol, tokenAddr, chain } = this.props;
    this.props.language && this.columns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left">
            <img className="totalImg" src={this.props.tokenIconList[tokenAddr]} />
            <span className="wanTotal">{getTokenAmount}</span>
            <span className="wanTex">{symbol}</span>
            <Tag className="symbol">{getFullChainName(chain)}</Tag>
          </Col>
          <Col span={12} className="col-right">
            <span className={style.tokenTxt}>{intl.get('Common.tokenAddr')}: <span className={style.tokenAddr} onClick={this.onClickTokenAddress}>{tokenAddr}</span></span>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TokenTransHistory name={chain === 'WAN' ? ['normal', 'import', 'ledger', 'trezor', 'rawKey'] : ['normal', 'rawKey']} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default props => <TokenTrans {...props} symbol={props.match.params.symbol} chain={props.match.params.chain} key={props.match.params.tokenAddr} tokenAddr={props.match.params.tokenAddr} />;
