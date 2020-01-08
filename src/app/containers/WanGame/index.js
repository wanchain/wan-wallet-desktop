import React, { Component } from 'react';
import DApp from '../../components/DApp';

class WanGame extends Component {
  render () {
    return (
      <DApp dAppUrl={'http://localhost:8000/'}/>
    );
  }
}

export default WanGame;
