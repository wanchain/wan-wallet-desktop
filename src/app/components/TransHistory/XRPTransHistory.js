import { Table } from 'antd';
import intl from 'react-intl-universal';
import React, { useContext, useEffect } from 'react';
import { observer, MobXProviderContext } from 'mobx-react';

import history from 'static/image/history.png';
import { XRPMAIN, XRPTESTNET } from 'utils/settings';

const XRPTransHistory = observer(() => {
  const { languageIntl, session: { chainId }, xrpAddress: { historyList, updateTransHistory } } = useContext(MobXProviderContext)

  useEffect(() => {
    const timer = setInterval(() => updateTransHistory(), 5000);
    return () => clearInterval(timer);
  }, [])

  const onClickRow = record => {
    let href = chainId === 1 ? `${XRPMAIN}/${record.key}` : `${XRPTESTNET}/${record.key}`
    wand.shell.openExternal(href);
  }

  return (
    <React.Fragment>
      <div className="historyCon">
      <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
      </div>
      <div className="historyRow">
        <Table onRow={record => ({ onClick: onClickRow.bind(this, record) })} columns={languageIntl.transColumns} dataSource={historyList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    </React.Fragment>
  )
})

export default XRPTransHistory;
