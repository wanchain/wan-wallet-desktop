import React, { Component } from 'react';
import { Row, Col } from 'antd';

import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import './index.less';

import DelegateIn from 'components/Staking/DelegateIn';
import DelegateOut from 'components/Staking/DelegateOut';

@inject(stores => ({
  language: stores.languageIntl.language,
  validatorColumns: stores.languageIntl.validatorColumns,
  stakingList: stores.staking.stakingList,
}))

@observer
class DelegateActionGroup extends Component {
  state = {
    enableGroup: true,
  }

  handleDisableGroup = () => {
    this.setState({ enableGroup: false });
  }

  render () {
    return (
      <div>
        <Row>
          <Col span={12} align="center"><DelegateIn enableButton={this.state.enableGroup && this.props.record.quitEpoch === 0} record={this.props.record} /></Col>
          <Col span={12} align="center"><DelegateOut enableButton={this.state.enableGroup && this.props.record.quitEpoch === 0} record={this.props.record} handleDisableGroup={this.handleDisableGroup} /></Col>
        </Row>
        <Row>
          <Col span={12} className="modifyBtnText" align="center">{intl.get('staking.table.topup')}</Col>
          <Col span={12} className="modifyBtnText" align="center">{intl.get('staking.table.exit')}</Col>
        </Row>
      </div>
    );
  }
}

export default DelegateActionGroup;
