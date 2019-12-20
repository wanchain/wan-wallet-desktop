import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Tooltip } from 'antd';
import { getFullChainName } from 'utils/helper';

import style from 'components/TransHistory/index.less';
import TransInfo from 'componentUtils/TransInfo';

import history from 'static/image/history.png';

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  crossEOSTrans: stores.crossChain.crossEOSTrans,
  transColumns: stores.languageIntl.transColumns,
  updateCrossTrans: () => stores.crossChain.updateCrossTrans(),
}))

@observer
class CrossEOSHistory extends Component {
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
    const { crossEOSTrans, crossErc20Trans, transColumns, symbol } = this.props;
    let trans;

    if (symbol === 'EOS') {
      trans = crossEOSTrans;
      transColumns[1].render = (text, record) => <div className={style.textHeight} title={record.fromAddr}>{text} <br /> <span className={style.chainText}>{getFullChainName(record.srcChainType)}</span></div>;
      transColumns[2].render = (text, record) => <div className={style.textHeight} title={record.toAddr}>{text} <br /> <span className={style.chainText}>{getFullChainName(record.dstChainType)}</span></div>;
      transColumns[4].render = (text, record) => <Tooltip title={intl.get(`CrossChainTransHistory.${text}`)}>{text}</Tooltip>;
    } else {
      trans = crossErc20Trans;
      transColumns[1].render = (text, record) => <div className={style.textHeight} title={record.fromAddr}>{text} <br /> <span className={style.chainText}>{getFullChainName(record.srcChainType)}</span></div>;
      transColumns[2].render = (text, record) => <div className={style.textHeight} title={record.toAddr}>{text} <br /> <span className={style.chainText}>{getFullChainName(record.dstChainType)}</span></div>;
    }

    return (
      <div>
        <div className="historyCon" id="wanAddrSelect">
          <img src={history} /><span>{intl.get('TransHistory.transactionHistory')}</span>
        </div>
        <div className="historyRow">
          <Table onRow={record => ({ onClick: this.onClickRow.bind(this, record) })} columns={transColumns} dataSource={trans} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        </div>
        { this.state.visible && <TransInfo handleCancel={this.handleCancel} record={this.state.record}/> }
      </div>
    );
  }
}

export default CrossEOSHistory;
