import React, { Component } from 'react';
import { Button, Card, Modal, Input, message } from 'antd';
import { clipboard } from 'electron';

import './index.less';

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

  inputChanged = e => {
    this.setState({ pwd: e.target.value });
  }

  sendGetPhraseCmd = pwd => {
    wand.request('phrase_reveal', { pwd: pwd }, (err, val) => {
      if (err) {
        message.warn('Invalid password. Try again');
      } else {
        this.setState({
          mnemonic: val,
          showMnemonic: true
        });
      }
    })
  }

  copy2Clipboard = (val) => {
    clipboard.writeText(val);
    message.success('Copy successfully');
  }

  render() {
    return (
      <div>
        <Card title="Reveal Mnemonic Sentence">
          <p className="com-gray">
            If you install a new wallet, you will need this seed phrase to access your assets.
            Save them somewhere safe and secret.
          </p>
          <Button type="primary" onClick={this.showModal}>Continue</Button>
          <Modal
            destroyOnClose={true}
            title="Mnemonic Sentence"
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.resetStateVal}
            closable={false}
          >
            <p className="textP">WARNING: DO NOT share this seed phrase with anybody. Otherwise all of your assets will be lost.</p>
            {
              this.state.showMnemonic ? (
                <div>
                  <p className="textP2"> Your Seed Phrase:</p>
                  {/* <Card > */}
                  <p className="textP3">{this.state.mnemonic}</p>
                  {/* </Card> */}
                  <p className="copyBtn" onClick={() => this.copy2Clipboard(this.state.mnemonic)}>[ Copy to clipboard ]</p>
                </div>
              ) : (
                  <div>
                    <Input.Password placeholder="Enter Password" onChange={this.inputChanged} onPressEnter={this.handleOk} />
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




