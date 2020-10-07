const server = require('./lib/server');
const workers = require('./lib/workers');

const app = {};

app.init = ()=>{
    //Start the server
    server.init();
    
    //Start the Server background service workers

    // workers.init();

}

app.init();