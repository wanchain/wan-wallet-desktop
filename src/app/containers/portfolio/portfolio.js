import React, { Component } from 'react';

import { Layout } from 'antd';

import path from 'path'



const { Content } = Layout;



const { remote, ipcRenderer } = window.require('electron');

const mainProcess = remote.require(path.join(__dirname, '../controllers/index.js'));

const currentWindow = remote.getCurrentWindow();



class Portfolio extends Component {



  constructor(props) {

    super(props)

    this.state = {

        phrase: 'I am just a placeholder :-)'

    }

}



handleClick = () => {

    console.log(mainProcess.generatePhrase)

    mainProcess.generatePhrase(currentWindow, '123')

}



componentDidMount() {

    ipcRenderer.on('phrase-generated', (event, phrase) => {

        this.setState({phrase: phrase})

    })

}



render() {

    return (

        <div>

            <h1>{this.state.phrase}</h1>

            <button onClick={this.handleClick}>

            Give me a phrase!!!

            </button>

        </div>

    );

}

}



export default Portfolio;
