import React, { Component } from 'react';
import { Input } from 'antd';
import { observer, inject } from 'mobx-react';

@inject(stores => ({
  setPwd: pwd => stores.mnemonic.setPwd(pwd),
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

  createMnemonic = () => {
    wand.request('phrase_generate', {pwd: this.state.pwd}, (err, val) => {
      if (err) { 
          console.log('error printed inside callback: ', err)
          return
      }
      this.setState({
        mnemonic: val.split(' '),
        pwd: ''
      });
    });
  }

  render() {
    return (
      <div className="textc">
        <Input.Password placeholder="Enter password to continue" onChange={this.inputChanged}/>
        <Input.Password placeholder="Confirm your password" onChange={this.inputConfirm}/>
      </div>
    );
  }
}

export default InputPwd;