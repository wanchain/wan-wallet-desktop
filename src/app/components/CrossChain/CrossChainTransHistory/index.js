import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table } from 'antd';

import 'components/TransHistory/index.less';
import { MAIN, TESTNET, TRANSTYPE } from 'utils/settings';

import history from 'static/image/history.png';

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  historyList: stores.wanAddress.historyList,
  selectedAddr: stores.wanAddress.selectedAddr,
  transColumns: stores.languageIntl.transColumns,
  offlineHistoryList: stores.wanAddress.offlineHistoryList,
  tokenTransferHistoryList: stores.wanAddress.tokenTransferHistoryList,
  setCurrPage: page => stores.wanAddress.setCurrPage(page),
}))

@observer
class CrossChainTransHistory extends Component {
  constructor (props) {
    super(props);
    this.props.setCurrPage(this.props.name || []);
  }

  onClickRow = record => {
    let href = this.props.chainId === 1 ? `${MAIN}/tx/${record.key}` : `${TESTNET}/tx/${record.key}`
    wand.shell.openExternal(href);
  }

  render () {
    const { addrInfo, historyList, name, offline, offlineHistoryList, transType, tokenTransferHistoryList } = this.props;
    let addrList = [];
    let dataSource;
    if (name) {
      name.forEach(val => { addrList = addrList.concat(Object.entries(addrInfo[val]).map(v => ({ address: v[0], name: v[1].name }))) });
    }
    if (offline) {
      dataSource = offlineHistoryList;
    } else {
      if (transType === TRANSTYPE.tokenTransfer) {
        dataSource = tokenTransferHistoryList;
      } else {
        dataSource = historyList;
      }
    }
    return (
      <div>
        <div className="historyCon" id="wanAddrSelect">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} className="portfolioMain" columns={this.props.transColumns} dataSource={dataSource} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default CrossChainTransHistory;
