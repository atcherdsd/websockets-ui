import WebSocket from "ws";
import { Types } from "../types/enums";
import { 
  IAuthSocket, 
  IUserRegisterData, 
  Room, 
  UpdateRoomData, 
  UpdateWinnersData, 
  WinnerData } from "../types/interfacesOut";
import { authenticateUser, getWinners } from "../users/authUser.service";
import { getFormattedData, parseRawData } from "../utils";
import { IncomingMessage } from "http";
import { addUserToRoom, createRoom, getRoomsForUser } from "../room/room.service";

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
