import React from 'react';
import { Form, Input, Row, Col } from 'antd';

function CommonFormItem (props) {
  const { formName, placeholder, prefix, title, form, options, disabled } = props;
  const { getFieldDecorator } = form;
  return (
    <div className="validator-line">
      <Row type="flex" justify="space-around" align="top">
        <Col span={8}><span className="stakein-name">{title}</span></Col>
        <Col span={16}>
          <Form layout="inline">
            <Form.Item>
              {getFieldDecorator(formName, options)(<Input disabled={!!disabled} placeholder={placeholder} prefix={prefix} />)}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default CommonFormItem;