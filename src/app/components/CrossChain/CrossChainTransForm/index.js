import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox, Tooltip, AutoComplete, Input, Row, Col } from 'antd';
import style from './index.less';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
// import AutoCompleteForm from 'componentUtils/AutoCompleteForm';
import AddContactsModal from '../../AddContacts/AddContactsModal';
import ChooseContactsModal from '../../AddContacts/ChooseContactsModal';
import AdvancedCrossChainOptionForm from 'components/AdvancedCrossChainOptionForm';
import { INBOUND, CROSS_TYPE, FAST_GAS, WAN_ETH_DECIMAL, WALLETID } from 'utils/settings';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm';
import { isExceedBalance, formatNumByDecimals, hexCharCodeToStr, removeRedundantDecimal, fromWei } from 'utils/support';
import { getFullChainName, getBalanceByAddr, checkAmountUnit, formatAmount, getValueByAddrInfo, checkAddressByChainType, getFees, getQuota, getValueByNameInfoAllType, getInfoByAddress } from 'utils/helper';

const Confirm = Form.create({ name: 'CrossChainConfirmForm' })(ConfirmForm);
const AdvancedCrossChainModal = Form.create({ name: 'AdvancedCrossChainOptionForm' })(AdvancedCrossChainOptionForm);
const { Option } = AutoComplete;
const AddContactsModalForm = Form.create({ name: 'AddContactsModal' })(AddContactsModal);
const ChooseContactsModalForm = Form.create({ name: 'AddContactsModal' })(ChooseContactsModal);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  from: stores.sendCrossChainParams.currentFrom,
  currTokenPairId: stores.crossChain.currTokenPairId,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  transParams: stores.sendCrossChainParams.transParams,
  coinPriceObj: stores.portfolio.coinPriceObj,
  contacts: stores.contacts.contacts,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
  addAddress: (chain, addr, val) => stores.contacts.addAddress(chain, addr, val),
  hasSameContact: (addr, chain) => stores.contacts.hasSameContact(addr, chain),
}))

