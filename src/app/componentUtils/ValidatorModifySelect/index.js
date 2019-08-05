import React from 'react';
import { Form, Select, Row, Col } from 'antd';

function ValidatorModifySelect (props) {
  const { form, types, handleChange, title, message, placeholder } = props;
  const { getFieldDecorator } = form;

  return (
    <React.Fragment>
      <Row type="flex" justify="space-around" align="top">
        <Col span={8}><span className="stakein-name">{title}</span></Col>
        <Col span={16}>
          <Form layout="inline" id="posModifyType">
            <Form.Item>
              {getFieldDecorator('modifyType', { rules: [{ required: true, message }] })
                (
                  <Select
                    autoFocus
                    className="colorInput"
                    dropdownMatchSelectWidth={false}
                    placeholder={placeholder}
                    onChange={handleChange}
                    getPopupContainer={() => document.getElementById('posModifyType')}
                  >
                    {
                      types.map((item, index) =>
                        <Select.Option value={item} key={index}>
                          <Row className="ant-row-flex">
                            <Col>{item}</Col>
                          </Row>
                        </Select.Option>)
                    }
                  </Select>
                )}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default ValidatorModifySelect;
