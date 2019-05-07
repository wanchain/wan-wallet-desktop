import React, { Component } from 'react';
import { Input, Radio  } from 'antd';
import { observer, inject } from 'mobx-react';

@inject(stores => ({
  method: stores.mnemonic.method,
  setPwd: pwd => stores.mnemonic.setPwd(pwd),
  setMethod: method => stores.mnemonic.setMethod(method),
  setconfirmPwd: pwd => stores.mnemonic.setconfirmPwd(pwd),
}))

@observer
class InputPwd extends Component {
  inputChanged = e => {
    this.props.setPwd(e.target.value);
  }

  inputConfirm = e => {
    this.props.setconfirmPwd(e.target.value);
  }

  onChange = e => {
    this.props.setMethod(e.target.value);
  }

  render() {
    return (
      <div className="textc">
        <Input.Password placeholder="Enter password to continue" onChange={this.inputChanged} />
        <br />
        <Input.Password placeholder="Confirm your password" onChange={this.inputConfirm} />
        <br />
        <Radio.Group onChange={this.onChange} value={this.props.method} buttonStyle="solid">
          <Radio.Button value='create'>Create Phrase</Radio.Button>
          <Radio.Button value='import'>Import Phrase</Radio.Button>
        </Radio.Group>
      </div>
    );
  }
}

export default InputPwd;