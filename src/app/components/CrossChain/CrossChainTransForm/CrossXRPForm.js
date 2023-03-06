import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { observer, MobXProviderContext } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Spin, Checkbox, Tooltip, AutoComplete, Input, Row, Col } from 'antd';

import style from './index.less';
import useAsync from 'hooks/useAsync';
import PwdForm from 'componentUtils/PwdForm';
import SelectForm from 'componentUtils/SelectForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import AddContactsModal from '../../AddContacts/AddContactsModal';
import ChooseContactsModal from '../../AddContacts/ChooseContactsModal';
import outboundOptionForm from 'components/AdvancedCrossChainOptionForm';
import ConfirmForm from 'components/CrossChain/CrossChainTransForm/ConfirmForm/CrossXRPConfirmForm';
import { WANPATH, INBOUND, XRPPATH, OUTBOUND, MINXRPBALANCE, ETHPATH, WALLETID } from 'utils/settings';
import { formatNumByDecimals, hexCharCodeToStr, isExceedBalance, formatNum, fromWei, removeRedundantDecimal } from 'utils/support';
import { getFullChainName, getStoremanAddrByGpk1, getValueByAddrInfo, checkAmountUnit, getValueByNameInfo, getBalance, getInfoByAddress, getValueByNameInfoAllType } from 'utils/helper';

const pu = require('promisefy-util');
const Confirm = Form.create({ name: 'CrossXRPConfirmForm' })(ConfirmForm);
const AdvancedOutboundOptionForm = Form.create({ name: 'AdvancedXRPCrossChainOptionForm' })(outboundOptionForm);
const { Option } = AutoComplete;
const AddContactsModalForm = Form.create({ name: 'AddContactsModal' })(AddContactsModal);
const ChooseContactsModalForm = Form.create({ name: 'AddContactsModal' })(ChooseContactsModal);

