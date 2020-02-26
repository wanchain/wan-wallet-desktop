import React, { Component } from 'react';
import { Button, Card, Modal, Input, Select, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { isValidChecksumOTAddress } from 'wanchain-util';

import style from './index.less';
const { Option } = Select;

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class ImportPrivateKey extends Component {
  state = {
    visible: false,
    pk: '',
    pk2: '',
    type: 'WAN',
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      pk: '',
      type: 'WAN',
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

  /* pwdChange = e => {
    this.setState({
      pwd: e.target.value
    });
  } */

  typeChange = (v) => {
    this.setState({
      type: v,
    });
  }

  checkToWanPrivateAddr = (rule, value, callback) => {
    if (/^0x[0-9a-f]{132}$/.test(value)) {
      return true;
    } else if (isValidChecksumOTAddress(value)) {
      return true;
    } else {
      return false;
    }
  }

  handleOk = () => {
    let { pk, pk2, type } = this.state;
    console.log(pk, pk2, type);
    try {
      if (typeof (pk) === 'string' && pk.trim().length && type.trim().length) {
        let param = {
          pk,
          type
        };
        if (this.state.type === 'WAN') {
          if (typeof (pk2) === 'string' && pk2.trim().length) {
            if (this.checkToWanPrivateAddr(`0x${pk2}`)) {
              message.warn(intl.get('ImportPrivateKey.invalidParameter'));
              return false;
            }
            param.pk2 = pk2.trim();
          } else {
            message.warn(intl.get('ImportPrivateKey.invalidParameter'));
            return;
          }
        }
        wand.request('wallet_importPrivateKey', param, function (err, val) {
          console.log('result:', err, val);
          if (err) {
            message.warn(intl.get('ImportPrivateKey.importPKFailed'));
            return
          }
          if (val) {
            message.success(intl.get('ImportPrivateKey.importPKSuccess'));
          } else {
            message.warn(intl.get('ImportPrivateKey.importPKFailed'));
          }
        });
      } else {
        message.warn(intl.get('ImportPrivateKey.invalidParameter'));
        return;
      }
      this.resetStateVal();
    } catch (e) {
      message.error(e.toString());
    }
  }

  render() {
    return (
      <div className={style['settings_importPrivateKey']}>
        <Card title={intl.get('ImportPrivateKey.title')}>
          <p className="com-gray">
            {intl.get('ImportPrivateKey.ImportPrivateKeyNotice')}
          </p>
          <Button type="primary" onClick={this.showModal}>{intl.get('Common.continue')}</Button>
          <Modal
            destroyOnClose={true}
            title={intl.get('ImportPrivateKey.title')}
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.resetStateVal}
            closable={false}
            okText={intl.get('Common.ok')}
            className={style['settings_importPrivateKey_modal']}
            cancelText={intl.get('Common.cancel')}
          >
            <p className={style.textP}>{intl.get('Common.warning')}: {intl.get('ImportPrivateKey.notify')}</p>
            <div>
              <Select defaultValue="WAN" onChange={this.typeChange}>
                <Option value="WAN" selected="selected">WAN</Option>
                <Option value="ETH">ETH</Option>
                <Option value="BTC">BTC</Option>
                <Option value="EOS">EOS</Option>
              </Select>
              <Input.Password placeholder={intl.get('ImportPrivateKey.enterPrivateKey')} onChange={this.pkChange} style={{ marginTop: '10px' }} />
              {
                this.state.type === 'WAN' && <Input.Password placeholder={intl.get('ImportPrivateKey.enterPrivateKey') + '2'} onChange={this.pkChange2} style={{ marginTop: '10px' }} />
              }
            </div>
          </Modal>
        </Card>
      </div>
    );
  }
}

export default ImportPrivateKey;
