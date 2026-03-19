import axios from 'axios';
import https from 'https';
import crypto from 'crypto';

const httpsAgent = new https.Agent({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    rejectUnauthorized: false
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const rawUrl = req.url.split('url=')[1];
    if (!rawUrl) return res.status(400).json({ error: 'Falta la URL' });

    const targetUrl = decodeURIComponent(rawUrl);

    try {
        const forwardedHeaders = { ...req.headers };

        // --- CLEANUP HEADERS ---
        delete forwardedHeaders.host;
        delete forwardedHeaders.connection;
        delete forwardedHeaders['accept-encoding'];

        const targetHost = new URL(targetUrl).host;

        const response = await axios.get(targetUrl, {
            httpsAgent: httpsAgent,
            headers: {
                ...forwardedHeaders,
                'host': targetHost,
                'Referer': 'https://universidades.sede.gob.es/',
                'Origin': 'https://universidades.sede.gob.es'
            },
            responseType: 'text',
            validateStatus: () => true
        });

        // Ensure we don't pass back the 'content-encoding' header if we stripped it
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }

        res.status(response.status).send(response.data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
