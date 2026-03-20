import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configurations
const configPath = path.join(__dirname, '../config/whatsappConfig.json');
let whatsappConfig = { admin: [], buildings: {} };

try {
    if (fs.existsSync(configPath)) {
        whatsappConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (error) {
    console.error("Error loading whatsappConfig.json:", error);
}

// Ensure puppeteer works in Docker/Alpine
const puppeteerExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH || null;

const puppeteerOptions = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions'
    ],
    headless: true,
};

if (puppeteerExecutablePath) {
    puppeteerOptions.executablePath = puppeteerExecutablePath;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOptions
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP TO LINK DEVICE');
    console.log('IF RUNNING IN DOCKER, DEPLOY LOCALLY FIRST TO CACHE .wwebjs_auth');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp API Session is READY and LINKED!');
    isReady = true;
});

client.on('message', message => {
    if (message.body === '!ping') {
        client.sendMessage(message.from, 'pong');
    }
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    isReady = false;
});

// Start initialization quietly
client.initialize().catch(err => {
    console.error('Failed to initialize WhatsApp Headless Client:', err);
});

/**
 * Sends a WhatsApp alarm message to the admin list and all users mapped to the specific building.
 * @param {string} buildingName - Name of the building in uppercase (e.g. "PRESTIGE POLYGON")
 * @param {string} liftId - Lift identifier (e.g. "P1")
 */
export const sendAlarmNotification = async (buildingName, liftId, floor) => {
export const sendAlarmNotification = async (buildingName, liftId, floor) => {
    if (!isReady) {
        console.warn(`[WhatsApp] Skipping message for ${liftId} in ${buildingName} - Client not ready yet.`);
        return;
    }

    const timestamp = new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(',', '');

    const message = `🚨 *ALERT! ALARM PRESSED* 🚨\n\n*Timestamp:* ${timestamp}\n*Building:* ${buildingName}\n*Floor:* ${floor || 'Unknown'}\n*Lift:* ${liftId}`;

    // Gather recipients: Admins + Building specific
    const recipients = new Set();

    if (Array.isArray(whatsappConfig.admin)) {
        whatsappConfig.admin.forEach(num => recipients.add(num.trim()));
    }

    if (whatsappConfig.buildings && Array.isArray(whatsappConfig.buildings[buildingName])) {
        whatsappConfig.buildings[buildingName].forEach(num => recipients.add(num.trim()));
    }

    if (recipients.size === 0) {
        console.warn(`[WhatsApp] No numbers configured for ${buildingName} or Admin. Msg dropped.`);
        return;
    }

    console.log(`[WhatsApp] Dispatching alarms to ${recipients.size} recipients for ${liftId} in ${buildingName}...`);

    for (const rawNumber of recipients) {
        try {
            // Numbers in config should include country code without '+', e.g., '919361876185'
            const chatId = `${rawNumber}@c.us`;
            await client.sendMessage(chatId, message);
            console.log(`✅ Passed native text payload to ${rawNumber}`);
        } catch (err) {
            console.error(`❌ Failed to send WhatsApp to ${rawNumber}:`, err.message);
        }
    }
};

export const getWhatsappStatus = () => isReady;
