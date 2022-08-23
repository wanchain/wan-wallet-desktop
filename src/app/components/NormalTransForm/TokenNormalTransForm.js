import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin, AutoComplete } from 'antd';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import AddContactsModal from '../AddContacts/AddContactsModal';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';
import { checkWanAddr, checkETHAddr, checkBTCAddr, getBalanceByAddr, checkAmountUnit, encodeTransferInput, getFullChainName } from 'utils/helper';
import style from './index.less';

const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);
const AddContactsModalForm = Form.create({ name: 'AddContactsModal' })(AddContactsModal);

@inject(stores => ({
  settings: stores.session.settings,
  tokensList: stores.tokens.tokensList,
  language: stores.languageIntl.language,
  from: stores.sendTransParams.currentFrom,
  tokensBalance: stores.tokens.tokensBalance,
  tokenAddr: stores.tokens.currTokenAddr,
  currTokenChain: stores.tokens.currTokenChain,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  transParams: stores.sendTransParams.transParams,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
  contacts: stores.contacts.contacts,
  updateGasLimit: gasLimit => stores.sendTransParams.updateGasLimit(gasLimit),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
  getTokenInfoFromTokensListByAddr: addr => stores.tokens.getTokenInfoFromTokensListByAddr(addr),
  getChainAddressInfoByChain: chain => stores.tokens.getChainAddressInfoByChain(chain),
  addAddress: (chain, addr, val) => stores.contacts.addAddress(chain, addr, val),
  hasSameContact: (addr, chain) => stores.contacts.hasSameContact(addr, chain),
}))

