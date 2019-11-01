import React, { Component } from 'react';
import { Table, Select } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import { MAIN, TESTNET, TRANSTYPE } from 'utils/settings';

import history from 'static/image/history.png';

const Option = Select.Option;

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
  setSelectedAddr: addr => stores.wanAddress.setSelectedAddr(addr)
}))

@observer
class TransHistory extends Component {
  constructor (props) {
    super(props);
    this.props.setCurrPage(this.props.name || []);
  }

  onChange = value => {
    this.props.setSelectedAddr(value);
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
          { !offline &&
            <Select
              showSearch
              allowClear
              style={{ width: 400 }}
              placeholder={intl.get('TransHistory.selectAFromAddress')}
              optionFilterProp="children"
              onChange={this.onChange}
              defaultValue={this.props.selectedAddr ? this.props.selectedAddr[0] : undefined}
              getPopupContainer = {() => document.getElementById('wanAddrSelect')}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            >
              {addrList.map((item, index) => <Option value={item.address} key={index}>{item.name}</Option>)}
            </Select>
          }
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} columns={this.props.transColumns} dataSource={dataSource} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default TransHistory;
