import React, { useState, useEffect, useCallback } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, Button, Row, Col, Tooltip, message, Icon } from 'antd';
import { wandWrapper } from '../../../utils/support';
import FileSelection from 'componentUtils/FileSelection';
import styled, { keyframes } from 'styled-components';

export default function Offline(props) {
  const [transactions, setTransactions] = useState([]);
  const [nonce, setNonce] = useState(0);
  const [gasPrice, setGasPrice] = useState(1);
  const wanAddresses = props.wanAddresses;
  const ethAddresses = props.ethAddresses;
  const [fromAddress, setFromAddress] = useState();
  const [step, setStep] = useState('build');
  const [chainType, setChainType] = useState('WAN');

  const addresses = chainType === 'WAN' ? wanAddresses : ethAddresses;

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
  }, [setTransactions, nonce]);

  const buildTransaction = useCallback(() => {
    const wallet = addresses.filter(v => v.address === fromAddress);
    console.log('transactions', transactions);
    const txs = transactions.map(v => {
      let param;
      if (v.parameters) {
        if (v.parameters.includes('{') || v.parameters.includes('}') || v.parameters.includes('[') || v.parameters.includes(']')) {
          // param = '[' + v.parameters + ']';
          param = JSON.parse(v.parameters);
        } else {
          param = v.parameters.split(',');
        }
      }

      console.log('param', param);
      return {
        toAddress: v.contractAddress ? v.contractAddress.toLowerCase() : undefined,
        abi: v.abiJson,
        method: v.method,
        paras: v.parameters ? param : [],
        gasPrice: gasPrice * 1e9,
        gasLimit: v.gasLimit,
        value: v.value,
      }
    });
    console.log('txs', txs);
    const walletId = wallet[0].wid;
    const path = wallet[0].path;
    const address = wallet[0].address;

    wandWrapper('contract_updateNonce', { address, nonce, chainType }).then((ret) => {
      console.log('ret', ret);
      wandWrapper('contract_buildTx', { walletId, path, txs, chainType }).then((ret) => {
        console.log('ret', ret);
        if (ret === true) {
          message.success('Success');
          setStep('save');
        } else {
          message.error('Build Failed please check SDK log 1');
        }
      }).catch(() => {
        message.error('Failed, please check sdk log 2');
      });
    }).catch(() => {
      message.error('Failed, please check sdk log 3');
    });
  }, [nonce, transactions, fromAddress, addresses, chainType, gasPrice]);

  const saveToFile = useCallback(() => {
    const wallet = addresses.filter(v => v.address === fromAddress);
    const address = wallet[0].address;
    wandWrapper('contract_getOutputPath', { address, chainType }).then((ret) => {
      console.log('2', ret);
      downloadFile(ret, address, nonce, chainType);
    }).catch(() => {
      message.error('Failed, please check sdk log 4');
    });
    setStep('build');
  }, [transactions, fromAddress, addresses, nonce]);

  // first empty tx
  // useEffect(() => {
  //   if (transactions && transactions.length === 0) {
  //     modify(0, { nonce: nonce, time: Date.now() });
  //   }
  // }, []);

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

  // console.log('addresses', addresses);

  return (<Body>
    <Title>{intl.get('contract.selectChain')}</Title>
    <StyledSelect value={chainType} onChange={(v) => { setChainType(v); setFromAddress(undefined) }}>
      <Select.Option value={'WAN'} key={'WAN'}>WAN</Select.Option>
      <Select.Option value={'ETH'} key={'ETH'}>ETH</Select.Option>
    </StyledSelect>
    <Title>{intl.get('contract.selectAccount2')}</Title>
    <StyledSelect onChange={(v) => { setFromAddress(v) }}>
      {
        addresses.map(v => {
          return <Select.Option value={v.address} key={v.address}>{v.address + ' ( ' + v.name + ' )'}</Select.Option>
        })
      }
    </StyledSelect>
    <Title>{intl.get('NormalTransForm.ConfirmForm.nonce')}</Title>
    <StyledInput value={nonce} onChange={(e) => { setNonce(e.target.value) }} />
    <Title>{intl.get('AdvancedOptionForm.gasPrice')}</Title>
    <StyledInput value={gasPrice} onChange={(e) => { setGasPrice(e.target.value) }} suffix="Gwin" />
    <InALine>
      {
        fromAddress && fromAddress.length > 0
          ? <StyledButton type="primary" onClick={() => {
            modify(transactions.length, {
              nonce: Number(nonce) + transactions.length,
              time: Date.now()
            });
          }}>{intl.get('contract.addTransaction')}</StyledButton>
          : <Title>{intl.get('contract.first')}</Title>
      }
      {
        step === 'build' && transactions && transactions.length > 0
          ? <StyledButton type="primary" onClick={() => {
            buildTransaction();
          }}>{intl.get('contract.buildTransaction')}</StyledButton>
          : null
      }
      {
        step === 'save' && transactions && transactions.length > 0
          ? <StyledButton type="primary" onClick={() => {
            saveToFile();
          }}>{intl.get('contract.saveToFile')}</StyledButton>
          : null
      }
    </InALine>
    {
      transactions && transactions.length > 0
        ? transactions.map((v, i) => {
          return <Transaction onModify={modify} tx={v} i={i} key={v.time} chainType={chainType} />
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
  const [paramTip, setParamTip] = useState('Normal transaction');
  const [parameters, setParameters] = useState();
  const [value, setValue] = useState(0);
  const [abiJson, setAbiJson] = useState();
  const [methods, setMethods] = useState();

  // update tx
  useEffect(() => {
    props.onModify(props.i, {
      ...props.tx,
      contractAddress,
      abiFile,
      method,
      gasLimit,
      parameters,
      value,
      abiJson,
    });
  }, [contractAddress, abiFile, method, gasLimit, parameters, value, abiJson]);

  // update methods
  useEffect(() => {
    if (!abiJson || !abiJson.length) {
      return;
    }
    setMethods(abiJson.filter((v) => {
      return (v.constant && (v.constant === false)) || (v.stateMutability && v.stateMutability !== 'view');
    }));
  }, [abiJson]);

  // update params
  useEffect(() => {
    if (!method || !abiJson || !abiJson.length) {
      return;
    }
    const tmp = abiJson.filter(v => v.name === method);
    if (tmp.length === 0) {
      return;
    }
    let tip = '';
    tmp[0].inputs.forEach(v => {
      tip += v.name + '(' + v.type + '),'
    });
    tip = tip.length > 0 ? tip.slice(0, tip.length - 1) : '';
    setParamTip(tip);
  }, [method, abiJson]);

  const uploadId = 'up_' + props.tx.time.toString();

  const onUploadCheck = (value, files) => {
    if (value) {
      var reader = new FileReader();
      reader.readAsText(files[0], 'UTF-8');
      setAbiFile(files[0].path);
      reader.onload = (evt) => {
        var fileString = evt.target.result;
        let obj = JSON.parse(fileString);
        setAbiJson(obj);
      }
    }
  }

  return (<TxBody>
    <SmallTitle>{intl.get('NormalTransForm.ConfirmForm.nonce') + ': ' + (props.tx && props.tx.nonce ? props.tx.nonce : 0)}</SmallTitle>
    <TableContainer>
      <Row>
        <Col span={4}><Label>{intl.get('contract.contractAddress')}</Label></Col>
        <Col span={8}><SmallInput value={contractAddress} placeholder="Please input contract address" onChange={e => { setContractAddress(e.target.value) }} /></Col>
        <Col span={4}><Label>{intl.get('contract.abiFile')}</Label></Col>
        <Col span={8}><FileSelection placeholder="Please select ABI file" id={uploadId} onChange={e => {
          let value = e.target.value;
          let files = e.target.files;
          setTimeout(() => { onUploadCheck(value, files) }, 1000);
        }} /></Col>
      </Row>
      <Row>
        <Col span={4}><Label>{intl.get('contract.callMethod')}</Label></Col>
        <Col span={8}>
          <SmallSelect value={method} onChange={(e) => { setMethod(e) }}>
            {
              methods
                ? methods.map((v) => {
                  return (<Select.Option value={v.name} key={v.name}>{v.name}</Select.Option>);
                })
                : null
            }
          </SmallSelect>
        </Col>
        <Col span={4}><Label>{intl.get('contract.gasLimit')}</Label></Col>
        <Col span={8}><SmallInput value={gasLimit} onChange={e => { setGasLimit(e.target.value) }} /></Col>
      </Row>
      <Row>
        <Col span={4}><Label>{intl.get('contract.parameters')}</Label></Col>
        <Tooltip title={paramTip}>
          <Col span={8}><SmallInput placeholder={paramTip} value={parameters} onChange={e => { setParameters(e.target.value) }} /></Col>
        </Tooltip>
        <Col span={4}><Label>{intl.get('CrossChainTransForm.Value')}</Label></Col>
        <Col span={8}><SmallInput suffix={props.chainType} value={value} onChange={e => { setValue(e.target.value) }} /></Col>
      </Row>
    </TableContainer>
    <RemoveButton type="primary">
      <Tooltip title={intl.get('contract.help')}>
        <Icon style={{ fontSize: '20px', margin: '5px 20px 5px 5px' }} type="question-circle" />
      </Tooltip>
      <Button onClick={() => { props.onModify(props.i, undefined) }} type="primary">{intl.get('contract.remove')}</Button>
    </RemoveButton>
  </TxBody>);
};

function downloadFile(dataJson, address, nonce, chainType) {
  var downloadAnchorNode = document.createElement('a');
  var datastr = 'data:text/json;charset=utf-8,' + encodeURIComponent(dataJson);
  downloadAnchorNode.setAttribute('href', datastr);
  downloadAnchorNode.setAttribute('download', chainType + '_' + address + '_' + nonce + '.json');
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

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
