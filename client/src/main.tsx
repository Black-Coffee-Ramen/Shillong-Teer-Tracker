import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Remixicon CSS
const remixIconLink = document.createElement('link');
remixIconLink.rel = 'stylesheet';
remixIconLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css';
document.head.appendChild(remixIconLink);

// Import Google Fonts
const fontsLink = document.createElement('link');
fontsLink.rel = 'stylesheet';
fontsLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@300;400;500&family=Roboto+Mono:wght@400;500&display=swap';
document.head.appendChild(fontsLink);

createRoot(document.getElementById("root")!).render(<App />);
