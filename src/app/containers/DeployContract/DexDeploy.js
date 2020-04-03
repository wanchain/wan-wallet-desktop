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
    loading: {
      buildPrepareContract: false,
      deployPrepareContract: false,
      buildExchangeContract: false,
      deployExchangeContract: false,
      buildProxyConfig: false,
      sendProxyConfig: false,
      buildRelayerDelegate: false,
      sendRelayerDelegate: false,
      buildRelayerApprove: false,
      sendRelayerApprove: false,
      verifySmartContract: false,
    },
    disableAction: {
      buildPrepareContract: false,
      deployPrepareContract: true,
      buildExchangeContract: true,
      deployExchangeContract: true,
      buildProxyConfig: true,
      sendProxyConfig: true,
      buildRelayerDelegate: true,
      sendRelayerDelegate: true,
      buildRelayerApprove: true,
      sendRelayerApprove: true,
      verifySmartContract: true,
    },
    disableDownload: {
      buildPrepareContract: true,
      deployPrepareContract: true,
      buildExchangeContract: true,
      deployExchangeContract: true,
      buildProxyConfig: true,
      sendProxyConfig: true,
      buildRelayerDelegate: true,
      sendRelayerDelegate: true,
      buildRelayerApprove: true,
      sendRelayerApprove: true,
      verifySmartContract: true,
    },
    verifyState: 0,
  }

  constructor(props) {
    super(props);
    this.props.changeTitle('menuConfig.dexDeploy');
  }

  handleImportFile = (type, step = 0) => {
    wand.request('offline_dexOpenFile', { type }, (err, data) => {
      if (err || !data.success) {
        message.warn('Import File Error, Please insert it again')
        return;
      }
      if (data.success) {
        message.success('Success');
        this.enableButton(type, 0, step);
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
    wand.request('offline_dexDownloadFile', { type }, (err, data) => {
      if (err) {
        message.warn('Download failed. Please try again!');
        return;
      }
      message.success('Download Success!')
    })
  }

  enableButton = (type, id, step) => {
    console.log(type, id, step);
    let disableAction = Object.assign({}, this.state.disableAction);
    let disableDownload = Object.assign({}, this.state.disableDownload);
    let target = '';
    if (type.includes('.json')) {
      switch (step) {
        case 2: target = 'deployPrepareContract'; break;
        case 3: target = 'buildExchangeContract'; break;
        case 4: target = 'deployExchangeContract'; break;
        case 5: target = 'buildProxyConfig'; break;
        case 6: target = 'sendProxyConfig'; break;
        case 7: target = 'buildRelayerDelegate'; break;
        case 8: target = 'sendRelayerDelegate'; break;
        case 9: target = 'buildRelayerApprove'; break;
        case 10: target = 'sendRelayerApprove'; break;
        case 11: target = 'verifySmartContract'; break;
      }
    } else {
      target = type;
    }

    if (id === 0) {
      disableAction[target] = false;
      this.setState({ disableAction });
    } else {
      disableDownload[target] = false;
      this.setState({ disableDownload });
    }
  }

  handleAction = type => {
    const { wanAddrInfo, setContractOwnerPath, contractOwnerPath } = this.props;
    const { contractOwner, contractOwnerNonce } = this.state;
    let loading = Object.assign({}, this.state.loading);
    loading[type] = true;
    this.setState({ loading });

    if (type.includes('build')) {
      if (![contractOwner, contractOwnerNonce].includes('')) {
        let obj = {
          [contractOwner]: contractOwnerNonce
        };
        let contractOwnerInfo = getInfoByAddress(contractOwner, ['path'], wanAddrInfo);
        wand.request('offline_dexUpdateNonce', obj, (err, data) => {
          if (err) {
            loading[type] = false;
            this.setState({ loading });
            return;
          };
          let path = { walletId: contractOwnerInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${contractOwnerInfo.path}`, addr: contractOwnerInfo.addr };
          setContractOwnerPath(path);
          wand.request('offline_dexAction', { type, data: path }, (err, data) => {
            console.log(err, data);
            if (err || !data) {
              message.warn('Failed!', 5);
              loading[type] = false;
              this.setState({ loading: loading });
              return;
            }
            message.success('Success!', 5);
            loading[type] = false;
            this.setState({ loading });
            this.enableButton(type, 1);
          })
        })
      } else {
        message.warn('Please insert correct data or select Address.');
        loading[type] = false;
        this.setState({ loading });
      }
    } else {
      wand.request('offline_dexAction', { type, data: '' }, (err, data) => {
        console.log(err, data);
        if (err || !data) {
          message.warn('Failed!', 5);
          loading[type] = false;
          this.setState({ loading: loading });
          if (type.includes('verify')) {
            this.setState({ verifyState: 2 });
          }
          return;
        }
        message.success('Success!', 5);
        loading[type] = false;
        this.setState({ loading });
        this.enableButton(type, 1);
        if (type.includes('verify')) {
          this.setState({ verifyState: 1 });
        }
      })
    }
  }

  render() {
    const { wanAddrInfo, contractOwnerPath } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    const { loading, disableAction, disableDownload } = this.state;

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
            <Button type="primary" style={btnStyle3} loading={loading['buildPrepareContract']} onClick={() => this.handleAction('buildPrepareContract')}>Build</Button>
            {<Button disabled={disableDownload['buildPrepareContract']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['buildPrepareContract(step1).json'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 2_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Deploy Prepare Contract / WWAN, Proxy, Discount</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('buildPrepareContract(step1).json', 2)}>Import buildPrepareContract(step1).json file</Button>
          {<Button disabled={disableAction['deployPrepareContract']} type="primary" style={btnStyle3} loading={loading['deployPrepareContract']} onClick={() => this.handleAction('deployPrepareContract')}>Deploy</Button>}
          {<Button disabled={disableDownload['deployPrepareContract']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['deployPrepareContract(step2).json'])}>Download</Button>}
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
            <Button type="primary" style={btnStyle} onClick={() => this.handleImportFile('deployPrepareContract(step2).json', 3)}>Import deployPrepareContract(step2).json file</Button>
            <Button disabled={disableAction['buildExchangeContract']} type="primary" style={btnStyle3} loading={loading['buildExchangeContract']} onClick={() => this.handleAction('buildExchangeContract')}>Build</Button>
            {<Button disabled={disableDownload['buildExchangeContract']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['buildExchangeContract(step3).json'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 4_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Deploy Exchange Contract</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('buildExchangeContract(step3).json', 4)}>Import buildExchangeContract(step3).json file</Button>
          {<Button disabled={disableAction['deployExchangeContract']} type="primary" style={btnStyle3} loading={loading['deployExchangeContract']} onClick={() => this.handleAction('deployExchangeContract')}>Deploy</Button>}
          {<Button disabled={disableDownload['deployExchangeContract']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['deployExchangeContract(step4).json'])}>Download</Button>}
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
            <Button type="primary" style={btnStyle} onClick={() => this.handleImportFile('deployPrepareContract(step2).json')}>Import deployPrepareContract(step2).json file</Button>
            <br />
            <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('deployExchangeContract(step4).json', 5)}>Import deployExchangeContract(step4).json file</Button>
            <Button disabled={disableAction['buildProxyConfig']} type="primary" style={btnStyle3} loading={loading['buildProxyConfig']} onClick={() => this.handleAction('buildProxyConfig')}>Build</Button>
            {<Button disabled={disableDownload['buildProxyConfig']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['buildProxyConfig(step5).json'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 6_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Send Proxy Config</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('buildProxyConfig(step5).json', 6)}>Import buildProxyConfig(step5).json file</Button>
          {<Button disabled={disableAction['sendProxyConfig']} type="primary" style={btnStyle3} loading={loading['sendProxyConfig']} onClick={() => this.handleAction('sendProxyConfig')}>Send</Button>}
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
            <Button type="primary" style={btnStyle} onClick={() => this.handleImportFile('deployExchangeContract(step4).json')}>Import deployExchangeContract(step4).json file</Button>
            <br />
            <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('delegate_address(engineer).json', 7)}>Import delegate_address(engineer).json file </Button>
            <Button disabled={disableAction['buildRelayerDelegate']} type="primary" style={btnStyle3} loading={loading['buildRelayerDelegate']} onClick={() => this.handleAction('buildRelayerDelegate')}>Build</Button>
            {<Button disabled={disableDownload['buildRelayerDelegate']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['buildRelayerDelegate(step7).json'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 8_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Send Approve Relayer Delegate</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('buildRelayerDelegate(step7).json', 8)}>Import buildRelayerDelegate(step7).json file</Button>
          {<Button disabled={disableAction['sendRelayerDelegate']} type="primary" style={btnStyle3} loading={loading['sendRelayerDelegate']} onClick={() => this.handleAction('sendRelayerDelegate')}>Send</Button>}
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
            <Button type="primary" style={btnStyle} onClick={() => this.handleImportFile('token_address(engineer).json')}>Import token_address(engineer).json file</Button>
            <br />
            <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('deployPrepareContract(step2).json', 9)}>Import deployPrepareContract(step2).json file</Button>
            <Button disabled={disableAction['buildRelayerApprove']} type="primary" style={btnStyle3} loading={loading['buildRelayerApprove']} onClick={() => this.handleAction('buildRelayerApprove')}>Build</Button>
            {<Button disabled={disableDownload['buildRelayerApprove']} type="primary" style={btnStyle3} onClick={() => this.handleDownloadFile(['buildRelayerApprove(step9).json'])}>Download</Button>}
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 10_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Send Relayer Approve</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('buildRelayerApprove(step9).json', 10)}>Import buildRelayerApprove(step9).json file</Button>
          {<Button disabled={disableAction['sendRelayerApprove']} type="primary" style={btnStyle3} loading={loading['sendRelayerApprove']} onClick={() => this.handleAction('sendRelayerApprove')}>Send</Button>}
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>Step 11_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Verify Smart Contracts</h3>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('token_address(engineer).json')}>Import token_address(engineer).json file</Button>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('deployPrepareContract(step2).json')}>Import deployPrepareContract(step2).json file</Button>
          <br />
          <Button type="primary" style={btnStyle2} onClick={() => this.handleImportFile('deployExchangeContract(step4).json', 11)}>Import deployExchangeContract(step4).json file</Button>
          {<Button disabled={disableAction['verifySmartContract']} type="primary" style={btnStyle3} loading={loading['verifySmartContract']} onClick={() => this.handleAction('verifySmartContract')}>Verify</Button>}
          {this.state.verifyState === 1 && <Icon type="check-circle" className={style.goodIcon} />}
          {this.state.verifyState === 0 && <Icon type="question-circle" className={style.unknownIcon} />}
          {this.state.verifyState === 2 && <Icon type="close-circle" className={style.badIcon} />}
        </div>
      </React.Fragment>
    );
  }
}

export default DexDeploy;
