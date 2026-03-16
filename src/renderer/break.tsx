import React from 'react'
import ReactDOM from 'react-dom/client'
import BreakPage from './pages/BreakPage'
import './i18n'
import './styles.css'

// 确保body有正确的样式
document.body.style.margin = '0'
document.body.style.padding = '0'
document.body.style.overflow = 'hidden'
document.body.style.height = '100vh'
document.body.style.width = '100vw'

const root = document.getElementById('root')
if (root) {
  root.style.height = '100%'
  root.style.width = '100%'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BreakPage />
  </React.StrictMode>,
)