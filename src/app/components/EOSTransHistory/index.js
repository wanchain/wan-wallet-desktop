import React, { Component } from 'react';
import { Table, Select, Radio, message, Icon, Tooltip } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import history from 'static/image/history.png';

const { Option } = Select;

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.eosAddress.addrInfo,
  language: stores.languageIntl.language,
  // normalHistoryList: stores.eosAddress.normalHistoryList,
  // resourceHistoryList: stores.eosAddress.resourceHistoryList,
  selectedAddr: stores.eosAddress.selectedAddr,
  transColumns: stores.languageIntl.transColumns,
  privateTransColumns: stores.languageIntl.privateTransColumns,
  // setCurrPage: page => stores.eosAddress.setCurrPage(page),
  setSelectedAddr: addr => stores.eosAddress.setSelectedAddr(addr)
}))

@observer
class EOSTransHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'normal'
    }
  }

  onChange = value => {
  }

  onTypeChange = (e) => {
    console.log(e.target.value);
    this.setState({
      type: e.target.value
    })
  }

  onClickRow = record => {
  }

  normalColumn = [
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
      title: 'AMOUNT',
      dataIndex: 'amount',
      key: 'amount',
    }, {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
    }
  ];

  resourceColumn = [
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
      title: 'AMOUNT',
      dataIndex: 'amount',
      key: 'amount',
    }, {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
    }
  ];

  render() {
    const { addrInfo } = this.props;
    let addrList = [];
    let normalHistoryList = [{
      time: '1',
      from: '1',
      to: '1',
      amount: '1',
      status: '1'
    }, {
      time: '2',
      from: '1',
      to: '1',
      amount: '1',
      status: '1'
    }, {
      time: '3',
      from: '1',
      to: '1',
      amount: '1',
      status: '1'
    }];
    let resourceHistoryList = [{
      time: '444',
      from: '2',
      to: '2',
      amount: '2',
      status: '2'
    }, {
      time: '555',
      from: '2',
      to: '2',
      amount: '2',
      status: '2'
    }, {
      time: '666',
      from: '2',
      to: '2',
      amount: '2',
      status: '2'
    }, {
      time: '777',
      from: '2',
      to: '2',
      amount: '2',
      status: '2'
    }];
    return (
      <div>
        <div className="historyCon" id="EOSSelection">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
          <Select
            showSearch
            allowClear
            style={{ width: 400 }}
            placeholder={'Select an account name'}
            optionFilterProp="children"
            onChange={this.onChange}
            defaultValue={1}
            getPopupContainer={() => document.getElementById('EOSSelection')}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {addrList.map((item, index) => <Option value={item.address} key={index}>{item.name}</Option>)}
          </Select>
          <Radio.Group className={style.typeRadio} onChange={this.onTypeChange} defaultValue={this.state.type}>
            <Radio className={style.allRadio} value={'normal'}>{'Normal'}
              <Tooltip placement="bottom" title={'Normal'} >
                <Icon type="question-circle" />
              </Tooltip>
            </Radio>
            <Radio value={'resource'}>{'Resource'}
              <Tooltip placement="bottom" title={'Resource'} >
                <Icon type="question-circle" />
              </Tooltip>
            </Radio>
          </Radio.Group>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} rowKey={'time'} columns={this.state.type === 'normal' ? this.normalColumn : this.resourceColumn} dataSource={this.state.type === 'normal' ? normalHistoryList : resourceHistoryList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default EOSTransHistory;
