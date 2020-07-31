import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message, Icon, Input, Checkbox, List, Tag } from 'antd';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  updateWalletTokenSelectedStatus: (key, value) => stores.tokens.updateWalletTokenSelectedStatus(key, value),
}))

@observer
class ChainMiniList extends Component {
  setCrossChainPairSelection = (key, selected) => {
    this.props.updateWalletTokenSelectedStatus(key, selected);
  }

  render() {
    let { record } = this.props;
    return (
      record.children.length && (
        <table className={style.tokenList}>
          <tbody>
            {
              record.children.map((d, i) => {
                return (
                  <tr key={d.key}>
                    <td style={{ textAlign: 'left', width: '40%', paddingLeft: '28%' }}>{d.symbol}</td>
                    <td style={{ textAlign: 'right', width: '30%' }}> <Tag className={style.symbolTag}>{d.title}</Tag></td>
                    <td style={{ textAlign: 'left' }}>
                      <span className={style.tokenItemSelected}>{d.selected ? <Icon type="star" className={style.starIcon} theme="filled" style={{ color: '#ff8c00' }} onClick={() => this.setCrossChainPairSelection(d.key, false)} /> : <Icon type="star" className={style.starIcon} theme="outlined" onClick={() => this.setCrossChainPairSelection(d.key, true)} />}</span>
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
