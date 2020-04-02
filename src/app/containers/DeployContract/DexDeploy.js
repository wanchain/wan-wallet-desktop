import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Icon, Select, Row, Col, Modal } from 'antd';

import style from './index.less';
import { WANPATH } from 'utils/settings';
import TableShowing from 'componentUtils/TableShowing';

import { getInfoByAddress } from 'utils/helper';

const btnStyle = { marginLeft: '10px', width: '330px' }
const btnStyle2 = { marginLeft: '10px', marginTop: '20px', width: '330px' }
const btnStyle3 = { marginLeft: '10px', width: '120px' }

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  contractOwnerPath: stores.deployContract.contractOwnerPath,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setContractOwnerPath: val => stores.deployContract.setContractOwnerPath(val),
}))

@observer
class DexDeploy extends Component {
  state = {
    deployStatus: false,
    contractOwner: this.props.contractOwnerPath.addr,
    contractOwnerNonce: '',
    deployContractStatus: false,
    libAddressStatus: false,
    deployContractLoading: false,
    setDependencyImportStatus: false,
    deployContractFile: false,
    setDependencyStatus: false,
    setDependencyLoading: false,
    buildSetDependencyStatus: false,
    buildSetDependencyLoading: false,
    buildDeployContractStatus: false,
    buildDeployContractLoading: false,
    deployContractFileShowing: false,
    deployContractContent: [],
    setDependencyFileShowing: false,
    setDependencyContent: [],
    setDependencyImportFileShowing: false,
    setDependencyImportContent: []
  }

  constructor(props) {
    super(props);
    this.props.changeTitle('menuConfig.dexDeploy');
  }

