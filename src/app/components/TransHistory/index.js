import React, { Component } from 'react';
import { Table, Select  } from 'antd';
import { observer, inject } from 'mobx-react';

import hostroy from 'static/image/wan.png';

const Option = Select.Option;

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
}))

@observer
class TransHistory extends Component {
  columns = [
    {
      title: 'TIME',
      dataIndex: 'time',
      key: 'time',
    }, {
      title: 'FROM',
      dataIndex: 'from',
      key: 'from',
    }, {
      title: 'TO',
      dataIndex: 'to',
      key: 'to',
    }, {
      title: 'VALUE',
      dataIndex: 'value',
      key: 'value'
    }
  ]

  source = [
    {
      key: 1,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
    {
      key: 2,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    }, 
    {
      key: 3,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
    {
      key: 4,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
    {
      key: 5,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
    {
      key: 6,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
    {
      key: 7,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
    {
      key: 8,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
    {
      key: 9,
      time: 2019,
      from: 'Account1',
      to: '0x4d249096704f30b7c4b28f6dd497a5f7b8f7d83f',
      value: '10 Wan'
    },
  ]
  onChange = value => {
    console.log(`selected ${value}`);
  }
  
  onBlur = () => {
    console.log('blur');
  }
  
  onFocus = () => {
    console.log('focus');
  }
  
  onSearch = val => {
    console.log('search:', val);
  }

  render() {
    const addrList = Object.keys(this.props.addrInfo);
    return (
      <div>
        <div className="histroyCon">
          <img src={hostroy} /><span>Transaction History</span>
          <Select 
            showSearch 
            style={{ width: 400 }} 
            placeholder="Select a person" 
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
        <Table className="portfolioMain" columns={this.columns} dataSource={this.source} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default TransHistory