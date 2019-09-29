import React from 'react';
import intl from 'react-intl-universal';
import { Form, Input, Icon, Row, Col } from 'antd';

function PwdForm (props) {
  const { getFieldDecorator } = props.form;
  let width = props.colSpan || 8;

  return (
    <div className="validator-line">
      <Row type="flex" justify="space-around" align="top">
        <Col span={width}><span className="stakein-name">{intl.get('NormalTransForm.password')}</span></Col>
        <Col span={24 - width}>
          <Form layout="inline">
            <Form.Item>
              {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default PwdForm;
