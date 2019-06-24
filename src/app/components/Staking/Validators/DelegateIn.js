import React, { Component } from 'react';
import { Button, Form, message } from 'antd';
import './index.less';
import intl from 'react-intl-universal'
import StakeInForm from '../StakeInForm';
const DelegateInForm = Form.create({ name: 'StakeInForm' })(StakeInForm);

class DelegateIn extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    }
  }

  showDialog = () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  handleSend = (walletID) => {
    this.setState({ visible: false });
    if(walletID == 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }
  }

  render() {
    return (
      <div>
        <Button className="modifyTopUpBtn" onClick={this.showDialog} />
        {
          this.state.visible
          ? <DelegateInForm disabled={true} visible={this.state.visible} onCancel={this.handleCancel} onSend={this.handleSend} record={this.props.record} />
          : ''
        }
      </div>
    );
  }
}

export default DelegateIn