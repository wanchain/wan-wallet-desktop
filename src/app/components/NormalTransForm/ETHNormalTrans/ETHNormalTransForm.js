import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin, AutoComplete, Select } from 'antd';
import intl from 'react-intl-universal';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';
import AddContactsModal from '../../AddContacts/AddContactsModal';
import { checkETHAddr, getBalanceByAddr, checkAmountUnit, formatAmount, estimateGasForNormalTrans } from 'utils/helper';
import style from '../index.less';

const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);
const AddContactsModalForm = Form.create({ name: 'AddContactsModal' })(AddContactsModal);
const { Option } = Select;
const chainSymbol = 'Ethereum';

@inject(stores => ({
  settings: stores.session.settings,
  tokensList: stores.tokens.tokensList,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  from: stores.sendTransParams.currentFrom,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  transParams: stores.sendTransParams.transParams,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
  contacts: stores.contacts.contacts,
  updateGasLimit: gasLimit => stores.sendTransParams.updateGasLimit(gasLimit),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
  addAddress: (chain, addr, val) => stores.contacts.addAddress(chain, addr, val),
  hasSameContact: (addr, chain) => stores.contacts.hasSameContact(addr, chain),
}))

@observer
class ETHNormalTransForm extends Component {
  state = {
    gasFee: 0,
    advanced: false,
    confirmVisible: false,
    disabledAmount: false,
    advancedVisible: false,
    contactsList: [],
    isNewContacts: false,
    showAddContacts: false
  }

