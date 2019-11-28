import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Icon, Table, Spin } from 'antd';
import { EOSPATH } from 'utils/settings';
import style from './index.less';

@inject(stores => ({
    language: stores.languageIntl.language,
    updateAccounts: (arr, type) => stores.eosAddress.updateAccounts(arr, type),
}))

@observer
class EOSAddAccountForm extends Component {
    state = {
        selections: []
    };

    componentDidMount () {
        this.setState({
            selections: this.props.selectedRow.accounts
        })
    }

    handleOk = () => {
        let { form, selectedRow } = this.props;
        form.validateFields(err => {
            if (err) {
                console.log('handleNext', err);
                return;
            };
            let from = form.getFieldValue('from');
            let accounts = form.getFieldValue('accounts');
            let obj = Object.assign({}, selectedRow);
            obj.path = `${EOSPATH}${obj.path}`;
            obj.accounts = accounts;
            this.props.updateAccounts(obj, 'normal');
            this.props.handleCancel();
        });
    }

    handleCancel = () => {
        this.props.handleCancel();
    }

    selectionChange = (arr) => {
        let { form } = this.props;
        form.setFieldsValue({
            accounts: arr
        });
        this.setState({
            selections: arr
        });
    }

    columns = () => [
        {
            title: 'ACCOUNT',
            dataIndex: 'account',
        }
    ];

    render() {
        const { form, accounts, selectedRow, spin } = this.props;
        const { selections } = this.state;
        const { getFieldDecorator } = form;
        const rowSelection = {
            onChange: (selectedRowKeys, selectedRows) => {
                this.selectionChange(selectedRowKeys);
            },
            selectedRowKeys: selections
        };
        return (
            <div>
                <Modal
                    title="Import Account"
                    visible={true}
                    wrapClassName={style.EOSAddAccountForm}
                    destroyOnClose={true}
                    closable={false}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="back" className="cancel" onClick={this.handleCancel}>{'Cancel'}</Button>,
                        <Button key="submit" type="primary" onClick={this.handleOk}>{'OK'}</Button>,
                    ]}
                >
                    <Spin spinning={spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
                        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                            <Form.Item label={'Searched Public Key'}>
                                {getFieldDecorator('from', { initialValue: selectedRow.publicKey })
                                    (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
                            </Form.Item>
                            <div style={{ marginBottom: '24px' }}>
                                <Table rowSelection={rowSelection} columns={this.columns()} rowKey="account" dataSource={this.props.accounts} rowKey={record => record.account} pagination={false} />
                            </div>
                            <Form.Item>
                                {getFieldDecorator('accounts', { rules: [{ type: 'array', required: true, message: 'Please select at least one account' }] })
                                    (<Input hidden={true} disabled={true} />)}
                            </Form.Item>
                        </Form>
                    </Spin>
                </Modal>
            </div>
        );
    }
}

export default EOSAddAccountForm;
