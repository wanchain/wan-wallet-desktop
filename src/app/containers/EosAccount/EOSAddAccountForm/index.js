import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observable, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Icon, Checkbox } from 'antd';
import EOSAddAccountList from './EOSAddAccountList';
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
                        <Button key="submit" type="primary" onClick={this.handleOk}>{'OK'}</Button>,
                    ]}
                >
                    <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                        <Form.Item label={'Searched Public Key'}>
                            {getFieldDecorator('from', { initialValue: this.props.selectedPublicKey })
                            (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
                        </Form.Item>
                        <EOSAddAccountList/>
                    </Form>
                </Modal>
            </div>
        );
    }
}

export default EOSAddAccountForm;
