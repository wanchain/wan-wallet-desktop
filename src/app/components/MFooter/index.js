import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class MFooter extends Component {
    render () {
        return (
            <div className={style.footer}>
              <div className={style['f-content']}>
                {intl.get('MFooter.allRightsReserved')} <br/> ©{new Date().getFullYear()} {intl.get('MFooter.wanchainFoundationLtd')}
              </div>
            </div>
        );
    }
}

export default MFooter;
