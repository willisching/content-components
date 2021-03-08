import Main from './src/components/main';
import Preview from './src/components/preview';
import Progress from './src/components/progress';
import Upload from './src/components/upload';

customElements.define('d2l-content-uploader-preview', Preview);
customElements.define('d2l-content-uploader-progress', Progress);
customElements.define('d2l-content-uploader-upload', Upload);
customElements.define('d2l-content-uploader', Main);
