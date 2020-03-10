import React, { Component, Fragment } from 'react';
import { Modal, Icon, message, Tooltip, Input } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import QRCode from 'qrcode';
import style from './index.less';
import { WALLETID } from 'utils/settings';
import { getTypeByWalletId } from 'utils/helper';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  deleteWANAccount: (type, addr) => stores.wanAddress.deleteAddress(type, addr),
  deleteBTCAccount: (type, addr) => stores.btcAddress.deleteAddress(type, addr),
  deleteETHAccount: (type, addr) => stores.ethAddress.deleteAddress(type, addr),
  deleteEOSAccount: (type, key) => stores.eosAddress.deleteKey(type, key),
}))

@observer
class CopyAndQrcode extends Component {
  state = {
    url: '',
    visible: false,
    showPrivateKey: false,
    privateKey1: '',
    privateKey2: '',
    pwd: '',
    showDeleteModal: false
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
    wand.writeText(addr);
    message.success(intl.get('CopyAndQrcode.copySuccessfully'));
  }

  resetState = () => {
    this.setState({
      visible: false,
      showMnemonic: false,
      pwd: '',
      showPrivateKey: false,
      privateKey1: '',
      privateKey2: ''
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
        this.setState({
          privateKey1: data[0],
          privateKey2: data[1],
          showPrivateKey: true
        });
      }
    })
  }

  showDeleteModal = () => {
    this.setState({
      showDeleteModal: true
    });
  }

  handleDeleteCancel = () => {
    this.setState({
      showDeleteModal: false,
    });
  }

  handleDeleteOk = () => {
    this.deleteAccount();
    this.handleDeleteCancel();
  }

  deleteAccount = () => {
    const { addr, type, path, wid } = this.props;
    wand.request('account_delete', { walletID: wid, path }, async (err, ret) => {
      if (err) {
        console.log('Delete user from DB failed ', err);
        message.warn('Delete user from DB failed');
      } else {
        if (ret) {
          message.success('Delete user from DB Success');
          this.props[`delete${type}Account`](getTypeByWalletId(wid), addr); // Delete in view
        } else {
          message.warn('Delete user from DB failed');
        }
      }
    });
  }

  render() {
    const { addr, addrInfo, type, path, wid, name } = this.props;
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
              <p className={style.textP}>{intl.get('Common.warning')}: {intl.get('Private.doNotShare')}</p>
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
                          <p className={style.copyBtn} onClick={() => this.copy2Clipboard(`${intl.get('CopyAndQrcode.privateKey')}1: ${this.state.privateKey1}\n${intl.get('CopyAndQrcode.privateKey')}2: ${this.state.privateKey2}`)}>[ {intl.get('Backup.copyToClipboard')} ]</p>
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
        {
          Object.values(WALLETID).includes(wid) && <Tooltip placement="bottom" title={intl.get('Common.delete')}><Icon type="delete" onClick={e => this.showDeleteModal()} /></Tooltip>
        }
        {[WALLETID.KEYSTOREID, WALLETID.RAWKEY].includes(wid)
          ? <Tooltip placement="bottom" title={intl.get('title.imported')}><Icon type="import" /></Tooltip>
          : ''
        }
        {
          this.state.showDeleteModal &&
          <Modal
            className='showPrivateKey'
            destroyOnClose={true}
            title={intl.get('Config.deleteConfirm')}
            visible={true}
            onOk={(addr, type, path, wid) => this.handleDeleteOk(addr, type, path, wid)}
            onCancel={this.handleDeleteCancel}
            closable={false}
            okText={intl.get('Common.ok')}
            cancelText={intl.get('Common.cancel')}
            bodyStyle={{ textAlign: 'center' }}
          >
            <div className={style.deleteMsg}>
              <span>{intl.get('CopyAndQrcode.confirmText')} : </span>
              <span className={style.symbolSty}>{name}</span>
            </div>
          </Modal>
        }
      </div>
    );
  }
}

export default CopyAndQrcode;
