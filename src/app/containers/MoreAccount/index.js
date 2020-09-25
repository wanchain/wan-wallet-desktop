import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, Icon } from 'antd';
import ChainMiniList from './ChainMiniList';
import AddToken from 'componentUtils/AddToken';
import { COIN_ACCOUNT } from 'utils/settings';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  getWalletSelections: stores.tokens.getWalletSelections,
  tokenIconList: stores.tokens.tokenIconList,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class MoreAccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pairFilter: false,
      selectedOnly: false,
      showAddToken: false,
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
      render: (text, record) => {
        let filtered = record.children.map(v => v.account).filter(v => v !== COIN_ACCOUNT);
        return (<div className={style.tokenGrid}>
          <div><img className="totalImg" src={this.props.tokenIconList[filtered.length === 0 ? COIN_ACCOUNT : filtered[0]]} /></div>
          <div>{text}</div>
        </div>)
      }
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

  handleAddToken = chain => {
    console.log('onAddCustomToken')
    this.addTokenChain = chain
    this.setState({
      showAddToken: true
    });
  }

  onCancel = () => {
    this.setState({
      showAddToken: false
    });
  }

  render() {
    let { getWalletSelections, tokenIconList } = this.props;
    return (
      <div className={style['moreCrossChain']}>
        <Row>
          <Col>
            <div className={style['addCustom']} onClick={this.handleAddToken}>
              <Icon type="plus" style={{ fontWeight: 'bold' }}/>
            </div>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" mode={'horizontal'} childrenColumnName={'unset'} showHeader={false} pagination={false} columns={this.columns} dataSource={getWalletSelections} />
          </Col>
        </Row>
        {
          this.state.showAddToken && <AddToken chain={this.addTokenChain} onCancel={this.onCancel} />
        }
      </div>
    );
  }
}

export default MoreAccount;
