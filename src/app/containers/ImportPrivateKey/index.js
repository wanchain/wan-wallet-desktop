import React, { Component } from 'react';
import { Button, Card, message, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import ImportPrivateKeyForm from './ImportPrivateKeyForm';
import ImportPrivateKeyConfirmation from './ImportPrivateKeyConfirmation';

import style from './index.less';
const ImportForm = Form.create({ name: 'ImportPrivateKeyForm' })(ImportPrivateKeyForm);
@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class ImportPrivateKey extends Component {
  state = {
    visible: false,
    confirmationVisible: false,
    spin: false,
    pk: '',
    pk2: '',
    type: 'WAN',
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      confirmationVisible: false,
      spin: false,
      pk: '',
      pk2: '',
      type: 'WAN',
    });
  }

  showModal = () => {
    this.setState({ visible: true, })
  }

  handleOk = (data) => {
    this.setState({
      confirmationVisible: true,
      pk: data.pk,
      pk2: data.pk2,
      type: data.type,
    });
  }

  handleCancelForm = () => {
    this.resetStateVal();
  }

  handleSubmit = () => {
    let { pk, pk2, type } = this.state;
    try {
      this.setState({ spin: true, confirmationVisible: false });
      if (typeof (pk) === 'string' && pk.length && type.length) {
        let param = {
          pk,
          type
        };
        if (this.state.type === 'WAN') {
          param.pk2 = pk2;
        }
        wand.request('wallet_importPrivateKey', param, (err, val) => {
          if (err) {
            message.warn(intl.get('ImportPrivateKey.importPKFailed'));
            this.setState({ spin: false });
            return
          }
          if (val && val.status) {
            message.success(intl.get('ImportPrivateKey.importPKSuccess'));
            this.resetStateVal();
          } else {
            if (val.message && val.message === 'sameAddress') {
              message.warn(intl.get('ImportPrivateKey.sameAddress'));
            } else {
              message.warn(intl.get('ImportPrivateKey.importPKFailed'));
            }
            this.setState({ spin: false });
          }
        });
      } else {
        message.warn(intl.get('ImportPrivateKey.invalidParameter'));
        this.setState({ spin: false });
        return;
      }
    } catch (e) {
      message.error(e.toString());
      this.setState({ spin: false });
    }
  }

  handleCloseConfirmationDialog = () => {
    this.setState({ confirmationVisible: false });
  }

  render() {
    return (
      <div className={style['settings_importPrivateKey']}>
        <Card title={intl.get('ImportPrivateKey.title')}>
          <p className="com-gray">
            {intl.get('ImportPrivateKey.ImportPrivateKeyNotice')}
          </p>
          <Button type="primary" onClick={this.showModal}>{intl.get('Common.continue')}</Button>
          {
            this.state.visible && <ImportForm handleCancel={this.handleCancelForm} handleOk={this.handleOk} spin={this.state.spin}/>
          }
          {
            this.state.confirmationVisible && <ImportPrivateKeyConfirmation onOk={this.handleSubmit} onCancel={this.handleCloseConfirmationDialog}/>
          }
        </Card>
      </div>
    );
  }
}

export default ImportPrivateKey;
