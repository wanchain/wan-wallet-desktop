import React, { useState, useEffect, useCallback } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, Button, Row, Col, Tooltip, message, Icon, Modal, Table } from 'antd';
import { getNonce, checkWanAddr, getGasPrice } from '../../../utils/helper';
import { wandWrapper } from '../../../utils/support';
import FileSelection from 'componentUtils/FileSelection';
import styled from 'styled-components';

const colums = [
  {
    title: 'Nonce',
    dataIndex: 'nonce',
    key: 'Nonce',
  },
  {
    title: 'To',
    dataIndex: 'toAddress',
    key: 'toAddress',
  },
  {
    title: 'Method',
    dataIndex: 'method',
    key: 'method',
  },
  {
    title: 'Paras',
    dataIndex: 'paras',
    key: 'paras',
    render: paras => <div>{JSON.stringify(paras)}</div>,
  },
  {
    title: 'Value',
    dataIndex: 'value',
    key: 'value',
  },
]

export default function Online(props) {
  const [nonce, setNonce] = useState(0);
  const [gasPrice, setGasPrice] = useState(1);
  const wanAddresses = props.wanAddresses;
  const ethAddresses = props.ethAddresses;
  const [fromAddress, setFromAddress] = useState();
  const [offlineJson, setOfflineJson] = useState();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offlinePath, setOfflinePath] = useState();
  const [chainType, setChainType] = useState('WAN');

  console.log('fromAddress', fromAddress);

  const onUploadCheck = (value, files) => {
    if (value) {
      var reader = new FileReader();
      reader.readAsText(files[0], 'UTF-8');
      reader.onload = (evt) => {
        var fileString = evt.target.result;
        let obj = JSON.parse(fileString);
        setChainType(obj[0].chain);
        setOfflineJson(obj);
        console.log('wandWrapper', wandWrapper, files[0].path)
        wandWrapper('contract_setFilePath', { inputPath: files[0].path }).then((ret) => {
          console.log('ret', ret);
          setShowModal(true);
        }).catch(() => {
          message.error('Failed, please check sdk log 1');
        });
      }
    }
  }

  const OfflineModal = () => {
    return <Modal
      title={intl.get('contract.offlineTransactionConfirm')}
      visible={showModal}
      footer={[
        <Button key="back" className="cancel-button" onClick={() => { setShowModal(false); setOfflinePath(undefined); }}>{intl.get('Common.cancel')}</Button>,
        <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={() => {
          console.log('send');
          setLoading(true);
          wandWrapper('contract_sendTx', { chainType }).then(ret => {
            console.log('sendTx', ret);
            if (ret) {
              message.success('Success');
              setShowModal(false);
            } else {
              message.info('Send failed, please check sdk log');
            }
          }).catch((err, ret) => {
            console.log(err, ret);
            message.error('Send failed, please check sdk log 2');
          }).finally(() => {
            setLoading(false);
          });
          setOfflinePath(undefined);
        }}>{intl.get('Common.send')}</Button>,
      ]}
    >
      <Title>{intl.get('contract.fromAddress')}</Title>
      <Title>{offlineJson && offlineJson.length > 0 ? offlineJson[0].sender : 'None'}</Title>
      <p style={{ height: '20px' }}></p>
      <StyledTable columns={colums} dataSource={offlineJson} />
    </Modal>
  }

  return (<Body>
    <OfflineModal />
    <Title>{intl.get('contract.selectChain')}</Title>
    <StyledSelect value={chainType} onChange={(v) => { setChainType(v); setFromAddress(undefined) }}>
      <Select.Option value={'WAN'} key={'WAN'}>WAN</Select.Option>
      <Select.Option value={'ETH'} key={'ETH'}>ETH</Select.Option>
    </StyledSelect>
    <Title>{intl.get('contract.selectAccount')}</Title>
    <StyledSelect showSearch onChange={(v) => { setFromAddress(v) }} onSearch={(v) => { setFromAddress(v) }} onBlur={(v) => { console.log('blur', v); setFromAddress(v) }}>
      {
        chainType === 'WAN'
          ? wanAddresses.map(v => {
            return <Select.Option value={v.address} key={v.address}>{v.address + ' ( ' + v.name + ' ) '}</Select.Option>
          })
          : ethAddresses.map(v => {
            return <Select.Option value={v.address} key={v.address}>{v.address + ' ( ' + v.name + ' ) '}</Select.Option>
          })
      }
      {
        fromAddress && fromAddress.length > 0
          ? <Select.Option value={fromAddress} key={fromAddress + '_2'}>{fromAddress}</Select.Option>
          : null
      }
    </StyledSelect>
    <Title>{intl.get('NormalTransForm.ConfirmForm.nonce')}:</Title>
    <StyledButton type="primary" onClick={() => {
      checkWanAddr(fromAddress).then((ret) => {
        if (ret) {
          getNonce(fromAddress, chainType).then((ret) => {
            if (ret || ret === 0) {
              setNonce(ret);
            } else {
              message.warn(intl.get('Offline.getInfoFailed'))
            }
          }).catch(() => {
            message.error('Failed, please check sdk log 3');
          });
        } else {
          message.warn(intl.get('NormalTransForm.addressIsIncorrect'));
        }
      }).catch(() => {
        message.error('Failed, please check sdk log 4');
      })
    }}>{intl.get('contract.getNonce')}</StyledButton>
    <StyledInput readOnly value={nonce} />
    <Title>{intl.get('AdvancedOptionForm.gasPrice')}:</Title>
    <StyledButton type="primary" onClick={() => {
      checkWanAddr(fromAddress).then((ret) => {
        if (ret) {
          getGasPrice(chainType).then((ret) => {
            if (ret || ret === 0) {
              setGasPrice(ret);
            } else {
              message.warn(intl.get('Offline.getInfoFailed'))
            }
          }).catch(() => {
            message.error('Failed, please check sdk log 3');
          });
        } else {
          message.warn(intl.get('NormalTransForm.addressIsIncorrect'));
        }
      }).catch(() => {
        message.error('Failed, please check sdk log 4');
      })
    }}>{intl.get('contract.getGasPrice')}</StyledButton>
    <StyledInput readOnly value={gasPrice} />
    <Title style={{ marginBottom: '16px', marginTop: '20px' }}>{intl.get('contract.loadOfflineData')}</Title>
    <FileSelection placeholder={intl.get('contract.loadOfflineData2')} value={offlinePath} id="upLoad" style={{ border: '10px solid red' }} buttonStyle={{ float: 'left', width: '400px' }} onChange={e => {
      let value = e.target.value;
      let files = e.target.files;
      setOfflinePath(value);
      setTimeout(() => { onUploadCheck(value, files) }, 1000);
    }} />
  </Body>);
}

