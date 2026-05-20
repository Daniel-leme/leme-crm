import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O proxy permite que o frontend faça chamadas para /api e elas sejam
// redirecionadas para o servidor Node em 4000. Se rodar o cliente em
// outra máquina (sócio via Hamachi), basta editar VITE_API_BASE no
// arquivo .env do cliente, ou em runtime via janela localStorage.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
