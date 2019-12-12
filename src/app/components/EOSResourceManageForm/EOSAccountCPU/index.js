import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Icon, Select, Radio, message, Spin, Row, Col, Progress, InputNumber } from 'antd';
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
        confirmVisible: false,
        formData: {},
        loading: false,
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

    handleOk = () => {
        const { form, selectedAccount } = this.props;
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
                const count = cost.div(this.props.price);
                if (count.gt(selectedAccount.cpuAvailable)) {
                    message.warn(intl.get('EOSResourceManageForm.noSufficientCPUtoUnstake'));
                } else {
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

    getPathAndIdByPublicKey = key => {
        const { keyInfo } = this.props;
        let obj = {};
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
    }

    sendTrans = (obj) => {
        const { selectedAccount } = this.props;
        let pathAndId = this.getPathAndIdByPublicKey(selectedAccount.publicKey);
        let params = {
            action: obj.type === 'delegate' ? 'delegatebw' : 'undelegatebw',
            from: selectedAccount.account,
            to: obj.type === 'delegate' ? obj.account : selectedAccount.account,
            netAmount: 0,
            cpuAmount: obj.amount,
            BIP44Path: `${EOSPATH}${pathAndId.path}`,
            walletID: pathAndId.walletID,
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

    render() {
        let { cpuAvailable, cpuTotal, balance } = this.props.selectedAccount;
        const { form, price } = this.props;
        const { getFieldDecorator } = form;
        return (
            <div className={style.EOSAccountCPU}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => new BigNumber(cpuAvailable).toFixed(3).toString() + 'ms / ' + new BigNumber(cpuTotal).toFixed(3).toString() + 'ms'}
                                percent={Number(new BigNumber(cpuAvailable).div(cpuTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>{intl.get('EOSResourceManageForm.available')} {new BigNumber(cpuAvailable).div(cpuTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        <div className={style.CPUPriceBar}>{intl.get('EOSResourceManageForm.currentCPUPrice')} : <span className={style.CPUPrice}>{price.toString(10)} EOS/ms</span></div>
                        <div className={style.CPUForm}>
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
                                        <div className={style.delegateInfo}>{intl.get('EOSResourceManageForm.stakeCPU')} ({balance} EOS MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('delegateSize', { rules: [{ required: true, message: intl.get('EOSResourceManageForm.invalidSize'), validator: this.checkDelegateSize }] })
                                                (<InputNumber placeholder={intl.get('EOSResourceManageForm.enterEOSAmount')} precision={4} min={0.0001} max={balance} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                        </Form.Item>
                                        <Form.Item>
                                            {getFieldDecorator('account', {
                                                rules: [{ required: true }],
                                            })(
                                                <Select
                                                    showSearch
                                                    allowClear
                                                    placeholder={intl.get('EOSResourceManageForm.selectReceivingAccount')}
                                                    optionFilterProp="children"
                                                >
                                                    {this.props.getAccount.map((item, index) => <Option value={item} key={item}>{item}</Option>)}
                                                </Select>
                                            )}
                                        </Form.Item>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={style.undelegateInfo}>{intl.get('EOSResourceManageForm.unstakeCPU')} ({new BigNumber(cpuAvailable).times(price).toString(10)} EOS MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('undelegateSize', { rules: [{ required: true, message: intl.get('EOSResourceManageForm.invalidSize'), validator: this.checkUndelegateSize }] })
                                                (<InputNumber placeholder={intl.get('EOSResourceManageForm.enterEOSAmount')} precision={4} min={0.0001} max={new BigNumber(cpuAvailable).times(price).toNumber()} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                        </Form.Item>
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

export default EOSAccountCPU;
