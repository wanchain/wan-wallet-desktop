import React from 'react';
import intl from 'react-intl-universal';
import { Form, Select, Row, Col } from 'antd';

function AddrSelectForm(props) {
  const { form, addrSelectedList, handleChange, getValueByAddrInfoArgs } = props;
  const { getFieldDecorator } = form;

  return (
    <React.Fragment>
      <Row type="flex" justify="space-around" align="top">
        <Col span={8}><span className="stakein-name">{intl.get('ValidatorRegister.address')}</span></Col>
        <Col span={16}>
          <Form layout="inline" id="posAddrSelect">
            <Form.Item>
              {getFieldDecorator('myAddr', { rules: [{ required: true, message: intl.get('NormalTransForm.invalidAddress') }] })
                (
                  <Select
                    autoFocus
                    showSearch
                    allowClear
                    className="colorInput"
                    optionLabelProp="value"
                    optionFilterProp="children"
                    dropdownStyle={{ width: "470px" }}
                    dropdownMatchSelectWidth={false}
                    placeholder={intl.get('StakeInForm.selectAddress')}
                    onChange={handleChange}
                    getPopupContainer={() => document.getElementById('posAddrSelect')}
                    filterOption={(input, option) => option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  >
                    {
                      addrSelectedList.map((item, index) =>
                        <Select.Option value={item} key={index}>
                          <Row className="ant-row-flex">
                            <Col>{item}</Col>&nbsp;
                          <Col className="stakein-selection-balance">- {Number(getValueByAddrInfoArgs(item, 'balance')).toFixed(1)}</Col>
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

export default AddrSelectForm;