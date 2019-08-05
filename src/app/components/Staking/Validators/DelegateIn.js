import React, { Component } from 'react';
import { Button, Form } from 'antd';

import './index.less';
import StakeInForm from '../StakeInForm';

const DelegateInForm = Form.create({ name: 'StakeInForm' })(StakeInForm);

class DelegateIn extends Component {
  state = {
    visible: false,
  }

  showDialog = () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  handleSend = () => {
    this.setState({ visible: false });
  }

  render () {
    return (
      <div>
        <Button className="modifyTopUpBtn" disabled={ !this.props.enableButton } onClick={this.showDialog} />
        {
          this.state.visible &&
          <DelegateInForm disabled={true} visible={this.state.visible} onCancel={this.handleCancel} onSend={this.handleSend} record={this.props.record} topUp={true} />
        }
      </div>
    );
  }
}

export default DelegateIn;
