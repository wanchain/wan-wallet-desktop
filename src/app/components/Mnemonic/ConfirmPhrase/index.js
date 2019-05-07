import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Tag } from 'antd';
import { TweenOneGroup } from 'rc-tween-one';

import './index.less';
import { randomsort } from 'utils/support';

@inject(stores => ({
  pwd: stores.mnemonic.pwd,
  method: stores.mnemonic.method,
  mnemonic: stores.mnemonic.mnemonic,
  setMnemonic: val => stores.mnemonic.setMnemonic(val),
  setNewPhrase: val => stores.mnemonic.setNewPhrase(val),
  setMnemonicStatus: ret => stores.session.setMnemonicStatus(ret)
}))

@observer
class ConfirmPhrase extends Component {
  constructor(props) {
    super(props);
    const { mnemonic } = this.props;
    this.state = {
      mnemonicArr: mnemonic.split(' '),
      tags: [],
    }
  }

  addWord = (item, index) => {
    const { tags, mnemonicArr } = this.state;
    if(tags.length === 11) {
      this.props.setNewPhrase(tags.concat(item))
    }
    mnemonicArr.splice(index, 1);
    this.setState({
      tags: tags.concat(item),
      mnemonicArr: mnemonicArr
    })
  }

  handleClose = (removedTag) => {
    const { mnemonicArr } = this.state;
    const tags = this.state.tags.filter(tag => tag !== removedTag);
    const newMnemonic = this.state.tags.filter(tag => tag === removedTag);
    this.setState({ tags, mnemonicArr: mnemonicArr.concat(newMnemonic) });
  }

  forMap = tag => {
    const tagElem = (
      <Tag closable onClose={e => {e.preventDefault();this.handleClose(tag);}}>
        {tag}
      </Tag>
    );
    return (
      <span key={tag} style={{ display: 'inline-block' }}>
        {tagElem}
      </span>
    );
  }

  render() {
    const { tags, mnemonicArr } = this.state;
    const tagChild = tags.map(this.forMap);

    return (
      <div>
        <div>
          <TweenOneGroup enter={{scale: 0.8, opacity: 0, type: 'from', duration: 100, onComplete: (e) => {e.target.style = '';},}} leave={{ opacity: 0, width: 0, scale: 0, duration: 200 }} appear={false}>
            {tagChild}
          </TweenOneGroup>
        </div>
        <div>
          { randomsort(mnemonicArr).map((item, index) => <Tag className="word" onClick={() => this.addWord(item, index)} key={index}>{item}</Tag>) }
        </div>
      </div>
    );
  }
}

export default ConfirmPhrase;