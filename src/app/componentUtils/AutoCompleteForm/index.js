import React from 'react';
import { Form, Row, Col, AutoComplete } from 'antd';

function AutoCompleteForm(props) {
  const { form, dataSource, formMessage, formName, colSpan, onChange, options } = props;
  const { getFieldDecorator } = form;
  let width = colSpan || 8;
  // console.log('dataSource:', dataSource);
  return (
    <div className="validator-line">
      <Row type="flex" justify="space-around" align="top">
        <Col span={width}><span className="stakein-name">{formMessage}</span></Col>
        <Col span={24 - width}>
          <Form layout="inline" id="selectForm">
            <Form.Item>
              {getFieldDecorator(formName, options)
                (
                  <AutoComplete
                    dataSource={dataSource}
                    onChange={onChange}
                  />
                )}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default AutoCompleteForm;
