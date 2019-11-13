import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Input, Icon, Select, Radio, Checkbox, message, Spin, Row, Col, Progress } from 'antd';
import intl from 'react-intl-universal';
import style from './index.less';

@inject(stores => ({
    language: stores.languageIntl.language,
}))

@observer
class EOSAccountCPU extends Component {
    state = {
        availableValue: 70,
        availableTotal: 100,
        networkValue: 35,
        networkTotal: 100,
        delegate: true
    }

    componentWillUnmount() {
        this.setState = (state, callback) => {
            return false;
        };
    }

    onChange = e => {
        this.setState({
            delegate: e.target.value,
        });
    };

    render() {
        let { availableValue, availableTotal, networkValue, networkTotal } = this.state;
        const { form } = this.props;
        const { getFieldDecorator } = form;
        console.log(availableValue, availableTotal, networkValue, networkTotal);
        return (
            <div className={style.EOSAccountCPU}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => availableValue + 'ms/' + availableTotal + 'ms'}
                                percent={availableValue / availableTotal * 100}
                            />
                            <ul><li><span>Available {availableValue / availableTotal * 100 + '%'}</span></li></ul>
                        </div>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#108ee9"
                                format={() => networkValue + 'ms/' + networkTotal + 'ms'}
                                percent={networkValue / networkTotal * 100}
                            />
                            <ul><li><span>All Network {networkValue / networkTotal * 100 + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        <div className={style.CPUPriceBar}>Current CPU Price : <span className={style.CPUPrice}>8 EOS/KB</span></div>
                        <div className={style.CPUForm}>
                            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                                <Form.Item className={style.type}>
                                    {getFieldDecorator('type', { initialValue: true })
                                        (<Radio.Group onChange={this.onChange}>
                                            <Radio value={true} className={style.delegateRadio}>DELEGATE</Radio>
                                            <Radio value={false}>UNDELEGATE</Radio>
                                        </Radio.Group>)}
                                </Form.Item>
                                {this.state.delegate ? (
                                    <div>
                                        <div className={style.delegateInfo}>Delegate CPU (100 EOS ~ 12ms MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('size')
                                                (<Input placeholder={'Enter CPU Amount You Want To Stake'}/>)}
                                        </Form.Item>
                                        <Form.Item>
                                            {getFieldDecorator('account')
                                                (<Input placeholder={'Enter Receiving Account'}/>)}
                                        </Form.Item>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={style.undelegateInfo}>Undelegate CPU (24ms ~ 200 EOS MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('size')
                                                (<Input placeholder={'Enter CPU Amount You Want To Unstake'} />)}
                                        </Form.Item>
                                    </div>
                                )}
                            </Form>
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default EOSAccountCPU;
