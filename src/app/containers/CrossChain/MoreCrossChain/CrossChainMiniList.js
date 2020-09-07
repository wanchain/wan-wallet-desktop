import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Icon } from 'antd';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  setCcTokenSelectedStatus: (...args) => stores.crossChain.setCcTokenSelectedStatus(...args),
}))

@observer
class CrossChainMiniList extends Component {
  render() {
    let { record, setCcTokenSelectedStatus } = this.props;
    return (
      record.children.length && (
        <table className={style.tokenList}>
          <tbody>
            {
              record.children.map((d, i) =>
                <tr key={i}>
                  <td style={{ textAlign: 'right', width: '45%' }}>{d.fromChainName}</td>
                  <td style={{ textAlign: 'center', width: '10%' }}>{` < - > `}</td>
                  <td style={{ textAlign: 'left', width: '45%' }}>
                    <span className={style.tokenItemSymbol}>{d.toChainName}</span>
                    <span className={style.tokenItemSelected}>{d.selected ? <Icon type="star" className={style.starIcon} theme="filled" style={{ color: '#ff8c00' }} onClick={() => setCcTokenSelectedStatus(d.id, false)} /> : <Icon type="star" className={style.starIcon} theme="outlined" onClick={() => setCcTokenSelectedStatus(d.id, true)} />}</span>
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      )
    );
  }
}

export default CrossChainMiniList;
