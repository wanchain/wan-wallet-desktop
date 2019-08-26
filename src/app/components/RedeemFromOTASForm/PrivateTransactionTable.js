import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';

@observer
class PrivateTransactionTable extends Component {
    columns = [
        {
            title: 'Value',
            dataIndex: 'value',
            width: 140
        },
        {
            title: 'OTA',
            dataIndex: 'toOTA',
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
                <Table rowSelection={this.rowSelection} columns={this.columns} dataSource={this.props.balanceData} rowKey={record => record.toOTA} pagination={false} style={{ minWidth: 1350 }} />
            </div>
        );
    }
}

export default PrivateTransactionTable;
