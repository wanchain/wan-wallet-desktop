import React from 'react'

const { remote, ipcRenderer } = window.require('electron')
const mainProcess = remote.require('./main.dev.js')
const currentWindow = remote.getCurrentWindow()

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            phrase: 'I am just aa placeholder :-)'
        }
    }
    // This syntax ensures `this` is bound within handleClick.
    // Warning: this is *experimental* syntax.
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

export default App