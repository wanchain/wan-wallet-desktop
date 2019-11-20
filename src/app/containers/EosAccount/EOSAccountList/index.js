import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Tooltip, Icon, Form, message } from 'antd';
import style from './index.less';
import { EOSPATH, WALLETID } from 'utils/settings';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { EditableFormRow, EditableCell } from 'components/Rename';
import SendEOSNormalTrans from 'components/SendNormalTrans/SendEOSNormalTrans';
import EOSResourceManageForm from 'components/EOSResourceManageForm';

const CHAINTYPE = 'EOS';

@inject(stores => ({
    language: stores.languageIntl.language,
    getAccountList: stores.eosAddress.getAccountList,
}))

@observer
class EOSAccountList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showManageResourceForm: false,
            record: {}
        }
    }

    columns = [
        {
            dataIndex: 'account',
            editable: true,
            width: '30%',
            render: (text, record) => <div className="addrText">
                <p className="address">{text}</p>
                <Tooltip className={style.copyIcon} placement="bottom" title={intl.get('title.copy')}><Icon type="copy" onClick={() => this.copy(text)} /></Tooltip>
            </div>
        },
        {
            dataIndex: 'ramAvailable',
            width: '10%',
            render: balance => balance
        },
        {
            dataIndex: 'cpuAvailable',
            width: '10%',
        },
        {
            dataIndex: 'netAvailable',
            width: '10%',
        },
        {
            dataIndex: 'balance',
            width: '15%',
        },
        {
            dataIndex: 'action',
            width: '25%',
            render: (text, record) => (<div>
                <Button type="primary" onClick={() => { this.showManageResourceForm(record); }}>Manage Resources</Button>
                <SendEOSNormalTrans />
            </div>)
        }
    ];

    copy = (text) => {
        wand.writeText(text);
        message.success(intl.get('CopyAndQrcode.copySuccessfully'));
    }

    showManageResourceForm = (record) => {
        console.log('showManageResourceForm', record);
        this.setState({
            showManageResourceForm: true,
            record: record
        });
    }

    onCancel = () => {
        this.setState({
            showManageResourceForm: false,
        });
    }

    render() {
        const { getAccountList } = this.props;
        // console.log('getAccountList:', getAccountList);
        this.props.language && this.columns.forEach(col => {
            col.title = intl.get(`EosAccount.${col.dataIndex}`)
        })

        return (
            <div>
                <Table className="content-wrap" rowKey="account" pagination={false} columns={this.columns} dataSource={getAccountList} />
                {this.state.showManageResourceForm && <EOSResourceManageForm record={this.state.record} onCancel={this.onCancel} />}
            </div>
        );
    }
}

export default EOSAccountList;
