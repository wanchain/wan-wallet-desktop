import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Icon, Select, Radio, message, Row, Col, Progress, InputNumber } from 'antd';
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
class EOSAccountRAM extends Component {
    state = {
        type: 'buy',
        maxBuyRAM: 0,
        confirmVisible: false,
        formData: {},
    }

    componentWillUnmount() {
        this.setState = (state, callback) => {
            return false;
        };
    }

    componentDidMount() {
        const { selectedAccount, price } = this.props;
        this.setState({
            maxBuyRAM: price === 0 ? null : new BigNumber(selectedAccount.balance).div(price).toString(10)
        });
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

    handleOk = () => {
        const { form, selectedAccount } = this.props;
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
                const cost = new BigNumber(values.buySize).times(this.props.price);
                if (this.props.price !== 0 && new BigNumber(values.buySize).gt(this.state.maxBuyRAM)) {
                    message.warn(intl.get('EOSResourceManageForm.oversizeRAM'));
                } else if (this.props.price !== 0 && cost.gt(selectedAccount.balance)) {
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
            action: obj.type === 'buy' ? 'buyrambytes' : 'sellram',
            from: selectedAccount.account,
            to: obj.type === 'buy' ? obj.account : selectedAccount.account,
            ramBytes: obj.amount,
            BIP44Path: `${EOSPATH}${pathAndId.path}`,
            walletID: pathAndId.walletID,
        };
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
                console.log('Transaction sent failed:', err);
            }
        });
    }

    render() {
        let { ramAvailable, ramTotal } = this.props.selectedAccount;
        const { form, price } = this.props;
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
                        <div className={style.RAMPriceBar}>{intl.get('EOSResourceManageForm.currentRAMPrice')} : <span className={style.RAMPrice}>{price.toFixed(4).toString(10)} EOS/KB</span></div>
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
                                        <div className={style.buyInfo}>{intl.get('EOSResourceManageForm.buyRAM')} ({this.state.maxBuyRAM} KB MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('buySize', { rules: [{ required: true, message: intl.get('EOSResourceManageForm.invalidSize'), validator: this.checkBuySize }] })
                                                (<InputNumber placeholder={intl.get('EOSResourceManageForm.enterRAMSize')} min={0} /* max={this.state.maxBuyRAM} */ prefix={<Icon type="credit-card" className="colorInput" />} />)}
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
                                        <div className={style.sellInfo}>{intl.get('EOSResourceManageForm.sellRAM')} ({ramAvailable} KB MAX)</div>
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
                    this.state.confirmVisible && <Confirm onCancel={this.handleConfirmCancel} formData={this.state.formData} sendTrans={this.sendTrans} />
                }
            </div>
        );
    }
}

export default EOSAccountRAM;
