import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observable, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Icon, Checkbox } from 'antd';
import style from './index.less';

class EOSAddAccountForm extends Component {
    handleOk () {
        console.log('handleOk')
    }

    handleCancel = () => {
        console.log('handleCancel');
        console.log(this);
        this.props.handleCancel();
    }

    render() {
        const { form } = this.props;
        const { getFieldDecorator } = form;
        return (
            <div>
                <Modal
                    title="Add Account"
                    visible ={this.props.showModal}
                    destroyOnClose={true}
                    closable={false}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="back" className="cancel" onClick={this.handleCancel}>{'Cancel'}</Button>,
                        <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleOk}>{'OK'}</Button>,
                    ]}
                >
                    <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                        <Form.Item label={'Searched Public Key'}>
                            {getFieldDecorator('from', { initialValue: 'EOS55hDyA8VrcyAQXDyk54YekWpKMyPufocfp1F5USjfjPD3rdCiM ' })
                            (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
                        </Form.Item>
                        {/* <Form.Item label={'Select Account'}>
                            {getFieldDecorator('account', { initialValue: 'EOS55hDyA8VrcyAQXDyk54YekWpKMyPufocfp1F5USjfjPD3rdCiM ' })
                            (<Checkbox.Group disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
                        </Form.Item> */}
                    </Form>
                </Modal>
            </div>
        );
    }
}

export default EOSAddAccountForm;
