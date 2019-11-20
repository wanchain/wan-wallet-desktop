import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Input, Icon, Select, Radio, Checkbox, message, Spin, Row, Col, Progress, InputNumber } from 'antd';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import style from './index.less';
import { values } from 'mobx';
import ConfirmForm from '../EOSResourceManageConfirmForm';

const { Option } = Select;

const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
@inject(stores => ({
    language: stores.languageIntl.language,
    getAccount: stores.eosAddress.getAccount,
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
        availableValue: 70,
        availableTotal: 100,
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
        if (typeof value === 'number') {
            callback();
        } else {
            callback(intl.get('Invalid size value'));
        }
    }

    checkSellSize = (rule, value, callback) => {
        if (typeof value === 'number') {
            callback();
        } else {
            callback(intl.get('Invalid size value'));
        }
    }

    handleOk = () => {
        console.log('handleOk');
        const { form } = this.props;
        form.validateFields(async (err) => {
            if (err) {
                return;
            };
            console.log('values: ', form.getFieldsValue()); // {type: true, size: 12, account: "cuiqiangtes2"}
            this.setState({
                formData: form.getFieldsValue(),
                confirmVisible: true
            });
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

    render() {
        let { availableValue, availableTotal, networkValue, networkTotal } = this.state;
        let { balance, publicKey, ramAvailable, ramTotal } = this.props.record;
        // console.log(Object.keys(this.props.record));
        console.log(this.props.getAccount);
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
                                // format={() => ramAvailable + 'KB/' + ramTotal + 'KB'}
                                format={() => '80 KB/100 KB'} // Fake data
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
                                            {getFieldDecorator('size', { rules: [{ required: true, message: 'Invalid size', validator: this.checkBuySize }] })
                                                (<InputNumber placeholder={'Enter RAM Size You Want To Buy'} min={0} max={this.state.maxBuyRAM} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                                        </Form.Item>
                                        <Form.Item>
                                            {getFieldDecorator('account', {
                                                rules: [{ required: true }],
                                            })(
                                                <Select
                                                    showSearch
                                                    allowClear
                                                    placeholder={'Enter Receiving Account'}
                                                    optionFilterProp="children"
                                                >
                                                    {this.props.getAccount.map((item, index) => <Option value={item} key={item}>{item}</Option>)}
                                                </Select>
                                            )}
                                        </Form.Item>
                                    </div>
                                ) : (
                                        <div>
                                            <div className={style.sellInfo}>Sell RAM ({this.state.maxSellRAM} KB ~ {this.state.maxSellEOS} MAX)</div>
                                            <Form.Item>
                                                {getFieldDecorator('size', { rules: [{ required: true, message: 'Invalid size', validator: this.checkSellSize }] })
                                                    (<InputNumber placeholder={'Enter RAM Size You Want To Sell'} min={0} max={this.state.maxSellRAM} prefix={<Icon type="credit-card" className="colorInput" />} />)}
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
                <Confirm visible={this.state.confirmVisible} onCancel={this.handleConfirmCancel} formData={this.state.formData} />
            </div>
        );
    }
}

export default EOSAccountRAM;
