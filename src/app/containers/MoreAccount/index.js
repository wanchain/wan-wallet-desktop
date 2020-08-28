import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message, Icon, Input } from 'antd';
import ChainMiniList from './ChainMiniList';
import style from './index.less';

const { Search } = Input;
const CHAINTYPE = 'BTC';
@inject(stores => ({
  language: stores.languageIntl.language,
  getWalletSelections: stores.tokens.getWalletSelections,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class MoreAccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pairFilter: false,
      selectedOnly: false,
    }
    this.props.changeTitle('MoreTokens.tokenList');
  }

  columns = [
    {
      dataIndex: 'ancestor',
      width: 360,
      title: 'TOKEN',
      align: 'center',
      ellipsis: false,
    },
    {
      dataIndex: 'key',
      width: 600,
      title: 'CROSS-CHAIN',
      align: 'center',
      ellipsis: false,
      render: (text, record) => <ChainMiniList record={record} />
    },
    {
      flex: 1
    }
  ];

  render() {
    let { getWalletSelections } = this.props;
    return (
      <div className={style['moreCrossChain']}>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" mode={'horizontal'} childrenColumnName={'unset'} showHeader={false} pagination={false} columns={this.columns} dataSource={getWalletSelections} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default MoreAccount;
