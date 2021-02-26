import { Table, Select } from 'antd';
import intl from 'react-intl-universal';
import { observer, MobXProviderContext } from 'mobx-react';
import React, { useContext, useEffect, useState, useMemo } from 'react';

import history from 'static/image/history.png';
import { XRPMAIN, XRPTESTNET } from 'utils/settings';

const Option = Select.Option;

const XRPTransHistory = observer(({ name }) => {
  const [selectedAddr, setSelectedAddr] = useState('')
  const { languageIntl, session: { chainId }, xrpAddress: { addrInfo, historyList, updateTransHistory } } = useContext(MobXProviderContext)

  useEffect(() => {
    updateTransHistory()
    const timer = setInterval(() => updateTransHistory(), 5000);
    return () => clearInterval(timer);
  }, [])

  const onClickRow = record => {
    let href = chainId === 1 ? `${XRPMAIN}/${record.key}` : `${XRPTESTNET}/${record.key}`
    wand.shell.openExternal(href);
  }

  const addrList = useMemo(() => {
    let data = [];
    name.forEach(val => { data = data.concat(Object.entries(addrInfo[val]).map(v => ({ address: v[0], name: v[1].name }))) });
    return data;
  }, [addrInfo, name])

  const dataSource = useMemo(() => {
    return historyList.filter(v => !selectedAddr || v.fromAddr === selectedAddr);
  }, [historyList, selectedAddr])

  return (
    <React.Fragment>
      <div className="historyCon" id="xrpAddrSelect">
        <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
        <Select
          showSearch
          allowClear
          style={{ width: 400 }}
          placeholder={intl.get('TransHistory.selectAFromAddress')}
          optionFilterProp="children"
          onChange={value => setSelectedAddr(value)}
          defaultValue={selectedAddr || undefined}
          getPopupContainer = {() => document.getElementById('xrpAddrSelect')}
          filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
        >
        {addrList.map((item, index) => <Option value={item.address} key={index}>{item.name}</Option>)}
      </Select>
      </div>
      <div className="historyRow">
        <Table onRow={record => ({ onClick: onClickRow.bind(this, record) })} columns={languageIntl.transColumns} dataSource={dataSource} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    </React.Fragment>
  )
})

export default XRPTransHistory;
