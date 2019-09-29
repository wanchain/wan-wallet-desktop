import React from 'react';
import intl from 'react-intl-universal';
import { Form, Select, Row, Col } from 'antd';

function SelectForm (props) {
  const { form, selectedList, handleChange, formMessage, placeholder, formName, initialValue, getValByInfoList, colSpan } = props;
  const { getFieldDecorator } = form;
  let width = colSpan || 8;

  return (
    <div className="validator-line">
      <Row type="flex" justify="space-around" align="top">
        <Col span={width}><span className="stakein-name">{intl.get(formMessage)}</span></Col>
        <Col span={24 - width}>
          <Form layout="inline" id="selectForm">
            <Form.Item>
              {getFieldDecorator(formName, { rules: [{ required: true }], initialValue: initialValue })
                (
                  <Select
                    autoFocus
                    showSearch
                    className="colorInput"
                    optionLabelProp="value"
                    optionFilterProp="children"
                    dropdownStyle={{ width: '470px' }}
                    dropdownMatchSelectWidth={false}
                    placeholder={intl.get(placeholder)}
                    onChange={handleChange}
                    getPopupContainer={() => document.getElementById('selectForm')}
                  >
                    {
                      selectedList.map((item, index) =>
                        <Select.Option value={item} key={index}>
                          <Row className="ant-row-flex">
                            <Col>{item}</Col>&nbsp;
                            <Col className="stakein-selection-balance">- {Number(getValByInfoList(item)).toFixed(1)}</Col>
                          </Row>
                        </Select.Option>)
                    }
                  </Select>
                )}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default SelectForm;
