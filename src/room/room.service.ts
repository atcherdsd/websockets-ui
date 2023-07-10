import { IAuthSocket, Room, User } from "../types/interfacesOut";

const userSockets: IAuthSocket[] = [];
const roomUsers: User[] = [];
let rooms: Room[] = [];

export const createRoom = (socket: IAuthSocket): Room | null => {
  const alreadyExistingRoom = checkExistingRoom(socket.index);
  if (alreadyExistingRoom) {
    console.log(
      'This player has already created a game room. Creating another one is impossible.'
    );
    return null;
  }
  
  userSockets.push(socket);
  roomUsers.push({
    name: socket.name, 
    index: socket.index
  });
  const newRoom = {} as Room;
  
  newRoom.roomUsers = roomUsers;
  newRoom.roomId = roomUsers.length - 1;

  rooms.push(newRoom);
  return newRoom;
};

function checkExistingRoom(id: number): Room | null {
  const foundedRoom = rooms.find(({ roomUsers }): User | undefined => {
    return roomUsers.find(elem => elem.index === id)
  });
  return foundedRoom || null;
}

export const getRoomsForUser = (): Room[] => {
  const availableRooms = rooms.filter(({ roomUsers}) => roomUsers.length < 2);
  return availableRooms.map(({ roomId, roomUsers }) => ({ roomId, roomUsers}));
};

export const addUserToRoom = (
  socket: IAuthSocket, 
  indexRoom: number 
  ): Room | null => {
  const socketOwnRoom = rooms
    .find(room => room.roomUsers
      .find(roomUser => roomUser.index === socket.index));
  if (socketOwnRoom) {
    if (socketOwnRoom.roomId === indexRoom) {
      console.log('Info: Unable to add a player to his own room');
      return null;
    }
    removeRoom(socketOwnRoom.roomId);
  }
    
  const requestedRoom = rooms.find((room) => room.roomId === indexRoom);
  if (!requestedRoom) {
    console.log('Requested room not found');
    return null;
  }
  requestedRoom.roomUsers
    .push({ name: socket.name, index: socket.index});
  userSockets.push(socket);

  createGame();

  return requestedRoom;
};

function removeRoom(id: number) {
  rooms = rooms.filter((room) => room.roomId !== id);
}

function createGame() {

}
