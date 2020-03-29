import React, { Component } from 'react';
import { Button, Card, Modal, Input, Select, message, Spin } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
const { Option } = Select;

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class ImportPrivateKeyConfirmation extends Component {
  state = {
    okText: `5 ${intl.get('ImportPrivateKeyConfirmation.seconds')}`,
    okDisabled: true,
  }

  componentDidMount() {
    let count = 5;
    let timer = setInterval(() => {
      if (count === 0) {
        clearInterval(timer);
      } else {
        count--;
        this.setState({
          okText: count !== 0 ? (count === 1 ? `${count} ${intl.get('ImportPrivateKeyConfirmation.second')}` : `${count} ${intl.get('ImportPrivateKeyConfirmation.seconds')}`) : intl.get('Common.ok'),
          okDisabled: count !== 0
        });
      }
    }, 1000);
  }

  resetState = () => {
    this.setState({
      okText: intl.get('Common.ok'),
      okDisabled: true,
    })
  }

  onOk = () => {
    this.resetState();
    this.props.onOk();
  }

  onCancel = () => {
    this.resetState();
    this.props.onCancel();
  }

  render() {
    let { okText, okDisabled } = this.state;
    return (
      <Modal
        destroyOnClose={true}
        title={intl.get('Common.warning')}
        visible={true}
        closable={false}
        onOk={this.onOk}
        onCancel={this.onCancel}
        okText={okText}
        cancelText={intl.get('Common.cancel')}
        okButtonProps={{ disabled: okDisabled, className: okDisabled ? style.disabledButton : '' }}
      >
        <p className={style.noticeText}>{intl.get('ImportPrivateKeyConfirmation.warningText')}</p>
      </Modal>
    );
  }
}

export default ImportPrivateKeyConfirmation;
