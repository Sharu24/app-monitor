const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const helpers = require('./helpers');
const handlers = require('./handlers');

const port = process.env.PORT || 3000;

const server = http.createServer((req,res) => {

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    const trimmedPath = path.replace(/^\/+|\/$/g, '');
    const queryStringObject = parsedUrl.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;

    const decoder = new stringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    })

    req.on('end', async () => {
        try {
            buffer += decoder.end();
            let clientData = {
                trimmedPath,
                queryStringObject,
                method,
                headers,
                'payload' : helpers.parseJsonToObject(buffer)
            }
    
            const handlerResponse = await handlers.identifyRoute(clientData);
            let statusCode = typeof (handlerResponse.statusCode) === 'number' ? handlerResponse.statusCode : helpers.statusCodes.SERVICE_UNAVAILABLE;
            let payload = typeof (handlerResponse.message) === 'object' ? handlerResponse.message : typeof handlerResponse.message === 'string' ? {'message' : handlerResponse.message } : {};
    
            payload = JSON.stringify(payload);
    
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payload);
            console.log(statusCode, payload);
        }
        catch(err) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(err.statusCode);
            res.end(err.message);
            console.log(err);
        }
        
    })
    
});

//Server init
module.exports = {
    init: () => {
        server.listen(port, () => {
            console.log(`Server Started on ${port}`);
        })
    }
}