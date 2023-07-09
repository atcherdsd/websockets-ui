import WebSocket, { WebSocketServer } from 'ws';
import { handleData } from '../controller';

const port = 3000;

const wsServer = new WebSocketServer({ port });

wsServer.on('listening', () => {
  console.log(`New connection established on port  ${port}!`);
});

wsServer.on('connection', (socket: WebSocket) => {

  socket.on('error', console.error);

  socket.on('message', (data: WebSocket.RawData, isBinary: boolean): void => {

    handleData(socket, data);

    wsServer.clients.forEach((client): void => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  socket.on('close', () => {
    console.log('Connection has been closed!');
  })
});
