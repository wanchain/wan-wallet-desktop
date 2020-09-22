import { Row, Col, Table } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import OsmVldClaim from './OsmClaim';
import OsmAppendAndExit from './OsmAppendAndExit';

@inject(stores => ({
  language: stores.languageIntl.language,
  storemanListData: stores.openstoreman.storemanListData,
  osmStoremanListColumns: stores.languageIntl.osmStoremanListColumns,
  getStoremanStakeInfo: () => stores.openstoreman.getStoremanStakeInfo(),
  getStoremanDelegatorInfo: () => stores.openstoreman.getStoremanDelegatorInfo()
}))

@observer
class MyStoremanList extends Component {
  state = {
    withdrawVisible: false,
    stakeInVisible: false,
  }

  componentDidMount () {
    this.timer = setInterval(() => {
      this.props.getStoremanStakeInfo()
      this.props.getStoremanDelegatorInfo()
    }, 20000)
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
        render: rank => {
          if (rank[0].toString() === '-1') {
            return <div><span>&gt;</span><span>{rank[1]}</span></div>
          } else {
            return <div><span>{rank[0]}</span>/<span>{rank[1]}</span></div>
          }
        }
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
            <Col span={8} align="center"><OsmAppendAndExit enableButton={record.canStakeOut && !record.quited} record={record} modifyType='exit' /></Col>
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
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={this.props.storemanListData} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default MyStoremanList;
