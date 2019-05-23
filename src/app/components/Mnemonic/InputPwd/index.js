import React, { Component } from 'react';
import { Input, Radio  } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
@inject(stores => ({
  method: stores.mnemonic.method,
  language: stores.languageIntl.language,
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
        <h1 className="mneCom-h1">{intl.get('Mnemonic.InputPwd.createAWANWallet')}</h1>
        <div className="mne-input">
          <Input.Password placeholder={intl.get('Mnemonic.InputPwd.enterPassword')} onChange={this.inputChanged} />
          <Input.Password placeholder={intl.get('Mnemonic.InputPwd.confirmPassword')} onChange={this.inputConfirm} />
        </div>
        <Radio.Group onChange={this.onChange} value={this.props.method} buttonStyle="solid" className="groupCon">
          <Radio.Button value='create' className="creat-button">{intl.get('Mnemonic.InputPwd.createPhrase')}</Radio.Button>
          <Radio.Button value='import' className="creat-button">{intl.get('Mnemonic.InputPwd.importPhrase')}</Radio.Button>
        </Radio.Group>
      </div>
    );
  }
}

export default InputPwd;