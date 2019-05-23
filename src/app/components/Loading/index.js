import React, { Component } from 'react';
import { Progress } from 'antd';
import intl from 'react-intl-universal';

import './index.less';

class Loading extends Component {
  state = {
    percent: 0
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      let currentPercent = this.state.percent;
      let tmp = Math.random() * 30 + parseFloat(currentPercent);
      if(tmp > 100) {
        tmp = 99.9;
        clearInterval(this.timer);
      }
      this.setState({
        percent: tmp.toFixed(1)
      })
    }, 500)
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