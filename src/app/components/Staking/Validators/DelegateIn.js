import React, { Component } from 'react';
import { Button, Form } from 'antd';
import './index.less';
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

  handleSend = () => {
    this.setState({ visible: false });
  }

  render() {
    return (
      <div>
        <Button className="modifyTopUpBtn" onClick={this.showDialog} />
        {this.state.visible
          ? <DelegateInForm onCancel={this.handleCancel} onSend={this.handleSend} record={this.props.record} />
          : ''
        }
      </div>
    );
  }
}

export default DelegateIn