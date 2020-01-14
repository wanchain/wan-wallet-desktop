import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Select, Row, Col, Modal } from 'antd';

import style from './index.less';
import { WANPATH } from 'utils/settings';
import TableShowing from 'componentUtils/TableShowing';

import { getInfoByAddress } from 'utils/helper';

const btnStyle = { marginLeft: '10px' }
@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  registerTokenPath: stores.deployContract.registerTokenPath,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setRegisterTokenPath: val => stores.deployContract.setRegisterTokenPath(val),
}))

@observer
class RegisterToken extends Component {
  state = {
    tokenFileShowing: false,
    tokenContent: [],
    registerTokenFileShowing: false,
    registerTokenContent: [],
    registerTokenAddr: this.props.registerTokenPath.addr,
    registerTokenAddrNonce: '',
    tokenStatus: false,
    updateNonce: false,
    registerTokenLoading: false,
    registerTokenStatus: false,
    buildRegisterTokenStatus: false,
    buildRegisterTokenLoading: false,
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.registerToken');
  }

  handleGetInfo = type => {
    wand.request('offline_openFile', { type }, (err, data) => {
      if (err) {
        message.warn('Import File Error, Please insert it again')
        return;
      }
      if (data.ret) {
        message.success('Success')
        this.setState({ [`${type}Status`]: true });
        if (data.openFileContent && data.openFileContent.length !== 0) {
          this.setState({ [`${type}FileShowing`]: true, [`${type}Content`]: data.openFileContent })
        }
      }
    })
  }

  handleSelectAddr = (value, type) => {
    const { wanAddrInfo, setRegisterTokenPath } = this.props;
    if (value === undefined) {
      value = ''
    }
    this.setState({ [type]: value })
    switch (type) {
      case 'registerTokenAddr':
        let registerTokenAddrInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        setRegisterTokenPath({ walletId: registerTokenAddrInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${registerTokenAddrInfo.path}`, addr: value });
        break;
    }
  }

  handleBuildContract = type => {
    const { wanAddrInfo, setRegisterTokenPath } = this.props;
    const { registerTokenAddr, registerTokenAddrNonce } = this.state;
    this.setState({ [`${type}Loading`]: true });

    if (![registerTokenAddr, registerTokenAddrNonce].includes('')) {
      let obj = {
        [registerTokenAddr]: registerTokenAddrNonce
      };
      let registerTokenAddrPath = getInfoByAddress(registerTokenAddr, ['path'], wanAddrInfo);
      wand.request('offline_updateNonce', obj, (err, data) => {
        if (err) {
          this.setState({ [`${type}Loading`]: false });
          return;
        };
        let path = { walletId: registerTokenAddrPath.type === 'normal' ? 1 : 5, path: `${WANPATH}${registerTokenAddrPath.path}`, addr: registerTokenAddrPath.addr };
        setRegisterTokenPath(path);
        wand.request('offline_buildContract', { type, data: path }, (err, data) => {
          if (err || !data.ret) {
            this.setState({ [`${type}Loading`]: false });
            message.warn('Build Failures!')
            return;
          }
          this.setState({ [`${type}Loading`]: false, [`${type}Status`]: true });
          message.success('Build Success!')
        })
      })
    } else {
      message.warn('Please insert correct data');
      this.setState({ [`${type}Loading`]: false });
    }
  }

  handleDownloadFile = type => {
    wand.request('offline_downloadFile', { type }, (err, data) => {
      if (err) {
        message.warn('Download failed. Please try again!')
        return;
      }
      message.success('Download Success!')
    })
  }

  deployContractAction = type => {
    this.setState({ [`${type}Loading`]: true });
    wand.request('offline_deployContractAction', { type }, (err, data) => {
      if (err || !data.ret) {
        // message.warn(err.desc);
        Modal.error({
          content: err.desc || 'Error occurred. Please restart!',
        });
        this.setState({ [`${type}Loading`]: false });
        return;
      }
      message.success('Success!');
      if (!['setDependency'].includes(type)) {
        this.setState({ [`${type}File`]: true, [`${type}Loading`]: false });
      } else {
        this.setState({ [`${type}Loading`]: false });
      }
    })
  }

  render () {
    const { registerTokenFileShowing, registerTokenContent, tokenContent, tokenFileShowing, registerTokenLoading, registerTokenStatus, buildRegisterTokenStatus, buildRegisterTokenLoading, tokenStatus } = this.state;
    const { registerTokenPath, wanAddrInfo } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <h5 className={style.fontText + ' ' + style.inlineBlock}>Select Address</h5>
          <div>
            <Select
              autoFocus
              className="colorInput"
              defaultValue={registerTokenPath.addr}
              optionLabelProp="value"
              optionFilterProp="children"
              onChange={value => this.handleSelectAddr(value, 'registerTokenAddr')}
              placeholder="Select contract owner"
              dropdownMatchSelectWidth={false}
            >
              {
                addr.map((item, index) =>
                  <Select.Option value={item} key={index}>
                    <Row className="ant-row-flex">
                      <Col>{item}</Col>&nbsp;
                    </Row>
                  </Select.Option>)
              }
            </Select>
            <Input onChange={e => this.handleSelectAddr(e.target.value, 'registerTokenAddrNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small"/>
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Register Token</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('token')}>Import token.json File</Button>
          { tokenStatus && <Button type="primary" style={btnStyle} loading={buildRegisterTokenLoading} onClick={() => this.handleBuildContract('buildRegisterToken')}>Build</Button> }
          { buildRegisterTokenStatus && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['txData', 'registerToken.dat'])}>Download</Button> }
          { tokenFileShowing && <TableShowing type="token" data={tokenContent}/> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>2_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Register Token</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('registerToken')}>Import registerToken.dat File</Button>
          { registerTokenStatus && <Button type="primary" style={btnStyle} loading={registerTokenLoading} onClick={() => this.deployContractAction('registerToken')}>Deploy</Button> }
          { registerTokenFileShowing && <TableShowing type="registerToken" data={registerTokenContent}/> }
        </div>
      </React.Fragment>
    );
  }
}

export default RegisterToken;
