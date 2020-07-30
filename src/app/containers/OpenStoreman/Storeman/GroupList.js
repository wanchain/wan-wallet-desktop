import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Row, Col, Table, Button, Form } from 'antd';

import style from './index.less';
import StoremanRegister from './StoremanRegister';
import Cell from 'components/Staking/Common/Cell';
import Validator from 'components/Staking/Common/Validator';
import { formatNum } from 'utils/support';

const StoremanRegisterForm = Form.create({ name: 'StoremanRegister' })(StoremanRegister);

@inject(stores => ({
  language: stores.languageIntl.language,
  myValidatorList: stores.staking.myValidatorList,
  osmGroupListColumns: stores.languageIntl.osmGroupListColumns,
  getValidatorsInfo: () => stores.staking.getValidatorsInfo()
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
    this.timer = setInterval(() => {
      this.props.getValidatorsInfo()
    }, 3000)
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
        ...osmGroupListColumns[0]
      },
      {
        ...osmGroupListColumns[1],
        // render: principal => <Cell title={formatNum(Number(principal.value).toFixed(0))} bottom={intl.get('staking.fromDaysAgo1') + principal.days + intl.get('staking.fromDaysAgo2')} />,
      },
      {
        ...osmGroupListColumns[2],
        // render: entrustment => <Cell title={formatNum(Number(entrustment.value).toFixed(0))} />,
      },
      {
        ...osmGroupListColumns[3],
        // render: img => <img className={style['table-arrow']} src={img} />,
      },
      {
        ...osmGroupListColumns[4],
        // render: validator => <Validator img={validator.img} name={validator.name} title={validator.address}/>,
      },
      {
        ...osmGroupListColumns[5],
        // render: img => <img className={style['table-arrow']} src={img} />,
      },
      {
        ...osmGroupListColumns[6],
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
    const fakeData = [
      {
        key: 1,
        groupId: '1',
        startTime: '2020/7/9',
        endTime: '2020/8/9',
        crosschain: 'WAN / BTC',
        currDeposit: '20000',
        delegationFee: '0.1%',
        action: 'Register',
      }
    ]
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={fakeData} pagination={{ pageSize: 10, hideOnSinglePage: true }} />
        {this.state.validatorRegister && <StoremanRegisterForm group={this.state.selectGroup} onCancel={this.handleStateToggle} onSend={this.handleStateToggle} />}
      </div>
    );
  }
}

export default GroupList;
