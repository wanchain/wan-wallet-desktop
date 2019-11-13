import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';
@inject(stores => ({
    language: stores.languageIntl.language,
}))

@observer
class EOSAddAccountList extends Component {
    columns = () => [
        {
            title: 'ACCOUNTS',
            dataIndex: 'account',
        }
    ];

    accounts = [{
        account: 'EOS-Account-1'
    }, {
        account: 'EOS-Account-2'
    }, {
        account: 'EOS-Account-3'
    }, {
        account: 'EOS-Account-4'
    }];

    rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(selectedRowKeys, selectedRows);
        }
    };

    render() {
        return (
            <div style={{ marginBottom: '24px' }}>
                <Table rowSelection={this.rowSelection} columns={this.columns()} dataSource={this.accounts} rowKey={record => record.account} pagination={false} />
            </div>
        );
    }
}

export default EOSAddAccountList;
