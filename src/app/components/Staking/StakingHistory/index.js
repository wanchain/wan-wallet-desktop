import React, { Component } from 'react';
import { Table, Avatar } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import history from 'static/image/history.png';

const main = 'https://www.wanscan.org/tx/'
const testnet = 'http://testnet.wanscan.org/tx/';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  historyList: stores.wanAddress.stakingHistoryList,
  stakingColumns: stores.languageIntl.stakingColumns,
  setSelectedAddr: addr => stores.wanAddress.setSelectedAddr(addr),
}))

@observer
class StakingHistory extends Component {
  onChange = value => {
    this.props.setSelectedAddr(value);
  }

  onClickRow = record => {
    let href = this.props.chainId === 1 ? `${main}${record.key}` : `${testnet}${record.key}`;
    wand.shell.openExternal(href);
  }

  stakingColumnsTree = () => {
    this.props.stakingColumns[3].render = validator => <span title={validator.address}><Avatar src={validator.img} size="large" /> {validator.name}</span>;
    return this.props.stakingColumns;
  }

  render() {
    const { historyList } = this.props;
    return (
      <div>
        <div className="historyCon">
          <img src={history} /><span>{intl.get('staking.delegateHistory')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} className="portfolioMain" columns={this.stakingColumnsTree()} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default StakingHistory