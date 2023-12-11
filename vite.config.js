import { defineConfig } from 'vite'
import path from 'path'
import vituum from 'vituum'
import twig from '@vituum/vite-plugin-twig'

export default defineConfig({
    plugins: [
        vituum({
            pages: {
				dir: './src/views',
                normalizeBasePath: true
			}
        }),
        twig({
			root: './src',
		})
    ],
    base: '',
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                includePaths: ['node_modules']
            }
        }
    },
    build: {
        modulePreload: false,
        rollupOptions: {
            input: ['./src/views/**/*.{json,twig,html}']
        }
    }
})