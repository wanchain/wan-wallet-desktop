import React from 'react';
import { Tooltip } from 'antd';
import ToolTipIcon from 'static/image/tooltip.png';

export default function ToolTipCus() {
  return (
    <Tooltip
      placement="top"
      title={<Content />}
      overlayClassName="ccToolTips"
      overlayStyle={{ borderRadius: '12px', fontSize: '12px' }}
    >
      <img src={ToolTipIcon} alt="1" width={18} />
    </Tooltip>
  );
}

const Content = () => {
  return (
    <div style={{ backgroundColor: '#3D3E53' }}>
      <p style={{ marginBottom: '15px' }}>The Bridge Fee consists of <span style={{ color: '#2FBDF4' }}>"Network Fee + Service Fee"</span>.</p>
      <p style={{ marginBottom: '15px' }}>If your recipient address holds 50,000 WAN or more, you will enjoy a 50% discount on the Service Fee.</p>
      <p>
        <span style={{ color: '#F1754B', display: 'block' }}>Note: </span>
        Keep your WAN balance unchanged on the recipient address until you receive cross-chain assets to ensure the discount is applied and avoid extra charges.
      </p>
    </div>
  )
}
