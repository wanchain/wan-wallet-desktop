import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { Checkbox, Button, Form, Card } from 'antd';
import style from './index.less';
import AddDAppForm from 'components/AddDAppForm';

const DAppAddForm = Form.create({ name: 'AddDAppForm' })(AddDAppForm);

@inject(stores => ({
  language: stores.languageIntl.language,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
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
    console.log('check:', e.target.checked);
    this.setState({ addDisabled: !e.target.checked });
  }

  onCancel = () => {
    this.setState({ showAddForm: false });
  }

  onOk = () => {
    this.setState({ showAddForm: false });
  }

  render() {
    return (
      <div className={style.root}>
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
          <div className={style.buttonParent}>
            <Button onClick={() => { this.setState({ showAddForm: true }) }} disabled={this.state.addDisabled} className={style.button + ' ant-btn ant-btn-primary'}>{intl.get('DApp.addButton')}</Button>
          </div>
          {this.state.showAddForm && <DAppAddForm onCancel={this.onCancel} onOk={this.onOk} />}
        </Card>
      </div>
    );
  }
}

export default AddDApp;
