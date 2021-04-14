import intl from 'react-intl-universal';
import { Table, Row, Col, message } from 'antd';
import React, { useContext, useEffect, useMemo } from 'react';
import { observer, MobXProviderContext } from 'mobx-react';

import { formatNum } from 'utils/support';
import style from '../CrossETH/index.less';
import totalImg from 'static/image/xrp.png';
import { INBOUND, OUTBOUND } from 'utils/settings';
import CopyAndQrcode from 'components/CopyAndQrcode';
import useTokenPairsInfo from 'hooks/useTokenPairsInfo';
import XRPTrans from 'components/CrossChain/SendCrossChainTrans/XRPTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory/CrossXRPHistory';

const CrossXRP = observer(({ match }) => {
  const { languageIntl, xrpAddress: { getNormalAddrList }, tokens } = useContext(MobXProviderContext)
  const tokenPairsInfo = useTokenPairsInfo(match.params.tokenPairId, 'XRP')
  const inboundColumns = [
    {
      dataIndex: 'name',
      width: '20%',
      ellipsis: true
    },
    {
      dataIndex: 'address',
      width: '50%',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.balance - b.balance,
      render: num => formatNum(num),
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><XRPTrans record={record} type={INBOUND} /></div>
    }
  ];

  const outboundColumns = [
    {
      dataIndex: 'name',
      width: '20%',
      ellipsis: true
    },
    {
      dataIndex: 'address',
      width: '50%',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.balance - b.balance,
      render: num => formatNum(num),
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><XRPTrans record={record} type={OUTBOUND} /></div>
    }
  ];

  const useInboundColumns = useMemo(() => {
    inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });
    return inboundColumns;
  }, [languageIntl.language])

  const useOutboundColumns = useMemo(() => {
    outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    });
    return outboundColumns;
  }, [languageIntl.language])

  useEffect(() => {
    tokens.setCurrToken(tokenPairsInfo.toAccount);
    tokens.setCurrTokenChain(tokenPairsInfo.toChainSymbol);
    languageIntl.changeTitle('Common.crossChain');
    tokens.updateChainBalanceList('XRP');
    tokens.updateTokensBalance(tokenPairsInfo.toAccount, tokenPairsInfo.toChainSymbol);
    let timer = setInterval(() => { tokens.updateTokensBalance(tokenPairsInfo.toAccount, tokenPairsInfo.toChainSymbol) }, 5000);
    return () => {
      clearInterval(timer);
      tokens.updateChainBalanceList();
    }
  }, [match.params.tokenPairId])

  return (
    <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{tokenPairsInfo.fromTokenSymbol} </span><span className={style.chain}>{tokenPairsInfo.fromChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={useInboundColumns} dataSource={getNormalAddrList} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{tokenPairsInfo.toTokenSymbol} </span><span className={style.chain}>{tokenPairsInfo.toChainName}</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={useOutboundColumns} dataSource={tokens.getCCTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossChainTransHistory name={['normal']} symbol='XRP' />
          </Col>
        </Row>
    </div>
  )
})

export default CrossXRP;
