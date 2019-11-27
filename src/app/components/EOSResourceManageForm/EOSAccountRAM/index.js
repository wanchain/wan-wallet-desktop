import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Input, Icon, Select, Radio, message, Row, Col, Progress, InputNumber } from 'antd';
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
        maxBuyEOS: 100,
        maxBuyRAM: 12,
        maxSellEOS: 200,
        maxSellRAM: 24,
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

    checkBuySize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            if (new BigNumber(value).times(this.props.price).gte(0.0001)) {
                callback();
            } else {
                callback(intl.get('Too small size'));
            }
        } else {
            callback(intl.get('Invalid size value'));
        }
    }

    checkSellSize = (rule, value, callback) => {
        if (typeof value === 'number' && value !== 0) {
            if (new BigNumber(value).times(this.props.price).gte(0.0001)) {
                callback();
            } else {
                callback(intl.get('Too small size'));
            }
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
            if (values.type === 'buy') {
                if (!selectedAccount.balance) {
                    message.warn('No sufficient balance');
                    return;
                }
                const cost = new BigNumber(values.buySize).times(this.props.price);
                if (new BigNumber(values.buySize).gt(this.state.maxBuyRAM)) {
                    message.warn('Over the maximum size of RAM');
                } else if (cost.gt(this.state.maxBuyEOS)) {
                    message.warn('Over the maximum size of EOS');
                } else if (cost.gt(selectedAccount.balance)) {
                    message.warn('No sufficient balance');
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
                if (new BigNumber(values.sellSize).gt(this.state.maxSellRAM)) {
                    message.warn('Over the maximum size of RAM');
                } else if (new BigNumber(values.sellSize).times(this.props.price).gt(this.state.maxSellEOS)) {
                    message.warn('Over the maximum size of EOS');
                } else if (new BigNumber(values.sellSize).gt(selectedAccount.ramAvailable)) {
                    message.warn('No sufficient RAM to sell');
                } else {
                    console.log('can sell');
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
        console.log('params:', params);
        wand.request('transaction_EOSNormal', params, (err, res) => {
            if (!err) {
                if (res.code) {
                    this.setState({
                        confirmVisible: false
                    });
                } else {
                    message.error('Transaction failed');
                    console.log(res.result);
                }
            } else {
                message.error('Transaction failed');
                console.log('Transaction failed:', err);
            }
        });
    }

    render() {
        let { networkValue, networkTotal } = this.state;
        let { ramAvailable, ramTotal } = this.props.selectedAccount;
        const { form } = this.props;
        const { getFieldDecorator } = form;
        return (
            <div className={style.EOSAccountRAM}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => ramAvailable + 'KB/' + ramTotal + 'KB'}
                                percent={Number(new BigNumber(ramAvailable).div(ramTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>Available {new BigNumber(ramAvailable).div(ramTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#108ee9"
                                format={() => networkValue + 'GB/' + networkTotal + 'GB'}
                                percent={Number(new BigNumber(networkValue).div(networkTotal).times(100).toFixed(2))}
                            />
                            <ul><li><span>All Network {new BigNumber(networkValue).div(networkTotal).times(100).toFixed(2) + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        <div className={style.RAMPriceBar}>Current RAM Price : <span className={style.RAMPrice}>{new BigNumber(this.props.price).toFixed(4)} EOS/KB</span></div>
                        <div className={style.RAMForm}>
                            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                                <Form.Item className={style.type}>
                                    {getFieldDecorator('type', { initialValue: 'buy' })
                                        (<Radio.Group onChange={this.onChange}>
                                            <Radio value={'buy'} className={style.buyRadio}>BUY</Radio>
                                            <Radio value={'sell'}>SELL</Radio>
                                        </Radio.Group>)}
                                </Form.Item>
                                {this.state.type === 'buy' ? (
                                    <div>
                                        <div className={style.buyInfo}>Buy RAM ({this.state.maxBuyEOS} EOS ~ {this.state.maxBuyRAM} KB MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('buySize', { rules: [{ required: true, message: 'Invalid size', validator: this.checkBuySize }] })
                                                (<InputNumber placeholder={'Enter RAM Size You Want To Buy ( KB )'} min={0} max={this.state.maxBuyRAM} prefix={<Icon type="credit-card" className="colorInput" />} />)}
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
                                            <div className={style.sellInfo}>Sell RAM ({this.state.maxSellRAM} KB ~ {this.state.maxSellEOS} EOS MAX)</div>
                                            <Form.Item>
                                                {getFieldDecorator('sellSize', { rules: [{ required: true, message: 'Invalid size', validator: this.checkSellSize }] })
                                                    (<InputNumber placeholder={'Enter RAM Size You Want To Sell ( KB )'} min={0} max={this.state.maxSellRAM} prefix={<Icon type="credit-card" className="colorInput" />} />)}
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
                <Confirm visible={this.state.confirmVisible} onCancel={this.handleConfirmCancel} formData={this.state.formData} sendTrans={this.sendTrans} />
            </div>
        );
    }
}

export default EOSAccountRAM;
