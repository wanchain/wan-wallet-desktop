import React, { Component } from 'react';
import { Modal, Icon, message } from 'antd';
import QRCode from 'qrcode';

// import { clipboard } from 'electron';

class CopyAndQrcode extends Component {
  state = {
    url: ''
  }

  createQrCode = (addr) => {
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
        maskClosable: true
      });
    })
    .catch(err => {
      console.error(err)
    });
  }

  copy2Clipboard = (addr) => {
    // clipboard.writeText(addr);
    wand.writeText(addr);
    message.success('Copy successfully');
  }

  render() {
    const { addr } = this.props;
    return (
      <div className="handleIco">
        <Icon type="copy" onClick={(e) => this.copy2Clipboard(addr, e)} />
        <Icon type="qrcode" onClick={(e) => this.createQrCode(addr, e)} />
      </div>
    );
  }
}

export default CopyAndQrcode;