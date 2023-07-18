import WebSocket, { WebSocketServer } from 'ws';
import { disconnectSocket, handleData } from '../controller';

const port = 3000;

const wsServer = new WebSocketServer({ port });

wsServer.on('listening', () => {
  console.log(`WebSocket server connection established on port ${port}!`);
});

wsServer.on('connection', (socket: WebSocket) => {

  socket.on('error', console.error);

  socket.on('message', (data: WebSocket.RawData): void => {

    handleData(socket, data, wsServer);

  });

  socket.on('close', () => {
    disconnectSocket(socket, wsServer);
  })
});
