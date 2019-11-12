import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table } from 'antd';

import { BTCMAIN, BTCTESTNET } from 'utils/settings';

import history from 'static/image/history.png';

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  historyList: stores.btcAddress.historyList,
  transColumns: stores.languageIntl.transBTCColumns,
  setCurrPage: page => stores.btcAddress.setCurrPage(page),
}))

@observer
class BTCTransHistory extends Component {
  constructor (props) {
    super(props);
    this.props.setCurrPage(this.props.name);
  }

  onClickRow = record => {
    let href = this.props.chainId === 1 ? `${BTCMAIN}/tx/${record.key}` : `${BTCTESTNET}/tx/${record.key}`
    wand.shell.openExternal(href);
  }

  render () {
    const { historyList } = this.props;

    return (
      <div>
        <div className="historyCon" id="wanAddrSelect">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} columns={this.props.transColumns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default BTCTransHistory;
