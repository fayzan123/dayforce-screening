// App entry point: mount the root component and load the global stylesheet.
import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

createApp(App).mount('#app');
