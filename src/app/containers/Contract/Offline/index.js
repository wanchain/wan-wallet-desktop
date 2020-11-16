import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { Button, Row, Col, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import Offline from './Offline';

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  normalAddrList: stores.wanAddress.getNormalAddrList,
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
      <Offline normalAddrList={this.props.normalAddrList} />
    );
  }
}

export default ContractOffline;