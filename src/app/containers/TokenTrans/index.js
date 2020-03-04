import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';

import style from './index.less';
import TransHistory from 'components/TransHistory';
import CopyAndQrcode from 'components/CopyAndQrcode';
import SendNormalTrans from 'components/SendNormalTrans';
import { WanTx, WanRawTx } from 'utils/hardwareUtils'
import { checkAddrType, getWalletIdByAddr } from 'utils/helper';
import { WALLETID, TRANSTYPE, MAIN, TESTNET } from 'utils/settings';
import { signTransaction } from 'componentUtils/trezor'

const CHAINTYPE = 'WAN';

message.config({
  duration: 2,
  maxCount: 1
});

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.tokens.getTokenAmount,
  transParams: stores.sendTransParams.transParams,
  getTokensListInfo: stores.tokens.getTokensListInfo_2WanTypes,
  setCurrToken: addr => stores.tokens.setCurrToken(addr),
  getTokenIcon: (tokenScAddr) => stores.tokens.getTokenIcon(tokenScAddr),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr)
}))

@observer
class TokenTrans extends Component {
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
      render: (text, record) => <div><SendNormalTrans balance={record.balance} tokenAddr={this.props.tokenAddr} from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE} transType={TRANSTYPE.tokenTransfer}/></div>
    }
  ];

  constructor (props) {
    super(props);
    this.img = this.props.getTokenIcon(this.props.tokenAddr);
    this.props.setCurrToken(this.props.tokenAddr);
    this.props.changeTitle('WanAccount.wallet');
    this.props.updateTransHistory();
  }

  componentDidMount () {
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateTokensBalance(this.props.tokenAddr);
    }, 5000);
  }

  componentWillUnmount () {
    clearInterval(this.timer);
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

  handleSend = from => {
    let params = this.props.transParams[from];
    let type = checkAddrType(from, this.props.addrInfo);
    let walletID = getWalletIdByAddr(type);
    let trans = {
      walletID,
      chainType: CHAINTYPE,
      symbol: CHAINTYPE,
      path: params.path,
      to: params.to,
      amount: '0',
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
                  this.props.updateTransHistory();
                })
                console.log('TxHash:', txHash);
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
                wand.request('transaction_insertTransToDB', { rawTx: {
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
                  this.props.updateTransHistory();
                })
                resolve(txHash);
              }
            });
          });
          break;
        case 'normal':
          wand.request('transaction_normal', trans, (err, txHash) => {
            if (err) {
              message.warn(intl.get('WanAccount.sendTransactionFailed'));
              console.log('transaction_normal:', err);
              reject(false); // eslint-disable-line prefer-promise-reject-errors
            } else {
              this.props.updateTransHistory();
              console.log('Tx hash: ', txHash);
              resolve(txHash)
            }
          });
          break;
      }
    })
  }

  onClickRow = () => {
    let { chainId, tokenAddr } = this.props;
    let href = chainId === 1 ? `${MAIN}/token/${tokenAddr}` : `${TESTNET}/token/${tokenAddr}`
    wand.shell.openExternal(href);
  }

  render () {
    const { getAmount, getTokensListInfo, symbol, tokenAddr } = this.props;

    this.props.language && this.columns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={this.img} /><span className="wanTotal">{getAmount}</span><span className="wanTex">{symbol}</span></Col>
          <Col span={12} className="col-right">
            <span className={style.tokenTxt}>{intl.get('Common.tokenAddr')}: <span className={style.tokenAddr} onClick={this.onClickRow}>{tokenAddr}</span></span>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <TransHistory name={['normal', 'import', 'ledger', 'trezor']} transType={TRANSTYPE.tokenTransfer} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default props => <TokenTrans {...props} symbol={props.match.params.symbol} key={props.match.params.tokenAddr} tokenAddr={props.match.params.tokenAddr} />;
