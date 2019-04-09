import React, { Component } from 'react';
import helper from 'utils/helper';
import { ipcRenderer } from 'electron';

const { getPhrase, generatePhrase } = helper;

class Portfolio extends Component {
  state = {
    phrase: 'I am just a placeholder :-)',
    show: 'hello'
  }

  handleClick = () => {
    generatePhrase('123');
  }
  getPhrase = () => {
    getPhrase('123');
  }
  componentDidMount() {
      ipcRenderer.on('phrase-generated', (event, phrase) => {
          this.setState({phrase: phrase})
      })
      ipcRenderer.on('phrase-revealed', (event, phrase) => {
        this.setState({show: phrase})
    })
  }

  render() {
      return (
          <div>
              <h1>{this.state.phrase}</h1>
              <button onClick={this.handleClick}>Give me a phrase!!!</button>
              <button onClick={this.getPhrase}>get Revaled</button>
              <h1>{this.state.show}</h1>
          </div>
      );
  }
}

export default Portfolio;
