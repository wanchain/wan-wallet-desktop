import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Input, Tag } from 'antd';
import intl from 'react-intl-universal';

const { TextArea } = Input;

import './index.less';

@inject(stores => ({
  method: stores.mnemonic.method,
  mnemonic: stores.mnemonic.mnemonic,
  language: stores.languageIntl.language,
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
          <h3 className="mneCom-h1">{intl.get('Mnemonic.ShowPhrase.importYourSeedPhrase')}</h3>
          <h4 className="mneCom-h4">{intl.get('Mnemonic.ShowPhrase.enterSeedPhraseHereAndSeparateEachWordWithSingleSpace')}</h4>
          <TextArea className="mne-textarea" rows={4} onChange={this.onChange} />
        </div>
      )
    } else {
      return (
        <div className="phraseCon">
          <h1 className="mneCom-h1">{intl.get('Mnemonic.ShowPhrase.backupYourSeedPhrase')}</h1>
          <h3 className="mneCom-h3">{intl.get('Mnemonic.ShowPhrase.warning')}: {intl.get('Mnemonic.ShowPhrase.doNotShareThisSeedPhraseWithAnybody')}</h3>
          {mnemonic.split(' ').map((item, index) => <Tag className="word" key={index}>{item}</Tag>)}
          <div className="mne-tips">
            <p className="tips-tit">{intl.get('Mnemonic.ShowPhrase.tips')}:</p>
            <p className="tips-mes">{intl.get('Mnemonic.ShowPhrase.writeSeedPhraseOnPaperAndStoreInSecurePlace')}</p>
          </div>
        </div>
      )
    }
  }
}

export default ShowPhrase;