import React from 'react';
import { Form, Select, Row, Col } from 'antd';

import { getValueByAddrInfo } from 'utils/helper';

function SelectForm(props) {
  const { form, selectedList, handleChange, formMessage, placeholder, formName, initialValue, getValByInfoList, colSpan, showBalance, dropdownStyle, addrInfo, isTextValueData } = props;
  const { getFieldDecorator } = form;
  let width = colSpan || 8;
  let filterItem = props.filterItem || (val => addrInfo ? getValueByAddrInfo(val, 'name', addrInfo) : val);

  return (
    <div className="validator-line">
      <Row type="flex" justify="space-around" align="top">
        <Col span={width}><span className="stakein-name">{formMessage}</span></Col>
        <Col span={24 - width}>
          <Form layout="inline" id="selectForm">
            <Form.Item>
              {getFieldDecorator(formName, { rules: [{ required: true }], initialValue: initialValue })
                (
                  <Select
                    autoFocus
                    className="colorInput"
                    optionLabelProp={isTextValueData ? 'label' : 'value'}
                    optionFilterProp="children"
                    dropdownStyle={dropdownStyle}
                    dropdownMatchSelectWidth={false}
                    placeholder={placeholder}
                    onSelect={handleChange}
                    getPopupContainer={() => document.getElementById('selectForm')}
                  >
                    {
                      selectedList.map((item, index) => {
                        return isTextValueData ? (<Select.Option value={item.value} label={item.text} key={index}>
                          <Row className="ant-row-flex">
                            <Col>{item.text}</Col>&nbsp;
                        </Row>
                        </Select.Option>) : (<Select.Option value={filterItem(item)} key={index}>
                          <Row className="ant-row-flex">
                            <Col>{filterItem(item)}</Col>&nbsp;
                          {showBalance && <Col className="stakein-selection-balance">- {Number(getValByInfoList(item)).toFixed(1)}</Col>}
                          </Row>
                        </Select.Option>)
                      })
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
