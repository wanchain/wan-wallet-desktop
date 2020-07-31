import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Row, Col } from 'antd';

import GroupList from './GroupList';
import MyStoremanList from './MyStoremanList';
import StoremanCards from './StoremanCards';
import OsmStakeHistory from './OsmStakeHistory';

import style from './index.less';
import total from 'static/image/total.png';

@inject(stores => ({
  language: stores.languageIntl.language,
  stakingList: stores.staking.stakingList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class Validator extends Component {
  state = {
    validatorRegister: false,
  }

  constructor(props) {
    super(props);
    this.props.updateTransHistory();
    this.props.changeTitle('stormen.title');
  }

  componentDidMount() {
    this.props.updateStakeInfo();
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateStakeInfo();
    }, 20000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return (
      <div className="staking">
        <Row>
          <StoremanCards />
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span className={style.itemTitle}>Open Group List</span>
            </Col>
          </div>
        </Row>
        <Row>
          <GroupList />
        </Row>
        <Row>
          <div className="historyCon">
            <Col span={12} className="col-left">
              <img src={total} /><span className={style.itemTitle}>Storeman List</span>
            </Col>
          </div>
        </Row>
        <Row>
          <MyStoremanList />
        </Row>
        <Row>
          <OsmStakeHistory name="normal" />
        </Row>
      </div>
    );
  }
}

export default Validator;
