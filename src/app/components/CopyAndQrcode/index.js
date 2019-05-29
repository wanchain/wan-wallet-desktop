import React, { Component } from 'react';
import { Modal, Icon, message, Tooltip } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import QRCode from 'qrcode';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
}))

@observer
class CopyAndQrcode extends Component {
  state = {
    url: ''
  }

  createQrCode = addr => {
    QRCode.toDataURL(addr)
    .then(url => {
      this.setState({
        url: url
      })
      Modal.info({
        title: addr,
        content: (
          <div className="codeImg">
            <img src={this.state.url} />
          </div>
        ),
        maskClosable: true,
        okText: intl.get('popup.ok')
      });
    })
    .catch(err => {
      console.error(err)
    });
  }

  copy2Clipboard = addr => {
    wand.writeText(addr);
    message.success(intl.get('CopyAndQrcode.copySuccessfully'));
  }

  render() {
    const { addr, addrInfo } = this.props;
    return (
      <div className="handleIco">
        <Icon type="copy" onClick={e => this.copy2Clipboard(addr, e)} />
        <Icon type="qrcode" onClick={e => this.createQrCode(addr, e)} />
        { Object.keys(addrInfo['import']).includes(addr) 
            ? <Tooltip placement="bottom" title={intl.get('title.imported')}><Icon type="import" /></Tooltip>
            : ''
        }
      </div>
    );
  }
}

export default CopyAndQrcode;