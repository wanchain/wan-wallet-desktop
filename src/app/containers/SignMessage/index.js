import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Form, Descriptions, Tooltip, Icon } from 'antd';

import style from './index.less';
import { WALLETID } from 'utils/settings';
import AddrSelectForm from 'componentUtils/AddrSelectForm';
import { getValueByAddrInfo } from 'utils/helper';

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  addrSelectedList: stores.wanAddress.addrSelectedList,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class SignMessage extends Component {
  constructor (props) {
    super(props);
    this.state = {
      message: '',
      showMessage: '',
      signedMessage: ''
    };
    this.props.changeTitle('menuConfig.signMessage');
  }

  handleNext = () => {
    let { myAddr: from } = this.props.form.getFieldsValue(['myAddr']);
    if (from && this.state.message) {
      let path = this.getValueByAddrInfoArgs(from, 'path');
      let walletID = from.indexOf(':') !== -1 ? WALLETID[from.split(':')[0].toUpperCase()] : WALLETID.NATIVE;
      wand.request('wallet_signPersonalMessage', { walletID, path, rawTx: this.state.message }, (err, data) => {
        let tmpMessage = this.state.message;

        if (err) {
          message.warn(intl.get('Offline.getInfoFailed'))
        } else {
          this.setState({
            message: '',
            showMessage: tmpMessage,
            signedMessage: data
          });
        }
      })
    } else {
      message.warn(intl.get('SignMessage.warn'))
    }
  }

  copy2Clipboard = () => {
    wand.writeText(this.state.signedMessage);
    message.success(intl.get('CopyAndQrcode.copySuccessfully'));
  }

  handleMessage = e => {
    this.setState({
      message: e.target.value
    })
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  getValueByAddrInfoArgs = (...args) => {
    return getValueByAddrInfo(...args, this.props.addrInfo);
  }

  onChangeAddrSelect = value => {
    this.setState(() => {
      let balance = value ? this.getValueByAddrInfoArgs(value, 'balance') : 0;
      return { balance }
    })
  }

  render () {
    const { addrSelectedList, form } = this.props;
    let addrSelectedListFilter = addrSelectedList.filter(v => v.indexOf(':') === -1)

    return (
      <div className={style.offlineStep + ' signmessage'}>
        <h3 className={style.stepOne + ' ' + style.inlineBlock}>{intl.get('EOSCreateAccountForm.accountToFundAccount')}</h3>
        <div className="validator-line">
          <AddrSelectForm form={form} addrSelectedList={addrSelectedListFilter} handleChange={this.onChangeAddrSelect} getValueByAddrInfoArgs={this.getValueByAddrInfoArgs} />
        </div>
        <p className={style.stepInfo}>{intl.get('SignMessage.inputPlaceholder')}</p>
        <p>
          <Input.TextArea placeholder={intl.get('SignMessage.input')} autosize={{ minColumns: 20, minRows: 4, maxRows: 10 }} className={style.stepText} onChange={this.handleMessage} value={this.state.message}></Input.TextArea>
        </p>
        <p className={style.threeBtn}>
          <Button type="primary" onClick={this.handleNext}>{intl.get('SignMessage.sign')}</Button>
        </p>
        <Descriptions title="Message" column={1} size="small">
          <Descriptions.Item label={intl.get('SignMessage.original')}>{this.state.showMessage}</Descriptions.Item>
          <Descriptions.Item label={intl.get('SignMessage.signed')}>
            {this.state.signedMessage}
            {
              this.state.signedMessage !== '' &&
              <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" theme="twoTone" onClick={this.copy2Clipboard}/></Tooltip>
            }
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  }
}

export default Form.create({ name: 'SignMessage' })(SignMessage);
