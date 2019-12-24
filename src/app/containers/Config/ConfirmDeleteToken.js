import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Form, Input, Icon } from 'antd';

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
        bodyStyle={{ textAlign: 'center' }}
      >
        <div className={style.deleteMsg}>{intl.get('Config.confirmText')} <span className={style.symbolSty}>{token.symbol} </span>?</div>
      </Modal>
    );
  }
}

export default ConfirmDeleteToken;
