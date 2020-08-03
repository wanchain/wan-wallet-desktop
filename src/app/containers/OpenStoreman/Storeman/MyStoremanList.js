import { Row, Col, Table } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import OsmVldClaim from './OsmClaim';
import OsmAppendAndExit from './OsmAppendAndExit';

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
            <Col span={8} align="center"><OsmAppendAndExit record={record} modifyType='top-up' /></Col>
            <Col span={8} align="center"><OsmAppendAndExit record={record} modifyType='exit' /></Col>
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
        account: 'Account1',
        myAddress: {
          addr: '0x56664f3B65Cc5DAF4098ed10b66C4a86e58e21a4',
          type: 'normal',
          path: "m/44'/5718350'/0'/0",
        },
        stake: '20000',
        groupId: '112',
        rank: ['11', '21'],
        slash: '1',
        activity: '2',
        reward: '55',
        crosschain: 'WAN / BTC',
        status: 'Processing',
        wAddr: '0x56664f3B65Cc5DAF4098ed10b66C4a86e58e21a4',
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
