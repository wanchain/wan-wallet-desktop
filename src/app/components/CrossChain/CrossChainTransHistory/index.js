import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table } from 'antd';

import 'components/TransHistory/index.less';
import TransInfo from 'componentUtils/TransInfo';

import history from 'static/image/history.png';

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  crossETHTrans: stores.crossChain.crossETHTrans,
  crossE20Trans: stores.crossChain.crossE20Trans,
  transColumns: stores.languageIntl.transColumns,
  setCurrPage: page => stores.wanAddress.setCurrPage(page),
  updateCrossTrans: () => stores.crossChain.updateCrossTrans(),
}))

@observer
class CrossChainTransHistory extends Component {
  state = {
    visible: false,
    record: {},
  }

  constructor (props) {
    super(props);
    this.props.setCurrPage(this.props.name || []);
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.props.updateCrossTrans();
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  onClickRow = record => {
    // let href = this.props.chainId === 1 ? `${MAIN}/tx/${record.key}` : `${TESTNET}/tx/${record.key}`
    // wand.shell.openExternal(href);
    this.setState({ visible: true, record })
  }

  handleCancel = () => {
    this.setState({
      visible: false
    })
  }

  render () {
    const { crossETHTrans, crossE20Trans, transColumns, symbol } = this.props;
    let trans;

    if (symbol === 'ETH') {
      trans = crossETHTrans;
      transColumns[1].render = (text, record) => <div className="textHeight" title={record.fromAddr}>{text} <br /> <span className="chainText">{record.srcChainAddr}</span></div>;
      transColumns[2].render = (text, record) => <div className="textHeight" title={record.toAddr}>{text} <br /> <span className="chainText">{record.dstChainAddr}</span></div>;
    } else {
      trans = crossE20Trans;
      transColumns[1].render = (text, record) => <div className="textHeight" title={record.fromAddr}>{text} <br /> <span className="chainText">{record.srcChainType}</span></div>;
      transColumns[2].render = (text, record) => <div className="textHeight" title={record.toAddr}>{text} <br /> <span className="chainText">{record.dstChainType}</span></div>;
    }

    return (
      <div>
        <div className="historyCon" id="wanAddrSelect">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} className="portfolioMain" columns={transColumns} dataSource={trans} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
        { this.state.visible && <TransInfo handleCancel={this.handleCancel} record={this.state.record}/> }
      </div>
    );
  }
}

export default CrossChainTransHistory;
