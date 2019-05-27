import React, { Component } from 'react';
import { Table, Select  } from 'antd';
import { observer, inject } from 'mobx-react';

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
      title: 'TIME',
      dataIndex: 'time',
      key: 'time',
    }, {
      title: 'TYPE',
      dataIndex: 'annotate',
      key: 'annotate',
    }, {
      title: 'FROM',
      dataIndex: 'from',
      key: 'from',
    }, {
      title: 'VALIDATOR',
      dataIndex: 'validator',
      key: 'validator',
    }, {
      title: 'VALUE',
      dataIndex: 'value',
      key: 'value'
    }, {
      title: 'STATUS',
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
          <img src={history} /><span>Transaction History</span>
        </div>
        <Table className="portfolioMain" columns={this.columns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default StakingHistory