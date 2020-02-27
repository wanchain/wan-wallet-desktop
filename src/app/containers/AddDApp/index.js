import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { Checkbox, Button, Form, Card, Modal, message } from 'antd';
import style from './index.less';
import AddDAppForm from 'components/AddDAppForm';

const DAppAddForm = Form.create({ name: 'AddDAppForm' })(AddDAppForm);

@inject(stores => ({
  language: stores.languageIntl.language,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  addCustomDApp: (obj) => stores.dapps.addCustomDApp(obj),
}))

@observer
class AddDApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddForm: false,
      addDisabled: true,
    }
    this.props.changeTitle('DApp.addTitle');
  }

  checkChange = (e) => {
    this.setState({ addDisabled: !e.target.checked });
  }

  onShowAddForm = () => {
    this.setState({ showAddForm: true });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.form.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        let ret = this.props.addCustomDApp(values);
        if (!ret) {
          message.error(intl.get('DApp.addFailed'));
        } else {
          console.log('add dapp success');
          message.success(intl.get('DApp.addSuccess'));
          this.props.onClose();
        }
      }
    });
  };

  render() {
    return (
      <Modal
        title={intl.get('DApp.addTitle')}
        visible
        bodyStyle={{ width: '100%', padding: '0px' }}
        centered={true}
        destroyOnClose={true}
        closable={false}
        onCancel={this.props.onClose}
        footer={!this.state.showAddForm ? [
          <Button key="back" className="cancel" onClick={this.props.onClose}>{intl.get('Common.cancel')}</Button>,
          <Button key="next" onClick={this.onShowAddForm} disabled={this.state.addDisabled} className={style.button + ' ant-btn ant-btn-primary'}>{intl.get('Common.next')}</Button>
        ] : [
          <Button key="back" className="cancel" onClick={this.props.onClose}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" disabled={false} type="primary" htmlType="submit" onClick={this.handleSubmit}>{intl.get('Common.ok')}</Button>
        ]}
      >
        <div className={style.root}>
          {
            !this.state.showAddForm &&
            <Card title={intl.get('DApp.termOfServiceTitle')} bordered={false}>
              <div className={style.termOfService}>
                <h3 className={style.section}>{intl.get('DApp.termOfService1')}</h3>
                <h3 className={style.section}>{intl.get('DApp.termOfService2')}</h3>
                <h3 className={style.section}>{intl.get('DApp.termOfService3')}</h3>
                <h3 className={style.section}>{intl.get('DApp.termOfService4')}</h3>
              </div>
              <div className={style.checkBox}>
                <Checkbox onChange={this.checkChange}>{intl.get('DApp.termOfServiceAgree')}</Checkbox>
              </div>
            </Card>
          }
          {
            this.state.showAddForm &&
            <Card bordered={false}>
              <DAppAddForm onCancel={this.onCancel} onOk={this.onOk} handleSubmit={this.handleSubmit} wrappedComponentRef={(form) => { this.form = form; return this.form; }} />
            </Card>
          }
        </div>
      </Modal>
    );
  }
}

export default AddDApp;
