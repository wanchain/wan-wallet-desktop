import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { Button, Row, Col, Form } from 'antd';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import total from 'static/image/total.png';
import DelegationCards from './DelegationCards';
import OsmDelegateList from './OsmDelegateList';
import OsmDelegateInForm from './OsmDelegateInForm';
import OsmDelegationHistory from './OsmDelegationHistory';
import styleComm from 'containers/OpenStoreman/Storeman/index.less';

const InForm = Form.create({ name: 'OsmDelegateInForm' })(OsmDelegateInForm);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  getStoremanConf: () => stores.openstoreman.getStoremanConf(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  getOpenStoremanGroupList: () => stores.openstoreman.getOpenStoremanGroupList(),
  getStoremanDelegatorTotalIncentive: () => stores.openstoreman.getStoremanDelegatorTotalIncentive(),
}))

@observer
class Delegation extends Component {
  state = {
    delegateInFormVisible: false
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('staking.title');
    this.props.updateTransHistory();
  }

  update() {
    this.props.getStoremanConf();
    this.props.updateTransHistory();
    this.props.getOpenStoremanGroupList();
    this.props.getStoremanDelegatorTotalIncentive()
}

  componentDidMount () {
    this.update();
    this.timer = setInterval(() => {
      this.update();
    }, 60000)
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  handleStateToggle = () => {
    this.setState(state => ({ delegateInFormVisible: !state.delegateInFormVisible }));
  }

  render () {
    return (
      <div className={style.staking}>
        <Row>
          <Col>
            <DelegationCards />
          </Col>
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span className={styleComm.itemTitle}>{intl.get('staking.delegateList')}</span>
            </Col>
            <Col span={12} className="col-right">
              <Button className={style.newValidatorBtn} type="primary" shape="round" size="large" onClick={this.handleStateToggle}>{intl.get('staking.newDelegate')}</Button>
              {this.state.delegateInFormVisible &&
                <InForm onCancel={this.handleStateToggle} onSend={this.handleStateToggle} />
              }
            </Col>
          </div>
        </Row>
        <Row>
          <Col>
            <OsmDelegateList />
          </Col>
        </Row>
        <Row>
          <Col>
            <OsmDelegationHistory name="normal" />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Delegation;
