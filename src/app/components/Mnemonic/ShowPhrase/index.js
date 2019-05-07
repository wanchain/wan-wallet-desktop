import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Input, Tag } from 'antd';

const { TextArea } = Input;

import './index.less';

@inject(stores => ({
  method: stores.mnemonic.method,
  mnemonic: stores.mnemonic.mnemonic,
  setIndex: index => stores.mnemonic.setIndex(index),
  setMnemonic: val => stores.mnemonic.setMnemonic(val),
}))

@observer
class ShowPhrase extends Component {
  onChange = e => {
    this.props.setMnemonic(e.target.value.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' '));
  }

  render() {
    const { mnemonic, method } = this.props;
    if(method === 'import') {
      return (
        <div>
          <h3 className="mneCom-h1">Please import the Secret Phrase</h3>
          <h4 className="mneCom-h4">Please enter your Secret Phrase in the correct order, using space</h4>
          <TextArea className="mne-textarea" rows={4} onChange={this.onChange}/>
        </div>
      )
    } else {
      return (
        <div className="phraseCon">
        <h1 className="mneCom-h1">Secret Backup Phrase</h1>
        <h3 className="mneCom-h3">WARNING: DO NOT share this mnemonic sentence with anybody! Otherwise all of your ssets will be lost.</h3>
        <h3 className="mneCom-h2">Your sevret backe up phrase makes it easy to back up and restore
youre account</h3>
          { mnemonic.split(' ').map((item, index) => <Tag className="word" key={index}>{item}</Tag>) }
        <div className="mne-tips">
          <p className="tips-tit">Tips:</p>
          <p className="tips-mes">Your sevret backe up phrase makes it easy to back up and restore youre account Your sevret backe up phrase makes it easy to back up and restore youre account</p>
        </div>
        </div>
      )
    }
  }
}

export default ShowPhrase;