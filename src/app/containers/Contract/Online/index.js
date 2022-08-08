import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { Button, Row, Col, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import Online from './Online';

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  wanAddresses: stores.wanAddress.getAddrList,
  ethAddresses: stores.ethAddress.getAddrList,
  trxAddresses: stores.trxAddress.getAddrList,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class ContractOnline extends Component {
  constructor (props) {
    super(props);
    this.props.changeTitle('contract.onlineTitle');
  }

  componentDidMount () {

  }

  componentWillUnmount () {
  }

  render () {
    return (
      <Online wanAddresses={this.props.wanAddresses} ethAddresses={this.props.ethAddresses} trxAddresses={this.props.trxAddresses}/>
    );
  }
}

export default ContractOnline;
