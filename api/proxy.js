// Vercel serverless function to proxy requests to HTTP backend
// This solves the HTTPS -> HTTP mixed content blocking issue

// Disable Vercel's body parser to handle raw FormData
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    const BACKEND_URL = 'http://82.29.165.232';

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const path = req.url.replace('/api/proxy', '');
        const targetUrl = `${BACKEND_URL}${path}`;

        // Build headers
        const headers = {};
        if (req.headers['content-type']) {
            headers['Content-Type'] = req.headers['content-type'];
        }

        // Build fetch options
        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        // Forward body for non-GET requests by reading raw request stream
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            fetchOptions.body = Buffer.concat(chunks);
        }

        // Make request to backend
        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json();

        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
}
