import WebSocket, { WebSocketServer } from 'ws';

const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on('connection', (socket) => {
  socket.on('error', console.error);

  socket.on('message', (data, isBinary): void => {
    wsServer.clients.forEach((client): void => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});
