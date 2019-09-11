import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

@observer
class PrivateTransactionTable extends Component {
    columns = [
        {
            title: intl.get('RedeemFromPrivateForm.PrivateAddress'),
            dataIndex: 'toPrivateAddr',
            className: 'privateAddrColumn',
        },
        {
            title: intl.get('Common.amount'),
            dataIndex: 'value',
            width: 140
        },
    ];

    rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            this.props.handleCheck(selectedRows);
        }
    };

    render() {
        return (
            <div className="selectPrivateTransactionTable" style={{ marginBottom: '24px' }}>
                <Table rowSelection={this.rowSelection} columns={this.columns} dataSource={this.props.balanceData} rowKey={record => record.toPrivateAddr} pagination={false} />
            </div>
        );
    }
}

export default PrivateTransactionTable;