  constructor(props) {
    super(props);
    this.decimals = 18;
  }

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return false;
    };
  }

  componentDidMount() {
    this.processContacts();
  }

  processContacts = () => {
    const { normalAddr } = this.props.contacts;
    let contactsList = Object.values(normalAddr[chainSymbol]);
    this.setState({
      contactsList
    })
  }

  onAdvanced = () => {
    this.props.form.validateFields(['to', 'amount'], {
      force: true
    }, errors => {
      if (!errors) {
        this.setState({
          advancedVisible: true,
        });
      }
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
    const { form, balance, from, minGasPrice, transParams } = this.props;
    const { gasPrice, gasLimit } = transParams[from];
    let savedFee = new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);
    this.setState({
      gasFee: savedFee,
      advancedVisible: false,
      advanced: true,
    }, () => {
      if (this.state.disabledAmount) {
        form.setFieldsValue({
          amount: new BigNumber(balance).minus(savedFee).toString(10)
        });
      }
    });
  }

  handleNext = () => {
    const { form, from, updateTransParams, addrInfo, settings } = this.props;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext', err);
        return;
      };
      let { pwd, amount, to } = form.getFieldsValue(['pwd', 'amount', 'to']);
      let addrAmount = getBalanceByAddr(from, addrInfo);
      if (new BigNumber(addrAmount).minus(this.state.gasFee).lt(amount)) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd }, err => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to, amount: formatAmount(amount) });
            this.setState({ confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to, amount: formatAmount(amount) });
        this.setState({ confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, gasFee) => {
    let { form, from, balance } = this.props;
    this.props.updateTransParams(from, { gasLimit, gasPrice, nonce });
    this.setState({ gasFee })
    if (this.state.disabledAmount) {
      form.setFieldsValue({
        amount: new BigNumber(balance).minus(gasFee).toString(10)
      });
    }
  }

  updateGasLimit = () => {
    let data = '0x';
    let tx = {};
    let { form, from } = this.props;
    let { to } = form.getFieldsValue(['to']);
    try {
      tx = { from, to, data };
      wand.request('transaction_estimateGas', { chainType: 'ETH', tx }, (err, gasLimit) => {
        if (err) {
          message.warn(intl.get('NormalTransForm.estimateGasFailed'));
        } else {
          this.props.updateTransParams(from, { gasLimit });
          this.props.updateGasLimit(gasLimit);
        }
      });
    } catch (err) {
      console.log('updateGasLimit failed', err);
    }
  }

  estimateGasInAdvancedOptionForm = async (inputs) => {
    const { transParams, form, walletID } = this.props;
    const { from, to, amount } = form.getFieldsValue(['from', 'to', 'amount']);
    const { chainType, path } = transParams[from];
    let params = {
      walletID,
      chainType,
      symbol: chainType,
      path,
      to,
      amount,
      nonce: inputs.nonce,
      data: inputs.inputData,
    }
    return estimateGasForNormalTrans(params);
  }

  checkToETHAddr = (rule, value, callback) => {
    if (value === undefined) {
      this.setState({
        isNewContacts: false
      })
      callback(rule.message);
      return;
    }
    checkETHAddr(value).then(ret => {
      if (ret) {
        const isNewContacts = this.props.hasSameContact(value, chainSymbol);
        console.log('isNewContacts', isNewContacts)
        if (!this.state.advanced) {
          this.updateGasLimit();
        }
        this.setState({
          isNewContacts: !isNewContacts
        })
        callback();
      } else {
        console.log('check false')
        this.setState({
          isNewContacts: false
        })
        callback(rule.message);
      }
    }).catch(err => {
      console.log('checkToETHAddr:', err)
      this.setState({
        isNewContacts: false
      })
      callback(intl.get('network.down'));
    })
  }

  checkAmount = (rule, value, callback) => {
    if (value === undefined) {
      callback(rule.message);
      return;
    }
    if (new BigNumber(value).lte(0) || !checkAmountUnit(this.decimals, value)) {
      callback(rule.message);
      return;
    }
    if (!this.state.advanced) {
      this.updateGasLimit();
    }

    callback();
  }

  sendAllAmount = e => {
    let { form, balance } = this.props;
    if (e.target.checked) {
      form.setFieldsValue({
        amount: new BigNumber(balance).minus(this.state.gasFee).toString(10)
      });
      this.setState({
        disabledAmount: true,
      })
    } else {
      form.setFieldsValue({
        amount: 0
      });
      this.setState({
        disabledAmount: false,
      })
    }
  }

  renderOption = item => {
    return (
      <Option key={item.address} text={item.address} name={item.name}>
        <div className="global-search-item">
          <span className="global-search-item-desc">
            {item.name}-{item.address}
          </span>
        </div>
      </Option>
    )
  }

  handleCreate = (address, name) => {
    this.props.addAddress(chainSymbol, address, {
      name,
      address,
      chainSymbol
    }).then(async () => {
      this.setState({
        isNewContacts: false
      });
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
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, balance } = this.props;
    const { advancedVisible, confirmVisible, advanced, disabledAmount, contactsList, isNewContacts, showAddContacts } = this.state;
    const { gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;

    return (
      <div>
        <Modal
          visible
          wrapClassName={style.ETHNormalTransFormModal}
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
                {getFieldDecorator('balance', { initialValue: balance + ' ETH' })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('to', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkToETHAddr }] })
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
                {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkAmount }] })
                  (<Input disabled={disabledAmount} min={0} placeholder='0' prefix={<Icon type="credit-card" className="colorInput" />} />)}
                {<Checkbox onChange={this.sendAllAmount}>{intl.get('NormalTransForm.sendAll')}</Checkbox>}
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
                        <Radio.Button onClick={e => this.handleClick(e, minGasPrice, gasLimit, nonce, minFee)} value="minFee"><p>{intl.get('NormalTransForm.slow')}</p>{minFee} ETH</Radio.Button>
                        <Radio.Button onClick={e => this.handleClick(e, averageGasPrice, gasLimit, nonce, averageFee)} value="averageFee"><p>{intl.get('NormalTransForm.average')}</p>{averageFee} ETH</Radio.Button>
                        <Radio.Button onClick={e => this.handleClick(e, maxGasPrice, gasLimit, nonce, maxFee)} value="maxFee"><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} ETH</Radio.Button>
                      </Radio.Group>
                    )}
                  </Form.Item>
              }
              <p className="onAdvancedT"><span onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</span></p>
            </Form>
          </Spin>
        </Modal>
        <AdvancedOption visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} estimateGas={this.estimateGasInAdvancedOptionForm} from={from} chain='ETH' />
        {
          confirmVisible &&
          <Confirm chain='ETH' visible={true} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        }
        {
          showAddContacts && <AddContactsModalForm handleSave={this.handleCreate} onCancel={this.handleShowAddContactModal} address={form.getFieldValue('to')} chain={chainSymbol}></AddContactsModalForm>
        }
      </div>
    );
  }
}

export default ETHNormalTransForm;
