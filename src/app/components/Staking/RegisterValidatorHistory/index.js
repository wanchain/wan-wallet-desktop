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
  stakingColumns: stores.languageIntl.stakingColumns,
  historyList: stores.staking.registerValidatorHistoryList,
}))

@observer
class RegisterValidatorHistory extends Component {
  onClickRow = record => {
    let href = this.props.isMainNetwork ? `${WANMAIN}/tx/${record.key}` : `${WANTESTNET}/tx/${record.key}`;
    wand.shell.openExternal(href);
  }

  stakingColumnsTree = () => {
    let stakingColumns = cloneDeep(this.props.stakingColumns);
    stakingColumns[2].render = (from, info) => <span title={info.fromAddress}>{from}</span>;
    stakingColumns[3].render = validator => <span title={validator.address}><Avatar src={validator.img} size="large" /> {validator.name}</span>;
    return stakingColumns;
  }

  render () {
    const { historyList } = this.props;
    return (
      <div>
        <div className="historyCon">
          <img src={history} /><span>{intl.get('ValidatorRegister.historyTitle')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} columns={this.stakingColumnsTree()} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default RegisterValidatorHistory;
