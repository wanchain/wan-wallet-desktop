import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import wanLogo from 'static/image/wan.png';
import ethLogo from 'static/image/eth.png';
import btcLogo from 'static/image/btc.png';
import eosLogo from 'static/image/eos.png';

@inject(stores => ({
  netStatus: stores.session.netStatus,
  portfolioList: stores.portfolio.portfolioList,
  portfolioColumns: stores.languageIntl.portfolioColumns,
  setCoin: (coins) => stores.portfolio.setCoin(coins),
  updateCoinPrice: () => stores.portfolio.updateCoinPrice(),
  updateTokenBalance: () => stores.portfolio.updateTokenBalance(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  getTokenIcon: (tokenScAddr) => stores.tokens.getTokenIcon(tokenScAddr),
}))

@observer
class Portfolio extends Component {
  constructor (props) {
    super(props);
    this.props.changeTitle('Portfolio.portfolio');
  }

  componentDidMount () {
    if (this.props.netStatus) {
      this.props.setCoin();
      this.props.updateCoinPrice();
      this.props.updateTokenBalance();
      this.timer = setInterval(() => {
        this.props.updateCoinPrice();
        this.props.updateTokenBalance();
      }, 60000);
    } else {
      this.timer = setInterval(() => {
        this.props.updateCoinPrice();
      }, 60000);
    }
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  TokenImg = (text, record) => {
    let img;
    switch (text) {
      case 'WAN':
        img = wanLogo;
        break;
      case 'ETH':
        img = ethLogo;
        break;
      case 'BTC':
        img = btcLogo;
        break;
      case 'EOS':
        img = eosLogo;
        break;
      default:
        img = this.props.getTokenIcon(record.scAddr);
    }
    return (
      <div><img className={style.nameIco} src={img} /><span>{text}</span></div>
    );
  }

  render () {
    const { portfolioColumns, portfolioList } = this.props;
    const columns = [...portfolioColumns];
    columns[0]['render'] = this.TokenImg;

    return (
        <div>
          <Table columns={columns} dataSource={portfolioList} pagination={false}/>
        </div>
    );
  }
}

export default Portfolio;
