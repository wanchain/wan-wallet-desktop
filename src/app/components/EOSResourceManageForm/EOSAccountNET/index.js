import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Form, Input, Icon, Select, Radio, Checkbox, message, Spin, Row, Col, Progress } from 'antd';
import intl from 'react-intl-universal';
import style from './index.less';

@inject(stores => ({
    language: stores.languageIntl.language,
}))

@observer
class EOSAccountNET extends Component {
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
            <div className={style.EOSAccountNET}>
                <Row>
                    <Col span={8}>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#87d068"
                                format={() => availableValue + 'KB/' + availableTotal + 'KB'}
                                percent={availableValue / availableTotal * 100}
                            />
                            <ul><li><span>Available {availableValue / availableTotal * 100 + '%'}</span></li></ul>
                        </div>
                        <div className={style.progressContainer}>
                            <Progress
                                type="circle"
                                strokeColor="#108ee9"
                                format={() => networkValue + 'GB/' + networkTotal + 'GB'}
                                percent={networkValue / networkTotal * 100}
                            />
                            <ul><li><span>All Network {networkValue / networkTotal * 100 + '%'}</span></li></ul>
                        </div>
                    </Col>
                    <Col span={16}>
                        <div className={style.NETPriceBar}>Current NET Price : <span className={style.NETPrice}>8 EOS/KB</span></div>
                        <div className={style.NETForm}>
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
                                        <div className={style.delegateInfo}>Delegate NET (100 EOS ~ 12KB MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('size')
                                                (<Input placeholder={'Enter NET Amount You Want To Stake'}/>)}
                                        </Form.Item>
                                        <Form.Item>
                                            {getFieldDecorator('account')
                                                (<Input placeholder={'Enter Receiving Account'}/>)}
                                        </Form.Item>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={style.undelegateInfo}>Undelegate NET (24KB ~ 200 EOS MAX)</div>
                                        <Form.Item>
                                            {getFieldDecorator('size')
                                                (<Input placeholder={'Enter NET Amount You Want To Unstake'} />)}
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

export default EOSAccountNET;
