import React, { useMemo } from 'react';
import { Tooltip } from 'antd';
import ToolTipIcon from 'static/image/tooltip.png';
import { BigNumber } from 'bignumber.js';

export default function ToolTipCus({
  minOperationFeeLimit,
  maxOperationFeeLimit,
  percentOperationFee,
  isPercentOperationFee,
  symbol
}) {
  return (
    <Tooltip
      placement="top"
      title={<Content percentOperationFee={percentOperationFee} maxOperationFeeLimit={maxOperationFeeLimit} minOperationFeeLimit={minOperationFeeLimit} isPercentOperationFee={isPercentOperationFee} symbol={symbol}/>}
      overlayClassName="ccToolTips"
      overlayStyle={{ borderRadius: '12px', fontSize: '12px' }}
    >
      <img src={ToolTipIcon} alt="1" width={18} />
    </Tooltip>
  );
}

const Content = ({
  percentOperationFee,
  minOperationFeeLimit,
  maxOperationFeeLimit,
  isPercentOperationFee,
  symbol
}) => {
  const handleClick = () => {
    wand.shell.openExternal('https://medium.com/wanchain-foundation/wanbridge-launches-a-brand-new-bridge-fee-charging-model-committed-to-promoting-the-sustainable-404c05a7a801')
  }

  const rate = useMemo(() => {
    if (isPercentOperationFee) {
      const ret = new BigNumber(percentOperationFee).multipliedBy(100).toString()
      return `${ret}%`;
    } else {
      return 'N/A'
    }
  }, [isPercentOperationFee, percentOperationFee])

  return (
    <div style={{ backgroundColor: '#3D3E53' }}>
      <p style={{ marginBottom: '15px' }}>The Bridge Fee consists of <span style={{ color: '#2FBDF4' }}>"Network Fee + Service Fee"</span>.</p>
      <p style={{ marginBottom: '15px' }}>If either your sending or receiving address on the Wanchain network holds 50,000 WAN or more, inclusive of WAN staked on Bridge node, you will enjoy a 50% discount on the Service Fee.</p>
      <p style={{ marginTop: '10px' }}>
        <span style={{ display: 'block' }}>Applicable Service Fee Rules for your WAN:</span>
        <span style={{ display: 'block' }}>- Service fee rate : <span style={{ color: '#2fbdf4' }}>{rate}</span></span>
        <span style={{ display: 'block' }}>- Minimum charge : <span style={{ color: '#2fbdf4' }}>{minOperationFeeLimit} {symbol}</span></span>
        <span style={{ display: 'block' }}>- Maximum charge : <span style={{ color: '#2fbdf4' }}>{new BigNumber(maxOperationFeeLimit).eq('0') ? 'Unlimited' : `${maxOperationFeeLimit} ${symbol}`} </span></span>
      </p>
      <p style={{ marginTop: '10px' }}>
        <span style={{ color: '#F1754B', display: 'block' }}>Note: </span>
        Maintain a consistent WAN balance on your Wanchain address until your cross-chain assets are received to guarantee the discount is applied and avoid extra charges.
      </p>
      <p style={{ marginTop: '10px' }}>
        For more details, go to <span style={{ color: '#2fbdf4', cursor: 'pointer' }} onClick={handleClick}>WanBridge Fee Charging Model</span>
      </p>
    </div>
  )
}
