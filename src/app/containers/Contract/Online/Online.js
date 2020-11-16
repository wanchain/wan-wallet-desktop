import React, { useState, useEffect, useCallback } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, Button, Row, Col, Tooltip, message, Icon, Modal, Table } from 'antd';
import { getNonce, checkWanAddr } from '../../../utils/helper';
import { wandWrapper } from '../../../utils/support';
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
  const addresses = props.normalAddrList;
  const [fromAddress, setFromAddress] = useState();
  const [offlineJson, setOfflineJson] = useState();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log('fromAddress', fromAddress);

  const onUploadCheck = () => {
    let up = document.getElementById('upLoad');
    if (up.value) {
      var reader = new FileReader();
      reader.readAsText(up.files[0], 'UTF-8');
      reader.onload = (evt) => {
        var fileString = evt.target.result;
        let obj = JSON.parse(fileString);
        setOfflineJson(obj);
        console.log('wandWrapper', wandWrapper, up.files[0].path)
        wandWrapper('contract_setFilePath', { inputPath: up.files[0].path }).then((ret) => {
          console.log('ret', ret);
          setShowModal(true);
        }).catch(message.error);
      }
    }
  }

  const OfflineModal = () => {
    return <Modal
      title={intl.get('contract.offlineTransactionConfirm')}
      visible={showModal}
      footer={[
        <Button key="back" className="cancel-button" onClick={() => { setShowModal(false) }}>{intl.get('Common.cancel')}</Button>,
        <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={() => {
          console.log('send');
          setLoading(true);
          wandWrapper('contract_sendTx').then(ret => {
            console.log('sendTx', ret);
            if (ret) {
              message.info('Success');
              setShowModal(false);
            } else {
              message.info('Send failed, please check sdk log');
            }
          }).catch(message.error).finally(() => {
            setLoading(false);
          });
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
    <Title>{intl.get('contract.selectAccount')}</Title>
    <OfflineModal />
    <StyledSelect showSearch onChange={(v) => { setFromAddress(v) }} onSearch={(v) => { setFromAddress(v) }} onBlur={(v) => { console.log('blur', v); setFromAddress(v) }}>
      {
        addresses.map(v => {
          return <Select.Option value={v.address} key={v.address}>{v.address}</Select.Option>
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
          getNonce(fromAddress, 'WAN').then((ret) => {
            if (ret) {
              setNonce(ret);
            } else {
              message.warn(intl.get('Offline.getInfoFailed'))
            }
          }).catch(message.error);
        } else {
          message.warn(intl.get('NormalTransForm.addressIsIncorrect'));
        }
      }).catch(message.error)
    }}>{intl.get('contract.getNonce')}</StyledButton>
    <StyledInput readOnly value={nonce} />
    <Title style={{ marginBottom: '16px' }}>{intl.get('contract.loadOfflineData')}</Title>
    <SmallInput type='file' placeholder={intl.get('contract.loadOfflineData')} readOnly id="upLoad" onChange={e => {
      setTimeout(onUploadCheck, 1000);
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
