import React, { Component } from 'react';
import DApp from 'components/DApp';

class DApps extends Component {
  render() {
    const url = this.props.url;
    return (
      <DApp dAppUrl={'https://' + url + '/'} />
    );
  }
}

export default props => <DApps {...props}
  key={props.match.params.url}
  url={props.match.params.url} />;
