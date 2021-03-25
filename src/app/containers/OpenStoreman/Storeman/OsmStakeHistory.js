import { Table, Avatar } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { cloneDeep } from 'lodash';
import style from './index.less';
import history from 'static/image/history.png';
import { WANMAIN, WANTESTNET } from 'utils/settings'

@inject(stores => ({
  isMainNetwork: stores.session.isMainNetwork,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  historyList: stores.openstoreman.storemanHistoryList,
  osmStakingColumns: stores.languageIntl.osmStakingColumns,
}))

@observer
class OsmStakeHistory extends Component {
  onClickRow = record => {
    let href = this.props.isMainNetwork ? `${WANMAIN}/tx/${record.key}` : `${WANTESTNET}/tx/${record.key}`;
    wand.shell.openExternal(href);
  }

  stakingColumnsTree = () => {
    let osmStakingColumns = cloneDeep(this.props.osmStakingColumns);
    osmStakingColumns[2].render = (from, info) => <span title={info.fromAddress}>{from}</span>;
    return osmStakingColumns;
  }

  render () {
    const { historyList } = this.props;
    return (
      <div>
        <div className="historyCon">
          <img src={history} /><span className={style.itemTitle}>{intl.get('Common.history')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} columns={this.stakingColumnsTree()} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default OsmStakeHistory;
