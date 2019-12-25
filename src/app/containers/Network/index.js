import React, { Component } from 'react';
import { Button, Card, Modal, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class Network extends Component {
  state = {
    loading: false,
    rpcDelay: 'N/A',
    wanNodeDelay: 'N/A',
    ethNodeDelay: 'N/A',
    eosNodeDelay: 'N/A',
    btcNodeDelay: 'N/A',
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

  render () {
    return (
      <div className={style['settings_network']}>
        <Card title={intl.get('Network.title')}>
          <p className={style.textP}>
            {intl.get('Network.desc')}
          </p>
          <Button
            loading={this.state.loading}
            type="primary" onClick={this.startTest}>{intl.get('Network.startButton')}
          </Button>
          <div className={style.textP2}>iWan-rpc:{this.state.rpcDelay}</div>
          <div className={style.textP2}>wan-node:{this.state.wanNodeDelay}</div>
          <div className={style.textP2}>eth-node:{this.state.ethNodeDelay}</div>
          <div className={style.textP2}>btc-node:{this.state.btcNodeDelay}</div>
          <div className={style.textP2}>eos-node:{this.state.eosNodeDelay}</div>
        </Card>
      </div>
    );
  }
}

export default Network;
