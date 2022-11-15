import React, { Component } from 'react';
import { Modal, Input, Select, message, Spin, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import { isValidPrivateKey } from 'utils/helper';
import style from './index.less';
const { Option } = Select;

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class ImportPrivateKeyForm extends Component {
  state = {
    pk: '',
    pk2: '',
    type: 'WAN',
    spin: false
  }

  resetStateVal = () => {
    this.setState({
      pk: '',
      pk2: '',
      type: 'WAN',
      spin: false
    });
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

  checkPrivateKey = async (rule, value, callback) => {
    try {
      let res = await isValidPrivateKey(value, this.state.type);
      if (res) {
        callback();
      } else {
        callback(intl.get('ImportPrivateKeyForm.isInvalid'));
      }
    } catch (err) {
      callback(intl.get('ImportPrivateKeyForm.isInvalid'));
    }
  }

  handleOk = async () => {
    let { pk, pk2, type } = this.state;
    let isValid = false;
    if (type === 'WAN') {
      isValid = await isValidPrivateKey(pk, type) && (pk2.length === 0 || await isValidPrivateKey(pk2, type));
    } else {
      isValid = await isValidPrivateKey(pk, type);
    }
    if (!isValid) {
      message.warn(intl.get('ImportPrivateKeyForm.invalidFormData'));
    } else {
      this.handleSubmit();
    }
  }

  handleCancel = async () => {
    this.resetStateVal();
    this.props.handleCancel();
  }

  handleSubmit = () => {
    let { pk, pk2, type } = this.state;
    try {
      this.setState({ spin: true });
      if (typeof (pk) === 'string' && pk.length && type.length) {
        let param = {
          pk,
          type
        };
        if (type === 'WAN') {
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
            this.handleCancel();
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

  render() {
    const { form } = this.props;
    const { spin } = this.state;
    const { getFieldDecorator } = form;
    return (
      <Modal
        destroyOnClose={true}
        title={intl.get('ImportPrivateKey.title')}
        visible={true}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        closable={false}
        okText={intl.get('Common.ok')}
        className={style['modal']}
        cancelText={intl.get('Common.cancel')}
      >
        <Spin spinning={spin}>
          <p className={style['textP']}>{intl.get('Common.warning')}: {intl.get('ImportPrivateKey.notify')}</p>
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
            <div>
              <Select defaultValue="WAN" onChange={this.typeChange}>
                <Option value="WAN" selected="selected">WAN</Option>
                <Option value="ETH">ETH</Option>
                <Option value="TRX">TRX</Option>
              </Select>
              <Form.Item>
                {getFieldDecorator('privateKey1', { rules: [{ required: true, message: intl.get('ImportPrivateKeyForm.isInvalid'), validator: this.checkPrivateKey }] })
                  (<Input placeholder={intl.get('ImportPrivateKey.enterPrivateKey')} onChange={this.pkChange} style={{ marginTop: '10px' }} />)}
              </Form.Item>
              {
                this.state.type === 'WAN' && <Form.Item>
                  {getFieldDecorator('privateKey2', { rules: [{ required: true, message: intl.get('ImportPrivateKeyForm.isInvalid'), validator: this.checkPrivateKey }] })
                    (<Input placeholder={intl.get('ImportPrivateKey.enterPrivateKey') + '2'} onChange={this.pkChange2} style={{ marginTop: '10px' }} />)}
                </Form.Item>
              }
            </div>
          </Form>
        </Spin>
      </Modal>
    );
  }
}

export default ImportPrivateKeyForm;
