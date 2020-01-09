import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Icon, Tooltip, Select, Row, Col } from 'antd';

import style from './index.less';
import { fromWei } from 'utils/support';
import { WANPATH } from 'utils/settings';

import { deserializeWanTx, getInfoByAddress } from 'utils/helper';

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  sgAddrPath: stores.deployContract.sgAddrPath,
  contractOwnerPath: stores.deployContract.contractOwnerPath,
  setSgAddrPath: val => stores.deployContract.setSgAddrPath(val),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setContractOwnerPath: val => stores.deployContract.setContractOwnerPath(val),
}))

@observer
class RegisterStoremanGroup extends Component {
  state = {
    sgAddr: '',
    sgAddrNonce: '',
    contractOwner: '',
    contractOwnerNonce: '',
    smgStatus: false,
    tokenStatus: false,
    updateNonce: false,
    deployContractStatus: false,
    contractAddressStatus: false,
    deployContractLoading: false,
    setDependencyImportStatus: false,
    deployContractFile: false,
    buildRegisterSmgStatus: false,
    registerTokenLoading: false,
    setDependencyStatus: false,
    setDependencyLoading: false,
    registerTokenStatus: false,
    registerSmgStatus: false,
    registerSmgLoading: false,
    buildRegisterSmgLoading: false,
    buildRegisterTokenStatus: false,
    buildRegisterTokenLoading: false,
    buildSetDependencyStatus: false,
    buildSetDependencyLoading: false,
    buildDeployContractStatus: false,
    buildDeployContractLoading: false,
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.deployContract');
  }

  handleGetInfo = type => {
    let action;
    switch (type) {
      case 'contractAddress':
      case 'setDependencyImport':
        action = 'contractAddress';
        break;
      default:
        action = type;
        break;
    }
    wand.request('offline_openFile', { type: action }, (err, data) => {
      if (err) {
        message.warn('Import File Error, Please insert it again')
        return;
      }
      if (data) {
        message.success('Success')
        this.setState({ [`${type}Status`]: true })
      }
    })
  }

  handleSelectAddr = (value, type) => {
    const { wanAddrInfo } = this.props;
    if (value === undefined) {
      value = ''
    }
    this.setState({ [type]: value })
    switch (type) {
      case 'contractOwner':
        let contractOwnerInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        this.props.setContractOwnerPath({ walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}` });
        break;
      case 'sgAddr':
        let sgAddrInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        this.props.setSgAddrPath({ walletId: sgAddrInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${sgAddrInfo.path}` });
        break;
    }
  }

  updateInfo = () => {
    const { wanAddrInfo, setSgAddrPath, setContractOwnerPath } = this.props;
    const { contractOwner, contractOwnerNonce, sgAddr, sgAddrNonce } = this.state;
    let contractOwnerStatus = ![contractOwner, contractOwnerNonce].includes('');
    let sgAddrStatus = ![sgAddr, sgAddrNonce].includes('');
    if (contractOwnerStatus || sgAddrStatus) {
      let obj = {};
      let contractOwnerInfo, sgAddrInfo;
      if (contractOwnerStatus) {
        obj[contractOwner] = contractOwnerNonce;
        contractOwnerInfo = getInfoByAddress(contractOwner, ['path'], wanAddrInfo);
      }
      if (sgAddrStatus) {
        obj[sgAddr] = sgAddrNonce;
        sgAddrInfo = getInfoByAddress(sgAddr, ['path'], wanAddrInfo);
      }
      wand.request('offline_updateNonce', obj, (err, data) => {
        if (err) return;
        sgAddrStatus && setSgAddrPath({ walletId: sgAddrInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${sgAddrInfo.path}` });
        contractOwnerStatus && setContractOwnerPath({ walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}` });
        message.success('Success');
        this.setState({ updateNonce: true })
      })
    } else {
      message.warn('Please insert correct data');
    }
  }

  handleBuildContract = (type, data) => {
    if (Object.keys(data).length === 0) {
      let addrType = type === 'buildRegisterSmg' ? 'Storeman Group Address' : 'Contract Owner Address'
      message.warn(`Please re-select the ${addrType}`)
      return;
   }
    this.setState({ [`${type}Loading`]: true });
    wand.request('offline_buildContract', { type, data }, (err, ret) => {
      if (err) {
        this.setState({ [`${type}Loading`]: false });
        message.success('Build Failures!')
        return;
      }
      this.setState({ [`${type}Loading`]: false, [`${type}Status`]: true });
      message.success('Build Success!')
    })
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
      if (err) {
        message.warn(err.desc);
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
    const { registerSmgLoading, registerSmgStatus, buildRegisterSmgLoading, buildRegisterSmgStatus, smgStatus, registerTokenLoading, registerTokenStatus, buildRegisterTokenStatus, buildRegisterTokenLoading, tokenStatus, setDependencyLoading, setDependencyStatus, buildSetDependencyStatus, buildSetDependencyLoading, setDependencyImportStatus, contractAddressStatus, buildDeployContractLoading, buildDeployContractStatus, deployContractStatus, deployContractFile, deployContractLoading, setDependencyImportFile } = this.state;
    const { wanAddrInfo, contractOwnerPath, sgAddrPath } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Data Preparation</h3>
          <div>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Import Deployment Library File</h5>
            <Button type="primary" onClick={() => this.handleGetInfo('contractAddress')}>Import</Button>
            { contractAddressStatus && <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> }
          </div>
          <div>
            <h5 className={style.fontText + ' ' + style.inlineBlock}>Select Address</h5>
            <div>
              <Select
                autoFocus
                className="colorInput"
                optionLabelProp="value"
                optionFilterProp="children"
                onChange={value => this.handleSelectAddr(value, 'contractOwner')}
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
              <Input onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small"/>
              <Divider className={style.dividerStyle} type="vertical" />
              <Select
                autoFocus
                className="colorInput"
                optionLabelProp="value"
                optionFilterProp="children"
                onChange={value => this.handleSelectAddr(value, 'sgAddr')}
                placeholder="Select storeman group address"
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
              <Input onChange={e => this.handleSelectAddr(e.target.value, 'sgAddrNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small"/>
            </div>
            <Button type="primary" onClick={this.updateInfo}>Update Nonce</Button>
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>8_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Register Storeman Group</h3>
          <Button type="primary" onClick={() => this.handleGetInfo('smg')}>Import</Button>
          { smgStatus && <Button type="primary" loading={buildRegisterSmgLoading} onClick={() => this.handleBuildContract('buildRegisterSmg', sgAddrPath)}>Build</Button> }
          { buildRegisterSmgStatus && <Button type="primary" onClick={() => this.handleDownloadFile(['txData', 'registerSmg.dat'])}>Download</Button> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>9_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Register Storeman Group</h3>
          <Button type="primary" onClick={() => this.handleGetInfo('registerSmg')}>Import</Button>
          { registerSmgStatus && <Button type="primary" loading={registerSmgLoading} onClick={() => this.deployContractAction('registerSmg')}>Deploy</Button> }
        </div>
      </React.Fragment>
    );
  }
}

export default RegisterStoremanGroup;
