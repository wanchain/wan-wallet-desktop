import { Table, Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import OsmDelegateClaim from './OsmDelegateClaim'
import DelegateAppendAndExit from './DelegateAppendAndExit';

@inject(stores => ({
  language: stores.languageIntl.language,
  delegatorListData: stores.openstoreman.delegatorListData,
  osmDelegateListColumns: stores.languageIntl.osmDelegateListColumns,
  getStoremanDelegatorInfo: () => stores.openstoreman.getStoremanDelegatorInfo()
}))

@observer
class OsmDelegateList extends Component {
  state = {
    withdrawVisible: false,
    stakeInVisible: false,
  }

  componentDidMount () {
    this.timer = setInterval(() => {
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
    const { osmDelegateListColumns } = this.props;
    return [
      {
        ...osmDelegateListColumns[0]
      },
      {
        ...osmDelegateListColumns[1],
      },
      {
        ...osmDelegateListColumns[2],
      },
      {
        ...osmDelegateListColumns[3],
      },
      {
        ...osmDelegateListColumns[4],
      },
      {
        ...osmDelegateListColumns[5],
        render: (text, record) =>
        <div>
          <Row>
            <Col span={8} align="center"><DelegateAppendAndExit record={record} modifyType='top-up' /></Col>
            <Col span={8} align="center"><DelegateAppendAndExit enableButton={record.canDelegateOut && !record.quited} record={record} modifyType='exit' /></Col>
            <Col span={8} align="center"><OsmDelegateClaim record={record} /></Col>
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

  render() {
    return (
      <div>
        <Table columns={this.getColumns()} dataSource={this.props.delegatorListData} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default OsmDelegateList;
