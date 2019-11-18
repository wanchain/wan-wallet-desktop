import React, { Component } from 'react';
import { Spin } from 'antd';
import { observer, inject } from 'mobx-react';
import style from './index.less';

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
    this.state = { loading: true };
  }

  componentDidMount () {
    this.timer = setInterval(() => {
      this.props.updateCoinPrice();
    }, 5000)
    window.molin = {};
    window.molin.name = 'MoLin';

    this.setState({ loading: true });
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  onLoad = () => {
    this.setState({ loading: false });
    var f = document.getElementById('dex-frame');
    f.height = '100%';
  }

  render () {
    const { portfolioColumns, portfolioList } = this.props;
    return (
      <div className={style.myIframe}>
        {this.state.loading ? <Spin tip="Loading..." size="large"/> : null}
        <iframe src="http://localhost:3000/" id='dex-frame' onLoad={this.onLoad} width="100%" height="0%" allowTransparency="true" frameBorder="0" marginHeight="0" marginWidth="0">
          Your explorer doesn't support iframe, please upgrade.
        </iframe>
      </div>
    );
  }
}

export default Dex;
