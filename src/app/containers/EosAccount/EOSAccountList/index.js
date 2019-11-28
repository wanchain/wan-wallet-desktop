import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Tooltip, Icon, Form, message } from 'antd';
import style from './index.less';
import SendEOSNormalTrans from 'components/SendNormalTrans/SendEOSNormalTrans';
import EOSResourceManageForm from 'components/EOSResourceManageForm';

@inject(stores => ({
    language: stores.languageIntl.language,
    getAccountList: stores.eosAddress.getAccountList,
    updateSelectedAccount: obj => stores.eosAddress.updateSelectedAccount(obj),
}))

@observer
class EOSAccountList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showManageResourceForm: false,
        }
    }

    columns = [
        {
            dataIndex: 'account',
            editable: true,
            width: '15%',
            render: (text, record) => <div className="addrText">
                <p className="address">{text}</p>
                <Tooltip className={style.copyIcon} placement="bottom" title={intl.get('title.copy')}><Icon type="copy" onClick={() => this.copy(text)} /></Tooltip>
            </div>
        },
        {
            dataIndex: 'ramAvailable',
            width: '15%',
            render: (text, record) => {
                return Number(text).toFixed(3);
            }
        },
        {
            dataIndex: 'cpuAvailable',
            width: '15%',
            render: (text, record) => {
                return Number(text).toFixed(3);
            }
        },
        {
            dataIndex: 'netAvailable',
            width: '15%',
            render: (text, record) => {
                return Number(text).toFixed(3);
            }
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
                <SendEOSNormalTrans record={record}/>
            </div>)
        }
    ];

    copy = (text) => {
        wand.writeText(text);
        message.success(intl.get('CopyAndQrcode.copySuccessfully'));
    }

    showManageResourceForm = (record) => {
        this.props.updateSelectedAccount(record);
        this.setState({
            showManageResourceForm: true
        });
    }

    onCancel = () => {
        this.setState({
            showManageResourceForm: false,
        });
    }

    render() {
        const { getAccountList } = this.props;
        this.props.language && this.columns.forEach(col => {
            col.title = intl.get(`EosAccount.${col.dataIndex}`)
        })

        return (
            <div>
                <Table className="content-wrap" rowKey="account" pagination={false} columns={this.columns} dataSource={getAccountList} />
                {this.state.showManageResourceForm && <EOSResourceManageForm onCancel={this.onCancel} />}
            </div>
        );
    }
}

export default EOSAccountList;
