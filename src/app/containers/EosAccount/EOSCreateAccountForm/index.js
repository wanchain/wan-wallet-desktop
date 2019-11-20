import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observable, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Select, Row, Col, Icon } from 'antd';
import style from './index.less';

const { Option } = Select;

class EOSCreateAccountForm extends Component {
    handleOk() {
        console.log('handleOk')
    }

    handleCancel = () => {
        console.log('handleCancel');
        this.props.handleCancel();
    }

    render() {
        const { form } = this.props;
        const { getFieldDecorator } = form;
        const span = 8;
        return (
            <div>
                <Modal
                    title={'Create Account'}
                    visible={this.props.showModal}
                    wrapClassName={style.EOSCreateAccountForm}
                    destroyOnClose={true}
                    closable={false}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="back" className="cancel" onClick={this.handleCancel}>{'Cancel'}</Button>,
                        <Button key="submit" type="primary" onClick={this.handleOk}>{'OK'}</Button>,
                    ]}
                >
                    <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                        <Form.Item label={'New Account Name'}>
                            {getFieldDecorator('name', { initialValue: '' })
                                (<Input prefix={<Icon type="wallet" className="colorInput" />} />)}
                        </Form.Item>
                        <Form.Item label={'Creator'}>
                            {getFieldDecorator('creator', { initialValue: '' })
                                (
                                    <Select
                                        showSearch
                                        placeholder={'Account Used To Fund The New Account'}
                                        optionFilterProp="children"
                                        // onChange={onChange}
                                        // onFocus={onFocus}
                                        // onBlur={onBlur}
                                        // onSearch={onSearch}
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        <Option value="jack">Jack</Option>
                                        <Option value="lucy">Lucy</Option>
                                        <Option value="tom">Tom</Option>
                                    </Select>
                                )}
                        </Form.Item>
                        <Form.Item label={'Owner Public Key'}>
                            {getFieldDecorator('owner', { initialValue: '' })
                                (
                                    <Select
                                        showSearch
                                        placeholder={'Owner Key'}
                                        optionFilterProp="children"
                                        // onChange={onChange}
                                        // onFocus={onFocus}
                                        // onBlur={onBlur}
                                        // onSearch={onSearch}
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        <Option value="1">ASDF1</Option>
                                        <Option value="2">ASDF2</Option>
                                        <Option value="3">ASDF3</Option>
                                    </Select>
                                )}
                        </Form.Item>
                        <Form.Item label={'Active Public Key'}>
                            {getFieldDecorator('active', { initialValue: '' })
                                (
                                    <Select
                                        showSearch
                                        placeholder={'Active Key'}
                                        optionFilterProp="children"
                                        // onChange={onChange}
                                        // onFocus={onFocus}
                                        // onBlur={onBlur}
                                        // onSearch={onSearch}
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        <Option value="1">ASDF1</Option>
                                        <Option value="2">ASDF2</Option>
                                        <Option value="3">ASDF3</Option>
                                    </Select>
                                )}
                        </Form.Item>
                        <Row type="flex" justify="space-around">
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'RAM'}>
                                    {getFieldDecorator('RAM', { initialValue: '0' })
                                        (<Input addonAfter="Bytes" />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'CPU&NET'}>
                                    {getFieldDecorator('CPUNET', { initialValue: '0' })
                                        (<Input addonAfter="EOS" />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'TOTAL'}>
                                    {getFieldDecorator('TOTAL', { initialValue: '0' })
                                        (<Input addonAfter="EOS" />)}
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </div>
        );
    }
}

export default EOSCreateAccountForm;
