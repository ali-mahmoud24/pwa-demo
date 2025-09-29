if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '../serviceWorker.js'
      );
      console.log('Service worker registered successfully.', registration);
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  });
}

// PWA Install Button
const installBtn = document.getElementById('install-btn');
let deferredPrompt = null;

function isAppInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

// Hide button if app already installed
if (isAppInstalled()) installBtn.style.display = 'none';

// Show button when browser allows installation
window.addEventListener('beforeinstallprompt', (e) => {
  if (isAppInstalled()) return;
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});

// Handle button click
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice; // optional
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

// Hide button after installation
window.addEventListener('appinstalled', () => {
  installBtn.style.display = 'none';
});
