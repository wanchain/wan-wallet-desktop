import React, { Component } from 'react';
import { Table, Select  } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import history from 'static/image/history.png';
import './index.less';

const Option = Select.Option;

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  historyList: stores.wanAddress.stakingHistoryList,
  setSelectedAddr: addr => stores.wanAddress.setSelectedAddr(addr)
}))

@observer
class StakingHistory extends Component {
  columns = [
    {
      title: intl.get('TransHistory.time'),
      dataIndex: 'time',
      key: 'time',
    }, {
      title: intl.get('staking.table.type'),
      dataIndex: 'annotate',
      key: 'annotate',
    }, {
      title: intl.get('TransHistory.from'),
      dataIndex: 'from',
      key: 'from',
    }, {
      title: intl.get('staking.table.validator'),
      dataIndex: 'validator',
      key: 'validator',
    }, {
      title: intl.get('TransHistory.value'),
      dataIndex: 'value',
      key: 'value'
    }, {
      title: intl.get('TransHistory.status'),
      dataIndex: 'status',
      key: 'status'
    }
  ]

  onChange = value => {
    console.log(`selected ${value}`);
    this.props.setSelectedAddr(value);
  }

  render() {
    const { historyList } = this.props;
    return (
      <div>
        <div className="historyCon">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
        </div>
        <Table className="portfolioMain" columns={this.columns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default StakingHistory