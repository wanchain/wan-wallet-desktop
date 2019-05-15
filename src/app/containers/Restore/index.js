import React, { Component } from 'react';
import { Button, Card, Modal, Input, message } from 'antd';

import './index.less';

class Restore extends Component {
  state = {
    visible: false,
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
    });
  }

  showModal = () => {
    this.setState({ visible: true, })
  }

  handleOk = () => {
    /** TODO */
    console.log('clear local data and reboot ')
    this.resetStateVal();
  }

  render() {
    return (
      <div>
        <Card title="Restore From Seed Phrase">
          <p className="textP">
            WARNING: If you restore a new wallet from your seed phrase, all local data of the current wallet will be deleted and the application will be rebooted. 
            Please confirm and continue.
          </p>
          <Button type="primary" onClick={this.showModal}>Continue</Button>
          <Modal
            destroyOnClose={true}
            title="Restore From Seed Phrase"
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.resetStateVal}
            closable={false}
          >
            <p className="textP">WARNING: All local data will be lost, including current seed phrase, transaction history, imported addresses and so on. Are you sure to continue?</p>
          </Modal>
        </Card>
      </div>
    );
  }
}

export default Restore;




