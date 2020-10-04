const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    //Get the URL and Parse it
    const parsedUrl = url.parse(req.url, true);
    //Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query String as an object
    const queryStringObject = parsedUrl.query;
    //Get HTTP Method
    const method = req.method.toLowerCase();
    //Get the Headers as on object
    const headers = req.headers;

    //Get the body payload
    const decoder = new stringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();
        let clientData = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        }
        const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        //Route the request to the handler specified inthe router

        chosenHandler(clientData, (statusCode, payload) => {
            statusCode = typeof (statusCode) === 'number' ? statusCode : 200;
            payload = typeof (payload) === 'object' ? payload : {};
            //Convert the payload to a tring
            payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log(statusCode, payloadString);
        })
    })

});

server.listen(port, () => {
    console.log(`Server Started on ${port}`);
})

//Implementing a Router
const router = {
    'users': handlers.users,
    '': handlers.homePage,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}