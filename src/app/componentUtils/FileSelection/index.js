import intl from 'react-intl-universal';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';

function FileSelection(props) {
    let buttonStyle = props.buttonStyle || {};
    const HiddenFileInput = styled.input`
        display: none;
    `;
    const FileInput = styled.div`
        display: inline-block;
        width: 80%!important;
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
            color: #fff;
            float: ${buttonStyle.float || 'right'};
            padding: 0px 20px;
            border-radius: 20px;
            background: linear-gradient(90deg, #414EDD 0%, #29307C 100%);
        }
        &:hover::after {
            background: linear-gradient(90deg, #29307C 0%, #414EDD 100%) !important;
        }
    `;
    const [fileName, setFileName] = useState();
    const fileEl = useRef(null);
    const clickFun = (e) => { fileEl.current.click(); }
    const onChange = (e) => {
        setFileName(e.target.files.length > 0 ? e.target.files[0].name : undefined);
        props.onChange(e);
    }

    return (
        <div>
            <HiddenFileInput id={props.id} onChange={onChange} type="file" readOnly ref={fileEl} />
            <FileInput onClick={clickFun}>{fileName || props.placeholder}</FileInput>
        </div>
    )
}
export default FileSelection;
