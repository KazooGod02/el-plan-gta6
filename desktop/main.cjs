// EL PLAN — desktop build (Electron). Serves the same game files as the web version
// through an app:// protocol (ES modules don't load from file://).
const { app, BrowserWindow, protocol, net, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const p = decodeURIComponent(new URL(req.url).pathname);
    const file = path.normalize(path.join(ROOT, p === '/' ? 'index.html' : p));
    if (!file.startsWith(ROOT)) return new Response('', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });

  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 640, minHeight: 360,
    fullscreen: true, backgroundColor: '#0b0b14', title: 'EL PLAN',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), autoplayPolicy: 'no-user-gesture-required' },
  });
  win.removeMenu();
  win.loadURL('app://game/index.html');
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && (i.key === 'F11' || (i.alt && i.key === 'Enter'))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  ipcMain.on('fullscreen', () => win.setFullScreen(!win.isFullScreen()));
  // `--smoke`: load, report console errors, quit (used to test builds without opening a window)
  if (process.argv.includes('--smoke')) {
    win.hide();
    const errs = [];
    win.webContents.on('console-message', (e) => { if (e.level === 'error') errs.push(e.message); });
    win.webContents.on('did-finish-load', () => setTimeout(async () => {
      const ok = await win.webContents.executeJavaScript('!!(window.G && G.scene && window.desktop)').catch(() => false);
      console.log(JSON.stringify({ ok, errs }));
      app.quit();
    }, 3000));
  }
});

ipcMain.on('quit', () => app.quit());
app.on('window-all-closed', () => app.quit());
