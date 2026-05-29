const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let backendProcess;

function createWindow() {

    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            contextIsolation: true
        }
    });

    win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {

    backendProcess = fork(
        path.join(__dirname, "11_BACKEND", "server.js")
    );

    setTimeout(() => {
        createWindow();
    }, 3000);

});

app.on("window-all-closed", () => {

    if (backendProcess) {
        backendProcess.kill();
    }

    app.quit();

});