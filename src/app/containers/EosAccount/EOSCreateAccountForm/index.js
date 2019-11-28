import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Select, Row, Col, Icon, message, Tooltip } from 'antd';
import style from './index.less';
import { BigNumber } from 'bignumber.js';
import { EOSPATH } from 'utils/settings';

const { Option } = Select;
const DEFAULT_ACCOUNT_NAME = 'eosnewyorkio';
@inject(stores => ({
    language: stores.languageIntl.language,
    getAccount: stores.eosAddress.getAccount,
    getKeyList: stores.eosAddress.getKeyList,
    getAccountList: stores.eosAddress.getAccountList,
    keyInfo: stores.eosAddress.keyInfo,
    accountInfo: stores.eosAddress.accountInfo,
}))

@observer
class EOSCreateAccountForm extends Component {
    state = {
        ramDefaultValue: 3,
        cpuDefaultValue: 0,
        netDefaultValue: 0,
        prices: {
            ram: 0,
            cpu: 0,
            net: 0
        }
    }

    componentDidMount() {
        if (this.props.getAccount.length === 0) {
            console.log('No account');
            return;
        }
        wand.request('address_getEOSResourcePrice', { account: this.props.getAccount[0] || DEFAULT_ACCOUNT_NAME }, (err, res) => {
            console.log('prices:', res);
            if (!err) {
                this.setState({
                    prices: res
                });
            } else {
                console.log('Get resource price failed:', err);
                message.error('Get resource price failed');
            }
        });
    }

    handleOk = () => {
        const { form, getAccountList, getAccount, accountInfo, keyInfo } = this.props;
        form.validateFields(async (err) => {
            if (err) { return; };
            let values = form.getFieldsValue();
            if (getAccount.indexOf(values.name) !== -1) {
                message.error('Duplicate account name');
            }
            if (new BigNumber(values.CPU).plus(values.NET).gt(0)) {
                const balance = this.getBalanceByAccount(values.creator);
                if (!(typeof balance === 'number' && new BigNumber(values.CPU).plus(values.NET).lte(balance))) {
                    message.error('No sufficient balance');
                    return false;
                }
            }
            let params = {
                action: 'newaccount',
                accountName: values.name,
                from: values.creator,
                ownerPublicKey: values.owner,
                activePublicKey: values.active,
                ramBytes: values.RAM,
                cpuAmount: values.CPU,
                netAmount: values.NET,
                BIP44Path: accountInfo[values.creator].path,
                walletID: 1,
            };
            console.log('params:', params);
            wand.request('transaction_EOSNormal', params, (err, res) => {
                console.log(err, res);
                if (!err) {
                    if (res.code) {
                        this.props.handleCancel();
                    } else {
                        message.error('Create account fialed');
                    }
                } else {
                    console.log('Create account fialed:', err);
                    message.error('Create account fialed');
                }
            });
        })
    }

    handleCancel = () => {
        this.props.handleCancel();
    }

    getBalanceByAccount = (name) => {
        const { getAccountList } = this.props;
        let index = getAccountList.findIndex((item) => item.account === name);
        return getAccountList[index].balance;
    }

    checkNumber = (rule, value, callback) => {
        if (value >= 0) {
            callback();
        } else {
            callback(intl.get('Invalid'));
        }
    }

    checkName = (rule, value, callback) => {
        let reg = /[A-Z]/g;
        if (reg.test(value)) {
            const str = 'Invalid name';
            callback(str);
        } else {
            callback();
        }
    }

    cpuChange = e => {
        this.setState({
            cpuDefaultValue: e.target.value
        });
    }

    netChange = e => {
        this.setState({
            netDefaultValue: e.target.value
        });
    }

    render() {
        const { form, getAccount, getKeyList } = this.props;
        const { ramDefaultValue, cpuDefaultValue, netDefaultValue } = this.state;
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
                            {getFieldDecorator('name', { rules: [{ required: true, validator: this.checkName }] })
                                (<Input placeholder={'Name'} prefix={<Icon type="wallet" className="colorInput" />} />)}
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
                                        {getKeyList.map(v => <Option value={v.publicKey} key={v.publicKey}><Tooltip placement="right" title={`${v.name} - ${v.publicKey}`}>{v.name} - {v.publicKey}</Tooltip></Option>)}
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
                                        {getKeyList.map(v => <Option value={v.publicKey} key={v.publicKey}><Tooltip placement="right" title={`${v.name} - ${v.publicKey}`}>{v.name} - {v.publicKey}</Tooltip></Option>)}
                                    </Select>
                                )}
                        </Form.Item>
                        <Row type="flex" justify="space-around">
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'RAM'}>
                                    {getFieldDecorator('RAM', { initialValue: ramDefaultValue, rules: [{ message: 'Invalid value, at least 3KB', validator: this.checkNumber }] })
                                        (<Input type="number" min={3} addonAfter="KB" />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={`CPU (≈${new BigNumber(cpuDefaultValue).div(this.state.prices.cpu).toFixed(4).toString()} ms)`}>
                                    {getFieldDecorator('CPU', { initialValue: cpuDefaultValue, rules: [{ message: 'Invalid value', validator: this.checkNumber }] })
                                        (<Input type="number" min={0} addonAfter="EOS" onChange={this.cpuChange} />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={`NET (≈${new BigNumber(netDefaultValue).div(this.state.prices.net).toFixed(4).toString()} KB)`}>
                                    {getFieldDecorator('NET', { initialValue: netDefaultValue, rules: [{ message: 'Invalid value', validator: this.checkNumber }] })
                                        (<Input type="number" min={0} addonAfter="EOS" onChange={this.netChange} />)}
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
