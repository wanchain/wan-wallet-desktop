import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table } from 'antd';

import style from 'components/TransHistory/index.less';
import TransInfo from 'componentUtils/TransInfo';

import history from 'static/image/history.png';

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  crossBTCTrans: stores.crossChain.crossBTCTrans,
  transColumns: stores.languageIntl.transColumns,
  updateCrossTrans: () => stores.crossChain.updateCrossTrans(),
}))

@observer
class CrossBTCHistory extends Component {
  state = {
    visible: false,
    record: {},
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
    this.setState({ visible: true, record })
  }

  handleCancel = () => {
    this.setState({
      visible: false
    })
  }

  render () {
    const { crossBTCTrans, transColumns } = this.props;

    transColumns[1].render = (text, record) => <div className={style.textHeight} title={record.fromAddr}>{text} <br /> <span className={style.chainText}>{record.srcChainAddr}</span></div>;
    transColumns[2].render = (text, record) => <div className={style.textHeight} title={record.toAddr}>{text} <br /> <span className={style.chainText}>{record.dstChainAddr}</span></div>;

    return (
      <div>
        <div className="historyCon" id="wanAddrSelect">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} columns={transColumns} dataSource={crossBTCTrans} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
        { this.state.visible && <TransInfo handleCancel={this.handleCancel} record={this.state.record}/> }
      </div>
    );
  }
}

export default CrossBTCHistory;
