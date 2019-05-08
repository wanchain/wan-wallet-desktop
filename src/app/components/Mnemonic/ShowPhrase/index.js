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
    if (method === 'import') {
      return (
        <div>
          <h3 className="mneCom-h1">Import Your Seed Phrase</h3>
          <h4 className="mneCom-h4">Enter your seed phrase here and separate each word with a single space</h4>
          <TextArea className="mne-textarea" rows={4} onChange={this.onChange} />
        </div>
      )
    } else {
      return (
        <div className="phraseCon">
          <h1 className="mneCom-h1">Backup Your Seed Phrase</h1>
          <h3 className="mneCom-h3">WARNING: DO NOT share this seed phrase with anybody. Otherwise all of your assets will be lost.</h3>
          {mnemonic.split(' ').map((item, index) => <Tag className="word" key={index}>{item}</Tag>)}
          <div className="mne-tips">
            <p className="tips-tit">Tips:</p>
            <p className="tips-mes">Write this seed phrase on a piece of paper and store in a secure place</p>
          </div>
        </div>
      )
    }
  }
}

export default ShowPhrase;