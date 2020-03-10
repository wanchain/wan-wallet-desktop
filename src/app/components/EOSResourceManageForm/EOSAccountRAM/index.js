import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Icon, Select, Radio, message, Row, Col, Progress, InputNumber, AutoComplete, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import style from './index.less';
import ConfirmForm from '../EOSResourceManageConfirmForm';
import { getWalletIdByType } from 'utils/helper';

const { Option } = Select;
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
@inject(stores => ({
    language: stores.languageIntl.language,
    getAccount: stores.eosAddress.getAccount,
    selectedAccount: stores.eosAddress.selectedAccount,
    keyInfo: stores.eosAddress.keyInfo,
}))

@observer
class EOSAccountRAM extends Component {
    state = {
        type: 'buy',
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

    checkBuySize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            if (new BigNumber(value).times(this.props.price).gte(0.0001)) {
                callback();
            } else {
                callback(intl.get('EOSResourceManageForm.tooSmallSize'));
            }
        } else {
            callback(intl.get('EOSResourceManageForm.invalidSize'));
        }
    }

    checkSellSize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            if (new BigNumber(value).times(this.props.price).gte(0.0001)) {
                callback();
            } else {
                callback(intl.get('EOSResourceManageForm.tooSmallSize'));
            }
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
        const { form, selectedAccount, price } = this.props;
        form.validateFields(async (err) => {
            if (err) {
                return;
            };
            let values = form.getFieldsValue();
            if (values.type === 'buy') {
                if (!selectedAccount.balance) {
                    message.warn(intl.get('EOSResourceManageForm.noSufficientBalance'));
                    return;
                }
                const cost = new BigNumber(values.buySize).times(price);
                if (price !== 0 && new BigNumber(values.buySize).gt(new BigNumber(selectedAccount.balance).div(price))) {
                    message.warn(intl.get('EOSResourceManageForm.oversizeRAM'));
                } else if (price !== 0 && cost.gt(selectedAccount.balance)) {
                    message.warn(intl.get('EOSResourceManageForm.noSufficientBalance'));
                } else {
                    this.setState({
                        formData: {
                            account: values.account,
                            amount: values.buySize,
                            type: values.type,
                        },
                        confirmVisible: true
                    });
                }
            } else if (values.type === 'sell') {
                if (new BigNumber(values.sellSize).gt(selectedAccount.ramAvailable)) {
                    message.warn(intl.get('EOSResourceManageForm.noSufficientRAM'));
                } else {
                    this.setState({
                        formData: {
                            amount: values.sellSize,
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
              walletID: getWalletIdByType(key)
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
            action: obj.type === 'buy' ? 'buyrambytes' : 'sellram',
            from: selectedAccount.account,
            to: obj.type === 'buy' ? obj.account : selectedAccount.account,
            ramBytes: obj.amount,
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
                        confirmVisible: false,
                    });
                    this.props.onCancel();
                    message.success(intl.get('EOSResourceManageForm.txSentSuccess'));
                } else {
                    message.error(intl.get('EOSResourceManageForm.txSentFailed'));
                    console.log(res.result);
                }
            } else {
                message.error(intl.get('EOSResourceManageForm.txSentFailed'));
                console.log('Transaction sent failed:', err);
            }
            this.setState({
                loading: false
            });
        });
    }

    render() {
        const { form, price, selectedAccount, getAccount } = this.props;
        let { ramAvailable, ramTotal, balance } = selectedAccount;
        const { getFieldDecorator } = form;
        return (
            <div className={style.EOSAccountRAM}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => new BigNumber(ramAvailable).toFixed(3).toString() + 'KB / ' + new BigNumber(ramTotal).toFixed(3).toString() + 'KB'}
                                percent={Number(new BigNumber(ramAvailable).div(ramTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>{intl.get('EOSResourceManageForm.available')} {new BigNumber(ramAvailable).div(ramTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        <div className={style.RAMPriceBar}>{intl.get('EOSResourceManageForm.currentRAMPrice')} : <span className={style.RAMPrice}>{Number(new BigNumber(price).toFixed(8)) === 0 ? '0' : new BigNumber(price).toFixed(8).toString(10)} EOS/KB</span></div>
                        <div className={style.RAMForm}>
                            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                                <Form.Item className={style.type}>
                                    {getFieldDecorator('type', { initialValue: 'buy' })
                                        (<Radio.Group onChange={this.onChange}>
                                            <Radio value={'buy'} className={style.buyRadio}>{intl.get('EOSResourceManageForm.buy')}</Radio>
                                            <Radio value={'sell'}>{intl.get('EOSResourceManageForm.sell')}</Radio>
                                        </Radio.Group>)}
                                </Form.Item>
                                {this.state.type === 'buy' ? (
                                    <div>
                                        <div className={style.buyInfo}>{intl.get('EOSResourceManageForm.buyRAM')} (MAX {price === 0 ? 'N/A' : new BigNumber(balance).div(price).toFixed(4).toString(10)} KB)</div>
                                        <Form.Item>
                                            {getFieldDecorator('buySize', { rules: [{ required: true, message: intl.get('EOSResourceManageForm.invalidSize'), validator: this.checkBuySize }] })
                                                (<InputNumber placeholder={intl.get('EOSResourceManageForm.enterRAMSize')} min={0} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                        </Form.Item>
                                        <div className={style.buyInfo}>{intl.get('EOSResourceManageForm.selectReceivingAccount')}</div>
                                        <Form.Item>
                                            {getFieldDecorator('account', {
                                                rules: [{ required: true, validator: this.checkName }]
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
                                    </div>
                                ) : (
                                    <div>
                                        <div className={style.sellInfo}>{intl.get('EOSResourceManageForm.sellRAM')} (MAX {new BigNumber(ramAvailable).toFixed(4).toString(10)} KB)</div>
                                        <Form.Item>
                                            {getFieldDecorator('sellSize', { rules: [{ required: true, message: intl.get('EOSResourceManageForm.invalidSize'), validator: this.checkSellSize }] })
                                                (<InputNumber placeholder={intl.get('EOSResourceManageForm.enterRAMSize')} min={0} max={ramAvailable} prefix={<Icon type="credit-card" className="colorInput" />} />)}
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

export default EOSAccountRAM;
