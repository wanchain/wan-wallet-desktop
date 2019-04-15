import React, { Component } from 'react';
import { Button, Card, Modal, Input, message } from 'antd';
import './index.less';
import helper from 'utils/helper';
import { ipcRenderer, clipboard } from 'electron';

const { getPhrase } = helper;


class Backup extends Component {
  state = {
    visible: false,
    showMnemonic: false,
    mnemonic: '',
    pwd: ''
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      showMnemonic: false,
      mnemonic: '',
      pwd: ''
    });
  }

  showModal = () => {
    this.setState({ visible: true, })
  }

  handleOk = () => {
    if (this.state.showMnemonic) {
      this.resetStateVal();
    } else {
      this.sendGetPhraseCmd(this.state.pwd);
    }
  }

  handleCancel = () => {
    this.resetStateVal();
  }

  inputChanged = (e) => {
    this.setState({ pwd: e.target.value });
  }

  pressEnter = (e) => {
    this.handleOk();
  }

  sendGetPhraseCmd = (pwd) => {
    ipcRenderer.once('phrase_revealed', (event, phrase) => {
      this.handlePhraseResult(phrase);
    })
    getPhrase(pwd);
  }

  handlePhraseResult = (phrase) => {
    this.setState({ mnemonic: phrase });
    this.setState({ showMnemonic: true });
  }

  copy2Clipboard = (val) => {
    clipboard.writeText(val);
    message.success('Copy successfully');
  }

  render() {
    return (
      <div>
        <Card title="Reveal Mnemonic Sentence">
          <p>
            If you install a new wallet, you will need this mnemonic sentence to access your assets.
            Save them somewhere safe and secret.
          </p>
          <Button type="primary" onClick={this.showModal}>REVEAL MNEMONIC SENTENCE</Button>
          <Modal
            destroyOnClose={true}
            title="Mnemonic Sentence"
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <p>WARNING: DO NOT share this mnemonic sentence with anybody! Otherwise all of your assets will be lost.</p>
            {
              this.state.showMnemonic ? (
                <div>
                  <p> Your private mnemonic sentence</p>
                  <Card >
                    <p>{this.state.mnemonic}</p>
                  </Card>
                  <Button type="primary" onClick={() => this.copy2Clipboard(this.state.mnemonic)}>Copy to clipboard</Button>
                </div>
              ) : (
                  <div>
                    <p> Enter password to continue</p>
                    <Input.Password placeholder="Input password" onChange={this.inputChanged} onPressEnter={this.pressEnter} />
                  </div>
                )
            }
          </Modal>
        </Card>
      </div>
    );
  }
}

export default Backup;