@observer
class TokenNormalTransForm extends Component {
  state = {
    gasFee: 0,
    advanced: false,
    confirmVisible: false,
    disableAmount: false,
    advancedVisible: false,
    contactsList: [],
    isNewContacts: false,
    showAddContacts: false,
    chainSymbol: '',
  }

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return false;
    };
  }

  componentDidMount() {
    this.setState({
      chainSymbol: getFullChainName(this.props.currTokenChain)
    }, () => {
      this.processContacts();
    })
  }

  processContacts = () => {
    const { chainSymbol } = this.state;
    const { normalAddr } = this.props.contacts;
    let contactsList = Object.values(normalAddr[chainSymbol]);
    this.setState({
      contactsList
    })
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

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  onCancel = () => {
    this.setState({
      advanced: false
    });
    this.props.onCancel();
  }

  handleSave = () => {
    const { from, minGasPrice, transParams } = this.props;
    const { gasPrice, gasLimit } = transParams[from];
    let savedFee = new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);

    this.setState({
      gasFee: savedFee,
      advancedVisible: false,
      advanced: true,
    });
  }

  handleNext = () => {
    const { updateTransParams, settings, balance, tokenAddr, currTokenChain, form, from, getChainAddressInfoByChain } = this.props;
    let addrInfo = getChainAddressInfoByChain(currTokenChain);
    if (addrInfo === undefined) {
      message.warn(intl.get('Unknown token type')); // TODO : i18n
      return;
    }
    form.validateFields((err, values) => {
      if (err) {
        console.log('TokenNormalTransForm_handleNext', err);
        return;
      };
      let { pwd, amount: token, transferTo } = values;
      let addrAmount = getBalanceByAddr(from, addrInfo);
      if (new BigNumber(addrAmount).lt(this.state.gasFee) || new BigNumber(balance).lt(token)) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }

      if (this.state.advanced) {
        this.getNewData();
      }

      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: tokenAddr, transferTo, token });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        if (this.state.advanced) {
          this.getNewData();
        }
        updateTransParams(from, { to: tokenAddr, transferTo, token })
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, gasFee) => {
    const { updateTransParams, from } = this.props;
    this.setState({ gasFee });
    updateTransParams(from, { gasLimit, gasPrice, nonce });
  }

  updateGasLimit = () => {
    let data = '0x';
    let { form, tokenAddr, from, currTokenChain } = this.props;
    let { transferTo } = form.getFieldsValue(['transferTo']);
    try {
      if (transferTo) {
        data = this.getNewData();
      }
      let tx = { from, to: tokenAddr, data, value: '0x0' };
      wand.request('transaction_estimateGas', { chainType: currTokenChain, tx }, (err, gasLimit) => {
        if (err) {
          message.warn(intl.get('NormalTransForm.estimateGasFailed'));
        } else {
          this.props.updateTransParams(from, { gasLimit });
          this.props.updateGasLimit(gasLimit)
        }
      });
    } catch (err) {
      console.log('updateGasLimit failed');
    }
  }

  getNewData = () => {
    let data = '0x';
    let { form, tokenAddr, from, getTokenInfoFromTokensListByAddr } = this.props;
    let { transferTo, amount } = form.getFieldsValue(['transferTo', 'amount']);
    let tokenInfo = getTokenInfoFromTokensListByAddr(tokenAddr);
    let decimals = tokenInfo.decimals;
    data = encodeTransferInput(transferTo, decimals, amount || 0);
    this.props.updateTransParams(from, { data });
    return data;
  }

  checkToWANAddr = (rule, value, callback) => {
    let { tokenAddr, currTokenChain } = this.props;
    const { chainSymbol } = this.state;
    if (value === undefined) {
      this.setState({ isNewContacts: false });
      callback(rule.message);
      return;
    }

    if (value.toLowerCase() === tokenAddr.toLowerCase()) {
      this.setState({ isNewContacts: false });
      callback(rule.message);
    }

    let checkFunc = null;
    switch (currTokenChain) {
      case 'WAN':
        checkFunc = addr => Promise.all([checkWanAddr(addr), checkETHAddr(addr)]).then(ret => ret[0] || ret[1]);
        break;
      case 'ETH':
        checkFunc = checkETHAddr;
        break;
      case 'BTC':
        checkFunc = checkBTCAddr;
        break;
      case 'BNB':
        checkFunc = checkETHAddr;
        break;
      default:
        callback(rule.message);
        return;
    }
    const isNewContacts = this.props.hasSameContact(value, chainSymbol);
    checkFunc(value).then(ret => {
      if (ret) {
        if (!this.state.advanced) {
          this.updateGasLimit();
        }
        this.setState({ isNewContacts: !isNewContacts });
        callback();
      } else {
        this.setState({ isNewContacts: false });
        callback(rule.message);
      }
    }).catch(err => {
      console.log('checkToWANAddr:', err)
      this.setState({ isNewContacts: false });
      callback(intl.get('network.down'));
    })
  }

  checkTokenAmount = (rule, value, callback) => {
    let { tokenAddr, balance, getTokenInfoFromTokensListByAddr } = this.props;
    let { decimals } = getTokenInfoFromTokensListByAddr(tokenAddr);
    if (value === undefined) {
      callback(rule.message);
      return;
    }
    if (new BigNumber(value).lte(0) || !checkAmountUnit(decimals, value)) {
      callback(rule.message)
      return;
    }
    if (new BigNumber(value).gt(balance)) {
      callback(intl.get('NormalTransForm.overBalance'));
      return;
    }
    if (!this.state.advanced) {
      this.updateGasLimit();
    }

    callback();
  }

  sendAllTokenAmount = e => {
    let { form, balance } = this.props;
    if (e.target.checked) {
      form.setFieldsValue({
        amount: balance.toString().replace(/,/g, '')
      });
      this.setState({
        disableAmount: true,
      })
      if (!this.state.advanced) {
        this.updateGasLimit();
      }
    } else {
      form.setFieldsValue({
        amount: 0
      });
      this.setState({
        disableAmount: false,
      })
    }
  }

  renderOption = item => {
    return (
      <AutoComplete.Option key={item.address} text={item.address} name={item.name}>
        <div className="global-search-item">
          <span className="global-search-item-desc">
            {item.name}-{item.address}
          </span>
        </div>
      </AutoComplete.Option>
    )
  }

  handleCreate = (address, name) => {
    const { chainSymbol } = this.state;
    this.props.addAddress(chainSymbol, address, {
      name,
      address,
      chainSymbol
    }).then(async () => {
      this.setState({
        isNewContacts: false
      })
      this.processContacts();
    })
  }

  handleShowAddContactModal = () => {
    this.setState({
      showAddContacts: !this.state.showAddContacts
    })
  }

  filterContactList = (inputValue, option) => {
    const text = option.props.text.toLowerCase();
    const name = option.props.name.toLowerCase();
    const inp = inputValue.toLowerCase();
    return text.includes(inp) || name.includes(inp);
  }

  render() {
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, balance, currTokenChain, symbol } = this.props;
    const { advancedVisible, confirmVisible, advanced, disableAmount, contactsList, isNewContacts, showAddContacts, chainSymbol } = this.state;
    const { gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;
    return (
      <div>
        <Modal
          visible
          wrapClassName={style.normalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('NormalTransForm.transaction')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} size="large" /* tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} */ className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
              <Form.Item label={intl.get('Common.from')}>
                {getFieldDecorator('from', { initialValue: from })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.balance')}>
                {getFieldDecorator('balance', { initialValue: balance + ` ${symbol}` })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('transferTo', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkToWANAddr }] })
                  (
                    <AutoComplete
                      getPopupContainer={node => node.parentNode}
                      size="large"
                      style={{ width: '100%' }}
                      filterOption={this.filterContactList}
                      dataSource={contactsList.map(this.renderOption)}
                      placeholder="input here"
                      optionLabelProp="text"
                    >
                      <Input placeholder={intl.get('NormalTransForm.recipientAddress')} prefix={<Icon type="wallet" className="colorInput" />} />
                    </AutoComplete>
                  )}
                  {
                    isNewContacts
                    ? <Button className={style.addNewContacts} shape="round" onClick={this.handleShowAddContactModal}>
                      <span className={style.magicTxt}>
                        {intl.get('NormalTransForm.addNewContacts')}
                      </span>
                    </Button>
                    : null
                  }
              </Form.Item>
              <Form.Item label={intl.get('Common.amount')}>
                {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkTokenAmount }] })
                  (<Input disabled={disableAmount} min={0} placeholder='0' prefix={<Icon type="credit-card" className="colorInput" />} />)}
                <Checkbox onChange={this.sendAllTokenAmount}>{intl.get('NormalTransForm.sendAll')}</Checkbox>
              </Form.Item>
              {
                settings.reinput_pwd &&
                <Form.Item label={intl.get('NormalTransForm.password')}>
                  {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                    (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                </Form.Item>
              }
              {
                advanced
                  ? <Form.Item label={intl.get('NormalTransForm.fee')}>
                    {getFieldDecorator('fixedFee', { initialValue: this.state.gasFee, rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                      <Input disabled={true} className="colorInput" />
                    )}
                  </Form.Item>
                  : <Form.Item label={intl.get('NormalTransForm.fee')}>
                    {getFieldDecorator('fee', { rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                      <Radio.Group>
                        <Radio.Button onClick={e => this.handleClick(e, minGasPrice, gasLimit, nonce, minFee)} value="minFee"><p>{intl.get('NormalTransForm.slow')}</p>{minFee} {currTokenChain}</Radio.Button>
                        <Radio.Button onClick={e => this.handleClick(e, averageGasPrice, gasLimit, nonce, averageFee)} value="averageFee"><p>{intl.get('NormalTransForm.average')}</p>{averageFee} {currTokenChain}</Radio.Button>
                        <Radio.Button onClick={e => this.handleClick(e, maxGasPrice, gasLimit, nonce, maxFee)} value="maxFee"><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} {currTokenChain}</Radio.Button>
                      </Radio.Group>
                    )}
                  </Form.Item>
              }
              <p className="onAdvancedT"><span onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</span></p>
            </Form>
          </Spin>
        </Modal>

        <AdvancedOption transType={this.props.transType} visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} from={from} chain={currTokenChain} />
        {
          confirmVisible &&
          <Confirm tokenAddr={this.props.tokenAddr} transType={this.props.transType} chain={currTokenChain} visible={true} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        }
        {
          showAddContacts && <AddContactsModalForm handleSave={this.handleCreate} onCancel={this.handleShowAddContactModal} address={form.getFieldValue('transferTo')} chain={chainSymbol}></AddContactsModalForm>
        }
      </div>
    );
  }
}

export default TokenNormalTransForm;
