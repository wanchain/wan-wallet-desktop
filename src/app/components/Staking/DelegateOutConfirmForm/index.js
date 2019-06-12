import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Input, Icon, Row, Col, Avatar, Form, message } from 'antd';

import './index.less';

@inject(stores => ({
  settings: stores.session.settings,
}))

@observer
class DelegateOutConfirmForm extends Component {
  onSend = () => {
    let { form, settings } = this.props;
    form.validateFields(err => {
      if (err) return;
      let pwd = form.getFieldValue('pwd');
      if(settings.reinput_pwd) {
        if(!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            this.props.onSend()
          }
        })
      } else {
        this.props.onSend()
      }
    });
  }

  render() {
    const { title, note, onCancel, record, settings, form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div className="withdraw">
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={title}
          onCancel={onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.onSend}>{intl.get('SendNormalTrans.send')}</Button>,
          ]}
          className="withdraw-modal"
        >
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('StakeInForm.validatorAccount')}</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.name')}</span></Col>
                <Col span={18}>
                  <div><Avatar src={record.validator.img}/>{' '}{record.validator.name}</div>
                  </Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={18}><span className="withdraw-addr">{record.validator.address}</span></Col>
              </Row>
            </div>
          </div>
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('StakeInForm.myAccount')}</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.stake')}</span></Col>
                <Col span={18}><span className="withdraw-addr">{record.myStake.title} WAN</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={18}><span className="withdraw-addr">{record.accountAddress}</span></Col>
              </Row>
            </div>
            {settings.reinput_pwd 
              ? <div className="withdraw-line" style={{height: "65px"}}>
                  <Row type="flex" justify="space-around" align="top">
                    <Col span={6} className="col-stakein-name"><span className="withdraw-name">{intl.get('StakeInForm.password')}</span></Col>
                    <Col span={18}>
                      <Form layout="inline">
                        <Form.Item>
                          {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                            (<Input.Password className="withdraw-pwd" placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                        </Form.Item>
                      </Form>
                    </Col>
                  </Row>
                </div>
              : ''}
          </div>
          <p className="withdraw-note">{note}</p>
        </Modal>
      </div>
    );
  }
}

export default DelegateOutConfirmForm;