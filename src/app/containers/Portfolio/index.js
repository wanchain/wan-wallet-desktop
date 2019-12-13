import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import wanLogo from 'static/image/wan.png';
import ethLogo from 'static/image/eth.png';
import btcLogo from 'static/image/btc.png';
import eosLogo from 'static/image/eos.png';

function TokenImg (text) {
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
  }
  return (
    <div><img className={style.nameIco} src={img} /><span>{text}</span></div>
  );
}

@inject(stores => ({
  portfolioList: stores.portfolio.portfolioList,
  portfolioColumns: stores.languageIntl.portfolioColumns,
  tokensOnSideBar: stores.tokens.tokensOnSideBar,
  e20TokensOnSideBar: stores.tokens.e20TokensOnSideBar,
  setCoin: (coins) => stores.portfolio.setCoin(coins),
  updateCoinPrice: () => stores.portfolio.updateCoinPrice(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class Portfolio extends Component {
  constructor (props) {
    super(props);
    this.props.changeTitle('Portfolio.portfolio');
  }

  componentDidMount () {
    const { tokensOnSideBar, e20TokensOnSideBar } = this.props;
    this.props.setCoin(tokensOnSideBar.concat(e20TokensOnSideBar).map(v => v.symbol));
    this.props.updateCoinPrice();
    this.timer = setInterval(() => {
      this.props.updateCoinPrice();
    }, 5000)
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  render () {
    const { portfolioColumns, portfolioList } = this.props;
    const columns = [...portfolioColumns];
    columns[0]['render'] = TokenImg;

    return (
        <div>
          <Table columns={columns} dataSource={portfolioList} pagination={false}/>
        </div>
    );
  }
}

export default Portfolio;
