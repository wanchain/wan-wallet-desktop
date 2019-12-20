import React, { Component } from 'react';
import { Modal, Form, Input, Icon } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language
}))

@observer
class ConfirmDeleteToken extends Component {
  render () {
    const { token, onOk, onClose } = this.props;
    return (
      <Modal
        destroyOnClose={true}
        title={intl.get('Config.deleteConfirm')}
        visible={true}
        onOk={onOk}
        onCancel={onClose}
        closable={false}
        okText={intl.get('Common.ok')}
        cancelText={intl.get('Common.cancel')}
      >
        <div>{intl.get('Config.confirmText')}</div>
        <div style={{ textAlign: 'center', fontSize: '18px', color: 'goldenrod' }}>{this.props.token.symbol}</div>
      </Modal>
    );
  }
}

export default ConfirmDeleteToken;
