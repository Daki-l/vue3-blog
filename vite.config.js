import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), vueJsx()],
    server: {
        port: 5188,
        strictPort: true // 端口被占用时直接报错,避免悄悄漂移到其他端口
    },
    // 本地 dev/preview 时把魔灵数据接口代理到线上 Worker(生产由环境变量 VITE_API_BASE 指向)
    preview: {
        proxy: {
            '/sw/data': { target: 'https://api.linow.us.kg', changeOrigin: true }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    css: {
        preprocessorOptions: {
            less: {
                additionalData: `@import "src/common/common.less";`
                // 或其他配置选项
            }
        }
    }
});