const Body = styled.div`
  width: auto;
  margin: 30px;
  padding: 30px;
  background-color: #ffffff16;
  /* min-height: 90vh; */
  border-radius: 20px;
`;

const Title = styled.div`
  font-size: 20px;
  color: #fff;
`;

const StyledSelect = styled(Select)`
  margin-top: 20px;
  margin-bottom: 20px;
  .ant-select-selection {
    border: 0px;
    border-radius: 20px;
  }
`;

const StyledInput = styled(Input)`
  margin-top: 20px;
  margin-bottom: 20px;
  width: 200px!important;
  text-align: center!important;
  .ant-input {
    width: 200px!important;
    text-align: center!important;
  }
  .ant-input-affix-wrapper .ant-input-suffix {
    width: 200px!important;
    text-align: center!important;
  }
`;

const InALine = styled.div`
  display: flex;
  justify-content: start;
`;

const StyledButton = styled(Button)`
  margin: 10px 20px 10px 0px!important;
  height: 40px;
  padding: 0 20px;
  font-size: 18px;
  border-radius: 40px;
`;

const TxBody = styled.div`
  border-radius: 20px;
  height: 264px;
  background: #ffffff11;
  margin-top: 20px;
`;

const SmallTitle = styled(Title)`
  padding-top: 12px;
  margin: 20px;
`;

const Label = styled(Title)`
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 18px;
`;

const TableContainer = styled.div`
  margin: 20px;
`;

const SmallInput = styled(StyledInput)`
  margin-top: 5px!important;
  text-align: center!important;
  input {
    text-align: center!important;
  }
  width: 80%!important;
  .ant-input {
    width: 100%!important;
    text-align: center!important;
  }
  .ant-input-affix-wrapper .ant-input-suffix {
    width: 100%!important;
    text-align: center!important;
  }
`;

const SmallSelect = styled(StyledSelect)`
  margin-top: 5px;
  width:80%;
  .ant-select-selection {
    width:100%!important;
  }
`;

const RemoveButton = styled.div`
  position: relative;
  width: 100%;
  top: -268px;
  text-align: right;
  padding-right: 10px;
  display: flex;
  justify-content: flex-end;
`;

const StyledTable = styled(Table)`
  .ant-table {
    overflow: scroll!important;
  }
`;
