import React, { Component } from 'react';
import { Layout } from 'antd';
import path from 'path'

const { Content } = Layout;
const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require(path.join(__dirname, '../controllers/index.js'));
const currentWindow = remote.getCurrentWindow();

class Portfolio extends Component {
  state = {
    phrase: 'I am just a placeholder :-)',
    show: 'hello'
  };

  handleClick() {
    mainProcess.generatePhrase(currentWindow, '123')
  }
  getPhrase() {
    mainProcess.revealPhrase(currentWindow, '123')
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
              <button onClick={this.handleClick.bind(this)}>Give me a phrase!!!</button>
              <button onClick={this.getPhrase.bind(this)}>get Revaled</button>
              <h1>{this.state.show}</h1>
          </div>
      );
  }
}

export default Portfolio;
