import React, { Component } from 'react';
import helper from 'utils/helper';
import { ipcRenderer } from 'electron';
import { Button } from 'antd';

import './index.less';
const { getPhrase, generatePhrase } = helper;

class Portfolio extends Component {
  state = {
    phrase: 'I am just a placeholder :-)',
    show: 'hello world'
  }

  handleClick = () => {
    generatePhrase('123');
  }
  getPhrase = () => {
    getPhrase('123');
  }
  componentDidMount() {
      ipcRenderer.on('phrase_generated', (event, phrase) => {
          this.setState({phrase: phrase})
      })
      ipcRenderer.on('phrase_revealed', (event, phrase) => {
        this.setState({show: phrase})
    })
  }

  render() {
      return (
          <div>
              <h1 className="portfolio">{this.state.phrase}</h1>
              <Button type="primary" onClick={this.handleClick}>Give me a phrase!!!</Button>
              <Button type="primary" onClick={this.getPhrase}>get Revealed</Button>
              <h1 className="portfolio">{this.state.show}</h1>
          </div>
      );
  }
}

export default Portfolio;
