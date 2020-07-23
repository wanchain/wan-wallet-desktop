import { Row, Col, Table } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import OsmVldClaim from './OsmVldClaim';
import OsmStakeOut from './OsmVldStakeOut';
import Cell from 'components/Staking/Common/Cell';
import Validator from 'components/Staking/Common/Validator';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  myValidatorList: stores.staking.myValidatorList,
  osmValidatorListColumns: stores.languageIntl.osmValidatorListColumns,
  getValidatorsInfo: () => stores.staking.getValidatorsInfo()
}))

@observer
class MyValidatorsList extends Component {
  state = {
    withdrawVisible: false,
    stakeInVisible: false,
  }

  componentDidMount () {
    this.timer = setInterval(() => {
      this.props.getValidatorsInfo()
    }, 3000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  modifyWithdraw = () => {
    this.setState({ withdrawVisible: true });
  }

  handleCancel = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  handleSend = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  getColumns () {
    const { osmValidatorListColumns } = this.props;
    return [
      {
        ...osmValidatorListColumns[0]
      },
      {
        ...osmValidatorListColumns[1],
      },
      {
        ...osmValidatorListColumns[2],
      },
      {
        ...osmValidatorListColumns[3],
      },
      {
        ...osmValidatorListColumns[4],
      },
      {
        ...osmValidatorListColumns[5],
      },
      {
        ...osmValidatorListColumns[6],
        render: (text, record) =>
        <div>
          <Row>
            <Col span={8} align="center"><OsmStakeOut record={record} modifyType={record.modifyStake[1]}/></Col>
            <Col span={8} align="center"><OsmVldClaim record={record} /></Col>
          </Row>
          <Row>
            <Col span={8} className={style.modifyBtnText} align="center">stakeOut</Col>
            <Col span={8} className={style.modifyBtnText} align="center">Claim</Col>
          </Row>
        </div>
      }
    ];
  }

  render () {
    const fakeData = [
      {
        key: 1,
        account: 'Test',
        deposit: '213122.2222424',
        groupId: '112',
        validator: '13',
        reward: '55%',
        chain: 'WAN / BTC',
        modifyStake: ['StakeOut', 'Claim']
      }
    ]
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={fakeData} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default MyValidatorsList;
