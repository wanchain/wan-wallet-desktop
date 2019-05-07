import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Tag, Input, Icon } from 'antd';
import { TweenOneGroup } from 'rc-tween-one';

import './index.less';
import { randomsort } from 'utils/support';

@inject(stores => ({
  pwd: stores.mnemonic.pwd,
  method: stores.mnemonic.method,
  mnemonic: stores.mnemonic.mnemonic,
  setMnemonic: val => stores.mnemonic.setMnemonic(val),
  setMnemonicStatus: ret => stores.session.setMnemonicStatus(ret)
}))

@observer
class ConfirmPhrase extends Component {
  constructor(props) {
    super(props);
    const { mnemonic } = this.props;
    this.state = {
      mnemonic: mnemonic.split(' '),
      randomMn: randomsort(mnemonic.split(' '))
    }
  }

  addWord = e => {
    console.log(Object.keys(e.target))
    console.log(e.target.value)
  }
  
  render() {
    const { randomMn } = this.state;
    return (
      <div>
        <Input.TextArea rows={4} />
        <div>
          { randomMn.map((item, index) => <span className="word" onClick={this.addWord} key={index}>{item}</span>) }
        </div>
      </div>
    );
  }
}

export default ConfirmPhrase;