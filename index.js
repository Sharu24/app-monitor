const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

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
            'payload': buffer
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

const handlers = {};
//Smaple Handler
handlers.sample = (clientData, callback) => {
    callback(200, { "Status": "You are in /sample Route" });
}

handlers.homePage = (clientData, callback) => {
    callback(200, { "Status": "Home Page Route" });
}

handlers.notFound = (clientData, callback) => {
    callback(404, { "Status": "Not Found" });
}

//Implementing a Router
const router = {
    'sample': handlers.sample,
    '': handlers.homePage
}