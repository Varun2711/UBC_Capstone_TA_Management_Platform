import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <>
        <App />
        {/* Allows us to use toasts globally across our app */}
        <Toaster richColors position='top-center'/> 
      </>
      
    </BrowserRouter>
  </StrictMode>,
)
