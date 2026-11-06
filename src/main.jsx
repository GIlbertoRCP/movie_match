import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'));

// Dev-only: ?preview=<screen> renders a screen from fixed sample data (src/dev/Preview.jsx).
// The import sits behind import.meta.env.DEV, so production builds drop it.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')) {
  import('./dev/Preview.jsx').then(({ default: Preview }) => root.render(<StrictMode><Preview /></StrictMode>));
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
