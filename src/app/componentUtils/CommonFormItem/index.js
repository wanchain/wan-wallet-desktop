import React from 'react';
import { Form, Input, Row, Col } from 'antd';

function CommonFormItem (props) {
  const { formName, placeholder, prefix, title, form, options, disabled, sbiling, colSpan } = props;
  const { getFieldDecorator } = form;
  let width = colSpan || 8;

  return (
    <div className="validator-line">
      <Row type="flex" justify="space-around" align="top">
        <Col span={width}><span className="stakein-name">{title}</span></Col>
        <Col span={24 - width}>
          <Form layout="inline">
            <Form.Item>
              {getFieldDecorator(formName, options)(<Input disabled={!!disabled} placeholder={placeholder} prefix={prefix} />)}
              { sbiling }
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default CommonFormItem;
