const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
// const activeWin = require('active-win'); // Import later when needed
// const { GoogleGenerativeAI } = require('@google/generative-ai');

let mainWindow;
let io;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // For prototype speed, enable node integration
        }
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools();
}

// --- SOCKET.IO SERVER (The Bridge) ---
function startServer() {
    const server = http.createServer();
    io = new Server(server, {
        cors: {
            origin: "*", // Allow connection from Chrome Extension
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New Client Connected:', socket.id);

        // Handle generic messages
        socket.on('message', (data) => {
            console.log('Message from client:', data);
        });

        // Handle Telemetry 
        socket.on('TELEMETRY', (data) => {
            console.log('Telemetry Received:', data);
            // Forward to Renderer (UI) to display
            if (mainWindow) {
                mainWindow.webContents.send('TELEMETRY_UPDATE', data);
            }
        });

        // Handle Smart Launcher URL Resolution
        socket.on('RESOLVE_URL', (input) => {
            console.log('Resolving URL for:', input);
            // Mock Logic for Stage 1
            let targetUrl = 'https://google.com';
            if (input.includes('mail')) targetUrl = 'https://mail.google.com';
            else if (input.includes('youtube')) targetUrl = 'https://youtube.com';

            // Send Redirect Command back
            socket.emit('REDIRECT', { url: targetUrl });
        });

        socket.on('disconnect', () => {
            console.log('Client Disconnected:', socket.id);
        });
    });

    server.listen(3000, () => {
        console.log(' NeuralPath Hub Server running on port 3000');
    });
}

app.whenReady().then(() => {
    createWindow();
    startServer();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
