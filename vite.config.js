import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173
    },
    build: {
        // 代码分割优化
        rollupOptions: {
            output: {
                manualChunks: {
                    // React核心库单独打包
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    // 状态管理
                    'state-vendor': ['zustand'],
                    // 图表库
                    'charts-vendor': ['recharts'],
                    // HTTP客户端
                    'http-vendor': ['axios'],
                }
            }
        },
        // 提高chunk大小警告阈值
        chunkSizeWarningLimit: 600,
        // 启用源码映射（开发调试用）
        sourcemap: false,
        // 压缩优化（使用esbuild，速度更快）
        minify: 'esbuild',
        // esbuild压缩选项
        target: 'es2015'
    },
    // 依赖预构建优化
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios']
    }
});
