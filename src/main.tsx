import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initPwa } from './pwa/pwa'
import { PwaLayer } from './pwa/PwaLayer'
import { isPaymentReturnInsidePopup, PaymentReturnInPopup } from './components/MayarCheckoutModal'

// Setelah bayar, Mayar mengarahkan popup pembayaran ke /pembayaran/:id. Di dalam popup itu
// cukup kabari jendela induk; aplikasi lengkap tidak perlu dimuat dua kali.
const insidePaymentPopup = isPaymentReturnInsidePopup()

if (!insidePaymentPopup) initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {insidePaymentPopup ? <PaymentReturnInPopup /> : <><App /><PwaLayer /></>}
  </StrictMode>,
)
