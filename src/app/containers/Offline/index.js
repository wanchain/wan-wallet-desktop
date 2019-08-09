import React, { Component } from 'react';
import { Button, Input, message, Col, Row, Statistic, Divider } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import TransHistory from 'components/TransHistory';
import { getGasPrice, getNonce, checkWanAddr, deserializeWanTx } from 'utils/helper';

const statStyle = { color: '#ddd' };

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle)
}))

@observer
class Offline extends Component {
  state = {
    raw: '',
    addr: '',
    gasPrice: null,
    nonce: null,
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.offline');
  }

  handleGetInfo = async () => {
    let gasPrice, nonce;
    if (this.state.addr) {
      try {
        let ret = await checkWanAddr(this.state.addr)
        if (!ret) {
          message.warn(intl.get('NormalTransForm.addressIsIncorrect'));
          return;
        }
        [gasPrice, nonce] = await Promise.all([getGasPrice('WAN'), getNonce(this.state.addr, 'WAN')]);
        this.setState({
          gasPrice,
          nonce
        });
      } catch (err) {
        console.log('handleGetInfo: ', err)
        message.warn(intl.get('Offline.getInfoFailed'))
      }
    } else {
      message.warn(intl.get('NormalTransForm.addressIsIncorrect'));
    }
  }

  handleAddrChange = e => {
    if (e.target.value === '') {
      this.setState({
        addr: '',
        gasPrice: null,
        nonce: null
      })
    } else {
      this.setState({
        addr: e.target.value
      })
    }
  }

  handleRawChange = e => {
    this.setState({
      raw: e.target.value
    })
  }

  sendTx = () => {
    if (this.state.raw) {
      wand.request('transaction_raw', { raw: this.state.raw, chainType: 'WAN' }, (err, txHash) => {
        if (err) {
          console.log('OfflineSendTx: ', err)
          message.warn(intl.get('Offline.sendRawTx'));
          this.setState({ raw: '' });
          return;
        }
        let txObj = deserializeWanTx(this.state.raw);
        let rawTx = {
          txHash,
          srcSCAddrKey: 'WAN',
          srcChainType: 'WAN',
          tokenSymbol: 'WAN',
          ...txObj
        }
        message.success(intl.get('Send.transSuccess'))
        wand.request('transaction_insertTransToDB', { rawTx, satellite: { offline: true } }, (err, res) => {
          if (err) {
            this.setState({ raw: '' })
            return;
          };
          this.props.updateTransHistory();
        })
      })
      this.setState({ raw: '' })
    } else {
      message.warn(intl.get('Offline.inputRawTxText'))
    }
  }

  render () {
    const { gasPrice, nonce } = this.state;

    return (
      <React.Fragment>
        <div className="offlineStep">
          <h3 className="stepOne">{intl.get('Offline.stepOne')}</h3>
          <Input placeholder={intl.get('Offline.inputAddr')} className="colorInputAddr" onChange={this.handleAddrChange} />
          <Button type="primary" onClick={this.handleGetInfo}>{intl.get('Offline.getInfo')}</Button>
          {
            gasPrice !== null && nonce !== null &&
            <Row align="middle">
              <Col span={12}>
                <Statistic valueStyle={statStyle} title="Gas Price" value={gasPrice} />
              </Col>
              <Col span={12}>
                <Statistic valueStyle={statStyle} title="Nonce" value={nonce} />
              </Col>
            </Row>
          }
        </div>
        <Divider />
        <div className="offlineStep">
          <h3 className="stepOne">{intl.get('Offline.stepTwo')}</h3>
        </div>
        <Divider />
        <div className="offlineStep">
          <h3 className="stepOne">{intl.get('Offline.stepThree')}</h3>
          <p className="stepInfo">{intl.get('Offline.threeInfo')}</p>
          <p className="stepTitle">{intl.get('Offline.threeTitle')}</p>
          <p>
            <Input.TextArea autosize={{ minRows: 4, maxRows: 10 }} className="stepText" onChange={this.handleRawChange} value={this.state.raw}></Input.TextArea>
          </p>
          <p className="threeBtn">
            <Button type="primary" onClick={this.sendTx}>{intl.get('Offline.sendTrans')}</Button>
          </p>
        </div>
        <TransHistory offline={true} />
      </React.Fragment>
    );
  }
}

export default Offline;
