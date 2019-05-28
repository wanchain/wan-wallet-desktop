import { Progress } from 'antd';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class Loading extends Component {
  state = {
    percent: 0
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      let currePercent = this.state.percent;
      let tmp = 10 + parseFloat(currePercent);
      if(tmp === 100) {
        tmp = 99.9
        clearInterval(this.timer);
      }
      this.setState({
        percent: tmp
      })
    }, 2000)
  }
  
  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return (
      <div className="loadingBg">
        <Progress className="progressSty" strokeColor={{ '0%': '#108ee9', '100%': '#87d068', }} percent={parseFloat(this.state.percent)} />
        <p>{intl.get('Loading.tips')}</p>
      </div>
    );
  }
}

export default Loading;