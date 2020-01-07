import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Tooltip, Icon, Form, message } from 'antd';
import style from './index.less';
import SendEOSNormalTrans from 'components/SendNormalTrans/SendEOSNormalTrans';
import EOSResourceManageForm from 'components/EOSResourceManageForm';

@inject(stores => ({
    language: stores.languageIntl.language,
    getAccountListWithBalance: stores.eosAddress.getAccountListWithBalance,
    updateSelectedAccount: obj => stores.eosAddress.updateSelectedAccount(obj),
}))

@observer
class EOSAccountList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showManageResourceForm: false,
            prices: {
                ram: 0,
                cpu: 0,
                net: 0,
            }
        }
    }

    columns = [
        {
            dataIndex: 'account',
            editable: true,
            width: '15%',
            render: (text, record) => <div className="addrText">
                <p className="address">{text}</p>
                <Tooltip className={style.copyIcon} placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={() => this.copy(text)} /></Tooltip>
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
            align: 'center',
            render: (text, record) => {
                if (Object.prototype.hasOwnProperty.call(record, 'address')) {
                    return (
                        <div>
                            <Button type="primary" onClick={() => { this.showManageResourceForm(record); }}>{intl.get('EOSAccountList.manageResource')}</Button>
                            <SendEOSNormalTrans record={record} />
                        </div>
                    )
                } else {
                    return (
                        <div>
                            <Button type="primary" style={{ color: '#fff' }} disabled onClick={() => { this.showManageResourceForm(record); }}>{intl.get('EOSAccountList.manageResource')}</Button>
                            <SendEOSNormalTrans record={record} buttonDisabled={true} />
                        </div>
                    )
                }
            }
        }
    ];

    copy = (text) => {
        wand.writeText(text);
        message.success(intl.get('CopyAndQrcode.copySuccessfully'));
    }

    showManageResourceForm = (record) => {
        this.props.updateSelectedAccount(record);
        wand.request('address_getRamPrice', (err, res) => {
            if (!err) {
                this.setState({
                    prices: {
                        ram: res,
                        cpu: 0,
                        net: 0,
                    }
                });
            } else {
                message.error(intl.get('EOSAccountList.getResourcePriceFailed'));
            }
        });
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
        const { getAccountListWithBalance } = this.props;
        this.props.language && this.columns.forEach(col => {
            col.title = intl.get(`EosAccount.${col.dataIndex}`)
        });
        return (
            <div>
                <Table className="content-wrap" rowKey="account" pagination={false} columns={this.columns} dataSource={getAccountListWithBalance} />
                {this.state.showManageResourceForm && <EOSResourceManageForm prices={this.state.prices} onCancel={this.onCancel} />}
            </div>
        );
    }
}

export default EOSAccountList;
