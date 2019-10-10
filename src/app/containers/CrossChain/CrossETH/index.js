import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';

import './index.less';
import totalImg from 'static/image/eth.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND } from 'utils/settings';
import ETHTrans from 'components/CrossChain/SendCrossChainTrans/ETHTrans';

const CHAINTYPE = 'ETH';

@inject(stores => ({
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.ethAddress.getAddrList,
  getAmount: stores.ethAddress.getNormalAmount,
  transParams: stores.sendTransParams.transParams,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class CrossETH extends Component {
  constructor (props) {
    super(props);
    this.props.setCurrToken(null, 'WETH');
    this.props.changeTitle('CrossChain.CrossChain');
  }

  columns = [
    {
      dataIndex: 'name',
    },
    {
      dataIndex: 'address',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><ETHTrans from={record.address} path={record.path} handleSend={this.handleSend} chainType={CHAINTYPE} type={INBOUND}/></div>
    }
  ];

  render () {
    const { getAddrList, getTokensListInfo } = this.props;

    this.props.language && this.columns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">ETH </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={getAddrList} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">WETH </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default CrossETH;
