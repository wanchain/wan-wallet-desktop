import React, { Component } from 'react';
import { Button } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less'

@inject(stores => ({
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  getMnemonic: ret => stores.session.getMnemonic(ret),
  setMnemonicStatus: ret => stores.session.setMnemonicStatus(ret)
}))

@observer
class CreateMnemonic extends Component {
  createMnemonic = () =>{
    wand.request('phrase_generate', {pwd: '123'}, (err, val) => {
      if (err) { 
          console.log('error printed inside callback: ', err)
          return
      }
      this.props.setMnemonicStatus(true)
    });
  }

  render() {
    return (
      <div className="textc">
        CreateMnemonic
        <Button type="primary" shape="round" size="large" onClick={this.createMnemonic}>createMnemonic</Button>
      </div>
    );
  }
}

export default CreateMnemonic;