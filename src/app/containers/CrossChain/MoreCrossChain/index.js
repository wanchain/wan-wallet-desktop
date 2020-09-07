import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col } from 'antd';
import CrossChainMiniList from './CrossChainMiniList';
import style from './index.less';

@inject(stores => ({
  getCrossChainTokenList: stores.crossChain.getCrossChainTokenList,
  language: stores.languageIntl.language,
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
  }

  setCrossChainPairSelection = (record, selected) => { }

  columns = [
    {
      dataIndex: 'chain',
      width: 360,
      title: 'TOKEN',
      align: 'center',
      ellipsis: true,
    },
    {
      dataIndex: 'key',
      width: 600,
      title: 'CROSS-CHAIN',
      align: 'center',
      ellipsis: true,
      render: (text, record) => <CrossChainMiniList record={record}/>
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
