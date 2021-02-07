import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, Input } from 'antd';
import CrossChainMiniList from './CrossChainMiniList';
import { COIN_ACCOUNT } from 'utils/settings';
import style from './index.less';

const { Search } = Input;
@inject(stores => ({
  getCrossChainTokenList: stores.crossChain.getCrossChainTokenList,
  language: stores.languageIntl.language,
  getCoinImage: (...args) => stores.tokens.getCoinImage(...args),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class MoreCrossChain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pairFilter: false,
      selectedOnly: false,
      filterText: '',
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

  searchChange = (e) => {
    let value = e.target.value.trim();
    this.setState({
      filterText: value
    })
  }

  getCCTokenList = () => {
    let { getCrossChainTokenList } = this.props;
    // TODO: Remove XRP tokenPairID
    let getCrossChainTokenListWithFilter = getCrossChainTokenList.filter(v => v.chain !== 'XRP')
    let text = this.state.filterText.trim().toLowerCase();
    let lists = [];
    if (text.length === 0) {
      return getCrossChainTokenListWithFilter;
    }
    getCrossChainTokenListWithFilter.forEach(obj => {
      if (new RegExp(text).test(obj.chain.toLowerCase())) {
        lists.push(obj);
      } else {
        if (obj.children.length > 0) {
          let list = null;
          obj.children.forEach(child => {
            if (new RegExp(text).test(child.fromChainName.toLowerCase()) || new RegExp(text).test(child.toChainName.toLowerCase())) {
              if (list === null) {
                list = {
                  chain: obj.chain,
                  key: obj.key,
                  children: []
                }
              }
              list.children.push(child);
            }
          })
          if (list !== null) {
            lists.push(list);
          }
        }
      }
    });
    return lists;
  }

  render() {
    return (
      <div className={style['moreCrossChain']}>
        <Row>
          <Col className={style['settingContainer']}>
            <Search className={style['searchField']} placeholder={intl.get('MoreAccount.inputSearchText')} onChange={this.searchChange} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" mode={'horizontal'} childrenColumnName={'unset'} showHeader={false} pagination={false} columns={this.columns} dataSource={this.getCCTokenList()} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default MoreCrossChain;
