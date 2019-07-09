import { Table, Avatar } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import './index.less';

import history from 'static/image/history.png';

const MAIN = 'https://www.wanscan.org/tx/'
const TESTNET = 'http://testnet.wanscan.org/tx/';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  stakingColumns: stores.languageIntl.stakingColumns,
  historyList: stores.staking.registValidatorHistoryList,
  setSelectedAddr: addr => stores.wanAddress.setSelectedAddr(addr),
}))

@observer
class RegistValidatorHistory extends Component {
  onClickRow = record => {
    let href = this.props.chainId === 1 ? `${MAIN}${record.key}` : `${TESTNET}${record.key}`;
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
          <img src={history} /><span>{intl.get('ValidatorRegister.historyTitle')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} className="portfolioMain" columns={this.stakingColumnsTree()} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default RegistValidatorHistory;