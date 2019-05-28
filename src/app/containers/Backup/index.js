import React, { Component } from 'react';
import { Button, Card, Modal, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
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
        message.warn(intl.get('Backup.invalidPassword'));
      } else {
        this.setState({
          mnemonic: val,
          showMnemonic: true
        });
      }
    })
  }

  copy2Clipboard = (val) => {
    wand.writeText(val);
    message.success(intl.get('Backup.copySuccessfully'));
  }

  render() {
    return (
      <div>
        <Card title={intl.get('Backup.revealSeedPhrase')}>
          <p className="com-gray">
            {intl.get('Backup.saveSeedPhraseNotice')}
          </p>
          <Button type="primary" onClick={this.showModal}>{intl.get('Backup.continue')}</Button>
          <Modal
            destroyOnClose={true}
            title={intl.get('Backup.seedPhrase')}
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.resetStateVal}
            closable={false}
            okText={intl.get('popup.ok')}
            cancelText={intl.get('popup.cancel')}
          >
            <p className="textP">{intl.get('Backup.warning')}: {intl.get('Backup.doNotShare')}</p>
            {
              this.state.showMnemonic ? (
                <div>
                  <p className="textP2"> {intl.get('Backup.yourSeedPhrase')}:</p>
                  {/* <Card > */}
                  <p className="textP3">{this.state.mnemonic}</p>
                  {/* </Card> */}
                  <p className="copyBtn" onClick={() => this.copy2Clipboard(this.state.mnemonic)}>[ {intl.get('Backup.copyToClipboard')} ]</p>
                </div>
              ) : (
                  <div>
                    <Input.Password placeholder={intl.get('Backup.enterPassword')} onChange={this.inputChanged} onPressEnter={this.handleOk} />
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




