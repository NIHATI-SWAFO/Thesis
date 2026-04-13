import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './lib/authConfig'
import './index.css'
import App from './App.jsx'

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(async () => {
  // Process the redirect response when Microsoft sends the user back
  const response = await msalInstance.handleRedirectPromise();
  
  if (response) {
    // User just came back from Microsoft login — set them as active
    msalInstance.setActiveAccount(response.account);
    console.log("Login success:", response.account.name);
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  );
});
