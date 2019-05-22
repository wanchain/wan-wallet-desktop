import React, { Component } from 'react';
import { Table, Select  } from 'antd';
import { observer, inject } from 'mobx-react';

import history from 'static/image/history.png';
import './index.less';

class StakingHistory extends Component {
  columns = [
    {
      title: 'TIME',
      dataIndex: 'time',
      key: 'time',
    }, {
      title: 'FROM',
      dataIndex: 'from',
      key: 'from',
    }, {
      title: 'TO',
      dataIndex: 'to',
      key: 'to',
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
        <div className="stakeHistroy">
          <img className="stakeHistroy-img" src={history} /><span>History</span>
        </div>
        <Table className="portfolioMain" columns={this.columns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default StakingHistory