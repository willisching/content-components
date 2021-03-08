import Main from './src/components/main';
import Preview from './src/components/preview';
import Progress from './src/components/progress';
import Upload from './src/components/upload';

customElements.define('d2l-content-store-add-content-preview', Preview);
customElements.define('d2l-content-store-add-content-progress', Progress);
customElements.define('d2l-content-store-add-content-upload', Upload);
customElements.define('d2l-content-store-add-content', Main);
