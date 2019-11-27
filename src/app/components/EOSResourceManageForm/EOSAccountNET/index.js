import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Input, Icon, Select, Radio, message, Spin, Row, Col, Progress, InputNumber } from 'antd';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import style from './index.less';
import ConfirmForm from '../EOSResourceManageConfirmForm';

const { Option } = Select;
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
@inject(stores => ({
    language: stores.languageIntl.language,
    getAccount: stores.eosAddress.getAccount,
    selectedAccount: stores.eosAddress.selectedAccount,
}))

@observer
class EOSAccountNET extends Component {
    state = {
        type: 'delegate',
        maxDelegateEOS: 100,
        maxDelegateNET: 12,
        maxUndelegateEOS: 200,
        maxUndelegateNET: 24,
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
                if (new BigNumber(values.delegateSize).gt(this.state.maxDelegateNET)) {
                    message.warn('Over the maximum size of NET');
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
                if (new BigNumber(values.undelegateSize).gt(this.state.maxUndelegateNET)) {
                    message.warn('Over the maximum size of NET');
                } else if (new BigNumber(values.undelegateSize).times(this.props.price).gt(this.state.maxUndelegateEOS)) {
                    message.warn('Over the maximum size of EOS');
                } else if (new BigNumber(values.undelegateSize).gt(selectedAccount.netAvailable)) {
                    message.warn('No sufficient NET to sell');
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
        /* if (obj.type === 'sell') return;
        let params = {
            action: 'buyrambytes',
            from: this.props.selectedAccount.account,
            to: obj.account,
            ramBytes: obj.amount
        };
        console.log('params:', params);
        wand.request('transaction_EOSNormal', params, (err, res) => {
            console.log(err, res);
            if (!err) {
                if (res.code) {
                    this.setState({
                        confirmVisible: false
                    });
                } else {
                    message.error('Buy RAM fialed');
                    console.log(res.result);
                }
            } else {
                console.log('Buy RAM fialed:', err);
                message.error('Buy RAM fialed');
            }
        }); */
    }

    render() {
        let { networkValue, networkTotal } = this.state;
        let { netAvailable, netTotal, netBalance } = this.props.selectedAccount;
        const { form } = this.props;
        const { getFieldDecorator } = form;
        console.log(netAvailable, netTotal, netBalance);
        return (
            <div className={style.EOSAccountNET}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => netAvailable + 'KB/' + netTotal + 'KB'}
                                percent={Number(new BigNumber(netAvailable).div(netTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>Available {new BigNumber(netAvailable).div(netTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#108ee9"
                                format={() => networkValue + 'KB/' + networkTotal + 'KB'}
                                percent={Number(new BigNumber(networkValue).div(networkTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>All Network {new BigNumber(networkValue).div(networkTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        {/* <div className={style.NETPriceBar}>Current NET Price : <span className={style.NETPrice}>{new BigNumber(this.props.price)} EOS/KB</span></div>
                        <div className={style.NETForm}>
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
                                        <div className={style.delegateInfo}>Delegate NET ({this.state.maxDelegateEOS} EOS ~ {this.state.maxDelegateNET} KB MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('delegateSize', { rules: [{ required: true, message: 'Invalid size', validator: this.checkDelegateSize }] })
                                                (<InputNumber placeholder={'Enter NET Amount You Want To Stake'} min={0} max={this.state.maxDelegateEOS} prefix={<Icon type="credit-card" className="colorInput" />} />)}
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
                                        <div className={style.undelegateInfo}>Undelegate NET ({this.state.maxUndelegateNET} KB ~ {this.state.maxUndelegateEOS} EOS MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('undelegateSize', { rules: [{ required: true, message: 'Invalid size', validator: this.checkUndelegateSize }] })
                                                (<InputNumber placeholder={'Enter NET Amount You Want To Unstake'} min={0} max={this.state.maxUndelegateNET} prefix={<Icon type="credit-card" className="colorInput" />} />)}
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

export default EOSAccountNET;
