import React, { useState, useEffect, useCallback } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, Button, Row, Col, Tooltip, message, Icon } from 'antd';
import { getNonce, checkWanAddr } from '../../../utils/helper';

import styled from 'styled-components';

export default function Online(props) {
  const [nonce, setNonce] = useState(0);
  const addresses = props.normalAddrList;
  const [fromAddress, setFromAddress] = useState();
  console.log('fromAddress', fromAddress);
  return (<Body>
    <Title>{intl.get('contract.selectAccount')}</Title>
    <StyledSelect showSearch onChange={(v) => { setFromAddress(v) }} onSearch={(v) => { setFromAddress(v) }}>
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
    <Title>{intl.get('NormalTransForm.ConfirmForm.nonce')}</Title>
    <StyledButton type="primary" onClick={() => {
      // checkWanAddr(fromAddress).then((ret) => {
      //   console.log('3', ret);
      //   if (ret) {
          getNonce(fromAddress, 'WAN').then((ret) => {
            console.log('4', ret);
            if (ret) {
              setNonce(ret);
            } else {
              message.warn(intl.get('Offline.getInfoFailed'))
            }
          }).catch(message.error);
      //   } else {
      //     message.warn(intl.get('NormalTransForm.addressIsIncorrect'));
      //   }
      // }).catch(message.error)
    }}>{intl.get('contract.getNonce')}</StyledButton>
    <StyledInput readOnly value={nonce} />
    <p></p>
    <StyledButton style={{ marginLeft: '20px!important' }} type="primary">{intl.get('contract.loadOfflineData')}</StyledButton>
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
