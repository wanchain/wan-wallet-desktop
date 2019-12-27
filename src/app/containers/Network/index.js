import React, { Component } from 'react';
import { Button, Card, Tooltip } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import imgBtc from 'static/image/btc.png';
import imgEos from 'static/image/eos.png';
import imgEth from 'static/image/eth.png';
import imgLine1 from 'static/image/network_line1.png';
import imgLine2 from 'static/image/network_line2.png';
import imgServer from 'static/image/network_server.png';
import imgWallet from 'static/image/network_wallet2.png';
import imgWanchain from 'static/image/wan.png';
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
      return style.idle;
    }

    if (value.toLowerCase().indexOf('good') !== -1) {
      return style.good;
    }

    if (value.toLowerCase().indexOf('slow') !== -1) {
      return style.slow;
    }

    if (value.toLowerCase().indexOf('time') !== -1) {
      return style.timeOut;
    }
  }

  render () {
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
                  <div className={style.wallet + ' ' + style.itemColorIdle}><img className={style.imgSize} src={imgWallet} /></div>
                </Tooltip>
              </div>
            <div className={style.layoutCol}>
              <div><Tooltip title={this.state.rpcDelay}><div className={style.line1 + ' ' + this.getStyleByState(this.state.rpcDelay)} /></Tooltip></div>
            </div>
            <div className={style.layoutCol}>
              <Tooltip title={'iWan RPC Server'}>
                <div className={style.server + ' ' + style.itemColorIdle}>
                  <img className={style.imgSize} src={imgServer} />
                </div>
              </Tooltip>
            </div>
            <div className={style.layoutCol}>
              <div>
                <Tooltip title={this.state.wanNodeDelay}><div className={style.line2 + ' ' + this.getStyleByState(this.state.wanNodeDelay)}/></Tooltip>
                <Tooltip title={this.state.ethNodeDelay}><div className={style.line3 + ' ' + this.getStyleByState(this.state.ethNodeDelay)}/></Tooltip>
                <Tooltip title={this.state.btcNodeDelay}><div className={style.line4 + ' ' + this.getStyleByState(this.state.btcNodeDelay)}/></Tooltip>
                <Tooltip title={this.state.eosNodeDelay}><div className={style.line5 + ' ' + this.getStyleByState(this.state.eosNodeDelay)}/></Tooltip>
              </div>
            </div>
            <div className={style.layoutCol}>
              <Tooltip title={'Wanchain Node'}><div className={style.node + ' ' + style.itemColorIdle}>
                <img className={style.nodeSize} src={imgWanchain} />
              </div></Tooltip>
              <Tooltip title={'Ethereum Node'}><div className={style.node + ' ' + style.itemColorIdle}>
                <img className={style.nodeSize} src={imgEth} />
              </div></Tooltip>
              <Tooltip title={'Bitcoin Node'}><div className={style.node + ' ' + style.itemColorIdle}>
                <img className={style.nodeSize} src={imgBtc} />
              </div></Tooltip>
              <Tooltip title={'EOS Node'}><div className={style.node + ' ' + style.itemColorIdle}>
                <img style={ { width: '30px', height: '30px' } } src={imgEos} />
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
