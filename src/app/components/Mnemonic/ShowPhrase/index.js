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
          <p>Please import the Secret Phrase</p>
          <TextArea rows={4} onChange={this.onChange}/>
        </div>
      )
    } else {
      return (
        <div>
          { mnemonic.split(' ').map((item, index) => <Tag className="word" key={index}>{item}</Tag>) }
        </div>
      )
    }
  }
}

export default ShowPhrase;