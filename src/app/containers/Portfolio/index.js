import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import wanLogo from 'static/image/wan.png';

function TokenImg(text) {
  return (
    <div><img className="nameIco" src={wanLogo} /><span>{text}</span></div>
  );
}

@inject(stores => ({
  language: stores.languageIntl.language,
  portfolioList: stores.portfolio.portfolioList,
  portfolioColumns: stores.languageIntl.portfolioColumns,
  updateCoinPrice: () => stores.portfolio.updateCoinPrice(),
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
}))

@observer
class Portfolio extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle(intl.get('Portfolio.portfolio'));
  }

  componentDidMount() {
    this.timer = setInterval(() =>{
      this.props.updateCoinPrice();
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    const { portfolioColumns, portfolioList } = this.props;
    const columns = [...portfolioColumns];
    columns[0]['render'] = TokenImg;

    return (
        <div>
          <Table className="portfolioMain" columns={columns} dataSource={portfolioList} pagination={false}/>
        </div>
    );
  }
}

export default Portfolio;