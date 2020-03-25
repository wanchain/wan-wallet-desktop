import React, { Component } from 'react';
import { Button, Card, Modal, Input, Select, message, Spin } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import ImportPrivateKeyConfirmation from './ImportPrivateKeyConfirmation';

import style from './index.less';
const { Option } = Select;

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
    spin: false
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      pk: '',
      type: 'WAN',
      spin: false
    });
  }

  showModal = () => {
    this.setState({ visible: true, })
  }

  pkChange = e => {
    this.setState({
      pk: e.target.value
    });
  }

  pkChange2 = e => {
    this.setState({
      pk2: e.target.value
    });
  }

  typeChange = (v) => {
    this.setState({
      type: v,
    });
  }

  handleOk = () => {
    this.setState({ confirmationVisible: true });
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
          if (typeof (pk2) === 'string' && pk2.length) {
            param.pk2 = pk2;
          } else {
            message.warn(intl.get('ImportPrivateKey.invalidParameter'));
            this.setState({ spin: false });
            return;
          }
        }
        wand.request('wallet_importPrivateKey', param, (err, val) => {
          if (err) {
            message.warn(intl.get('ImportPrivateKey.importPKFailed'));
            this.setState({ spin: false });
            return
          }
          if (val.status) {
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
            this.state.visible && <Modal
              destroyOnClose={true}
              title={intl.get('ImportPrivateKey.title')}
              visible={true}
              onOk={this.handleOk}
              onCancel={this.resetStateVal}
              closable={false}
              okText={intl.get('Common.ok')}
              className={style['settings_importPrivateKey_modal']}
              cancelText={intl.get('Common.cancel')}
            >
              <Spin spinning={this.state.spin}>
                <p className={style.textP}>{intl.get('Common.warning')}: {intl.get('ImportPrivateKey.notify')}</p>
                <div>
                  <Select defaultValue="WAN" onChange={this.typeChange}>
                    <Option value="WAN" selected="selected">WAN</Option>
                    <Option value="ETH">ETH</Option>
                    <Option value="BTC">BTC</Option>
                    <Option value="EOS">EOS</Option>
                  </Select>
                  <Input placeholder={intl.get('ImportPrivateKey.enterPrivateKey')} onChange={this.pkChange} style={{ marginTop: '10px' }} />
                  {
                    this.state.type === 'WAN' && <Input placeholder={intl.get('ImportPrivateKey.enterPrivateKey') + '2'} onChange={this.pkChange2} style={{ marginTop: '10px' }} />
                  }
                </div>
              </Spin>
            </Modal>
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
