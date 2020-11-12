import React, { useState, useEffect, useCallback } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, Button, Row, Col, Tooltip } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

import styled from 'styled-components';

export default function Offline(props) {
  const [transactions, setTransactions] = useState([]);
  const [nonce, setNonce] = useState(0);
  const [gasPrice, setGasPrice] = useState(1);
  const modify = useCallback((i, v) => {
    setTransactions((pre) => {
      const tmp = pre.slice();
      if (!v) {
        tmp.splice(i, 1);
        const tmp2 = tmp.map((v, i) => {
          v.nonce = Number(nonce) + i;
          return v;
        });
        return tmp2;
      }
      tmp[i] = v;
      return tmp;
    });
  }, [setTransactions]);

  // first empty tx
  useEffect(() => {
    if (transactions && transactions.length === 0) {
      modify(0, { nonce: nonce, time: Date.now() });
    }
  }, []);

  // flush new nonce
  useEffect(() => {
    setTransactions((pre) => {
      const tmp = pre.slice();
      return tmp.map((v, i) => {
        v.nonce = Number(nonce) + i;
        return v;
      });
    });
  }, [nonce]);

  return (<Body>
    <Title>{intl.get('contract.selectAccount')}</Title>
    <StyledSelect showSearch />
    <Title>{intl.get('NormalTransForm.ConfirmForm.nonce')}</Title>
    <StyledInput value={nonce} onChange={(e) => { setNonce(e.target.value) }} />
    <Title>{intl.get('AdvancedOptionForm.gasPrice')}</Title>
    <StyledInput value={gasPrice} onChange={(e) => { setGasPrice(e.target.value) }} suffix="Gwin" />
    <InALine>
      <StyledButton type="primary" onClick={() => {
        modify(transactions.length, {
          nonce: Number(nonce) + transactions.length,
          time: Date.now()
        });
      }}>{intl.get('contract.addTransaction')}</StyledButton>
      <StyledButton type="primary">{intl.get('contract.buildTransaction')}</StyledButton>
      <StyledButton type="primary">{intl.get('contract.saveToFile')}</StyledButton>
    </InALine>
    {
      transactions && transactions.length > 0
        ? transactions.map((v, i) => {
          return <Transaction onModify={modify} tx={v} i={i} key={v.time} />
        })
        : null
    }
  </Body>);
}

const Transaction = (props) => {
  const [contractAddress, setContractAddress] = useState();
  const [abiFile, setAbiFile] = useState();
  const [method, setMethod] = useState();
  const [gasLimit, setGasLimit] = useState(1000000);
  const [paramTip, setParamTip] = useState('Waiting...');
  const [parameters, setParameters] = useState();
  const [value, setValue] = useState(0);

  useEffect(() => {
    props.onModify(props.i, {
      ...props.tx,
      contractAddress,
      abiFile,
      method,
      gasLimit,
      parameters,
      value
    });
  }, [contractAddress, abiFile, method, gasLimit, parameters, value]);
  return (<TxBody>
    <SmallTitle>{intl.get('NormalTransForm.ConfirmForm.nonce') + ': ' + (props.tx && props.tx.nonce ? props.tx.nonce : 0)}</SmallTitle>
    <TableContainer>
      <Row gutter={[24, 24]}>
        <Col span={4}><Label>{intl.get('contract.contractAddress')}</Label></Col>
        <Col span={8}><SmallInput value={contractAddress} placeholder="Please input contract address" onChange={e => { setContractAddress(e.target.value) }} /></Col>
        <Col span={4}><Label>{intl.get('contract.abiFile')}</Label></Col>
        <Col span={8}><SmallInput type='file' placeholder="Please select ABI file" readOnly id="up" value={abiFile} onChange={e => { setAbiFile(e.target.value) }} /></Col>
      </Row>
      <Row gutter={[24, 24]}>
        <Col span={4}><Label>{intl.get('contract.callMethod')}</Label></Col>
        <Col span={8}><SmallSelect value={method} /></Col>
        <Col span={4}><Label>{intl.get('contract.gasLimit')}</Label></Col>
        <Col span={8}><SmallInput value={gasLimit} onChange={e => { setGasLimit(e.target.value) }} /></Col>
      </Row>
      <Row gutter={[24, 24]}>
        <Col span={4}><Label>{intl.get('contract.parameters')}</Label></Col>
        <Tooltip title={paramTip}>
          <Col span={8}><SmallInput placeholder={paramTip} value={parameters} onChange={e => { setParameters(e.target.value) }} /></Col>
        </Tooltip>
        <Col span={4}><Label>{intl.get('CrossChainTransForm.Value')}</Label></Col>
        <Col span={8}><SmallInput suffix='WAN' value={value} onChange={e => { setValue(e.target.value) }} /></Col>
      </Row>
    </TableContainer>
    <RemoveButton type="primary"><Button onClick={() => { props.onModify(props.i, undefined) }} type="primary">{intl.get('contract.remove')}</Button></RemoveButton>
  </TxBody>);
};

// const onUploadCheck = () => {
//   let up = document.getElementById('up');
//   if (up.value) {
//     clearInterval(this.timer);

//     var reader = new FileReader();
//     reader.readAsText(up.files[0], 'UTF-8');
//     reader.onload = (evt) => {
//       var fileString = evt.target.result;
//       console.log('fileString', fileString);
//       let obj = JSON.parse(fileString);
//       this.setState({ data: obj });
//       up.value = '';
//     }
//   }
// }

const Body = styled.div`
  width: auto;
  margin: 30px;
  padding: 30px;
  background-color: #ffffff16;
  min-height: 90vh;
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
`;
