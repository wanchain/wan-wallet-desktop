import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message, Icon, Input, Checkbox, List, Tag } from 'antd';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  updateWalletSelectedStatus: (...args) => stores.tokens.updateWalletSelectedStatus(...args),
  updateTokenSelectedStatus: (...args) => stores.tokens.updateTokenSelectedStatus(...args),
}))

@observer
class ChainMiniList extends Component {
  render() {
    let { record, updateWalletSelectedStatus, updateTokenSelectedStatus } = this.props;
    return (
      record.children.length && (
        <table className={style.tokenList}>
          <tbody>
            {
              record.children.map((d, i) => {
                return (
                  <tr key={d.key}>
                    <td style={{ textAlign: 'left', width: '40%', paddingLeft: '28%' }}>{d.symbol}</td>
                    <td style={{ textAlign: 'right', width: '30%' }}> <Tag className={style.symbolTag}>@{d.title.toUpperCase()}</Tag></td>
                    <td style={{ textAlign: 'left' }}>
                      <span className={style.tokenItemSelected}>{d.selected ? <Icon type="star" className={style.starIcon} theme="filled" style={{ color: '#ff8c00' }} onClick={() => d.isToken ? updateTokenSelectedStatus(d.tokenAddress, false) : updateWalletSelectedStatus(d.symbol, false) } /> : <Icon type="star" className={style.starIcon} theme="outlined" onClick={() => d.isToken ? updateTokenSelectedStatus(d.tokenAddress, true) : updateWalletSelectedStatus(d.symbol, true)} />}</span>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      )
    );
  }
}

export default ChainMiniList;
