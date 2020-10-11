/**
 * The Root File to spin off the application
 *
 * @invokes server.init() to create and register user and checks
 * @invokes workers.init() to monitor user checks
 *
 */
const server = require("./app/server");
const workers = require("./app/workers");

const app = {};

app.init = () => {
  //Start the Server to Process User data and Checks
  server.init();

  //Start the Server background service workers
  workers.init();
};

app.init();
