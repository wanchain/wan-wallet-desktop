import { cloneDeep } from 'lodash';
import intl from 'react-intl-universal';
import { Table, Tooltip } from 'antd';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { observer, MobXProviderContext } from 'mobx-react';

import history from 'static/image/history.png';
import TransInfo from 'componentUtils/TransInfo';
import style from 'components/TransHistory/index.less';
import { getFullChainName, convertStatus } from 'utils/helper';

const CrossXRPHistory = observer(() => {
  const [record, setRecord] = useState({});
  const [visible, setVisible] = useState(false)
  const { languageIntl: { language, transColumns }, crossChain } = useContext(MobXProviderContext)

  useEffect(() => {
    crossChain.updateCrossTrans();
    let timer = setInterval(() => crossChain.updateCrossTrans(), 5000);
    return () => clearInterval(timer)
  }, [])

  const xrpTransColumns = useMemo(() => {
    let data = cloneDeep(transColumns);
    data[1].render = (text, record) => <div className={style.textHeight} title={record.fromAddr}>{text} <br /> <span className={style.chainText}>{getFullChainName(record.srcChainType)}</span></div>;
    data[2].render = (text, record) => <div className={style.textHeight} title={record.toAddr}>{text} <br /> <span className={style.chainText}>{getFullChainName(record.dstChainType)}</span></div>;
    data[3].render = (text, record) => <div>{record.crossValue}</div>;
    data[4].render = (text, record) => <Tooltip title={intl.get(`CrossChainTransHistory.${convertStatus(text)}`)}>{intl.get(`CrossChainTransHistory.${convertStatus(text)}`)}</Tooltip>;
    return data;
  }, [transColumns])

  const onClickRow = record => {
    setRecord(record)
    setVisible(true)
  }

  const handleCancel = () => {
    setVisible(false)
  }

  return (
    <React.Fragment>
      <div className="historyCon">
        <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
      </div>
      <div className="historyRow">
        <Table onRow={record => ({ onClick: () => onClickRow(record) })} columns={xrpTransColumns} dataSource={crossChain.crossChainTrans} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
      { visible && <TransInfo handleCancel={handleCancel} record={record} convertStoreman={true} /> }
    </React.Fragment>
  );
})

export default CrossXRPHistory;
