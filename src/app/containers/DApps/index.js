import React, { Component } from 'react';
import DApp from 'components/DApp';

class DApps extends Component {
  render() {
    const { url, dappname } = this.props;
    let dappUrl = url.startsWith('www.wanchain.org') ? `/localDapps/${dappname}/index.html` : `https://${url}/`;
    // let dappUrl = url.startsWith('www.wanchain.org') ? `http://127.0.0.1:8000` : `https://${url}/`;

    return (
      <DApp dAppUrl={dappUrl} />
    );
  }
}

export default props =>
  <DApps
    {...props}
    key={props.match.params.url}
    url={props.match.params.url}
    dappname={props.match.params.dappname}
  />;
