import intl from 'react-intl-universal';
import { message, Button, Form } from 'antd';
import React, { useState, useContext } from 'react';
import { observer, MobXProviderContext } from 'mobx-react';

import useToggle from 'hooks/useToggle';
import { INBOUND, CROSS_TYPE } from 'utils/settings';
import CrossXRPForm from 'components/CrossChain/CrossChainTransForm/CrossXRPForm';

const CollectionCreateForm = Form.create({ name: 'CrossXRPForm' })(CrossXRPForm);

const XRPTrans = observer(({ record, type, symbol, tokenPairsInfo, tokenPairID }) => {
  const { languageIntl, sendCrossChainParams: { updateRecord, updateXRPTransParams, XRPCrossTransParams } } = useContext(MobXProviderContext)
  const [visible, toggleVisible] = useToggle(false);

  const showModal = () => {
    updateRecord(Object.assign(record, { type }));
    updateXRPTransParams({ from: { walletID: 1, path: record.path }, fromAddr: record.address });
    toggleVisible()
  }

  const handleSend = () => {
    const input = {
      tokenPairID,
      crossType: CROSS_TYPE[0],
      to: XRPCrossTransParams.to,
      from: XRPCrossTransParams.from,
      value: XRPCrossTransParams.value,
      storeman: XRPCrossTransParams.groupId,
      smgXrpAddr: XRPCrossTransParams.groupAddr,
      networkFee: XRPCrossTransParams.networkFee,
    }
    const info = type === INBOUND ? {
      sourceSymbol: tokenPairsInfo.fromChainSymbol,
      sourceAccount: tokenPairsInfo.fromAccount,
      destinationSymbol: tokenPairsInfo.toChainSymbol,
      destinationAccount: tokenPairsInfo.toAccount,
    } : {
      sourceSymbol: tokenPairsInfo.toChainSymbol,
      sourceAccount: tokenPairsInfo.toAccount,
      destinationSymbol: tokenPairsInfo.fromChainSymbol,
      destinationAccount: tokenPairsInfo.fromAccount,
    }
    const trans = Object.assign(info, { input, tokenPairID, type: 'LOCK' })

    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossChain', trans, (err, txHash) => {
        if (err) {
          if (err instanceof Object && err.desc && err.desc.includes('ready')) {
            message.warn(intl.get('Common.networkError'));
          } else {
            message.warn(err.desc);
          }
          toggleVisible();
        } else {
          if (txHash.code === false) {
            message.warn(intl.get('WanAccount.sendTransactionFailed'));
            toggleVisible();
          } else {
            message.success(intl.get('WanAccount.sendTransactionSuccessFully'));
            console.log('Tx hash: ', txHash);
            toggleVisible()
          }
        }
      });
    })
  }

  return (
    <React.Fragment>
      <Button type="primary" onClick={showModal}>{intl.get('Common.convert')}</Button>
      {
        visible &&
        <CollectionCreateForm symbol={symbol} toggleVisible={toggleVisible} onSend={handleSend}/>
      }
    </React.Fragment>
  )
});

export default XRPTrans;