@observer
class CrossChainTransForm extends Component {
  constructor(props) {
    super(props);
    let info = props.currentTokenPairInfo;
    let addr = props.getChainAddressInfoByChain(props.type === INBOUND ? info.toChainSymbol : info.fromChainSymbol)
    this.addressSelections = Object.keys({ ...addr.normal, ...addr.ledger, ...addr.trezor });
    this.state = {
      confirmVisible: false,
      crossType: CROSS_TYPE[0],
      advancedVisible: false,
      advanced: false,
      advancedFee: 0,
      operationFee: 0,
      minQuota: 0,
      maxQuota: 0,
      contactsList: [],
      isNewContacts: false,
      showAddContacts: false,
      showChooseContacts: false,
    }
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.smgList !== this.props.smgList) {
      let { smgList, currentTokenPairInfo: info, chainType, type } = this.props;
      try {
        const targetChainType = type === INBOUND ? info.toChainSymbol : info.fromChainSymbol;
        const [{ minQuota, maxQuota }] = await getQuota(((info.ancestorSymbol === 'EOS' && chainType === 'WAN') ? 'EOS' : chainType), smgList[0].groupId, [info.ancestorSymbol], { targetChainType });// EOS在WAN侧的做特殊处理
        const decimals = info.ancestorDecimals;
        this.setState({
          minQuota: formatNumByDecimals(minQuota, decimals),
          maxQuota: formatNumByDecimals(maxQuota, decimals)
        })
      } catch (e) {
        console.log('e:', e);
        message.warn(intl.get('CrossChainTransForm.getQuotaFailed'));
        this.props.onCancel();
      }
    }
  }

  componentDidMount() {
    const { currentTokenPairInfo: info, currTokenPairId, type } = this.props;
    this.processContacts();
    getFees(info[type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol'], info.fromChainID, info.toChainID).then(res => {
      this.setState({ operationFee: fromWei(res[0]) });
    }).catch(err => {
      console.log('err:', err);
      message.warn(intl.get('CrossChainTransForm.getOperationFeeFailed'));
    });
  }

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return false;
    };
  }

  processContacts = () => {
    const { contacts, currentTokenPairInfo: info, type } = this.props;
    const { normalAddr } = contacts;
    const chainSymbol = getFullChainName(info[type === INBOUND ? 'toChainSymbol' : 'fromChainSymbol']);
    let contactsList = Object.values(normalAddr[chainSymbol]);
    this.setState({
      contactsList
    })
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  onCancel = () => {
    this.props.onCancel();
  }

  handleNext = () => {
    const { updateTransParams, settings, form, from, type, getChainAddressInfoByChain, currentTokenPairInfo: info } = this.props;
    let toAddrInfo = getChainAddressInfoByChain(info[type === INBOUND ? 'toChainSymbol' : 'fromChainSymbol']);
    let isNativeAccount = false; // Figure out if the to value is contained in my wallet.
    form.validateFields(['from', 'balance', 'storemanAccount', 'quota', 'to', 'totalFee', 'amount'], { force: true }, async (err, { pwd, amount: sendAmount, to }) => {
      if (err) {
        console.log('handleNext:', err);
        return;
      };

      const { minQuota, maxQuota } = this.state;
      if (new BigNumber(sendAmount).lt(minQuota)) {
        message.warn(`${intl.get('CrossChainTransForm.UnderFastMinimum')}: ${removeRedundantDecimal(minQuota, 2)} ${info[type === INBOUND ? 'fromTokenSymbol' : 'toTokenSymbol']}`);
        return;
      }

      if (new BigNumber(sendAmount).gt(maxQuota)) {
        message.warn(intl.get('CrossChainTransForm.overQuota'));
        return;
      }

      let addrType = 'normal'
      if (this.accountSelections.includes(to)) {
        addrType = getValueByNameInfoAllType(to, 'type', toAddrInfo);
        to = getValueByNameInfoAllType(to, 'address', toAddrInfo);
        isNativeAccount = true;
      } else if (this.addressSelections.includes(to)) {
        isNativeAccount = true;
        addrType = getInfoByAddress(to, [], toAddrInfo).type;
      } else if (this.contactsList.find(v => v.name === to || v.address === to)) {
        const contactItem = this.contactsList.find(v => v.name === to || v.address === to);
        to = contactItem.address;
      }

      let toPath;
      if (type === INBOUND) {
        if (info.toChainSymbol === 'BNB') { // BNB coin type id is the same with ETH, both are 60.
          toPath = 60;
        } else {
          toPath = info.toChainID - Number('0x80000000'.toString(10));
        }
      } else {
        if (info.fromChainSymbol === 'BNB') {
          toPath = 60;
        } else {
          toPath = info.fromChainID - Number('0x80000000'.toString(10));
        }
      }
      toPath = isNativeAccount
                              ? addrType === 'normal' ? `m/44'/${toPath}'/0'/0/${toAddrInfo[addrType][to].path}` : toAddrInfo[addrType][to].path
                              : undefined;
      let walletID = addrType === 'normal' ? 1 : WALLETID[addrType.toUpperCase()];
      let toValue = isNativeAccount && addrType !== 'trezor';
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: toValue ? { walletID, path: toPath } : to, toAddr: to, amount: formatAmount(sendAmount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: toValue ? { walletID, path: toPath } : to, toAddr: to, amount: formatAmount(sendAmount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  checkAmount = (rule, value, callback) => {
    const { balance, estimateFee, from, type, currentTokenPairInfo: info, getChainAddressInfoByChain } = this.props;
    const decimals = info.ancestorDecimals;
    const { advanced, advancedFee, operationFee } = this.state;

    if (new BigNumber(value).gte('0') && checkAmountUnit(decimals || 18, value)) {
      let fromAddrInfo = getChainAddressInfoByChain(info[type === INBOUND ? 'fromChainSymbol' : 'toChainSymbol']);
      let origAddrAmount = getBalanceByAddr(from, fromAddrInfo);
      if (new BigNumber(value).gt(balance)) {
        callback(intl.get('CrossChainTransForm.overTransBalance'));
      } else if (isExceedBalance(origAddrAmount, advanced ? advancedFee : estimateFee, operationFee)) {
        callback(intl.get('CrossChainTransForm.overOriginalBalance'));
      } else {
        callback();
      }
    } else {
      callback(intl.get('Common.invalidAmount'));
    }
  }

  checkQuota = (rule, value, callback) => {
    value = value.split(' ')[0];
    if (new BigNumber(value).gt(0)) {
      let { amount } = this.props.form.getFieldsValue(['amount']);
      if (isExceedBalance(value, amount)) {
        callback(intl.get('CrossChainTransForm.overQuota'));
        return;
      }
      callback();
    } else {
      callback(intl.get('CrossChainTransForm.overQuota'));
    }
  }

  updateLockAccounts = async (storeman) => {
    let { from, form, updateTransParams, chainType, type, currentTokenPairInfo: info } = this.props;
    try {
      const targetChainType = type === INBOUND ? info.toChainSymbol : info.fromChainSymbol;
      const [{ minQuota, maxQuota }] = await getQuota(((info.ancestorSymbol === 'EOS' && chainType === 'WAN') ? 'EOS' : chainType), storeman, [info.ancestorSymbol], { targetChainType });// EOS在WAN侧的做特殊处理
      const decimals = info.ancestorDecimals;
      this.setState({
        minQuota: formatNumByDecimals(minQuota, decimals),
        maxQuota: formatNumByDecimals(maxQuota, decimals)
      }, () => {
        form.setFieldsValue({
          quota: `${this.state.maxQuota} ${type === INBOUND ? info.fromTokenSymbol : info.toTokenSymbol}`
        })
      });
    } catch (e) {
      console.log('e:', e);
      message.warn(intl.get('CrossChainTransForm.getQuotaFailed'));
      this.props.onCancel();
    }
    updateTransParams(from, { storeman });
  }

  updateCrossType = (v) => {
    let { from, updateTransParams } = this.props;
    updateTransParams(from, { crossType: v });
    this.setState({
      crossType: v,
    })
  }

  sendAllAmount = e => {
    let { form, balance } = this.props;
    if (e.target.checked) {
      form.setFieldsValue({
        amount: new BigNumber(balance).toString(10)
      });
    } else {
      form.setFieldsValue({
        amount: 0
      });
    }
  }

  checkTo = async (rule, value, callback) => {
    const { currentTokenPairInfo: info, type, hasSameContact } = this.props;
    let chain = type === INBOUND ? info.toChainSymbol : info.fromChainSymbol;
    const chainSymbol = getFullChainName(chain);
    const isNewContacts = hasSameContact(value, chainSymbol);
    if (this.accountSelections.includes(value) || this.addressSelections.includes(value)) {
      this.setState({
        isNewContacts: false
      })
      callback();
    } else {
      let isValid;
      if (chain === 'WAN') {
        let [isWAN, isETH] = await Promise.all([checkAddressByChainType(value, 'WAN'), checkAddressByChainType(value, 'ETH')]);
        isValid = isWAN || isETH;
      } else {
        isValid = await checkAddressByChainType(value, chain);
      }
      if (isValid) {
        this.setState({
          isNewContacts: !isNewContacts
        })
        callback();
      } else {
        this.setState({
          isNewContacts: false
        })
        callback(intl.get('NormalTransForm.invalidAddress'));
      }
    }
  }

  onAdvanced = () => {
    this.setState({
      advancedVisible: true,
    });
  }

  handleAdvancedCancel = () => {
    this.setState({
      advancedVisible: false,
    });
  }

  handleSaveOption = (gasPrice, gasLimit) => {
    this.setState({
      advancedVisible: false,
      advanced: true,
      advancedFee: formatNumByDecimals(new BigNumber(gasPrice).times(gasLimit).times(BigNumber(10).pow(9)).toString(10), WAN_ETH_DECIMAL),
    });
  }

  filterToOption = (inputValue, option) => {
    const value = option.props.name;
    return value.toLowerCase().indexOf(inputValue.toLowerCase()) > -1;
  }

  renderOption = item => {
    return (
      <Option key={item.address} text={item.name} name={item.name + '-' + item.address}>
        <div className="global-search-item">
          <span className="global-search-item-desc">
            {item.name}-{item.address}
          </span>
        </div>
      </Option>
    )
  }

  handleShowAddContactModal = () => {
    this.setState({ showAddContacts: !this.state.showAddContacts });
  }

  handleCreate = (address, name) => {
    const { currentTokenPairInfo: info, addAddress } = this.props;
    const chainSymbol = getFullChainName(info.toChainSymbol);
    console.log('chainSymbol', chainSymbol, 'currentTokenPairInfo', info, address, name)
    addAddress(chainSymbol, address, {
      name,
      address,
      chainSymbol
    }).then(async () => {
      this.setState({
        isNewContacts: false
      })
    })
  }

  handleChoose = address => {
    const { form } = this.props;
    form.setFieldsValue({
      to: address
    });
  }

  getChooseToAdd = () => {
    const { form } = this.props;
    let to = form.getFieldValue('to');
    if (this.accountSelections.includes(to)) {
      to = this.accountDataSelections.find(val => val.name === to).address;
    }
    return to;
  }

  render() {
    const { loading, form, from, settings, smgList, gasPrice, chainType, balance, type, account, getChainAddressInfoByChain, currentTokenPairInfo: info, coinPriceObj } = this.props;
    const { getFieldDecorator } = form;
    const { advancedVisible, advanced, advancedFee, operationFee, showChooseContacts, isNewContacts, showAddContacts, contactsList } = this.state;
    let gasFee, totalFee, desChain, title, tokenSymbol, toAccountList, quotaUnit, canAdvance, feeUnit;
    if (type === INBOUND) {
      desChain = info.toChainSymbol;
      toAccountList = getChainAddressInfoByChain(info.toChainSymbol);
      title = `${info.fromTokenSymbol}@${info.fromChainName} -> ${info.toTokenSymbol}@${info.toChainName}`;
      tokenSymbol = info.fromTokenSymbol;
      quotaUnit = info.fromTokenSymbol;
      feeUnit = info.fromChainSymbol;
      canAdvance = ['WAN', 'ETH'].includes(info.fromChainSymbol);
    } else {
      desChain = info.fromChainSymbol;
      toAccountList = getChainAddressInfoByChain(info.fromChainSymbol);
      title = `${info.toTokenSymbol}@${info.toChainName} -> ${info.fromTokenSymbol}@${info.fromChainName}`;
      tokenSymbol = info.toTokenSymbol;
      quotaUnit = info.toTokenSymbol;
      feeUnit = info.toChainSymbol;
      canAdvance = ['WAN', 'ETH'].includes(info.toChainSymbol);
    }
    this.accountSelections = this.addressSelections.map(val => getValueByAddrInfo(val, 'name', toAccountList));
    this.accountDataSelections = this.addressSelections.map(val => {
      const name = getValueByAddrInfo(val, 'name', toAccountList);
      return {
        address: val,
        name: name,
        text: `${name}-${val}`
      }
    })
    gasFee = advanced ? advancedFee : new BigNumber(gasPrice).times(FAST_GAS).div(BigNumber(10).pow(9)).toString(10);
    let defaultSelectStoreman = smgList.length === 0 ? '' : smgList[0].groupId;

    // Convert the value of fee to USD
    if ((typeof coinPriceObj === 'object') && feeUnit in coinPriceObj) {
      totalFee = `${new BigNumber(gasFee).plus(operationFee).times(coinPriceObj[feeUnit]).toString()} USD`;
    } else {
      totalFee = `${new BigNumber(gasFee).plus(operationFee).toString()} ${feeUnit}`;
    }
    gasFee = `${removeRedundantDecimal(gasFee)} ${feeUnit}`;
    let operationFeeWithUnit = `${removeRedundantDecimal(operationFee)} ${feeUnit}`;
    return (
      <div>
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={title}
          onCancel={this.onCancel}
          className={style['cross-chain-modal']}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} size="large" /* tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} */ className="loadingData">
            <div className="validator-bg">
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='from'
                disabled={true}
                options={{ initialValue: account }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('Common.from') + ' (' + getFullChainName(chainType) + ')'}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='balance'
                disabled={true}
                options={{ initialValue: balance + ` ${tokenSymbol}` }}
                prefix={<Icon type="wallet" className="colorInput" />}
                title={intl.get('Common.balance')}
              />
              <SelectForm
                form={form}
                colSpan={6}
                formName='storemanAccount'
                initialValue={defaultSelectStoreman}
                selectedList={smgList.map(v => ({
                  text: hexCharCodeToStr(v.groupId),
                  value: v.groupId
                }))}
                isTextValueData={true}
                handleChange={this.updateLockAccounts}
                formMessage={intl.get('Common.storemanGroup')}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='quota'
                disabled={true}
                options={{ initialValue: `${this.state.maxQuota} ${quotaUnit}`, rules: [{ validator: this.checkQuota }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.quota')}
              />
              {/* <AutoCompleteForm
                form={form}
                colSpan={6}
                formName='to'
                dataSource={this.accountSelections}
                formMessage={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}
                options={{ rules: [{ required: true }, { validator: this.checkTo }], initialValue: this.accountSelections[0] }}
              /> */}
              <div className="validator-line">
                <Row type="flex" justify="space-around" align="top">
                  <Col span={6}><span className="stakein-name">{intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}</span></Col>
                  <Col span={18}>
                    <Form layout="inline" id="selectForm">
                      <Form.Item>
                        {getFieldDecorator('to', { rules: [{ required: true }, { validator: this.checkTo }], initialValue: this.accountDataSelections[0].name })
                          (
                            <AutoComplete
                              dataSource={this.accountDataSelections.map(this.renderOption)}
                              filterOption={this.filterToOption}
                              optionLabelProp="text"
                              autoFocus
                            >
                              <Input suffix={
                                <Icon
                                  type="idcard"
                                  onClick={() => {
                                    this.setState({
                                      showChooseContacts: !showChooseContacts
                                    })
                                  }}
                                  className="colorInput"
                                />
                              } />
                            </AutoComplete>
                          )}
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </div>
              {
                isNewContacts
                  ? (
                      <div className="validator-line" style={{ margin: '0px 0px 10px', padding: '0 10px', height: 'auto' }}>
                        <Row type="flex" justify="space-around" align="top">
                          <Col span={6}></Col>
                          <Col span={18}>
                            <Button className={style.addNewContacts} shape="round" onClick={this.handleShowAddContactModal}>
                              <span className={style.magicTxt}>
                                {intl.get('NormalTransForm.addNewContacts')}
                              </span>
                            </Button>
                          </Col>
                        </Row>
                      </div>
                  )
                : null
              }
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='totalFee'
                disabled={true}
                options={{ initialValue: totalFee }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('CrossChainTransForm.estimateFee')}
                suffix={<Tooltip title={
                  <table className={style['suffix_table']}>
                    <tbody>
                      <tr><td>{intl.get('CrossChainTransForm.gasFee')}:</td><td>{gasFee}</td></tr>
                      <tr><td>{intl.get('CrossChainTransForm.operationFee')}:</td><td>{operationFeeWithUnit}</td></tr>
                    </tbody>
                  </table>
                }><Icon type="exclamation-circle" /></Tooltip>}
              />
              <CommonFormItem
                form={form}
                colSpan={6}
                formName='amount'
                placeholder={0}
                options={{ rules: [{ required: true, validator: this.checkAmount }] }}
                prefix={<Icon type="credit-card" className="colorInput" />}
                title={intl.get('Common.amount')}
              />
              <Checkbox onChange={this.sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>
              {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
              <p className="onAdvancedT"><span onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</span></p>
            </div>
          </Spin>
        </Modal>
        <Confirm tokenSymbol={tokenSymbol} chainType={chainType} estimateFee={form.getFieldValue('totalFee')} visible={this.state.confirmVisible} handleCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} type={type} loading={loading} />
        {advancedVisible && <AdvancedCrossChainModal chainType={chainType} onCancel={this.handleAdvancedCancel} onSave={this.handleSaveOption} from={from} />}
        {
          showAddContacts && <AddContactsModalForm handleSave={this.handleCreate} onCancel={this.handleShowAddContactModal} address={form.getFieldValue('to')} chain={getFullChainName(desChain)}></AddContactsModalForm>
        }
        {
          showChooseContacts && <ChooseContactsModalForm list={contactsList} to={this.getChooseToAdd()} handleChoose={this.handleChoose} onCancel={() => this.setState({ showChooseContacts: !showChooseContacts })}></ChooseContactsModalForm>
        }
      </div>
    );
  }
}

export default CrossChainTransForm;
