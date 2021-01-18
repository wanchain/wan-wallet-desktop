import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import { message, Button, Form } from 'antd';
import { observer, MobXProviderContext } from 'mobx-react';
import React, { useState, useContext } from 'react';

import XRPNormalTransForm from 'components/NormalTransForm/XRPNormalTrans/XRPNormalTransForm'

const CollectionCreateForm = Form.create({ name: 'XRPNormalTransForm' })(XRPNormalTransForm);

const SendETHNormalTrans = observer(({ from, balance, path }) => {
  const { languageIntl, session: { chainId }, sendTransParams: { updateXRPTransParams, XRPTransParams } } = useContext(MobXProviderContext)
  const [spin, setSpin] = useState(true);
  const [visible, setVisible] = useState(false);

  const showModal = async () => {
    if (BigNumber(balance).eq('0')) {
      message.warn(intl.get('SendNormalTrans.hasNoETHBalance'));
      return;
    }
    setVisible(true);
    try {
      updateXRPTransParams({ from, chainId, BIP44Path: path });
      setSpin(false);
    } catch (err) {
      console.log(`showModal: ${err}`)
      message.warn(intl.get('network.down'));
    }
  }

  const handleCancel = () => {
    setSpin(true);
    setVisible(false);
  }

  const sendTrans = () => {
    return new Promise((resolve, reject) => {
      wand.request('transaction_XRPNormal', XRPTransParams, (err, txHash) => {
        if (err) {
          message.warn(intl.get('WanAccount.sendTransactionFailed'));
          console.log(err);
          reject(false); // eslint-disable-line prefer-promise-reject-errors
        } else {
          if (txHash.code === false) {
            message.warn(intl.get('WanAccount.sendTransactionFailed'));
            reject(txHash.result);
          } else {
            message.success(intl.get('WanAccount.sendTransactionSuccessFully'));
            console.log('Tx hash: ', txHash);
            resolve(txHash)
          }
        }
      });
    })
  }

  const handleSend = () => {
    sendTrans().catch(err => {
      console.log(err);
    }).finally(() => {
      setSpin(true);
      setVisible(false);
    });
  }

  return (
    <React.Fragment>
      <Button type="primary" onClick={showModal}>{intl.get('Common.send')}</Button>
      {
        visible &&
        <CollectionCreateForm from={from} balance={balance} onCancel={handleCancel} onSend={handleSend} spin={spin}/>
      }
    </React.Fragment>
  );
})

export default SendETHNormalTrans;
