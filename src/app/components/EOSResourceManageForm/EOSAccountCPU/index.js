import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Input, Icon, Select, Radio, message, Spin, Row, Col, Progress, InputNumber } from 'antd';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import style from './index.less';
import ConfirmForm from '../EOSResourceManageConfirmForm';
import { EOSPATH } from 'utils/settings';

const { Option } = Select;
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
@inject(stores => ({
    language: stores.languageIntl.language,
    getAccount: stores.eosAddress.getAccount,
    selectedAccount: stores.eosAddress.selectedAccount,
    keyInfo: stores.eosAddress.keyInfo,
}))

@observer
class EOSAccountCPU extends Component {
    state = {
        type: 'delegate',
        maxDelegateEOS: 100,
        maxDelegateCPU: 12,
        maxUndelegateEOS: 200,
        maxUndelegateCPU: 24,
        confirmVisible: false,
        formData: {},
        networkValue: 35,
        networkTotal: 100,
    }

    componentWillUnmount() {
        this.setState = (state, callback) => {
            return false;
        };
    }

    onChange = e => {
        this.setState({
            type: e.target.value,
        });
    };

    checkDelegateSize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            callback();
        } else {
            callback(intl.get('Invalid size value'));
        }
    }

    checkUndelegateSize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            callback();
        } else {
            callback(intl.get('Invalid size value'));
        }
    }

    handleOk = () => {
        const { form, selectedAccount } = this.props;
        form.validateFields(async (err) => {
            if (err) {
                return;
            };
            let values = form.getFieldsValue();
            if (values.type === 'delegate') {
                if (!selectedAccount.balance) {
                    message.warn('No sufficient balance');
                    return;
                }
                const cost = new BigNumber(values.delegateSize).times(this.props.price);
                if (new BigNumber(values.delegateSize).gt(this.state.maxDelegateCPU)) {
                    message.warn('Over the maximum size of RAM');
                } else if (cost.gt(this.state.maxDelegateEOS)) {
                    message.warn('Over the maximum size of EOS');
                } else if (cost.gt(selectedAccount.balance)) {
                    message.warn('No sufficient balance');
                } else {
                    this.setState({
                        formData: {
                            account: values.account,
                            amount: values.size,
                            type: values.type,
                        },
                        confirmVisible: true
                    });
                }
            } else if (values.type === 'undelegate') {
                if (new BigNumber(values.undelegateSize).gt(this.state.maxUndelegateCPU)) {
                    message.warn('Over the maximum size of RAM');
                } else if (new BigNumber(values.undelegateSize).times(this.props.price).gt(this.state.maxUndelegateEOS)) {
                    message.warn('Over the maximum size of EOS');
                } else if (new BigNumber(values.undelegateSize).gt(selectedAccount.cpuAvailable)) {
                    message.warn('No sufficient RAM to sell');
                } else {
                    console.log('can undelegate');
                    this.setState({
                        formData: {
                            amount: values.undelegateSize,
                            type: values.type,
                        },
                        confirmVisible: true
                    });
                }
            }
        })
    }

    onCancel = () => {
        this.props.onCancel();
    }

    handleConfirmCancel = () => {
        this.setState({
            confirmVisible: false
        });
    }

    sendTrans = (obj) => {
    }

    render() {
        let { networkValue, networkTotal } = this.state;
        let { cpuAvailable, cpuTotal, cpuBalance } = this.props.selectedAccount;
        const { form } = this.props;
        const { getFieldDecorator } = form;
        return (
            <div className={style.EOSAccountCPU}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => cpuAvailable + 'ms/' + cpuTotal + 'ms'}
                                percent={Number(new BigNumber(cpuAvailable).div(cpuTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>Available {new BigNumber(cpuAvailable).div(cpuTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#108ee9"
                                format={() => networkValue + 'ms/' + networkTotal + 'ms'}
                                percent={Number(new BigNumber(networkValue).div(networkTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>All Network {new BigNumber(networkValue).div(networkTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        {/* <div className={style.CPUPriceBar}>Current CPU Price : <span className={style.CPUPrice}>{new BigNumber(this.props.price)} EOS/ms</span></div>
                        <div className={style.CPUForm}>
                            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                                <Form.Item className={style.type}>
                                    {getFieldDecorator('type', { initialValue: 'delegate' })
                                        (<Radio.Group onChange={this.onChange}>
                                            <Radio value={'delegate'} className={style.delegateRadio}>DELEGATE</Radio>
                                            <Radio value={'undelegate'}>UNDELEGATE</Radio>
                                        </Radio.Group>)}
                                </Form.Item>
                                {this.state.type === 'delegate' ? (
                                    <div>
                                        <div className={style.delegateInfo}>Delegate CPU ({this.state.maxDelegateEOS} EOS ~ {this.state.maxDelegateCPU} ms MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('delegateSize', { rules: [{ required: true, message: 'Invalid size', validator: this.checkDelegateSize }] })
                                                (<InputNumber placeholder={'Enter EOS Amount You Want To Delegate'} precision={4} min={0.0001} max={this.state.maxDelegateEOS} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                        </Form.Item>
                                        <Form.Item>
                                            {getFieldDecorator('account', {
                                                rules: [{ required: true }],
                                            })(
                                                <Select
                                                    showSearch
                                                    allowClear
                                                    placeholder={'Select Receiving Account'}
                                                    optionFilterProp="children"
                                                >
                                                    {this.props.getAccount.map((item, index) => <Option value={item} key={item}>{item}</Option>)}
                                                </Select>
                                            )}
                                        </Form.Item>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={style.undelegateInfo}>Undelegate CPU ({this.state.maxUndelegateCPU} ms ~ {this.state.maxUndelegateEOS} EOS MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('undelegateSize', { rules: [{ required: true, message: 'Invalid size', validator: this.checkUndelegateSize }] })
                                                (<InputNumber placeholder={'Enter EOS Amount You Want To Undelegate'} precision={4} min={0.0001} max={this.state.maxUndelegateCPU} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                        </Form.Item>
                                    </div>
                                )}
                            </Form>
                        </div> */}
                    </Col>
                </Row>
                <div className={style.customFooter}>
                    <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>
                    <Button key="submit" type="primary" onClick={this.handleOk}>{intl.get('Common.ok')}</Button>
                </div>
                <Confirm visible={this.state.confirmVisible} onCancel={this.handleConfirmCancel} formData={this.state.formData} sendTrans={this.sendTrans} />
            </div>
        );
    }
}

export default EOSAccountCPU;
