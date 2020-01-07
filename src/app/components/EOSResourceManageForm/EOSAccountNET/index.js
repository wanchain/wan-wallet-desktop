import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Icon, Select, Radio, message, Spin, Row, Col, Progress, InputNumber, AutoComplete, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import style from './index.less';
import ConfirmForm from '../EOSResourceManageConfirmForm';
import { WALLETID } from 'utils/settings';

const { Option } = Select;
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);

@inject(stores => ({
    language: stores.languageIntl.language,
    getAccount: stores.eosAddress.getAccount,
    selectedAccount: stores.eosAddress.selectedAccount,
    keyInfo: stores.eosAddress.keyInfo,
}))

@observer
class EOSAccountNET extends Component {
    state = {
        type: 'delegate',
        confirmVisible: false,
        formData: {},
        loading: false,
        accountInfo: [],
        showHolder: false,
    }

    componentWillUnmount() {
        this.setState = (state, callback) => {
            return false;
        };
    }

    onChange = e => {
        this.setState({
            type: e.target.value,
            showHolder: false,
        });
    };

    checkDelegateSize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            callback();
        } else {
            callback(intl.get('EOSResourceManageForm.invalidSize'));
        }
    }

    checkUndelegateSize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            callback();
        } else {
            callback(intl.get('EOSResourceManageForm.invalidSize'));
        }
    }

    checkName = (rule, value, callback) => {
        let reg = /^[a-z][1-5a-z\.]{11}$/g;
        if (reg.test(value)) {
            callback();
        } else {
            callback(intl.get('EOSCreateAccountForm.invalidNameFormat'));
        }
    }

    handleOk = () => {
        const { form, selectedAccount, accountStakeInfo } = this.props;
        form.validateFields(async (err) => {
            if (err) {
                return;
            };
            let values = form.getFieldsValue();
            if (values.type === 'delegate') {
                if (!selectedAccount.balance) {
                    message.warn(intl.get('EOSResourceManageForm.noSufficientBalance'));
                    return;
                }
                const cost = new BigNumber(values.delegateSize);
                if (cost.gt(selectedAccount.balance)) {
                    message.warn(intl.get('EOSResourceManageForm.noSufficientEOSToStake'));
                } else {
                    this.setState({
                        formData: {
                            account: values.account,
                            amount: values.delegateSize,
                            type: values.type,
                        },
                        confirmVisible: true
                    });
                }
            } else if (values.type === 'undelegate') {
                const cost = new BigNumber(values.undelegateSize);
                let stakedIndex = accountStakeInfo.findIndex((item) => {
                    return item.to === values.holderAccount
                });
                if (stakedIndex !== -1) {
                    let max = parseFloat(accountStakeInfo[stakedIndex].net_weight);
                    if (Number(max) && max && cost.gt(max)) {
                        message.warn(intl.get('EOSResourceManageForm.noSufficientNetToUnstake'));
                        return;
                    }
                }
                this.setState({
                    formData: {
                        account: values.holderAccount,
                        amount: values.undelegateSize,
                        type: values.type,
                    },
                    confirmVisible: true
                });
            }
        });
    }

    onCancel = () => {
        this.props.onCancel();
    }

    handleConfirmCancel = () => {
        this.setState({
            confirmVisible: false
        });
    }

    getPathAndIdByPublicKey = key => {
        const { keyInfo } = this.props;
        let obj = {};
        Object.keys(keyInfo).find(t => {
          if (keyInfo[t][key]) {
            obj = {
              path: keyInfo[t][key].path,
              walletID: key === 'normal' ? WALLETID.NATIVE : (key === 'import' ? WALLETID.KEYSTOREID : WALLETID.NATIVE)
            }
            return true;
          } else {
            return false;
          }
        });
        return obj;
    }

    sendTrans = (obj) => {
        const { selectedAccount } = this.props;
        let params = {
            action: obj.type === 'delegate' ? 'delegatebw' : 'undelegatebw',
            from: selectedAccount.account,
            to: obj.account,
            netAmount: obj.amount,
            cpuAmount: 0,
            BIP44Path: selectedAccount.path,
            walletID: selectedAccount.id,
        };
        this.setState({
            loading: true
        });
        wand.request('transaction_EOSNormal', params, (err, res) => {
            if (!err) {
                if (res.code) {
                    this.setState({
                        confirmVisible: false
                    });
                    this.props.onCancel();
                    message.success(intl.get('EOSResourceManageForm.txSentSuccess'));
                } else {
                    message.error(intl.get('EOSResourceManageForm.txSentFailed'));
                    console.log(res.result);
                }
            } else {
                message.error(intl.get('EOSResourceManageForm.txSentFailed'));
                console.log(intl.get('EOSResourceManageForm.txSentFailed'), err);
            }
            this.setState({
                loading: false
            });
        });
    }

    onHolderChange = (value, opts) => {
        let { form } = this.props;
        let reg = /^[a-z][1-5a-z\.]{11}$/g;
        if (reg.test(value)) {
            this.setState({
                showHolder: true
            });
            if (value !== undefined) {
                let index = opts.key.indexOf(':');
                if (index !== -1) {
                    let net_weight = parseFloat(opts.key.substring(index + 1));
                    if (!Number.isNaN(net_weight)) {
                        setTimeout(() => {
                            form.setFieldsValue({
                                undelegateSize: net_weight
                            });
                        }, 0);
                    }
                }
            }
        } else {
            this.setState({
                showHolder: false
            });
        }
    }

    render() {
        const { form, getAccount, selectedAccount } = this.props;
        let { netAvailable, netTotal, balance } = this.props.selectedAccount;
        const { getFieldDecorator } = form;
        return (
            <div className={style.EOSAccountNET}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => new BigNumber(netAvailable).toFixed(3).toString() + 'KB / ' + new BigNumber(netTotal).toFixed(3).toString() + 'KB'}
                                percent={Number(new BigNumber(netAvailable).div(netTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>{intl.get('EOSResourceManageForm.available')} {new BigNumber(netAvailable).div(netTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        <div className={style.NETForm}>
                            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                                <Form.Item className={style.type}>
                                    {getFieldDecorator('type', { initialValue: 'delegate' })
                                        (<Radio.Group onChange={this.onChange}>
                                            <Radio value={'delegate'} className={style.delegateRadio}>{intl.get('EOSResourceManageForm.stake')}</Radio>
                                            <Radio value={'undelegate'}>{intl.get('EOSResourceManageForm.unstake')}</Radio>
                                        </Radio.Group>)}
                                </Form.Item>
                                {this.state.type === 'delegate' ? (
                                    <div>
                                        <div className={style.delegateInfo}>{intl.get('EOSResourceManageForm.selectReceivingAccount')}</div>
                                        <Form.Item>
                                            {getFieldDecorator('account', {
                                                rules: [{ required: true, validator: this.checkName }],
                                            })(
                                                <AutoComplete
                                                    dataSource={getAccount.map(v => <Option value={v} key={v}><Tooltip placement="right" title={`${v}`}>{v}</Tooltip></Option>)}
                                                    placeholder={intl.get('EOSResourceManageForm.selectReceivingAccount')}
                                                    allowClear={true}
                                                    optionLabelProp={'value'}
                                                    filterOption={(input, option) => {
                                                        return option.props.children.props.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }}
                                                />
                                            )}
                                        </Form.Item>
                                        <div className={style.delegateInfo}>{intl.get('EOSResourceManageForm.stakeNet')} (MAX {balance} EOS)</div>
                                        <Form.Item>
                                            {getFieldDecorator('delegateSize', { rules: [{ required: true, message: intl.get('EOSResourceManageForm.invalidSize'), validator: this.checkDelegateSize }] })
                                                (<InputNumber placeholder={intl.get('EOSResourceManageForm.enterEOSAmount')} precision={4} min={0} max={balance} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                        </Form.Item>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={style.undelegateInfo}>{intl.get('EOSResourceManageForm.selectHolderAccount')}</div>
                                        <Form.Item>
                                            {getFieldDecorator('holderAccount', {
                                                rules: [{ required: true, validator: this.checkName }],
                                            })(
                                                <AutoComplete
                                                    dataSource={this.props.accountStakeInfo.map((v, index) => <Option value={v.to} key={`${index}:${v.net_weight}`}><Tooltip placement="right" title={`${v.to} - Max ${v.net_weight}`}>{v.to} - Max {v.net_weight}</Tooltip></Option>)}
                                                    placeholder={intl.get('EOSResourceManageForm.selectHolderAccount')}
                                                    allowClear={true}
                                                    optionLabelProp={'value'}
                                                    onChange={this.onHolderChange}
                                                    filterOption={(input, option) => {
                                                        return option.props.children.props.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }}
                                                />
                                            )}
                                        </Form.Item>
                                        {
                                            this.state.showHolder &&
                                            <div>
                                                <div className={style.undelegateInfo}>{`${intl.get('EOSResourceManageForm.unstakeNET')} (EOS)`}</div>
                                                <Form.Item>
                                                    {getFieldDecorator('undelegateSize', { rules: [{ required: true, message: intl.get('EOSResourceManageForm.invalidSize'), validator: this.checkUndelegateSize }] })
                                                        (<InputNumber placeholder={intl.get('EOSResourceManageForm.enterEOSAmount')} precision={4} min={0.0001} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                                </Form.Item>
                                            </div>
                                        }
                                    </div>
                                )}
                            </Form>
                        </div>
                    </Col>
                </Row>
                <div className={style.customFooter}>
                    <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>
                    <Button key="submit" type="primary" onClick={this.handleOk}>{intl.get('Common.ok')}</Button>
                </div>
                {
                    this.state.confirmVisible && <Confirm onCancel={this.handleConfirmCancel} formData={this.state.formData} sendTrans={this.sendTrans} loading={this.state.loading}/>
                }
            </div>
        );
    }
}

export default EOSAccountNET;
