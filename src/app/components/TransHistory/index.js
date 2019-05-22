import React, { Component } from 'react';
import { Table, Select  } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import history from 'static/image/history.png';
import './index.less';

const Option = Select.Option;

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  historyList: stores.wanAddress.historyList,
  language: stores.session.language,
  setSelectedAddr: addr => stores.wanAddress.setSelectedAddr(addr)
}))

@observer
class TransHistory extends Component {
  columns = [
    {
      title: intl.get('TransHistory.time'),
      dataIndex: 'time',
      key: 'time',
    }, {
      title: intl.get('TransHistory.from'),
      dataIndex: 'from',
      key: 'from',
    }, {
      title: intl.get('TransHistory.to'),
      dataIndex: 'to',
      key: 'to',
    }, {
      title: intl.get('TransHistory.value'),
      dataIndex: 'value',
      key: 'value'
    }, {
      title: intl.get('TransHistory.status'),
      dataIndex: 'status',
      key: 'status'
    }
  ]

  onChange = value => {
    console.log(`selected ${value}`);
    this.props.setSelectedAddr(value);
  }

  render() {
    const { addrInfo, historyList, name } = this.props;
    const addrList = Object.keys(addrInfo[name]);
    return (
      <div>
        <div className="historyCon">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
          <Select 
            showSearch
            allowClear
            style={{ width: 400 }}
            placeholder={intl.get('TransHistory.selectAFromAddress')}
            optionFilterProp="children" 
            onChange={this.onChange} 
            onFocus={this.onFocus} 
            onBlur={this.onBlur} 
            onSearch={this.onSearch}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            { addrList.map((item, index) => <Option value={item} key={index}>{item}</Option>) }
          </Select>
        </div>
        <Table className="portfolioMain" columns={this.columns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default TransHistory