const net = require("net");

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on("connect", () => {
      console.log(`Port ${port} on ${host} is OPEN!`);
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      console.log(`Port ${port} on ${host} TIMED OUT.`);
      socket.destroy();
      resolve(false);
    });
    socket.on("error", (err) => {
      console.log(`Port ${port} on ${host} ERROR:`, err.message);
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function run() {
  await checkPort("db.rotaract3192.org", 443);
  await checkPort("db.rotaract3192.org", 5432);
  await checkPort("db.rotaract3192.org", 6543);
  await checkPort("db.rotaract3192.org", 8000);
}

run();
