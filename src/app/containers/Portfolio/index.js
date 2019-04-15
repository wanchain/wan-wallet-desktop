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
    ipcRenderer.once('phrase_generated', (event, phrase) => {
      this.setState({
        phrase: phrase
      })
    })
    generatePhrase('123');
  }

  getPhrase = () => {
    ipcRenderer.once('phrase_revealed', (event, phrase) => {
      this.setState({
        show: phrase
      })
    })
    getPhrase('123');
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
