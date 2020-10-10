import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Row, Col, Table, Button, Form } from 'antd';

import style from './index.less';
import StoremanRegister from './StoremanRegister';

const StoremanRegisterForm = Form.create({ name: 'StoremanRegister' })(StoremanRegister);

@inject(stores => ({
  language: stores.languageIntl.language,
  groupListData: stores.openstoreman.groupListData,
  osmGroupListColumns: stores.languageIntl.osmGroupListColumns,
  getOpenStoremanGroupList: () => stores.openstoreman.getOpenStoremanGroupList()
}))

@observer
class GroupList extends Component {
  state = {
    withdrawVisible: false,
    stakeInVisible: false,
    validatorRegister: false,
    selectGroup: null,
  }

  componentDidMount () {
    this.props.getOpenStoremanGroupList()
    this.timer = setInterval(() => {
      this.props.getOpenStoremanGroupList()
    }, 60000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  modifyWithdraw = () => {
    this.setState({ withdrawVisible: true });
  }

  handleCancel = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  handleSend = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  handleStateToggle = selectGroup => {
    this.setState(state => ({ validatorRegister: !state.validatorRegister, selectGroup }));
  }

  getColumns () {
    const { osmGroupListColumns } = this.props;
    return [
      {
        ...osmGroupListColumns[0],
        render: (text, record) => <span>{record.groupIdName}</span>
      },
      {
        ...osmGroupListColumns[1],
      },
      {
        ...osmGroupListColumns[2],
      },
      {
        ...osmGroupListColumns[3],
      },
      {
        ...osmGroupListColumns[4],
      },
      {
        ...osmGroupListColumns[5],
        render: (text, record) =>
          <div>
            <Row>
              <Col span={8} align="center"><Button className={style.modifyTopUpBtn} onClick={() => this.handleStateToggle(record)} /></Col>
            </Row>
            <Row>
              <Col span={8} className={style.modifyBtnText} align="center">{intl.get('ValidatorNode.registerValidatorNode')}</Col>
            </Row>
          </div>
      }
    ];
  }

  render () {
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={this.props.groupListData} pagination={{ pageSize: 10, hideOnSinglePage: true }} />
        {this.state.validatorRegister && <StoremanRegisterForm group={this.state.selectGroup} onCancel={this.handleStateToggle} onSend={this.handleStateToggle} />}
      </div>
    );
  }
}

export default GroupList;
