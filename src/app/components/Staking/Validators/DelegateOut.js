import React, { Component } from 'react';
import { Button, Form } from 'antd';
import './index.less';
import WithdrawForm from '../WithdrawForm';
const DelegateOutForm = Form.create({ name: 'WithdrawForm' })(WithdrawForm);

class DelegateOut extends Component {
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
        <Button className="modifyExititBtn" onClick={this.showDialog} />
        {this.state.visible
          ? <DelegateOutForm onCancel={this.handleCancel} onSend={this.handleSend}
            record={this.props.record}
          />
          : ''
        }
      </div>
    );
  }
}

export default DelegateOut