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
    pk: '',
    pk2: '',
    type: 'WAN',
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      confirmationVisible: false,
      pk: '',
      pk2: '',
      type: 'WAN',
    });
  }

  showModal = () => {
    this.setState({ confirmationVisible: true, })
  }

  handleOk = (data) => {
    this.setState({
      confirmationVisible: false,
      visible: true,
    });
  }

  handleCloseConfirmationDialog = () => {
    this.setState({ confirmationVisible: false });
  }

  handleCancelForm = () => {
    this.resetStateVal();
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
            this.state.confirmationVisible && <ImportPrivateKeyConfirmation onOk={this.handleOk} onCancel={this.handleCloseConfirmationDialog} />
          }
          {
            this.state.visible && <ImportForm handleCancel={this.handleCancelForm} />
          }
        </Card>
      </div>
    );
  }
}

export default ImportPrivateKey;
