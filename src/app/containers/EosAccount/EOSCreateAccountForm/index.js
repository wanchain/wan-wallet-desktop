import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Select, Row, Col, Icon, message } from 'antd';
import style from './index.less';
import { BigNumber } from 'bignumber.js';
import { EOSPATH } from 'utils/settings';

const { Option } = Select;
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
    handleOk = () => {
        const { form, getAccountList, getAccount, accountInfo, keyInfo } = this.props;
        form.validateFields(async (err) => {
            if (err) { return; };
            let values = form.getFieldsValue();
            console.log('values: ', values);
            if (getAccount.indexOf(values.name) !== -1) {
                message.error('Duplicate account name');
            }
            if (new BigNumber(values.CPU).plus(values.NET).gt(0)) {
                const balance = this.getBalanceByAccount(values.creator);
                console.log(balance);
                if (!(typeof balance === 'number' && new BigNumber(values.CPU).plus(values.NET).lte(balance))) {
                    message.error('No sufficient balance');
                    return false;
                }
            }
            console.log('accountInfo:', accountInfo);
            console.log('keyInfo:', keyInfo);
            // let pathAndId = this.getPathAndIdByPublicKey(values.active);
            // console.log('-----pathAndId2222222222------', pathAndId);
            console.log('path:', accountInfo[values.creator].path);
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
                /* BIP44Path: `${EOSPATH}${pathAndId.path}`,
                walletID: pathAndId.walletID, */
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

    /* getPathAndIdByPublicKey = key => {
        const { keyInfo } = this.props;
        let obj = null;
        Object.keys(keyInfo).find(t => {
          if (keyInfo[t][key]) {
            obj = {
              path: keyInfo[t][key].path,
              walletID: key === 'normal' ? 1 : (key === 'import' ? 5 : 1)
            }
            return true;
          } else {
            return false;
          }
        });
        return obj;
    } */

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
                                    {getFieldDecorator('RAM', { initialValue: 3, rules: [{ message: 'Invalid value, at least 3KB', validator: this.checkNumber }] })
                                        (<Input type="number" min={3} addonAfter="KB" />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'CPU'}>
                                    {getFieldDecorator('CPU', { initialValue: 0, rules: [{ message: 'Invalid value', validator: this.checkNumber }] })
                                        (<Input type="number" addonAfter="EOS" />)}
                                </Form.Item>
                            </Col>
                            <Col className={style.colGap} span={span}>
                                <Form.Item label={'NET'}>
                                    {getFieldDecorator('NET', { initialValue: 0, rules: [{ message: 'Invalid value', validator: this.checkNumber }] })
                                        (<Input type="number" addonAfter="EOS" />)}
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
