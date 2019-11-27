import React, { Component } from 'react';
import { Table, Select, Radio, message, Icon, Tooltip } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { MAIN, TESTNET } from 'utils/settings';
import style from './index.less';
import history from 'static/image/history.png';

const { Option } = Select;

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  accountInfo: stores.eosAddress.accountInfo,
  normalHistoryList: stores.eosAddress.normalHistoryList,
  resourceHistoryList: stores.eosAddress.resourceHistoryList,
  selectedAddr: stores.eosAddress.selectedAddr,
  transColumns: stores.languageIntl.transColumns,
  privateTransColumns: stores.languageIntl.privateTransColumns,
  setCurrPage: page => stores.eosAddress.setCurrPage(page),
  setHistorySelectedAccountName: name => stores.eosAddress.setHistorySelectedAccountName(name)
}))

@observer
class EOSTransHistory extends Component {
  constructor(props) {
    super(props);
    this.props.setCurrPage(this.props.name || []);
    this.state = {
      type: 'normal'
    }
  }

  onChange = value => {
    this.props.setHistorySelectedAccountName(value);
  }

  onTypeChange = (e) => {
    this.setState({
      type: e.target.value
    })
  }

  onClickRow = record => {
    let href = this.props.chainId === 1 ? `${MAIN}/tx/${record.txHash}` : `${TESTNET}/tx/${record.txHash}`;
    wand.shell.openExternal(href);
  }

  getAction = action => {
    let type = '';
    switch (action) {
      case 'buyrambytes':
        type = 'Buy RAM';
        break;
    }
    return type;
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
      dataIndex: 'value',
      key: 'value',
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
      dataIndex: 'value',
      key: 'value',
    }, {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
    }, {
      title: 'ACTION',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => {
        return this.getAction(text);
      }
    }
  ];

  render() {
    const { accountInfo, normalHistoryList, resourceHistoryList } = this.props;
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
            // defaultValue={1}
            getPopupContainer={() => document.getElementById('EOSSelection')}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {Object.keys(accountInfo).map(v => <Option value={v} key={v}>{v}</Option>)}
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
