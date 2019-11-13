import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Tabs, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
import intl from 'react-intl-universal';
import EOSAccountRAM from './EOSAccountRAM';
import EOSAccountCPU from './EOSAccountCPU';
import EOSAccountNET from './EOSAccountNET';
import style from './index.less';
const RAM = Form.create({ name: 'EOSAccountRAM' })(EOSAccountRAM);
const CPU = Form.create({ name: 'EOSAccountCPU' })(EOSAccountCPU);
const NET = Form.create({ name: 'EOSAccountNET' })(EOSAccountNET);
const { TabPane } = Tabs;

@inject(stores => ({
    language: stores.languageIntl.language,
    settings: stores.session.settings,
}))

@observer
class EOSResourceManageForm extends Component {
    state = {
    }

    componentWillUnmount() {
        this.setState = (state, callback) => {
            return false;
        };
    }

    onChange = () => {
        console.log('onChange');
    }

    onCancel = () => {
        this.props.onCancel();
    }

    handleSave = () => {
    }

    render() {
        return (
            <div className={style.EOSResourceManageForm}>
                <Modal
                    visible
                    wrapClassName={style.EOSResourceManageFormModal}
                    destroyOnClose={true}
                    closable={false}
                    title={'EOS Resource Management'}
                    onCancel={this.onCancel}
                    footer={[
                        <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
                        <Button key="submit" type="primary" onClick={this.handleSave}>{intl.get('Common.ok')}</Button>,
                    ]}
                >
                    <Spin spinning={false} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
                        <Tabs className={style.tabs} defaultActiveKey={'1'} onChange={this.onChange} tabBarStyle={{ textAlign: 'center' }} tabBarGutter={120}>
                            <TabPane tab="RAM" key="1">
                                <RAM/>
                            </TabPane>
                            <TabPane tab="CPU" key="2">
                                <CPU/>
                            </TabPane>
                            <TabPane tab="NET" key="3">
                                <NET/>
                            </TabPane>
                        </Tabs>
                    </Spin>
                </Modal>
            </div>
        );
    }
}

export default EOSResourceManageForm;
