import React, { Component } from 'react';
import { Table } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

@observer
class PrivateTransactionTable extends Component {
    columns = [
        {
            title: 'Value',
            dataIndex: 'value',
            width: 100
        },
        {
            title: 'OTA',
            dataIndex: 'toOTA',
        },
    ];

    rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            // console.log(selectedRows);
            this.props.handleCheck(selectedRows);
        }
    };

    render() {
        return (
            <div className="selectPrivateTransactionTable" style={{ marginBottom: '24px' }}>
                <Table rowSelection={this.rowSelection} columns={this.columns} dataSource={this.props.balanceData} rowKey={record => record.toOTA} pagination={false} scroll={{ y: 300 }} /* size="small" */ />
            </div>
        );
    }
}

export default PrivateTransactionTable;