  handleGetInfo = type => {
    let action;
    switch (type) {
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
    const { wanAddrInfo, setContractOwnerPath } = this.props;
    if (value === undefined) {
      value = ''
    }
    this.setState({ [type]: value })
    switch (type) {
      case 'contractOwner':
        let contractOwnerInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        setContractOwnerPath({ walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}`, addr: value });
        break;
    }
  }

  handleBuildContract = type => {
    const { wanAddrInfo, setContractOwnerPath, contractOwnerPath } = this.props;
    const { contractOwner, contractOwnerNonce } = this.state;
    this.setState({ [`${type}Loading`]: true });

    if (type === 'buildDeployContract') {
      if (![contractOwner, contractOwnerNonce].includes('')) {
        let obj = {
          [contractOwner]: contractOwnerNonce
        };
        let contractOwnerInfo = getInfoByAddress(contractOwner, ['path'], wanAddrInfo);
        wand.request('offline_updateNonce', obj, (err, data) => {
          if (err) {
            this.setState({ [`${type}Loading`]: false });
            return;
          };
          let path = { walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}`, addr: contractOwnerInfo.addr };
          setContractOwnerPath(path);
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
    } else {
      if (contractOwnerPath !== undefined && Object.keys(contractOwnerPath).length === 0) {
        message.warn('Please select an address to build/deploy the transactions!');
        return;
      }
      wand.request('offline_buildContract', { type, data: contractOwnerPath }, (err, data) => {
        if (err || !data.ret) {
          this.setState({ [`${type}Loading`]: false });
          message.warn('Build Failures!')
          return;
        }
        this.setState({ [`${type}Loading`]: false, [`${type}Status`]: true });
        message.success('Build Success!')
      })
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
        let content = err ? err.desc : 'Error occurred. Please restart!';
        Modal.error({ content });
        this.setState({ [`${type}Loading`]: false });
        return;
      }
      message.success('Success!');
      if (!['setDependency'].includes(type)) {
        this.setState({ [`${type}File`]: true, [`${type}Loading`]: false });
      } else {
        this.setState({ deployStatus: true, [`${type}Loading`]: false });
      }
    })
  }

  render() {
    const { deployStatus, setDependencyImportContent, setDependencyImportFileShowing, setDependencyFileShowing, setDependencyContent, deployContractFileShowing, deployContractContent, setDependencyLoading, setDependencyStatus, buildSetDependencyStatus, buildSetDependencyLoading, setDependencyImportStatus, libAddressStatus, buildDeployContractLoading, buildDeployContractStatus, deployContractStatus, deployContractFile, deployContractLoading, setDependencyImportFile } = this.state;
    const { wanAddrInfo, contractOwnerPath } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Prepare Contract / WWAN, Proxy, Discount</h3>
          <div style={{ margin: '20px 0px 20px 0px' }}>
            <h5 className={style.fontText + ' ' + style.inlineBlock} style={{ width: '150px' }}>Select Admin Address:</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={contractOwnerPath.addr}
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
            <Input style={{ marginLeft: '20px', textAlign: 'center' }} onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small" />
          </div>
          <div>
            <Button type="primary" style={btnStyle3} loading={buildDeployContractLoading} onClick={() => this.handleBuildContract('buildDeployContract')}>Build</Button>
            {<Button disabled={true} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['txData', 'deployContract(step2).dat'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 2_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Deploy Prepare Contract / WWAN, Proxy, Discount</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import buildPrepareContract(step1).json file</Button>
          {<Button disabled={true} type="primary" style={btnStyle3} loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Deploy</Button>}
          {<Button disabled={true} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['contractAddress(step3).json'])}>Download</Button>}
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 3_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Exchange Contract</h3>
          <div style={{ margin: '20px 0px 20px 0px' }}>
            <h5 className={style.fontText + ' ' + style.inlineBlock} style={{ width: '150px' }}>Select Admin Address:</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={contractOwnerPath.addr}
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
            <Input style={{ marginLeft: '20px', textAlign: 'center' }} onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small" />
          </div>
          <div>
            <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('deployContract')}>Import deployPrepareContract(step2).json file</Button>
            <Button disabled={true} type="primary" style={btnStyle3} loading={buildDeployContractLoading} onClick={() => this.handleBuildContract('buildDeployContract')}>Build</Button>
            {<Button disabled={true} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['txData', 'deployContract(step2).dat'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 4_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Deploy Exchange Contract</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import exchange_contracts(step3).dat file</Button>
          {<Button disabled={true} type="primary" style={btnStyle3} loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Deploy</Button>}
          {<Button disabled={true} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['contractAddress(step3).json'])}>Download</Button>}
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 5_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Proxy Config</h3>
          <div style={{ margin: '20px 0px 20px 0px' }}>
            <h5 className={style.fontText + ' ' + style.inlineBlock} style={{ width: '150px' }}>Select Admin Address:</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={contractOwnerPath.addr}
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
            <Input style={{ marginLeft: '20px', textAlign: 'center' }} onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small" />
          </div>
          <div>
            <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('deployContract')}>Import deployPrepareContract(step2).json file</Button>
            <br />
            <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import deployExchangeContract(step4).json file</Button>
            <Button disabled={true} type="primary" style={btnStyle3} loading={buildDeployContractLoading} onClick={() => this.handleBuildContract('buildDeployContract')}>Build</Button>
            {<Button disabled={true} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['txData', 'deployContract(step2).dat'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 6_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Send Proxy Config</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import buildProxyConfig(step5).json file</Button>
          {<Button disabled={true} type="primary" style={btnStyle3} loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Send</Button>}
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 7_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Proxy Config</h3>
          <div style={{ margin: '20px 0px 20px 0px' }}>
            <h5 className={style.fontText + ' ' + style.inlineBlock} style={{ width: '150px' }}>Select Relayer Address:</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={contractOwnerPath.addr}
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
            <Input style={{ marginLeft: '20px', textAlign: 'center' }} onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small" />
          </div>
          <div>
            <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('deployContract')}>Import deployExchangeContract(step4).json file</Button>
            <br />
            <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import delegate_address(engineer).json file </Button>
            <Button disabled={true} type="primary" style={btnStyle3} loading={buildDeployContractLoading} onClick={() => this.handleBuildContract('buildDeployContract')}>Build</Button>
            {<Button disabled={true} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['txData', 'deployContract(step2).dat'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 8_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Send Approve Relayer Delegate</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import buildRelayerDelegate(step7).json file</Button>
          {<Button disabled={true} type="primary" style={btnStyle3} loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Send</Button>}
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 9_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Relayer Approve</h3>
          <div style={{ margin: '20px 0px 20px 0px' }}>
            <h5 className={style.fontText + ' ' + style.inlineBlock} style={{ width: '150px' }}>Select Relayer Address:</h5>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              defaultValue={contractOwnerPath.addr}
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
            <Input style={{ marginLeft: '20px', textAlign: 'center' }} onChange={e => this.handleSelectAddr(e.target.value, 'contractOwnerNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small" />
          </div>
          <div>
            <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('deployContract')}>Import token_address(engineer).json file</Button>
            <br />
            <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import deployPrepareContract(step2).json file</Button>
            <Button disabled={true} type="primary" style={btnStyle3} loading={buildDeployContractLoading} onClick={() => this.handleBuildContract('buildDeployContract')}>Build</Button>
            {<Button disabled={true} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['txData', 'deployContract(step2).dat'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 10_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Send Relayer Approve</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import buildRelayerApprove(step9).json file</Button>
          {<Button disabled={true} type="primary" style={btnStyle3} loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Send</Button>}
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 11_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Verify Smart Contracts</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import token_address(engineer).json file</Button>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import deployPrepareContract(step2).json file</Button>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleGetInfo('deployContract')}>Import deployExchangeContract(step4).json file</Button>
          {<Button disabled={true} type="primary" style={btnStyle3} loading={deployContractLoading} onClick={() => this.deployContractAction('deployContract')}>Verify</Button>}
          {false && <Icon type="check-circle" className={style.goodIcon}/>}
          {true && <Icon type="question-circle" className={style.unknownIcon}/>}
          {false && <Icon type="close-circle" className={style.badIcon}/>}
        </div>
      </React.Fragment>
    );
  }
}

export default DexDeploy;
