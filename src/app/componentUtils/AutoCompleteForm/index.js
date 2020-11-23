import React, { useState } from 'react';
import { Form, Row, Col, AutoComplete, Icon, Input } from 'antd';
import style from './index.less';

function AutoCompleteForm(props) {
  const { form, dataSource, formMessage, formName, colSpan, onChange, options } = props;
  const { getFieldDecorator } = form;
  let width = colSpan || 8;
  const [collapsed, setCollapsed] = useState(true);
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
                    onBlur={() => setCollapsed(true)}
                    onFocus={() => setCollapsed(false)}
                  >
                    <Input suffix={<Icon type={'down'} className={!collapsed && style['rotateToUp']} style={{ fontSize: '12px', transition: '0.3s' }} />} />
                  </AutoComplete>
                )}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default AutoCompleteForm;
