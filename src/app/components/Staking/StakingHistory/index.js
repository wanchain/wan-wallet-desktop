import React, { Component } from 'react';
import { Table, Select  } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import history from 'static/image/history.png';
import './index.less';

const Option = Select.Option;

@inject(stores => ({
  language: stores.languageIntl.language,
  stakingColumns: stores.languageIntl.stakingColumns,
  addrInfo: stores.wanAddress.addrInfo,
  historyList: stores.wanAddress.stakingHistoryList,
  setSelectedAddr: addr => stores.wanAddress.setSelectedAddr(addr)
}))

@observer
class StakingHistory extends Component {
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
        <Table className="portfolioMain" columns={this.props.stakingColumns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default StakingHistory