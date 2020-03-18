import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Button, Form, Input, Icon, Table, Spin, message } from 'antd';
import { EOSPATH, WALLETID } from 'utils/settings';
import style from './index.less';

@inject(stores => ({
    language: stores.languageIntl.language,
    chainId: stores.session.chainId,
    setImportedUserAccount: (...args) => stores.eosAddress.setImportedUserAccount(...args),
    getUserKeyFromDB: () => stores.eosAddress.getUserKeyFromDB(),
}))

@observer
class EOSImportAccountForm extends Component {
    state = {
        selections: []
    };

    handleOk = () => {
        let { form, selectedRow } = this.props;
        form.validateFields(err => {
            if (err) {
                message.warn(intl.get('EOSKeyPairList.invalidFormData'));
                return;
            };
            const accounts = form.getFieldValue('accounts');
            const path = selectedRow.path.includes(EOSPATH) ? `${selectedRow.path}` : `${EOSPATH}${selectedRow.path}`;
            const network = this.props.chainId === 1 ? `mainnet` : `testnet`;
            const wid = selectedRow.wid;
            this.props.setImportedUserAccount(accounts, network, wid, path, selectedRow.publicKey).then(() => {
                this.props.getUserKeyFromDB();
            }).catch(() => {
                message.error(intl.get('EOSKeyPairList.updateAccountInfoFailed'));
            });
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
            title: intl.get('EosAccount.account'),
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
                    title={intl.get('EOSKeyPairList.importAccount')}
                    visible={true}
                    wrapClassName={style.EOSImportAccountForm}
                    destroyOnClose={true}
                    closable={false}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="back" className="cancel" onClick={this.handleCancel}>{intl.get('Common.cancel')}</Button>,
                        <Button key="submit" type="primary" onClick={this.handleOk}>{intl.get('Common.ok')}</Button>,
                    ]}
                >
                    <Spin spinning={spin} size="large" /* tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} />} */ className="loadingData">
                        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
                            <Form.Item label={intl.get('EOSKeyPairList.publicKey')}>
                                {getFieldDecorator('from', { initialValue: selectedRow.publicKey })
                                    (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
                            </Form.Item>
                            <div style={{ marginBottom: '24px' }}>
                                <Table rowSelection={rowSelection} columns={this.columns()} rowKey="account" dataSource={accounts} rowKey={record => record.account} pagination={false} />
                            </div>
                            <Form.Item>
                                {getFieldDecorator('accounts', { rules: [{ type: 'array', required: true, message: intl.get('EOSKeyPairList.selectOneAccount') }] })
                                    (<Input hidden={true} disabled={true} />)}
                            </Form.Item>
                            <div className={style.tip}>{intl.get('EOSKeyPairList.tipText')}</div>
                        </Form>
                    </Spin>
                </Modal>
            </div>
        );
    }
}

export default EOSImportAccountForm;