const CrossXRPForm = observer(({ form, toggleVisible, onSend }) => {
  const { languageIntl, crossChain, tokens, session: { settings }, contacts: { contacts, addAddress, hasSameContact }, portfolio: { coinPriceObj }, sendCrossChainParams: { record, updateXRPTransParams, XRPCrossTransParams } } = useContext(MobXProviderContext)
  const { toChainSymbol, fromTokenSymbol, fromChainName, toTokenSymbol, toChainName, fromChainSymbol, ancestorDecimals, fromChainID, toChainID } = crossChain.currentTokenPairInfo
  const { type, name, balance, address } = record;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('0');
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [sendAll, setSendAll] = useState(false);
  const [handleNextStatus, setHandleNextStatus] = useState(false);
  const [isNewContacts, setIsNewContacts] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [showChooseContacts, setShowChooseContacts] = useState(false);
  const [operationFee, setOperationFee] = useState('0')
  const [networkFee, setNetworkFee] = useState('0')

  const { status: fetchGroupListStatus, value: smgList } = useAsync('storeman_getReadyOpenStoremanGroupList', [], true);
  const { status: estimateCrossChainNetworkFeeStatus, value: estimateCrossChainNetworkFee } = useAsync('crossChain_estimateCrossChainNetworkFee', { value: '0', isPercent: false, minNetworkFeeLimit: '0', maxNetworkFeeLimit: '0' }, true, { chainType: type === INBOUND ? 'XRP' : toChainSymbol, dstChainType: type === INBOUND ? toChainSymbol : 'XRP', options: { tokenPairID: crossChain.currTokenPairId } });
  const { status: estimateCrossChainOperationFeeStatus, value: estimateCrossChainOperationFee } = useAsync('crossChain_estimateCrossChainOperationFee', { value: '0', isPercent: false, minOperationFeeLimit: '0', maxOperationFeeLimit: '0' }, true, { chainType: type === INBOUND ? 'XRP' : toChainSymbol, dstChainType: type === INBOUND ? toChainSymbol : 'XRP', options: { tokenPairID: crossChain.currTokenPairId } });

  const { status: fetchQuotaStatus, value: quotaList, execute: executeGetQuota } = useAsync('crossChain_getQuota', [{}], false);
  const { status: fetchFeeStatus, value: estimatedFee, execute: executeEstimatedFee } = useAsync('crossChain_estimatedXrpFee', '0', false);
  const { status: fetchGasPrice, value: gasPrice } = useAsync('query_getGasPrice', '0', type === OUTBOUND, { chainType: toChainSymbol });
  const { status: getAllBalancesStatus, value: getAllBalances } = useAsync('address_getAllBalances', [{ currency: 'XRP', value: '0' }], true, { chainType: 'XRP', address });

  const info = type === INBOUND ? {
    feeSymbol: fromChainSymbol,
    desChain: toChainSymbol,
    toAccountList: tokens.getChainAddressInfoByChain(toChainSymbol),
    title: `${fromTokenSymbol}@${fromChainName} -> ${toTokenSymbol}@${toChainName}`,
    unit: fromTokenSymbol,
    feeUnit: fromChainSymbol,
    toUnit: toTokenSymbol,
    operationFeeUnit: 'XRP',
    networkFeeUnit: 'XRP'
  } : {
    feeSymbol: toChainSymbol,
    desChain: fromChainSymbol,
    toAccountList: tokens.getChainAddressInfoByChain(fromChainSymbol),
    title: `${toTokenSymbol}@${toChainName} -> ${fromTokenSymbol}@${fromChainName}`,
    unit: toTokenSymbol,
    feeUnit: toChainSymbol,
    toUnit: fromTokenSymbol,
    operationFeeUnit: 'XRP',
    networkFeeUnit: toChainSymbol
  }

  const spin = useMemo(() => {
    return [fetchGroupListStatus, fetchQuotaStatus, estimateCrossChainOperationFeeStatus, estimateCrossChainNetworkFeeStatus, fetchGasPrice, fetchFeeStatus].includes('pending') || handleNextStatus;
  }, [fetchGroupListStatus, fetchQuotaStatus, estimateCrossChainOperationFeeStatus, estimateCrossChainNetworkFeeStatus, fetchGasPrice, fetchFeeStatus, handleNextStatus])

  const maxQuota = useMemo(() => {
    return formatNumByDecimals(quotaList[0].maxQuota, ancestorDecimals)
  }, [quotaList])

  const minQuota = useMemo(() => {
    return formatNumByDecimals(quotaList[0].minQuota, ancestorDecimals)
  }, [quotaList])

  const minReserveXrp = useMemo(() => {
    return (getAllBalances.length > 0 ? getAllBalances.length - 1 : 0) * 2 + MINXRPBALANCE;
  }, [getAllBalances])

  const contactsList = useMemo(() => {
    const { normalAddr } = contacts;
    const chainSymbol = getFullChainName(type === INBOUND ? toChainSymbol : fromChainSymbol);
    let contactsArr = Object.values(normalAddr[chainSymbol]);
    return contactsArr;
  }, [quotaList]);

  const fee = useMemo(() => {
    let tmp;
    if (type === INBOUND) {
      tmp = estimatedFee;
    } else {
      tmp = new BigNumber(gasPrice).div(BigNumber(10).pow(9)).times(XRPCrossTransParams.gasLimit).div(BigNumber(10).pow(9)).toString(10);
    }
    return tmp;
  }, [estimatedFee, gasPrice, XRPCrossTransParams.gasLimit])

  const crosschainFee = useMemo(() => {
    if (info.networkFeeUnit === info.operationFeeUnit) {
      return `${new BigNumber(networkFee).plus(operationFee).toString()} ${info.networkFeeUnit}`;
    } else {
      return `${new BigNumber(networkFee).toString()} ${info.networkFeeUnit} + ${new BigNumber(operationFee).toString()} ${info.operationFeeUnit}`;
    }
  }, [fee, coinPriceObj, operationFee, networkFee]);

  const userNetWorkFee = useMemo(() => {
    return `${fee} ${info.feeSymbol}`
  }, [fee])

  useEffect(() => {
    if (!estimateCrossChainNetworkFee.isPercent) {
      setNetworkFee(type === INBOUND ? formatNumByDecimals(estimateCrossChainNetworkFee?.value, ancestorDecimals) : fromWei(estimateCrossChainNetworkFee.value));
    }
  }, [estimateCrossChainNetworkFee])

  useEffect(() => {
    if (!estimateCrossChainOperationFee.isPercent) {
      setOperationFee(formatNumByDecimals(estimateCrossChainOperationFee?.value, ancestorDecimals));
    }
  }, [estimateCrossChainOperationFee])

  useEffect(() => {
    if (form.getFieldValue('amount')) {
      form.validateFields(['amount'], { force: true })
    }
  }, [quotaList])

  useEffect(() => {
    updateXRPTransParams({ gasPrice: fromWei(gasPrice, 'gwei') })
  }, [gasPrice])

  useEffect(() => {
    let groupId = smgList[0] ? smgList[0].groupId : '0x';
    if (groupId === '0x') return;
    executeGetQuota({ chainType: info.feeUnit, groupId, symbolArray: 'XRP', options: { targetChainType: info.desChain } })
    updateXRPTransParams({ groupAddr: getStoremanAddrByGpk1(smgList[0][`gpk${Number(smgList[0].curve2 === '0') + 1}`]), groupId: smgList[0].groupId, groupName: hexCharCodeToStr(smgList[0].groupId) })
  }, [smgList])

  useEffect(() => {
    if (fetchGroupListStatus === 'error') {
      // TODO: CHANGE WARNING MESSAGE
      message.warn(intl.get('network.down'));
    }
    if (fetchQuotaStatus === 'error') {
      message.warn(intl.get('CrossChainTransForm.getQuotaFailed'));
    }
    // TODO: CHANGE WARNING MESSAGE
    if (fetchFeeStatus === 'error') {
      message.warn(intl.get('network.down'));
    }
    if (fetchGasPrice === 'error') {
      message.warn(intl.get('network.down'));
    }
  }, [fetchGroupListStatus, fetchQuotaStatus, fetchFeeStatus, fetchGasPrice])

  const addressSelections = Object.keys({ ...info.toAccountList.normal, ...info.toAccountList.ledger, ...info.toAccountList.trezor });
  const accountSelections = addressSelections.map(val => getValueByAddrInfo(val, 'name', info.toAccountList));
  const accountDataSelections = addressSelections.map(val => {
    const name = getValueByAddrInfo(val, 'name', info.toAccountList);
    return {
      address: val,
      name: name,
      text: `${name}-${val}`
    }
  });

  const checkXRPBalance = (addr, type) => {
    return type === OUTBOUND ? getBalance([addr], 'XRP').then(val => new BigNumber(val[addr]).plus(receivedAmount).gte(minReserveXrp)).catch(() => false) : Promise.resolve(true)
  }

  const handleNext = () => {
    setHandleNextStatus(true)
    form.validateFields(err => {
      if (err) {
        console.log('handleNext', err);
        setHandleNextStatus(false)
        return;
      };
      const { pwd, amount } = form.getFieldsValue(['pwd', 'amount']);
      const isNativeAddress = addressSelections.includes(form.getFieldValue('to'));
      const isNativeAccount = accountSelections.includes(form.getFieldValue('to'));
      const desPath = info.desChain === 'WAN' ? WANPATH : ETHPATH;
      const toPathPrefix = type === INBOUND ? desPath : XRPPATH;
      let to, toAddr, walletID;
      let addrType = 'normal';
      let toValue = form.getFieldValue('to')
      if (type === INBOUND) {
        if (new BigNumber(balance).minus(amount).minus(fee).lt(minReserveXrp)) {
          message.warn(intl.get('NormalTransForm.insufficientFee'));
          setHandleNextStatus(false);
          return;
        }
      } else {
        const fromAddrBalance = getValueByNameInfoAllType(name, 'balance', tokens.getChainAddressInfoByChain(toChainSymbol))
        if (new BigNumber(fromAddrBalance).minus(networkFee).minus(fee).lt(0)) {
          message.warn(intl.get('NormalTransForm.insufficientFee'));
          setHandleNextStatus(false);
          return;
        }
      }
      if (isNativeAddress || isNativeAccount) {
        if (isNativeAccount) {
          addrType = getValueByNameInfoAllType(toValue, 'type', info.toAccountList);
          walletID = addrType === 'normal' ? 1 : WALLETID[addrType.toUpperCase()]
          to = addrType !== 'trezor'
                                    ? { walletID, path: addrType === 'normal' ? `${toPathPrefix}${getValueByNameInfo(toValue, 'path', info.toAccountList)}` : info.toAccountList[addrType][getValueByNameInfoAllType(toValue, 'address', info.toAccountList)].path }
                                    : getValueByNameInfoAllType(toValue, 'address', info.toAccountList)
          toAddr = getValueByNameInfoAllType(toValue, 'address', info.toAccountList);
        } else {
          addrType = getInfoByAddress(toValue, [], info.toAccountList).type
          walletID = addrType === 'normal' ? 1 : WALLETID[addrType.toUpperCase()]
          to = addrType !== 'trezor'
                                    ? { walletID, path: addrType === 'normal' ? `${toPathPrefix}${(getInfoByAddress(toValue, ['path'], info.toAccountList)).path}` : info.toAccountList[addrType][toValue].path }
                                    : toValue
          toAddr = toValue;
        }
      } else if (contactsList.find(v => v.name === to || v.address === to)) {
        const contactItem = contactsList.find(v => v.name === to || v.address === to);
        to = contactItem.address;
      } else {
        to = toAddr = toValue;
      }
      const params = { value: amount, to, toAddr, estimateCrossChainNetworkFee: estimateCrossChainNetworkFee.value, receivedAmount, networkFee }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd }, err => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            checkXRPBalance(toAddr, type).then(ret => {
              setHandleNextStatus(false)
              if (ret) {
                updateXRPTransParams(params);
                setConfirmVisible(true);
              } else {
                message.warn(intl.get('Xrp.notExistAccount', { minReserveXrp }))
              }
            })
          }
        })
      } else {
        checkXRPBalance(toAddr, type).then(ret => {
          setHandleNextStatus(false)
          if (ret) {
            updateXRPTransParams(params);
            setConfirmVisible(true);
          } else {
            message.warn(intl.get('Xrp.notExistAccount', { minReserveXrp }))
          }
        })
      }
    });
  }

  const updateLockAccounts = groupId => {
    executeGetQuota({ chainType: info.feeUnit, groupId, symbolArray: 'XRP', options: { targetChainType: info.desChain } })
    const smgInfo = smgList.find(v => v.groupId === groupId) || {};
    updateXRPTransParams({ groupAddr: getStoremanAddrByGpk1(smgInfo[`gpk${Number(smgInfo.curve2 === '0') + 1}`]), groupId, groupName: hexCharCodeToStr(smgInfo.groupId) });
  }

  const checkQuota = (rule, value, callback) => {
    value = value.split(' ')[0];
    if (new BigNumber(value).gt(0)) {
      let amount = form.getFieldValue('amount');
      if (isExceedBalance(value, amount)) {
        callback(rule.message);
        return;
      }
      callback();
    } else {
      callback(rule.message);
    }
  }

  const checkAmount = useCallback((rule, value, callback) => {
    const message = intl.get('NormalTransForm.amountIsIncorrect');

    try {
      if (new BigNumber(value).lte(0) || !checkAmountUnit(6, value)) {
        callback(message);
        setReceivedAmount('0');
        return;
      }
      if (new BigNumber(value).lt(minQuota)) {
        let errText = `${intl.get('CrossChainTransForm.invalidAmount1')}: ${minQuota} ${info.unit}`;
        callback(errText);
        setReceivedAmount('0');
        return;
      }
      if (new BigNumber(value).gt(maxQuota)) {
        callback(intl.get('CrossChainTransForm.overQuota'))
        setReceivedAmount('0');
        return;
      }

      // const finnalNetworkFee =
      //   estimateCrossChainNetworkFee.isPercent
      //     ? new BigNumber(value).multipliedBy(estimateCrossChainNetworkFee.value).toString()
      //     : type === INBOUND ? formatNumByDecimals(estimateCrossChainNetworkFee.value, ancestorDecimals) : fromWei(estimateCrossChainNetworkFee.value);
      // const finnalOperationFee =
      //   estimateCrossChainOperationFee.isPercent
      //   ? new BigNumber(value).multipliedBy(estimateCrossChainOperationFee.value).toString()
      //   : formatNumByDecimals(estimateCrossChainOperationFee.value, ancestorDecimals);

      let finnalNetworkFee, finnalOperationFee;
      if (estimateCrossChainNetworkFee.isPercent) {
        let tmp = new BigNumber(value).multipliedBy(estimateCrossChainNetworkFee.value);
        finnalNetworkFee = tmp.lt(estimateCrossChainNetworkFee.minNetworkFeeLimit)
                                ? estimateCrossChainNetworkFee.minNetworkFeeLimit
                                : tmp.gt(estimateCrossChainNetworkFee.maxNetworkFeeLimit) ? estimateCrossChainNetworkFee.maxNetworkFeeLimit : tmp.toString();
      } else {
        finnalNetworkFee = type === INBOUND ? formatNumByDecimals(estimateCrossChainNetworkFee.value, ancestorDecimals) : fromWei(estimateCrossChainNetworkFee.value);
      }

      if (estimateCrossChainOperationFee.isPercent) {
        let tmp = new BigNumber(value).multipliedBy(estimateCrossChainOperationFee.value);
        finnalOperationFee = tmp.lt(estimateCrossChainOperationFee.minOperationFeeLimit)
                                ? estimateCrossChainOperationFee.minOperationFeeLimit
                                : tmp.gt(estimateCrossChainOperationFee.maxOperationFeeLimit) ? estimateCrossChainOperationFee.maxOperationFeeLimit : tmp.toString();
      } else {
        finnalOperationFee = formatNumByDecimals(estimateCrossChainOperationFee.value, ancestorDecimals);
      }

      setNetworkFee(finnalNetworkFee);
      setOperationFee(finnalOperationFee);

      if (type === INBOUND) {
        if (new BigNumber(value).minus(finnalNetworkFee).minus(finnalOperationFee).lte(0)) {
          callback(message);
          setReceivedAmount('0');
          return;
        }
        if (new BigNumber(balance).minus(value).lte(minReserveXrp)) {
          callback(intl.get('Xrp.minAmount', { minReserveXrp }));
          setReceivedAmount('0');
          return;
        }
        let toAddr;
        let toValue = form.getFieldValue('to');
        const isNativeAddress = addressSelections.includes(toValue);
        const isNativeAccount = accountSelections.includes(toValue);
        if (isNativeAddress || isNativeAccount) {
          toAddr = isNativeAccount ? getValueByNameInfoAllType(toValue, 'address', info.toAccountList) : toValue
        } else {
          toAddr = toValue;
        }
        executeEstimatedFee({ from: address, to: XRPCrossTransParams.groupAddr, value, wanAddress: toAddr })
        setReceivedAmount(new BigNumber(value).minus(finnalNetworkFee).minus(finnalOperationFee).toString(10));
      } else {
        if (new BigNumber(balance).lt(value)) {
          callback(message);
          return;
        }
        if (new BigNumber(value).minus(finnalOperationFee).lte(0)) {
          callback(intl.get('CrossChainTransForm.overOriginalBalance'));
          return;
        }
        setReceivedAmount(new BigNumber(value).minus(finnalOperationFee).toString(10));
      }
      callback();
    } catch (err) {
      callback(message);
    }
  })

  const checkToAddr = async (rule, value, callback) => {
    try {
      const isNativeAddress = addressSelections.includes(value);
      const isNativeAccount = accountSelections.includes(value);
      const chainSymbol = getFullChainName(info.desChain);
      const isNewContactsState = hasSameContact(value, chainSymbol);
      if (!(isNativeAddress || isNativeAccount)) {
        if (type === INBOUND) {
          pu.promisefy(wand.request, ['address_isEthAddress', { address: value }], this).then(ret => {
            if (ret) {
              setIsNewContacts(!isNewContactsState);
              callback();
            } else {
              setIsNewContacts(false);
              callback(intl.get('NormalTransForm.invalidAddress'));
            }
          }).catch(() => {
            setIsNewContacts(false);
            callback(intl.get('NormalTransForm.invalidAddress'));
          })
        } else {
          pu.promisefy(wand.request, ['address_isXrpAddress', { address: value }], this).then(ret => {
            if (ret[0] || ret[1]) {
              setIsNewContacts(!isNewContactsState);
              callback();
            } else {
              setIsNewContacts(false);
              callback(intl.get('NormalTransForm.invalidAddress'));
            }
          }).catch(() => {
            setIsNewContacts(false);
            callback(intl.get('NormalTransForm.invalidAddress'));
          })
        }
      } else {
        setIsNewContacts(false);
        callback();
      }
    } catch (err) {
      callback(intl.get('NormalTransForm.invalidAddress'))
    }
  }

  const sendAllAmount = e => {
    if (e.target.checked) {
      setSendAll(true);
      form.setFieldsValue({ amount: balance }, () => {
        form.validateFields(['amount'], { force: true });
      });
    } else {
      setSendAll(false)
      form.setFieldsValue({ amount: 0 });
    }
  }

  const handleOutBoundSaveOption = (gasPrice, gasLimit) => {
    updateXRPTransParams({ gasPrice, gasLimit });
    setAdvancedVisible(false);
  }

  const filterToOption = (inputValue, option) => {
    const value = option.props.name;
    return value.toLowerCase().indexOf(inputValue.toLowerCase()) > -1;
  }

  const renderOption = item => {
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

  const handleShowAddContactModal = () => {
    setShowAddContacts(!showAddContacts);
  }

  const handleCreate = (address, name) => {
    const chainSymbol = getFullChainName(info.toChainSymbol);
    addAddress(chainSymbol, address, {
      name,
      address,
      chainSymbol
    }).then(async () => {
      setIsNewContacts(false);
    })
  }

  const handleChoose = address => {
    form.setFieldsValue({
      to: address
    });
  }

  const getChooseToAdd = () => {
    let to = form.getFieldValue('to');
    if (accountSelections.includes(to)) {
      to = accountDataSelections.find(val => val.name === to).address;
    }
    return to;
  }

  const operationFeeWithUnit = useMemo(() => {
    return `${removeRedundantDecimal(operationFee)} ${info.operationFeeUnit}`;
  }, [operationFee, info.operationFeeUnit])

  const networkFeeWithUnit = useMemo(() => {
    return `${removeRedundantDecimal(networkFee)} ${info.networkFeeUnit}`;
  }, [networkFee, info.networkFeeUnit])

  return (
    <React.Fragment>
      <Modal
        visible
        destroyOnClose={true}
        closable={false}
        title={info.title}
        onCancel={toggleVisible}
        className={style['cross-chain-modal']}
        footer={[
          <Button key="back" className="cancel" onClick={toggleVisible}>{intl.get('Common.cancel')}</Button>,
          <Button disabled={spin} key="submit" type="primary" onClick={handleNext}>{intl.get('Common.next')}</Button>,
        ]}
      >
        <Spin spinning={spin} size="large" className="loadingData">
          <div className="validator-bg">
            <CommonFormItem
              form={form}
              colSpan={6}
              formName='from'
              disabled={true}
              options={{ initialValue: name }}
              prefix={<Icon type="wallet" className="colorInput" />}
              title={intl.get('Common.from') + ' (' + getFullChainName(fromChainSymbol) + ')'}
            />
            <CommonFormItem
              form={form}
              colSpan={6}
              formName='balance'
              disabled={true}
              options={{ initialValue: formatNum(balance) + ` ${info.unit}` }}
              prefix={<Icon type="wallet" className="colorInput" />}
              title={intl.get('Common.balance')}
            />
            <SelectForm
              form={form}
              colSpan={6}
              formName='storemanAccount'
              initialValue={smgList.length === 0 ? '' : smgList[0].groupId}
              selectedList={smgList.map(v => ({ text: hexCharCodeToStr(v.groupId), value: v.groupId }))}
              isTextValueData={true}
              handleChange={updateLockAccounts}
              formMessage={intl.get('Common.storemanGroup')}
            />
            <CommonFormItem
              form={form}
              colSpan={6}
              formName='quota'
              disabled={true}
              options={{ initialValue: `${maxQuota} ${info.unit}`, rules: [{ validator: checkQuota, message: intl.get('CrossChainTransForm.overQuota') }] }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('CrossChainTransForm.quota')}
            />
            {/* <AutoCompleteForm
              form={form}
              colSpan={6}
              formName='to'
              dataSource={accountSelections}
              formMessage={intl.get('NormalTransForm.to') + ' (' + getFullChainName(info.desChain) + ')'}
              options={{ rules: [{ required: true, validator: checkToAddr }], initialValue: accountSelections[0] }}
            /> */}
              <div className="validator-line">
                <Row type="flex" justify="space-around" align="top">
                  <Col span={6}><span className="stakein-name">{intl.get('NormalTransForm.to') + ' (' + getFullChainName(info.desChain) + ')'}</span></Col>
                  <Col span={18}>
                    <Form layout="inline" id="selectForm">
                      <Form.Item>
                        {form.getFieldDecorator('to', { rules: [{ required: true }, { validator: checkToAddr }], initialValue: accountDataSelections[0].name })
                          (
                            <AutoComplete
                              dataSource={accountDataSelections.map(renderOption)}
                              filterOption={filterToOption}
                              optionLabelProp="text"
                              autoFocus
                            >
                              <Input suffix={
                                <Icon
                                  type="idcard"
                                  onClick={() => {
                                    setShowChooseContacts(!showChooseContacts);
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
                            <Button className={style.addNewContacts} shape="round" onClick={handleShowAddContactModal}>
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
              formName='txFee'
              disabled={true}
              options={{ initialValue: userNetWorkFee }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('CrossChainTransForm.transactionFee')}
            />
            <CommonFormItem
              form={form}
              colSpan={6}
              formName='totalFee'
              disabled={true}
              options={{ initialValue: crosschainFee }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('CrossChainTransForm.crosschainFee')}
              // suffix={<Tooltip title={
              //   <table className={style['suffix_table']}>
              //     <tbody>
              //       <tr><td>{intl.get('CrossChainTransForm.networkFee')}:</td><td>{networkFeeWithUnit}</td></tr>
              //       <tr><td>{intl.get('CrossChainTransForm.operationFee')}:</td><td>{operationFeeWithUnit}</td></tr>
              //     </tbody>
              //   </table>
              // }><Icon type="exclamation-circle" /></Tooltip>}
            />
            <CommonFormItem
              form={form}
              colSpan={6}
              formName='amount'
              placeholder={0}
              options={{ rules: [{ required: true, validator: checkAmount }] }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('Common.amount')}
            />
            <CommonFormItem
              form={form}
              colSpan={6}
              formName='receive'
              disabled={true}
              options={{ initialValue: `${receivedAmount} ${info.toUnit}` }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('CrossChainTransForm.youWillReceive')}
            />
            {type === OUTBOUND && <Checkbox checked={sendAll} onChange={sendAllAmount} style={{ padding: '0px 20px' }}>{intl.get('NormalTransForm.sendAll')}</Checkbox>}
            {settings.reinput_pwd && <PwdForm form={form} colSpan={6} />}
            {type === OUTBOUND && <p className="onAdvancedT"><span onClick={() => setAdvancedVisible(true)}>{intl.get('NormalTransForm.advancedOptions')}</span></p>}
          </div>
        </Spin>
      </Modal>
      { confirmVisible && <Confirm visible={true} received={form.getFieldValue('receive')} userNetWorkFee={userNetWorkFee} crosschainFee={crosschainFee} onCancel={() => setConfirmVisible(false)} sendTrans={onSend} toName={form.getFieldValue('to')}/> }
      { advancedVisible && type === OUTBOUND && <AdvancedOutboundOptionForm symbol={'XRP'} chainType={toChainSymbol} onCancel={() => setAdvancedVisible(false)} onSave={handleOutBoundSaveOption} from={address} />}
      {
        showAddContacts && <AddContactsModalForm handleSave={handleCreate} onCancel={handleShowAddContactModal} address={form.getFieldValue('to')} chain={getFullChainName(info.desChain)}></AddContactsModalForm>
      }
      {
        showChooseContacts && <ChooseContactsModalForm list={contactsList} to={getChooseToAdd()} handleChoose={handleChoose} onCancel={() => setShowChooseContacts(!showChooseContacts)}></ChooseContactsModalForm>
      }
    </React.Fragment>
  )
});

export default CrossXRPForm;
