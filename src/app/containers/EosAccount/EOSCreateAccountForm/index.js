import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Select, Row, Col, Icon } from 'antd';
import style from './index.less';
import { BigNumber } from 'bignumber.js';

const { Option } = Select;
@inject(stores => ({
    language: stores.languageIntl.language,
    getAccount: stores.eosAddress.getAccount,
    getKeyList: stores.eosAddress.getKeyList,
    getAccountList: stores.eosAddress.getAccountList,
}))

@observer
class EOSCreateAccountForm extends Component {
    handleOk = () => {
        console.log('handleOk');
        const { form, getAccountList } = this.props;
        console.log('getAccountList:', getAccountList);
        form.validateFields(async (err) => {
            if (err) {
                return;
            };
            let values = form.getFieldsValue();
            console.log('values: ', values); // {type: "buy", size: 12, account: "cuiqiangtes1"}
            console.log('account:', values.creator);
            if (new BigNumber(values.CPU).plus(values.NET).gt(0)) {
                console.log(this.getBalanceByAccount(values.creator));
            }
        })
    }

    handleCancel = () => {
        console.log('handleCancel');
        this.props.handleCancel();
    }

    getBalanceByAccount = (name) => {
        console.log(name);
        const { getAccountList } = this.props;
        let index = getAccountList.findIndex((item) => item.account === name);
        console.log('index:', index, getAccountList[index]);
        return 123;
    }

    render() {
        const { form, getAccount, getKeyList } = this.props;
        const { getFieldDecorator } = form;
        const span = 8;
        return (
            <div>
                <Modal
                    title={'Create Account'}
                    visible
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
                            {getFieldDecorator('name', { rules: [{ required: true }] })
                                (<Input prefix={<Icon type="wallet" className="colorInput" />} />)}
                        </Form.Item>
                        <Form.Item label={'Creator'}>
                            {getFieldDecorator('creator', { rules: [{ required: true }] })
                                (
                                    <Select
                                        showSearch
                                        placeholder={'Account Used To Fund The New Account'}
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {getAccount.map(v => <Option value={v} key={v}>{v}</Option>)}
                                    </Select>
                                )}
                        </Form.Item>
                        <Form.Item label={'Owner Public Key'}>
                            {getFieldDecorator('owner', { rules: [{ required: true }] })
                                (
                                    <Select
                                        showSearch
                                        placeholder={'Owner Key'}
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {getKeyList.map(v => <Option value={v.publicKey} key={v.publicKey}>{v.name} - {v.publicKey}</Option>)}
                                    </Select>
                                )}
                        </Form.Item>
                        <Form.Item label={'Active Public Key'}>
                            {getFieldDecorator('active', { rules: [{ required: true }] })
                                (
                                    <Select
                                        showSearch
                                        placeholder={'Active Key'}
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {getKeyList.map(v => <Option value={v.publicKey} key={v.publicKey}>{v.name} - {v.publicKey}</Option>)}
                                    </Select>
                                )}
                        </Form.Item>
                        <Row type="flex" justify="space-around">
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'RAM'}>
                                    {getFieldDecorator('RAM', { initialValue: 0 })
                                        (<Input addonAfter="KB" />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'CPU'}>
                                    {getFieldDecorator('CPU', { initialValue: 0 })
                                        (<Input addonAfter="EOS" />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'NET'}>
                                    {getFieldDecorator('NET', { initialValue: 0 })
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
