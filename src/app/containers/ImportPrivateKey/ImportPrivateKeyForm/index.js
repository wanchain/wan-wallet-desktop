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
  }

  resetStateVal = () => {
    this.setState({
      pk: '',
      pk2: '',
      type: 'WAN',
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
      isValid = await isValidPrivateKey(pk, type) && await isValidPrivateKey(pk2, type);
    } else {
      isValid = await isValidPrivateKey(pk, type);
    }
    if (!isValid) {
      message.warn(intl.get('ImportPrivateKeyForm.invalidFormData'));
    } else {
      this.props.handleOk({ pk, pk2, type });
    }
  }

  handleCancel = async () => {
    this.resetStateVal();
    this.props.handleCancel();
  }

  render() {
    const { form, spin } = this.props;
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
                <Option value="BTC">BTC</Option>
                <Option value="EOS">EOS</Option>
              </Select>
              <Form.Item>
                {getFieldDecorator('pribateKey1', { rules: [{ required: true, message: intl.get('ImportPrivateKeyForm.isInvalid'), validator: this.checkPrivateKey }] })
                  (<Input placeholder={intl.get('ImportPrivateKey.enterPrivateKey')} onChange={this.pkChange} style={{ marginTop: '10px' }} />)}
              </Form.Item>
              {
                this.state.type === 'WAN' && <Form.Item>
                  {getFieldDecorator('pribateKey2', { rules: [{ required: true, message: intl.get('ImportPrivateKeyForm.isInvalid'), validator: this.checkPrivateKey }] })
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
