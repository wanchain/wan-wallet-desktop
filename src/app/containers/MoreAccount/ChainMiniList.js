import intl from 'react-intl-universal';
import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { Icon, Tag, Tooltip } from 'antd';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  updateTokenSelectedStatus: (...args) => stores.tokens.updateTokenSelectedStatus(...args),
}))

@observer
class ChainMiniList extends Component {
  render() {
    let { record, updateTokenSelectedStatus } = this.props;
    return (
      record.children.length && (
        <table className={style.tokenList}>
          <tbody>
            {
              record.children.map((d, i) => {
                return (
                  <tr key={d.key}>
                    <td style={{ textAlign: 'left', width: '50%', paddingLeft: '20%' }}>{d.symbol}</td>
                    <td style={{ textAlign: 'right', width: '30%' }}> <Tag className={style.symbolTag}>@{intl.get(`Common.${d.title.toLowerCase()}`)}</Tag></td>
                    <td style={{ textAlign: 'left' }}>
                      <span className={style.tokenItemSelected}>{d.selected ? <Icon type="star" className={style.starIcon} theme="filled" style={{ color: '#ff8c00' }} onClick={() => updateTokenSelectedStatus(d.toAccount, false)} /> : <Icon type="star" className={style.starIcon} theme="outlined" onClick={() => updateTokenSelectedStatus(d.toAccount, true)} />}</span>
                    </td>
                    <td>
                      {
                        d.isCustomToken && <Tooltip placement="bottom" title={intl.get('Common.delete')}><Icon className={style.deleteTokenIcon} type="delete" onClick={e => this.props.handleDelete(d)} /></Tooltip>
                      }
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
