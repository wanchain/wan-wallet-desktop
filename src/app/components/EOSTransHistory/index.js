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
        type = intl.get('EOSTransHistory.buyRAM');
        break;
      case 'sellram':
        type = intl.get('EOSTransHistory.sellRAM');
        break;
      case 'newaccount':
        type = intl.get('EOSTransHistory.newAccount');
        break;
      case 'delegatebw':
        type = intl.get('EOSTransHistory.stakeBandwidth');
        break;
      case 'undelegatebw':
        type = intl.get('EOSTransHistory.unstakeBandwidth');
        break;
    }
    return type;
  }

  normalColumn = [
    {
      title: intl.get('EOSTransHistory.time'),
      dataIndex: 'time',
      key: 'time',
    }, {
      title: intl.get('EOSTransHistory.from'),
      dataIndex: 'from',
      key: 'from',
    }, {
      title: intl.get('EOSTransHistory.to'),
      dataIndex: 'to',
      key: 'to',
    }, {
      title: intl.get('EOSTransHistory.amount'),
      dataIndex: 'value',
      key: 'value',
    }, {
      title: intl.get('EOSTransHistory.status'),
      dataIndex: 'status',
      key: 'status',
    }
  ];

  resourceColumn = [
    {
      title: intl.get('EOSTransHistory.time'),
      dataIndex: 'time',
      key: 'time',
    }, {
      title: intl.get('EOSTransHistory.from'),
      dataIndex: 'from',
      key: 'from',
    }, {
      title: intl.get('EOSTransHistory.to'),
      dataIndex: 'to',
      key: 'to',
    }, {
      title: intl.get('EOSTransHistory.resource'),
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => {
        if (record.action === 'newaccount') {
        return <Tooltip placement="top" title={'RAM/CPU/NET'} >{text}</Tooltip>
        }
        return text
      }
    }, {
      title: intl.get('EOSTransHistory.status'),
      dataIndex: 'status',
      key: 'status',
    }, {
      title: intl.get('EOSTransHistory.action'),
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
            placeholder={intl.get('EOSTransHistory.selectAccount')}
            optionFilterProp="children"
            onChange={this.onChange}
            // defaultValue={1}
            getPopupContainer={() => document.getElementById('EOSSelection')}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {Object.keys(accountInfo).map(v => <Option value={v} key={v}>{v}</Option>)}
          </Select>
          <Radio.Group className={style.typeRadio} onChange={this.onTypeChange} defaultValue={this.state.type}>
            <Radio className={style.allRadio} value={'normal'}>{intl.get('EOSTransHistory.normal')}
              <Tooltip placement="bottom" title={intl.get('EOSTransHistory.normalTip')} >
                <Icon type="question-circle" />
              </Tooltip>
            </Radio>
            <Radio value={'resource'}>{intl.get('EOSTransHistory.resource')}
              <Tooltip placement="bottom" title={intl.get('EOSTransHistory.resourceTip')} >
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
