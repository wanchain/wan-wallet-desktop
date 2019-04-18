import React, { Component } from 'react';
import { Button } from 'antd';
import { remote } from 'electron';

import './index.less';

const { revealMnemonic, generateMnemonic } = remote.require('./controllers');

class Portfolio extends Component {
  state = {
    phrase: 'I am just a placeholder :-)',
    show: 'hello world'
  }

  handleClick = () => {
    let phrase = generateMnemonic('123');
    if(phrase.code) {
      this.setState({
        phrase: phrase.result
      })
    }
  }

  revealPhrase = () => {
    let phrase = revealMnemonic('123');
    this.setState({
      show: phrase
    })
  }

  render() {
      return (
          <div>
              <h1 className="portfolio">{this.state.phrase}</h1>
              <Button type="primary" onClick={this.handleClick}>Give me a phrase!!!</Button>
              <Button type="primary" onClick={this.revealPhrase}>get Revealed</Button>
              <h1 className="portfolio">{this.state.show}</h1>
          </div>
      );
  }
}

export default Portfolio;
