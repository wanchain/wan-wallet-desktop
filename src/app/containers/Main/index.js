import React, { Component, Suspense } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';
import SideBar from '../Sidebar';
import MHeader from 'components/MHeader';
import MFooter from 'components/MFooter';
import Mask from 'components/Mask';
import style from './index.less';

@inject(stores => ({

}))

@observer
class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: false,
            maskMainContent: false,
        }
    }

    toggleNav = () => {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    toggleMask = show => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.setState({
                maskMainContent: show
            })
        }, show ? 0 : 50);
    }

    render() {
        const showHeader = !(location.pathname.includes('dapp') || location.pathname.includes('AddDApp'));
        return (
            <Row className="container">
                <Col className={style['nav-left'] + ' ' + (this.state.collapsed ? 'nav-collapsed' : '')}>
                    <SideBar handleNav={this.toggleNav} path={location.pathname} toggleMask={this.toggleMask} />
                </Col>
                <Col id="main-content" className={'main ' + (this.state.collapsed ? 'nav-collapsed' : '')}>
                    {showHeader ? <MHeader /> : null}
                    <Row className="content">{this.props.children}</Row>
                    {showHeader ? <MFooter /> : null}
                </Col>
                {
                    this.state.maskMainContent && <Mask />
                }
            </Row>
        )
    }
}

export default Main;
