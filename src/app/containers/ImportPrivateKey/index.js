import React, { Component } from 'react';
import { Button, Card, Modal, Input, Select, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

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

  handleOk = () => {
    console.log('handleOk');
    let { pk, type } = this.state;
    console.log(pk, type);
    if (pk.trim().length && type.trim().length) {
      console.log('submit');
      wand.request('wallet_importPrivateKey', {
        pk,
        type
    }, function (err, val) {
        console.log('result:');
        console.log(err, val);
        if (err) {
            console.log('Error occurred', err);
            return
        }
        if (val) {
          message.success('Import private key successfully.');
          console.log('Imported raw key address:', val);
            /* setTimeout(() => {
                window.close();
            }, 5000); */
        }
    })
    }
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
              <Input placeholder={intl.get('ImportPrivateKey.enterPrivateKey')} onChange={this.pkChange} />
              <Select defaultValue="WAN" onChange={this.typeChange}>
                <Option value="WAN" selected="selected">WAN</Option>
                <Option value="ETH">ETH</Option>
                <Option value="BTC">BTC</Option>
              </Select>
            </div>
          </Modal>
        </Card>
      </div>
    );
  }
}

export default ImportPrivateKey;
