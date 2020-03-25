import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { observer, inject } from 'mobx-react';
import { Row, Button, Col, Input, Avatar, Select, message } from 'antd';

import style from './index.less';
import { dAppSort } from 'utils/helper';
import totalImg from 'static/image/wan.png';
import { DAPPORDERING } from 'utils/settings';
import DAppInfo from 'components/DApp/DAppInfo';

const ALL = 'DApp.allCategories';

@inject(stores => ({
  allDapps: stores.dapps.allDapps,
  dAppTypes: stores.dapps.dAppTypes,
  language: stores.languageIntl.language,
  showDisclaimer: stores.dapps.showDisclaimer,
  addCustomDApp: obj => stores.dapps.addCustomDApp(obj),
  updateDApps: options => stores.dapps.updateDApps(options),
  setShowDisclaimer: () => stores.dapps.setShowDisclaimer(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class DAppMarket extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: DAPPORDERING[0],
      selectType: ALL,
      dAppDetail: null,
      showDetail: false
    };
    this.props.changeTitle('DApp.dAppMarket');
  }

  componentWillReceiveProps(nextProps) {
    const { language } = this.props
    if (language !== nextProps.language) {
      if (this.state.selectType === ALL) {
        this.setState({
          selectType: ALL,
        })
      }
    }
  }

  componentDidMount() {
    this.props.updateDApps({ chainTyps: 'WAN' })
  }

  handleTypeChange = value => {
    this.setState({ selectType: value })
  }

  handleSortChange = value => {
    this.setState({ sortBy: value });
  }

  handleJumpToWebsite = url => {
    wand.shell.openExternal(url);
  }

  showDetail = info => {
    this.setState({ dAppDetail: info, showDetail: true })
  }

  addDApp = info => {
    let ret = this.props.addCustomDApp({
      url: info.url,
      name: info.name,
      commit: info.shortDescribe,
      icon: `data:image/${info.iconType};base64,${info.iconData}`,
    });
    if (!ret) {
      message.error(intl.get('DApp.addFailed'));
    } else {
      console.log('add dapp success');
      message.success(intl.get('DApp.addSuccess'));
    }
  }

  closeDetail = () => {
    this.setState({ dAppDetail: null, showDetail: false })
  }

  render() {
    const { allDapps, dAppTypes } = this.props;
    let dAppsList = [ALL, intl.get(ALL)].includes(this.state.selectType) ? allDapps : allDapps.filter(item => item.type === this.state.selectType);
    dAppsList = dAppSort(dAppsList, this.state.sortBy, DAPPORDERING);

    return (
      <div className="account">
        <Row className={style.Row1 + ' title'}>
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} />
            <span className="wanTotal">ÐApps</span>
            <Input placeholder={intl.get('DApp.dAppSearch')} className={style.colorInputAddr} onChange={this.handleAddrChange} />
            <Button type="primary" onClick={this.handleGetInfo} shape="round" className={style.getInfoBtn}>{intl.get('popup.search')}</Button>
          </Col>
          <Col span={3} push={6} id="dAppType">
            <Select
              className='category-style'
              onChange={this.handleTypeChange}
              value={this.state.selectType === ALL ? intl.get(ALL) : this.state.selectType}
              getPopupContainer = {() => document.getElementById('dAppType')}
            >
              {dAppTypes.map((item, index) => {
                let val = index === dAppTypes.length - 1 ? intl.get(item) : item;
                return <Select.Option value={item} key={index}>{val}</Select.Option>
              })}
            </Select>
          </Col>
          <Col span={3} push={6} id="dAppSort">
            <Select
              className='category-style'
              onChange={this.handleSortChange}
              value={intl.get(this.state.sortBy)}
              getPopupContainer = {() => document.getElementById('dAppSort')}
            >
              {DAPPORDERING.map((item, index) => <Select.Option value={item} key={index}>{intl.get(item)}</Select.Option>)}
            </Select>
          </Col>
        </Row>
        <Row className={style.Row2 + ' title'}>
          {
            dAppsList.map((item, index) =>
            <Col span={7} className={style.cardDApp + ' col-left'} key={index}>
              <Row type="flex" justify="center" align="middle">
                <Col span={4} style={{ textAlign: 'center' }}><Avatar size="large" className={style.dappIcon} src={`data:image/${item.iconType};base64,${item.iconData}`} /></Col>
                <Col span={19} push={1}>
                  <Row>
                    <Col span={12}><span className={style.dAppName}>{item.name}</span></Col>
                    <Col span={6} offset={5}><Button className={style.createBtnType} shape="round" size="small">{item.type}</Button></Col>
                  </Row>
                  <Row className={style.dAppShortDescribe}>
                    <Col><span>{item.shortDescribe}</span></Col>
                  </Row>
                  <Row className={style.dAppShortDescribe}>
                    <Col><a onClick={() => this.handleJumpToWebsite(item.url)}>{item.url}</a></Col>
                  </Row>
                  <Row>
                    <Col span={6}><Button onClick={() => this.showDetail(item)} className={style.createBtn} type="primary" size="small">{intl.get('DApp.dAppDetail')}</Button></Col>
                    <Col span={6}><Button onClick={() => this.addDApp(item)} className={style.createBtn} type="primary" size="small">{intl.get('DApp.addButton')}</Button></Col>
                    <Col span={10} offset={2}><span className={style.dAppCreator}>{intl.get('DApp.poweredBy')}{item.creator}</span></Col>
                  </Row>
                </Col>
              </Row>
            </Col>
            )
          }
        </Row>
        { this.state.showDetail && <DAppInfo info={this.state.dAppDetail} handleClose={this.closeDetail}/> }
      </div>
    );
  }
}

export default DAppMarket;
