const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001', // Use your local backend port
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Don't rewrite paths
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add debugging
        console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          message: 'Proxy error - Backend server may be down',
          error: err.message 
        }));
      }
    })
  );
}; 