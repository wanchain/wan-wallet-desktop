import intl from 'react-intl-universal';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const HiddenFileInput = styled.input`
    display: none;
`;
const FileInput = styled.div`
    display: inline-block;
    width: ${props => props.buttonStyle['width'] || '80%'} !important;
    height: 40px;
    line-height: 40px;
    text-align: center;
    font-size: 16px;
    border-radius: 20px;
    border: none;
    color: #bfbfbf !important;
    background: #1F2034 !important;
    cursor: pointer;

    &::after {
        content: 'Browse';
        height: 40px;
        line-height: 40px;
        font-size: 1em;
        color: #fff;
        float: ${props => props.buttonStyle['float'] || 'right'};
        padding: 0em 1em;
        border-radius: 20px;
        background: linear-gradient(90deg, #414EDD 0%, #29307C 100%);
    }
    &:hover::after {
        background: linear-gradient(90deg, #29307C 0%, #414EDD 100%) !important;
    }
`;
const FileName = styled.span`
    display: inline-block;
    width: calc(100% - 8em);
    overflow: hidden;
    text-overflow: ellipsis;
`;

function FileSelection(props) {
    const [fileName, setFileName] = useState();
    const fileEl = useRef(null);
    const clickFun = (e) => { fileEl.current.click(); }
    const onChange = (e) => {
        setFileName(e.target.files.length > 0 ? e.target.files[0].name : undefined);
        props.onChange(e);
    }

    return (
        <div>
            <HiddenFileInput id={props.id} onChange={onChange} type="file" ref={fileEl} />
            <FileInput buttonStyle={props.buttonStyle || {}} onClick={clickFun}><FileName>{fileName || props.placeholder}</FileName></FileInput>
        </div>
    )
}
export default FileSelection;
