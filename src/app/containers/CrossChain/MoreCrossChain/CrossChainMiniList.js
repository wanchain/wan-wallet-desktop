import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message, Icon, Input, Checkbox, List, Tag } from 'antd';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  updateWalletTokenSelectedStatus: (...args) => stores.crossChain.updateWalletTokenSelectedStatus(...args),
}))

@observer
class CrossChainMiniList extends Component {
  setCrossChainPairSelection = (...args) => {
    this.props.updateWalletTokenSelectedStatus(...args);
  }

  render() {
    let { record } = this.props;
    return (
      record.children.length && (
        <table className={style.tokenList}>
          <tbody>
            {
              record.children.map((d, i) =>
                <tr key={i}>
                  <td style={{ textAlign: 'right', width: '45%' }}>{d.symbol.split(' <-> ')[0]}</td>
                  <td style={{ textAlign: 'center', width: '10%' }}>{` < - > `}</td>
                  <td style={{ textAlign: 'left', width: '45%' }}>
                    <span className={style.tokenItemSymbol}>{d.symbol.split(' <-> ')[1]}</span>
                    <span className={style.tokenItemSelected}>{d.selected ? <Icon type="star" className={style.starIcon} theme="filled" style={{ color: '#ff8c00' }} onClick={() => this.setCrossChainPairSelection(d.key, record.key, false)} /> : <Icon type="star" className={style.starIcon} theme="outlined" onClick={() => this.setCrossChainPairSelection(d.key, record.key, true)} />}</span>
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
