import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import Offline from './Offline';

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
class ContractOffline extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('contract.offlineTitle');
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <Offline wanAddresses={this.props.wanAddresses} ethAddresses={this.props.ethAddresses} trxAddresses={this.props.trxAddresses} />
    );
  }
}

export default ContractOffline;
