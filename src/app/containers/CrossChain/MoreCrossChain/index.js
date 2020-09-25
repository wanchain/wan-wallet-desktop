import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col } from 'antd';
import CrossChainMiniList from './CrossChainMiniList';
import { COIN_ACCOUNT } from 'utils/settings';
import style from './index.less';

@inject(stores => ({
  getCrossChainTokenList: stores.crossChain.getCrossChainTokenList,
  language: stores.languageIntl.language,
  getCoinImage: (...args) => stores.tokens.getCoinImage(...args),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class MoreCrossChain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pairFilter: false,
      selectedOnly: false,
    }
    this.props.changeTitle('MoreTokens.tokenList');
  }

  setCrossChainPairSelection = (record, selected) => { }

  columns = [
    {
      dataIndex: 'chain',
      width: 360,
      title: 'TOKEN',
      align: 'center',
      ellipsis: true,
      render: (text, record) => {
        let child = record.children[0];
        return (<div className={style.tokenGrid}>
          <div><img className={style.totalImg} src={this.props.getCoinImage(child.ancestorSymbol, child.fromAccount === COIN_ACCOUNT ? child.toAccount : child.fromAccount)} /></div>
          <div className={style.coinText}>{text}</div>
        </div>)
      }
    },
    {
      dataIndex: 'key',
      width: 600,
      title: 'CROSS-CHAIN',
      align: 'center',
      ellipsis: true,
      render: (text, record) => <CrossChainMiniList record={record} />
    },
    {
      flex: 1
    }
  ];

  render() {
    return (
      <div className={style['moreCrossChain']}>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" mode={'horizontal'} childrenColumnName={'unset'} showHeader={false} pagination={false} columns={this.columns} dataSource={this.props.getCrossChainTokenList} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default MoreCrossChain;
