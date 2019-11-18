import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import wanLogo from 'static/image/wan.png';
import ethLogo from 'static/image/eth.png';
import btcLogo from 'static/image/btc.png';

@inject(stores => ({
  portfolioList: stores.portfolio.portfolioList,
  portfolioColumns: stores.languageIntl.portfolioColumns,
  updateCoinPrice: () => stores.portfolio.updateCoinPrice(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class Dex extends Component {
  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.dex');
  }

  componentDidMount () {
    this.timer = setInterval(() => {
      this.props.updateCoinPrice();
    }, 5000)
    window.molin = {};
    window.molin.name = 'MoLin';
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  render () {
    const { portfolioColumns, portfolioList } = this.props;
    return (
      <div className={style.myIframe}>
        <iframe src="http://localhost:3000/" width="100%" height="100%" frameBorder="0" marginHeight="0" marginWidth="0">
          Your explorer doesn't support iframe, please upgrade.
        </iframe>
      </div>
    );
  }
}

export default Dex;
