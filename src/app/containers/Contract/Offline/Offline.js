import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, Button, Row, Col, Tooltip, message, Icon, Table } from 'antd';
import { wandWrapper } from '../../../utils/support';
import FileSelection from 'componentUtils/FileSelection';
import styled, { keyframes } from 'styled-components';
import { getChainId, getChainInfo } from '../../../utils/helper';
import { observer, MobXProviderContext } from 'mobx-react';
import { EditableFormRow, EditableCell } from 'components/Rename';

message.config({
  duration: 0,
});

export default function Offline(props) {
  const [transactions, setTransactions] = useState([]);
  const [nonce, setNonce] = useState(0);
  const [gasPrice, setGasPrice] = useState(1);
  const [chainId, setChainId] = useState();
  const wanAddresses = props.wanAddresses;
  const ethAddresses = props.ethAddresses;
  const trxAddresses = props.trxAddresses;
  const [fromAddress, setFromAddress] = useState();
  const [step, setStep] = useState('build');
  const [chainType, setChainType] = useState('WAN');
  const [offlinePath, setOfflinePath] = useState();
  const [abiFile, setAbiFile] = useState();
  const [offlineJson, setOfflineJson] = useState();
  const [trxInfo, setTrxInfo] = useState([]);
  const [inputTrx, setInputTrx] = useState('')

  let addresses;
  if (chainType === 'WAN') {
    addresses = wanAddresses;
  } else if (chainType === 'Tron') {
    addresses = trxAddresses;
  } else {
    addresses = ethAddresses;
  }

  useEffect(() => {
    if (!chainType) {
      return;
    }
    getChainId().then(ret => {
      let info = getChainInfo(chainType, Number(ret) === 1 ? 'mainnet' : 'testnet')
      setChainId(info.chainId);
    }).catch(() => {
      message.error('get getChainId failed');
    });
  }, [chainType])

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
    if (trxInfo.length !== 0 && !checkTrxInfo()) return;
    const allAddress = [...wanAddresses, ...trxAddresses, ...ethAddresses];
    const newTrans = transactions.map(i => {
      let addrInfo = allAddress.find(j => j.address.toLowerCase() === i.from.toLowerCase())
      if (addrInfo) {
        return Object.assign({}, i, { _wallet: { id: addrInfo.wid, path: addrInfo.path } })
      } else {
        message.warn('请确认From地址存在于钱包中')
        return null;
      }
    }).filter(v => v !== null);

    wandWrapper('contract_buildTx', { transactions: newTrans }).then((ret) => {
      if (ret === true) {
        message.success('Success');
        setStep('save');
        saveToFile();
      } else {
        message.error('Build Failed please check SDK log 1');
      }
    }).catch(() => {
      message.error('Failed, please check sdk log 2');
    });
  }, [trxInfo, nonce, transactions, fromAddress, addresses, chainType, gasPrice, chainId]);

  const saveToFile = useCallback(() => {
    // const wallet = addresses.filter(v => v.address === fromAddress);
    // const address = wallet[0].address;
    wandWrapper('contract_getOutputPath', {}).then((ret) => {
      console.log('2', ret);
      downloadFile(ret);
    }).catch((e) => {
      message.error('Failed, please check sdk log 4');
    });
    setStep('build');
  }, [transactions, fromAddress, addresses, nonce]);

  const onUploadCheck = (value, files) => {
    if (value) {
      var reader = new FileReader();
      reader.readAsText(files[0], 'UTF-8');
      reader.onload = (evt) => {
        var fileString = evt.target.result;
        let obj = JSON.parse(fileString);
        obj.some(i => {
          if (i.chain === 'TRX' && !!i.refBlock) {
            setTrxInfo([i.refBlock]);
            return true;
          }
          return false;
        })
        setOfflineJson(obj);
        setTransactions(obj)
      }
    }
  }

  const checkTrxInfo = useCallback(() => {
    const info = trxInfo[0];
    if (Date.now() - info.timestamp > 2 * 3600 * 1000) {
      message.warn('TRX交易中的确认块信息已经过期请重新填写');
      return false;
    }
    return true;
  }, [trxInfo])

  const handleUpdateTrxInfo = () => {
    try {
      const infoArr = JSON.parse(inputTrx)
      setTrxInfo([infoArr])
    } catch (error) {
      message.warn('Trx信息有误，请重新填写')
    }
  }

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
    {
      chainType === 'Custom' && <>
        <Title>Chain ID</Title>
        <StyledInput value={chainId} onChange={(e) => { setChainId(e.target.value) }}/>
      </>
    }
    <InALine>
      <FileSelection placeholder={intl.get('contract.loadOfflineData2')} value={offlinePath} id="upLoad" style={{ border: '10px solid red' }} buttonStyle={{ float: 'left', width: '400px' }} onChange={e => {
        let value = e.target.value;
        let files = e.target.files;
        setOfflinePath(value);
        setTimeout(() => { onUploadCheck(value, files) }, 1000);
      }} />
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
      trxInfo && trxInfo.length > 0
      ? <div>
          <TrxTitle>TRX Block Information</TrxTitle>
          <StyledInput.TextArea autosize={{ minColumns: 15, minRows: 4, maxRows: 10 }} onChange={e => setInputTrx(e.target.value)}/>
          <StyledButton type="primary" onClick={handleUpdateTrxInfo}>Update</StyledButton>
        </div>
      : null
    }
    {
      trxInfo && trxInfo.length > 0
        ? <TrxInfo info={trxInfo} setInfo={setTrxInfo} trans={transactions} setTrans={setTransactions} />
        : null
    }
    {
      transactions && transactions.length > 0
        ? <RawTransaction trans={transactions} />
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
        <Col span={4}><Label>{intl.get('CrossChainTransForm.Value')}:</Label></Col>
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

const RawTransaction = observer(({ trans }) => {
  const { languageIntl: { offlineTransColumns } } = useContext(MobXProviderContext)

  const transList = useMemo(() => {
    return trans.map((i, j) => ({
      key: j,
      chain: i.chain,
      from: i.from,
      to: i.to,
      action: i.abi && i.abi.name ? i.abi.name : 'normal tx',
      value: i.value || '0'
    }))
  }, [trans])

  return (
    <div className="historyRow">
      <Table columns={offlineTransColumns} dataSource={transList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
    </div>
  )
})

const TrxInfo = props => {
  const { info, setInfo, trans, setTrans } = props;

  const trxInfoColumns = [
    {
      title: 'Block Number',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    }
  ];

  const handleSave = (row) => {
    const newData = [...info];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    setInfo(newData);
    newData.splice(index, 1, { ...item, ...row });
    const newTrans = trans.map((i, v) => {
      if (i.chain === 'TRX' && !!i.refBlock) {
        let { key, ...data } = row;
        i.refBlock = data;
      }
      return i;
    })
    setTrans(newTrans);
  };

  const components = {
    body: {
      cell: EditableCell,
      row: EditableFormRow,
    },
  };

  const columns = trxInfoColumns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  const source = useMemo(() => {
    return info.map((i, j) => Object.assign(i, { key: j }))
  }, [info]);

  return (
    <div className="historyRow">
      <br />
      <Table components={components} rowClassName={() => 'editable-row'} columns={columns} dataSource={source} pagination={false} />
      <br />
      <br />
    </div>
  )
}

function downloadFile(dataJson) {
  var downloadAnchorNode = document.createElement('a');
  var datastr = 'data:text/json;charset=utf-8,' + encodeURIComponent(dataJson);
  downloadAnchorNode.setAttribute('href', datastr);
  downloadAnchorNode.setAttribute('download', 'txs' + '.json');
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

const TrxTitle = styled(Title)`
  margin: 20px;
  display: inline-block
`;

const StyledSelect = styled(Select)`
  margin-top: 20px;
  margin-bottom: 20px;
  .ant-select-selection {
    border: 0px;
    border-radius: 20px;
    width: 450px!important;
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
  margin-left: 16px;
  justify-content: start;
`;

const StyledButton = styled(Button)`
  margin-left: 20px!important;
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
