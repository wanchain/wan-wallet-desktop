import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message, Icon, Input, Checkbox, List } from 'antd';

import totalImg from 'static/image/btc.png';
import style from './index.less';

const { Search } = Input;
const CHAINTYPE = 'BTC';
@inject(stores => ({
  tokensList: stores.tokens.formatTokensList,
  twoWayBridgeTokenList: stores.tokens.twoWayBridgeTokenList,
  getTokenList: stores.tokens.getTokenList,
  formatTokensList: stores.tokens.formatTokensList,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getNormalAddrList: stores.btcAddress.getNormalAddrList,
  getAmount: stores.btcAddress.getNormalAmount,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams,
  tokensOnSideBar: stores.tokens.tokensOnSideBar,
  updateTransHistory: () => stores.btcAddress.updateTransHistory(),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr),
  toggleTwoWayBridgeTokenSelection: data => stores.tokens.toggleTwoWayBridgeTokenSelection(data)
}))

@observer
class MoreAccount extends Component {
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
      render: (text, record) => {
        return (
          record.list.length && (
            <table className={style.tokenList}>
              <tbody>
                {
                  record.list.map((d, i) =>
                    <tr key={i}>
                      <td style={{ textAlign: 'right', width: '50%' }}>{d.symbol}</td>
                      <td style={{ textAlign: 'left' }}>
                        <span className={style.tokenItemSelected}>{d.selected ? <Icon type="star" className={style.starIcon} theme="filled" style={{ color: '#ff8c00' }} onClick={() => this.setCrossChainPairSelection(record, false)} /> : <Icon type="star" className={style.starIcon} theme="outlined" onClick={() => this.setCrossChainPairSelection(record, true)} />}</span>
                      </td>
                    </tr>
                  )
                }
              </tbody>
            </table>
          )
        );
      }
    },
    {
      flex: 1
    }
  ];

  listColumns = [
    {
      dataIndex: 'symbol',
      // width: 460,
      title: 'SYMBOL',
      align: 'center',
      ellipsis: true,
    },
    {
      dataIndex: 'action',
      // flex: 1,
      width: 100,
      title: 'ACTION',
      align: 'center',
      ellipsis: true,
      render: (text, record) => {
        return (
          <Fragment>
            {record.selected ? <Icon type="star" className={style.starIcon} theme="filled" style={{ color: '#ff8c00' }} onClick={() => this.setCrossChainPairSelection(record, false)} /> : <Icon type="star" className={style.starIcon} theme="outlined" onClick={() => this.setCrossChainPairSelection(record, true)} />}
          </Fragment>
        );
      }
    }
  ];

  data = [{
    chain: 'BTC',
    key: 'BTC',
    list: [{
      selected: true,
      symbol: 'BITCOIN',
    }, {
      selected: true,
      symbol: 'WANCHAIN',
    }]
  }, {
    chain: 'ETH',
    key: 'ETH',
    list: [{
      selected: true,
      symbol: 'ETHEREUM',
    }, {
      selected: true,
      symbol: 'WANCHAIN',
    }]
  }, {
    chain: 'EOS',
    key: 'EOS',
    list: [{
      selected: false,
      symbol: 'EOS',
    }, {
      selected: false,
      symbol: 'WANCHAIN',
    }]
  }]

  render() {
    let { tokensOnSideBar } = this.props;
    this.data.splice(3, this.data.length - 3, ...tokensOnSideBar.map(item => ({
      chain: item.symbol,
      key: item.symbol,
      list: [{
        selected: false,
        symbol: item.chain === 'ETH' ? 'ETHEREUM' : item.chain,
      }, {
        selected: false,
        symbol: 'WANCHAIN',
      }]
    })));

    return (
      <div className={style['moreCrossChain']}>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">More Account</span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" mode={'horizontal'} rowKey={'chain'} pagination={false} columns={this.columns} dataSource={this.data} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default MoreAccount;
