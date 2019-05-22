import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import wanLogo from 'static/image/wan.png';

@inject(stores => ({
  portfolioList: stores.portfolio.portfolioList,
  language: stores.session.language,
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
  updateCoinPrice: () => stores.portfolio.updateCoinPrice()
}))

@observer
class Portfolio extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle(intl.get('Portfolio.portfolio'));
  }
  
  columns = [
    {
      title: intl.get('Portfolio.name'),
      dataIndex: 'name',
      key: 'name',
      render: text => <div><img className="nameIco" src={wanLogo} /><span>{text}</span></div>,
    }, {
      title: intl.get('Portfolio.price'),
      dataIndex: 'price',
      key: 'price',
    }, {
      title: intl.get('Portfolio.balance'),
      dataIndex: 'balance',
      key: 'balance',
    }, {
      title: intl.get('Portfolio.value'),
      dataIndex: 'value',
      key: 'value'
    }, {
      title: intl.get('Portfolio.portfolioUppercase'),
      dataIndex: 'portfolio',
      key: 'portfolio',
    }
  ]

  componentDidMount() {
    this.timer = setInterval(() =>{
      this.props.updateCoinPrice();
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return (
        <div>
          <Table className="portfolioMain" columns={this.columns} dataSource={this.props.portfolioList} pagination={false}/>
        </div>
    );
  }
}

export default Portfolio;