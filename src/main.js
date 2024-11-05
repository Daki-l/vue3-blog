import moment from 'moment';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import router from './router';
import App from './App.vue';
import './mock';
import "./utils/prototype";

import 'moment/locale/zh-cn';
moment.locale('zh-cn');

import './assets/main.css';
import 'element-plus/dist/index.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

app.mount('#app');
