import React, { Component } from 'react';
import { Table, Select  } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import history from 'static/image/history.png';
import './index.less';

const main = 'https://www.wanscan.org/tx/'
const testnet = 'http://testnet.wanscan.org/tx/';

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

  onClickRow = record => {
    let href = this.props.chainId === 1 ? `${main}${record.key}` : `${testnet}${record.key}`
    wand.shell.openExternal(href);
  }

  render() {
    const { historyList } = this.props;
    return (
      <div>
        <div className="historyCon">
          <img src={history} /><span>{intl.get('staking.delegateHistory')}</span>
        </div>
        <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} className="portfolioMain" columns={this.props.stakingColumns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default StakingHistory