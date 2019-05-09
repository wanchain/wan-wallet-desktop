import React, { Component } from 'react';
import './index.less';

class MFooter extends Component {
    render() {
        return (
            <div className="footer">
              <div className="f-content">
                All Rights Reserved <br/> ©{new Date().getFullYear()} WANCHAIN FOUNDATION LTD
              </div>
            </div>
        );
    }
}

export default MFooter;