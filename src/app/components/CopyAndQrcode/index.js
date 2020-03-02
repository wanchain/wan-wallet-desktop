import React, { Component, Fragment } from 'react';
import { Modal, Icon, message, Tooltip, Input } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import QRCode from 'qrcode';
import style from './index.less';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
}))

@observer
class CopyAndQrcode extends Component {
  state = {
    url: '',
    visible: false,
    showPrivateKey: false,
    privateKey1: '',
    privateKey2: '',
    pwd: ''
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
        okText: intl.get('Common.ok')
      });
    })
    .catch(err => {
      console.error(err)
    });
  }

  copy2Clipboard = addr => {
    console.log('copy:', addr);
    wand.writeText(addr);
    message.success(intl.get('CopyAndQrcode.copySuccessfully'));
  }

  resetState = () => {
    this.setState({
      visible: false,
      showMnemonic: false,
      mnemonic: '',
      pwd: ''
    });
  }

  inputChanged = e => {
    this.setState({ pwd: e.target.value });
  }

  showModal = () => {
    this.setState({ visible: true, })
  }

  handleOk = (path, wid) => {
    if (this.state.privateKey1) {
      this.resetState();
    } else {
      this.exportPrivateKeys(path, this.props.type, wid);
    }
  }

  exportPrivateKeys = (path, chainType, wid) => {
    wand.request('wallet_exportPrivateKeys', { wid, path, chainType }, (err, data) => {
      if (err) {
        console.log('wallet_exportPrivateKeys:', err)
      } else {
        console.log('privateKey:', data);
        this.setState({
          privateKey1: data[0],
          privateKey2: data[1],
          showPrivateKey: true
        });
      }
    })
  }

  render () {
    const { addr, addrInfo, type, path, wid } = this.props;

    return (
      <div className="handleIco">
        <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(addr, e)} /></Tooltip>
        <Tooltip placement="bottom" title={intl.get('Common.QRCode')}><Icon type="qrcode" onClick={e => this.createQrCode(addr, e)} /></Tooltip>
        {
          ['WAN', 'ETH', 'BTC', 'EOS'].includes(type) &&
          <React.Fragment>
            <Tooltip placement="bottom" title={intl.get('Common.exportKey')}><Icon type="export" onClick={e => this.showModal()} /></Tooltip>
            <Modal
              className='showPrivateKey'
              destroyOnClose={true}
              title={intl.get('Common.privateKey')}
              visible={this.state.visible}
              onOk={() => this.handleOk(path, wid)}
              onCancel={this.resetState}
              closable={false}
              okText={intl.get('Common.ok')}
              cancelText={intl.get('Common.cancel')}
            >
              <p className={style.textP}>{intl.get('Backup.warning')}: {intl.get('Backup.doNotShare')}</p>
              {
                this.state.showPrivateKey ? (
                  <div>
                    <p className={style.textP2}> {intl.get('Common.yourPrivateKey')} {this.props.type === 'WAN' ? '1' : ''}:</p>
                    <p className={style.textP3}>{this.state.privateKey1}</p>
                    {
                      this.props.type === 'WAN' ? (
                        <Fragment>
                          <p className={style.textP2}> {intl.get('Common.yourPrivateKey')} 2:</p>
                          <p className={style.textP3}>{this.state.privateKey2}</p>
                          <p className={style.copyBtn} onClick={() => this.copy2Clipboard(`${intl.get('CopyAndQrcode.privateKey')}1：${this.state.privateKey1}\n${intl.get('CopyAndQrcode.privateKey')}2：${this.state.privateKey2}`)}>[ {intl.get('Backup.copyToClipboard')} ]</p>
                        </Fragment>
                      ) : (
                        <p className={style.copyBtn} onClick={() => this.copy2Clipboard(this.state.privateKey1)}>[ {intl.get('Backup.copyToClipboard')} ]</p>
                      )
                    }
                  </div>
                ) : (
                    <div>
                      <Input.Password placeholder={intl.get('Backup.enterPassword')} onChange={this.inputChanged} onPressEnter={() => this.handleOk(path, wid)} />
                    </div>
                  )
              }
            </Modal>
          </React.Fragment>
        }
        { Object.keys(addrInfo['import']).includes(addr)
            ? <Tooltip placement="bottom" title={intl.get('title.imported')}><Icon type="info" /></Tooltip>
            : ''
        }
      </div>
    );
  }
}

export default CopyAndQrcode;
