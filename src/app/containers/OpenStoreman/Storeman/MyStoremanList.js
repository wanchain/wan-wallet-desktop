import { Row, Col, Table } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import OsmVldClaim from './OsmClaim';
import OsmStakeOut from './OsmStakeOut';
import Cell from 'components/Staking/Common/Cell';
import Validator from 'components/Staking/Common/Validator';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  myValidatorList: stores.staking.myValidatorList,
  osmStoremanListColumns: stores.languageIntl.osmStoremanListColumns,
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
    const { osmStoremanListColumns } = this.props;
    return [
      {
        ...osmStoremanListColumns[0]
      },
      {
        ...osmStoremanListColumns[1],
      },
      {
        ...osmStoremanListColumns[2],
      },
      {
        ...osmStoremanListColumns[3],
        render: rank => <div><span>{rank[0]}</span>/<span>{rank[1]}</span></div>
      },
      {
        ...osmStoremanListColumns[4],
      },
      {
        ...osmStoremanListColumns[5],
      },
      {
        ...osmStoremanListColumns[6],
      },
      {
        ...osmStoremanListColumns[7],
      },
      {
        ...osmStoremanListColumns[8],
        render: (text, record) =>
        <div>
          <Row>
            <Col span={8} align="center"><OsmVldClaim record={record} modifyType={record.modifyStake[1]}/></Col>
            <Col span={8} align="center"><OsmStakeOut record={record} /></Col>
            <Col span={8} align="center"><OsmVldClaim record={record} /></Col>

          </Row>
          <Row>
            <Col span={8} className={style.modifyBtnText} align="center">Top-up</Col>
            <Col span={8} className={style.modifyBtnText} align="center">Exit</Col>
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
        deposit: '20000',
        groupId: '112',
        rank: ['11', '21'],
        slash: '1',
        activity: '2',
        reward: '55',
        chain: 'WAN / BTC',
        status: 'Processing',
        modifyStake: ['Append', 'Exit', 'Claim']
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
