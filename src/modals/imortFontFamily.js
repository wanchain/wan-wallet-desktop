let style = document.createElement('style');
let url = wand.isDev ? `../../static/font` : `../static/font`;
style.textContent = `
    @font-face {
        font-family: Roboto-Regular;
        src: url('${url}/Roboto-Regular.ttf');
    }
    
    @font-face {
        font-family: Roboto-Bold;
        src: url('${url}/Roboto-Bold.ttf');
    }
`;
document.getElementsByTagName('head')[0].insertBefore(style, document.getElementsByTagName('link')[0]);