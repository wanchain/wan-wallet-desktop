import React, { Component } from 'react';
import { Button, Input, message, Col, Row, Statistic, Divider, Icon, Tooltip } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import TransHistory from 'components/TransHistory';
import { getGasPrice, getNonce, checkWanAddr, deserializeWanTx } from 'utils/helper';

const statStyle = { color: '#ddd', background: '#03147 !important' };

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
        message.success(intl.get('Send.transSuccess'))
        let txObj = deserializeWanTx(this.state.raw);
        let rawTx = {
          txHash,
          srcSCAddrKey: 'WAN',
          srcChainType: 'WAN',
          tokenSymbol: 'WAN',
          ...txObj
        }
        wand.request('transaction_insertTransToDB', { rawTx, satellite: { offline: true } }, (err, res) => {
          if (err) {
            this.setState({ raw: '' })
            return;
          };
          this.props.updateTransHistory();
        })
        this.setState({ raw: '' })
      })
    } else {
      message.warn(intl.get('Offline.inputRawTxText'))
    }
  }

  handleJumpToWebsite = () => {
    wand.shell.openExternal('https://www.wanchain.org/getstarted');
  }

  render () {
    const { gasPrice, nonce } = this.state;

    return (
      <React.Fragment>
        <div className="offlineStep">
          <Button type="primary" className="stepOne">{intl.get('Offline.stepOne')}</Button>
          <h3 className="stepOne inlineBlock">{intl.get('Offline.stepOneText')}</h3>
          <br />
          <Input placeholder={intl.get('Offline.inputAddr')} className="colorInputAddr" onChange={this.handleAddrChange} />
          <Button type="primary" onClick={this.handleGetInfo} className="getInfoBtn">{intl.get('Offline.getInfo')}</Button>
          <Row align="middle" style={{ marginTop: '10px' }}>
            <Col span={6}>
              <span className="textFont">Gas Price: </span><Statistic valueStyle={statStyle} value={gasPrice === null ? '--' : parseInt(gasPrice) + ' Gwin'} />
            </Col>
            <Col span={6}>
              <span className="textFont">Nonce: </span><Statistic valueStyle={statStyle} value={nonce === null ? '--' : nonce} />
            </Col>
          </Row>
        </div>
        <Divider className="borderSty" />
        <div className="offlineStep">
          <Button type="primary" className="stepOne">{intl.get('Offline.stepTwo')}</Button>
          <h3 className="stepOne inlineBlock">{intl.get('Offline.stepTwoText')}</h3>
          <Tooltip placement="bottom" title={intl.get('Offline.linkToWebsite')}><Icon type="link" onClick={this.handleJumpToWebsite} /></Tooltip>
        </div>
        <Divider className="borderSty" />
        <div className="offlineStep">
          <Button type="primary" className="stepOne">{intl.get('Offline.stepThree')}</Button>
          <h3 className="stepOne inlineBlock">{intl.get('Offline.stepThreeText')}</h3>
          <br />
          <p className="stepInfo">{intl.get('Offline.threeInfo')}</p>
          <p>
            <Input.TextArea placeholder={intl.get('Offline.threeTitle')} autosize={{ minColumns: 15, minRows: 4, maxRows: 10 }} className="stepText" onChange={this.handleRawChange} value={this.state.raw}></Input.TextArea>
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
