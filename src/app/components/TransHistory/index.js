import React, { Component } from 'react';
import { Table, Select } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import history from 'static/image/history.png';

const Option = Select.Option;
const main = 'https://www.wanscan.org/tx/'
const testnet = 'http://testnet.wanscan.org/tx/';

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  historyList: stores.wanAddress.historyList,
  transColumns: stores.languageIntl.transColumns,
  setCurrPage: page => stores.wanAddress.setCurrPage(page),
  setSelectedAddr: addr => stores.wanAddress.setSelectedAddr(addr)
}))

@observer
class TransHistory extends Component {
  constructor(props) {
    super(props);
    this.props.setCurrPage(this.props.name)
  }

  onChange = value => {
    this.props.setSelectedAddr(value);
  }

  onClickRow = record => {
    let href = this.props.chainId === 1 ? `${main}${record.key}` : `${testnet}${record.key}`
    wand.shell.openExternal(href);
  }

  render() {
    const { addrInfo, historyList, name } = this.props;
    let addrList = [];
    name.forEach(val => {
      addrList = addrList.concat(Object.keys(addrInfo[val]));
    })

    return (
      <div>
        <div className="historyCon" id="wanAddrSelect">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
          <Select
            showSearch
            allowClear
            style={{ width: 400 }}
            placeholder={intl.get('TransHistory.selectAFromAddress')}
            optionFilterProp="children"
            onChange={this.onChange}
            getPopupContainer = {() => document.getElementById('wanAddrSelect')}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {addrList.map((item, index) => <Option value={item} key={index}>{item}</Option>)}
          </Select>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} className="portfolioMain" columns={this.props.transColumns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default TransHistory