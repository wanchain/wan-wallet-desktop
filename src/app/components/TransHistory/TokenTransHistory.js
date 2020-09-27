import React, { Component } from 'react';
import { Table, Select } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { MAIN, TESTNET, BTCMAIN, BTCTESTNET, ETHMAIN, ETHTESTNET } from 'utils/settings';
import history from 'static/image/history.png';

const Option = Select.Option;

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  currTokenChain: stores.tokens.currTokenChain,
  transColumns: stores.languageIntl.transColumns,
  getChainStoreInfoByChain: chain => stores.tokens.getChainStoreInfoByChain(chain),
}))

@observer
class TokenTransHistory extends Component {
  onChange = value => {
    this.props.getChainStoreInfoByChain(this.props.currTokenChain).setSelectedAddr(value);
  }

  onClickRow = record => {
    let href = '';
    switch (this.props.currTokenChain) {
      case 'WAN':
        href = this.props.chainId === 1 ? `${MAIN}/tx/${record.key}` : `${TESTNET}/tx/${record.key}`;
        break;
      case 'ETH':
        href = this.props.chainId === 1 ? `${ETHMAIN}/tx/${record.key}` : `${ETHTESTNET}/tx/${record.key}`;
        break;
      case 'BTC':
        href = this.props.chainId === 1 ? `${BTCMAIN}/tx/${record.key}` : `${BTCTESTNET}/tx/${record.key}`;
        break;
      default:
        href = this.props.chainId === 1 ? `${MAIN}/tx/${record.key}` : `${TESTNET}/tx/${record.key}`;
    }
    wand.shell.openExternal(href);
  }

  componentDidMount() {
    this.props.getChainStoreInfoByChain(this.props.currTokenChain).setCurrPage(this.props.name || []);
  }

  render() {
    const { name, getChainStoreInfoByChain, currTokenChain } = this.props;
    let tokenAddress = getChainStoreInfoByChain(currTokenChain);
    let addrInfo = tokenAddress.addrInfo;
    let tokenTransferHistoryList = tokenAddress.tokenTransferHistoryList;
    let selectedAddr = tokenAddress.selectedAddr;
    let addrList = [];
    let dataSource;
    if (name) {
      name.forEach(val => {
        addrList = addrList.concat(Object.entries(addrInfo[val] || []).map(v => ({ address: v[0], name: v[1].name })));
      });
    }
    dataSource = tokenTransferHistoryList;
    return (
      <div>
        <div className="historyCon" id="tokenAddrSelect">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
          <Select
            showSearch
            allowClear
            style={{ width: 400 }}
            placeholder={intl.get('TransHistory.selectAFromAddress')}
            optionFilterProp="children"
            onChange={this.onChange}
            defaultValue={selectedAddr ? selectedAddr[0] : undefined}
            getPopupContainer={() => document.getElementById('tokenAddrSelect')}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {addrList.map((item, index) => <Option value={item.address} key={index}>{item.name}</Option>)}
          </Select>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} columns={this.props.transColumns} dataSource={dataSource} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
      </div>
    );
  }
}

export default TokenTransHistory;
