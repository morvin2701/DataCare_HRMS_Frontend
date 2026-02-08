// Vercel serverless function to proxy requests to HTTP backend
// This solves the HTTPS -> HTTP mixed content blocking issue

export default async function handler(req, res) {
    const BACKEND_URL = 'http://82.29.165.232';

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const path = req.url.replace('/api/proxy', '');
        const targetUrl = `${BACKEND_URL}${path}`;

        const options = {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
        };

        // Forward body for POST/PUT requests
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, options);
        const data = await response.json();

        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
}
