import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { Button, Form, message } from 'antd';

import './index.less';


class ValidatorIn extends Component {
  state = {
    visible: false
  }

  showDialog = () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  handleSend = walletID => {
    this.setState({ visible: false });
    if(walletID == 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }
  }

  render() {
    return (
      <div>
        <Button className="modifyTopUpBtn" onClick={this.showDialog} />

      </div>
    );
  }
}

export default ValidatorIn