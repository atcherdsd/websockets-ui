import WebSocket from "ws";
import { Types } from "../types/enums";
import { 
  IAuthSocket, 
  IUserRegisterData, 
  Room, 
  UpdateRoomData, 
  UpdateWinnersData, 
  WinnerData 
} from "../types/interfacesOut";
import { authenticateUser, getWinners, writeWinner } from "../users/authUser.service";
import { getFormattedData, parseRawData } from "../utils";
import { IncomingMessage } from "http";
import { 
  addShipsToCreatedGame, 
  addUserToRoom, 
  createRoom, 
  getRoomsForUser, 
  handleAttack,
  handleDisconnection
} from "../room/room.service";
import { 
  AttackDataProp, 
  IAttackData, 
  IRandomAttackData, 
  Position, 
  RandomAttackDataProp 
} from "../types/interfacesIn";

export const handleData = (
  socket: WebSocket, 
  data: WebSocket.RawData,
  wsServer: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>) => {
  try {
    
    const stringifiedData = data.toString();
    console.log(`Received from the client: ${stringifiedData}`);

    const parsedData = parseRawData(stringifiedData);
    
    if (!parsedData) return null;

    const type = parsedData.type;

    switch (type) {
      case Types.Reg: {
        const { data: { name, password } } = parsedData;

        const registerDataForResponse: IUserRegisterData = 
          authenticateUser(name, password, socket);
        const formattedResponseData: string = 
          getFormattedData(Types.Reg, registerDataForResponse);
        console.log(
          `Response about registration to the client: ${formattedResponseData}`
        );
        socket.send(formattedResponseData);
        console.log(
          `Info: New player '${registerDataForResponse.name}' is created!`
        );

        const roomsForUser: Room[] = getRoomsForUser();
        const formattedRoomResponseData:string = 
          getFormattedData(Types.UpdateRoom, roomsForUser as UpdateRoomData);
        console.log(`Response about rooms for all: ${formattedRoomResponseData}`);
        socket.send(formattedRoomResponseData);

        const winners: WinnerData[] = getWinners();
        const formattedWinnersResponseData:string = 
          getFormattedData(Types.UpdateWinners, winners as UpdateWinnersData);
        console.log(`Response about winners for all: ${formattedWinnersResponseData}`);
        broadcastData(formattedWinnersResponseData, wsServer);

        break;
      }
      case Types.CreateRoom: {
        const newRoom = createRoom(socket as IAuthSocket);

        if (newRoom) {
          const roomsForUser: Room[] = getRoomsForUser();
          const formattedRoomResponseData:string = 
            getFormattedData(Types.UpdateRoom, roomsForUser as UpdateRoomData);
          console.log(
            `Response about created room for all: ${formattedRoomResponseData}`
          );
          broadcastData(formattedRoomResponseData, wsServer);
          console.log(`Room ${newRoom.roomId} is created`);
        }
        break;
      }
      case Types.AddUserToRoom: {
        const { data: { indexRoom } } = parsedData;

        const roomToAddUser = addUserToRoom(socket as IAuthSocket, indexRoom);
        if (!roomToAddUser) break;

        const roomsForUser: Room[] = getRoomsForUser();
        const formattedAddUserResponseData:string = 
          getFormattedData(Types.UpdateRoom, roomsForUser as UpdateRoomData);
        console.log(
          `Data about adding a player to the room: ${formattedAddUserResponseData}`
        );
        broadcastData(formattedAddUserResponseData, wsServer);
        console.log(`Info: Player added to room ${roomToAddUser.roomId}`);

        break;
      }
      case Types.AddShips: {
        const {
          data: { indexPlayer, ships },
        } = parsedData;

        addShipsToCreatedGame(indexPlayer, ships);

        break;
      }
      case Types.Attack:
      case Types.RandomAttack: {
        const { data } = parsedData as IAttackData | IRandomAttackData;
        const { x, y } = data as Position;
        const { gameId, indexPlayer } = data as AttackDataProp | RandomAttackDataProp;
                
        const coordinatesExist = (x !== undefined && y !== undefined);
        const attackCoordinates = coordinatesExist ? { x, y} : null;

        const isGameOver = handleAttack(indexPlayer, attackCoordinates, gameId);

        if (isGameOver) {
          writeWinner(indexPlayer);

          const winners: WinnerData[] = getWinners();
          const formattedWinnersResponseData:string = 
            getFormattedData(Types.UpdateWinners, winners as UpdateWinnersData);
          console.log(`Response about winners for all: ${formattedWinnersResponseData}`);
          broadcastData(formattedWinnersResponseData, wsServer);
        }
        break;
      }
      default:
        console.log('The requested action is not supported');
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

function broadcastData(
  dataToSend: string, 
  wsServer: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>
) {
  wsServer.clients.forEach((client): void => {
    client.send(dataToSend);
  });
}

export const disconnectSocket = (
  socket: WebSocket,
  wsServer: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>
) => {
  const { name, index } = socket as IAuthSocket;

  if (index === undefined) {
    console.log('Connection with player is closed!');
  } else {
    console.log(`Connection with player ${name} is closed!`);
    const { 
      hasUpdateRooms, 
      hasUpdateWinners, 
      winner 
    } = handleDisconnection(index);

    if (hasUpdateRooms) {
      const roomsForUpdate = getRoomsForUser();
      const formattedHasUpdateRoomsResponseData
        = getFormattedData(Types.UpdateRoom, roomsForUpdate);
      console.log(`Response about rooms for all: ${formattedHasUpdateRoomsResponseData}`);
      broadcastData(formattedHasUpdateRoomsResponseData, wsServer);
    }

    if (hasUpdateWinners) {
      winner !== undefined ? writeWinner(winner) : null;

      const winners = getWinners();
      const formattedHasUpdateWinnersResponseData
        = getFormattedData(Types.UpdateWinners, winners);
      console.log(`Response about winners for all: ${formattedHasUpdateWinnersResponseData}`);
      broadcastData(formattedHasUpdateWinnersResponseData, wsServer);
    }
  }
};
