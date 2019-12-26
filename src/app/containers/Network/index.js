import React, { Component } from 'react';
import { Button, Card, Tooltip } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import imgBtc from 'static/image/network_btc.png';
import imgEos from 'static/image/network_eos.png';
import imgEth from 'static/image/network_eth.png';
import imgLine1 from 'static/image/network_line1.png';
import imgLine2 from 'static/image/network_line2.png';
import imgServer from 'static/image/network_server.png';
import imgWallet from 'static/image/network_wallet.png';
import imgWanchain from 'static/image/network_wanchain.png';
import imgRed from 'static/image/network_red.png';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class Network extends Component {
  state = {
    loading: false,
    rpcDelay: 'waiting...',
    wanNodeDelay: 'waiting...',
    ethNodeDelay: 'waiting...',
    eosNodeDelay: 'waiting...',
    btcNodeDelay: 'waiting...',
  }

  resetStateVal = () => {
    this.setState({
      loading: false,
    });
  }

  startTest = () => {
    this.setState({
      loading: true,
      rpcDelay: 'waiting...',
      wanNodeDelay: 'waiting...',
      ethNodeDelay: 'waiting...',
      eosNodeDelay: 'waiting...',
      btcNodeDelay: 'waiting...',
    })

    wand.request('setting_rpcDelay', null, function(err, ret) {
      this.setState({ loading: false, rpcDelay: err || ret });
    }.bind(this));

    wand.request('setting_wanNodeDelay', null, function(err, ret) {
      this.setState({ loading: false, wanNodeDelay: err || ret });
    }.bind(this));

    wand.request('setting_ethNodeDelay', null, function(err, ret) {
      this.setState({ loading: false, ethNodeDelay: err || ret });
    }.bind(this));

    wand.request('setting_btcNodeDelay', null, function(err, ret) {
      this.setState({ loading: false, btcNodeDelay: err || ret });
    }.bind(this));

    wand.request('setting_eosNodeDelay', null, function(err, ret) {
      this.setState({ loading: false, eosNodeDelay: err || ret });
    }.bind(this));
  }

  getStyleByState (value) {
    if (!value) {
      return;
    }
    if (value.toLowerCase().indexOf('wait') !== -1) {
      return style.itemColorIdle;
    }

    if (value.toLowerCase().indexOf('good') !== -1) {
      return style.itemColorGood;
    }

    if (value.toLowerCase().indexOf('slow') !== -1) {
      return style.itemColorSlow;
    }

    if (value.toLowerCase().indexOf('timeout') !== -1) {
      return style.itemColorTimeout;
    }
  }

  isTimeout(value) {
    if (value.toLowerCase().indexOf('timeout') !== -1) {
      return true;
    }
    return false;
  }

  render () {
    let walletStyle = this.getStyleByState('good');
    let serverStyle = this.getStyleByState(this.state.rpcDelay);
    let wanStyle = this.getStyleByState(this.state.wanNodeDelay);
    let ethStyle = this.getStyleByState(this.state.ethNodeDelay);
    let btcStyle = this.getStyleByState(this.state.btcNodeDelay);
    let eosStyle = this.getStyleByState(this.state.eosNodeDelay);

    let serverTimeout = this.isTimeout(this.state.rpcDelay);
    let wanTimeout = this.isTimeout(this.state.wanNodeDelay);
    let ethTimeout = this.isTimeout(this.state.ethNodeDelay);
    let btcTimeout = this.isTimeout(this.state.btcNodeDelay);
    let eosTimeout = this.isTimeout(this.state.eosNodeDelay);

    return (
      <div className={style['settings_network']}>
        <Card title={intl.get('Network.title')}>
          <p className={style.textP}>
            {intl.get('Network.desc')}
          </p>
          <Button
            loading={this.state.loading}
            className={style.startBtn}
            type="primary" onClick={this.startTest}>{intl.get('Network.startButton')}
          </Button>
          <div className={style.layoutDiv}>
            <div className={style.layoutCol}>
                <Tooltip title='Local Wallet'>
                  <div className={style.wallet + ' ' + walletStyle}><img className={style.imgSize} src={imgWallet} /></div>
                </Tooltip>
              </div>
            <div className={style.layoutCol}>
              <div><img className={style.line1} src={imgLine1} /></div>
            </div>
            <div className={style.layoutCol}>
              <Tooltip title={'iWan RPC Server' + ': ' + this.state.rpcDelay}>
                <div className={style.server + ' ' + serverStyle}>
                  <img className={style.imgSize} src={imgServer} />
                  { serverTimeout ? <div><div className={style.timeOutServer}>Timeout</div><img className={style.redSizeServer} src={imgRed}/></div> : null }
                </div>
              </Tooltip>
            </div>
            <div className={style.layoutCol}>
              <div><img className={style.line2} src={imgLine2} /></div>
            </div>
            <div className={style.layoutCol}>
              <Tooltip title={'Wanchain Node' + ': ' + this.state.wanNodeDelay}><div className={style.node + ' ' + wanStyle}>
                <img className={style.nodeSize} src={imgWanchain} />
                { wanTimeout ? <div><div className={style.timeOut}>Timeout</div><img className={style.redSize} src={imgRed}/></div> : null }
              </div></Tooltip>
              <Tooltip title={'Ethereum Node' + ': ' + this.state.ethNodeDelay}><div className={style.node + ' ' + ethStyle}>
                <img className={style.nodeSize} src={imgEth} />
                { ethTimeout ? <div><div className={style.timeOut}>Timeout</div><img className={style.redSize} src={imgRed}/></div> : null }
              </div></Tooltip>
              <Tooltip title={'Bitcoin Node' + ': ' + this.state.btcNodeDelay}><div className={style.node + ' ' + btcStyle}>
                <img className={style.nodeSize} src={imgBtc} />
                { btcTimeout ? <div><div className={style.timeOut}>Timeout</div><img className={style.redSize} src={imgRed}/></div> : null }
              </div></Tooltip>
              <Tooltip title={'EOS Node' + ': ' + this.state.eosNodeDelay}><div className={style.node + ' ' + eosStyle}>
                <img style={ { width: '30px', height: '30px' } } src={imgEos} />
                { eosTimeout ? <div><div className={style.timeOut}>Timeout</div><img className={style.redSize} src={imgRed}/></div> : null }
              </div>
              </Tooltip>
            </div>
          </div>
        </Card>
      </div>
    );
  }
}

export default Network;
