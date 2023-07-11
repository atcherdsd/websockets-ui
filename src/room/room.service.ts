import { StateOfShipDeck, StateOfWholeShip, Types } from "../types/enums";
import { Ships } from "../types/interfacesIn";
import { IAuthSocket, ICreateGameData, IShipStateData, IStartGameData, Room, User } from "../types/interfacesOut";
import { getFormattedData } from "../utils";

const userSockets: IAuthSocket[] = [];
const roomUsers: User[] = [];
let rooms: Room[] = [];

const shipsToSet = new Map<number, Ships>();
let currentPlayer: number;

const shipsStateDataCollection = new Map<number, IShipStateData[]>;

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

  createGame(indexRoom, socket.index);

  return requestedRoom;
};

function removeRoom(id: number) {
  rooms = rooms.filter((room) => room.roomId !== id);
}

function createGame(indexRoom: number, userId: number) {
  const newGame: ICreateGameData = getNewGame(indexRoom, userId);
  userSockets.forEach(socket => {
    const dataForEachCorrectResponse: ICreateGameData = {
      idGame: newGame.idGame,
      idPlayer: socket.index,
    };
    const formattedCreateGameResponseData = 
      getFormattedData(Types.CreateGame, dataForEachCorrectResponse);
    console.log(
      `Response for the game room about game creation: ${formattedCreateGameResponseData}`
    );
    socket.send(formattedCreateGameResponseData);
  })
}

function getNewGame(indexRoom: number, userId: number) {
  const game = {} as ICreateGameData;
  game.idGame = indexRoom;
  game.idPlayer = userId;
  return game;
}

export const addShipsToCreatedGame = (
  // gameId: number,
  indexPlayer: number, 
  ships: Ships
) => {
  if (shipsToSet.size === 0) {
    currentPlayer = indexPlayer;
  }
  shipsToSet.set(indexPlayer, ships);

  if (shipsToSet.size === 2) {
    startGame();

    const currentPlayerIndex = currentPlayer;

    userSockets.forEach(socket => {
      const startGameData: IStartGameData = {
        ships: shipsToSet.get(socket.index) as Ships,
        currentPlayerIndex,
      };
      const formattedStartGameResponseData = 
        getFormattedData(Types.StartGame, startGameData);
      console.log(
        `Response for the game room about game starting: ${formattedStartGameResponseData}`
      );
      socket.send(formattedStartGameResponseData);
    })
  }
}

function startGame() {
  shipsToSet.forEach((ships, indexPlayer) => {
    const shipsStateData: IShipStateData[] = [];

    ships.forEach(({ position: { x, y },  direction,  length }) => {
      const shipStateData: IShipStateData = { 
        shipState: StateOfWholeShip.Unharmed, 
        deckState: [],
      };
      for (let i = 0; i < length; i++) {
        shipStateData.deckState.push({
          shipDeckState: StateOfShipDeck.Unharmed,
          x: direction ? x : x + 1,
          y: direction ? y : y + 1,
        })
      }
      shipsStateData.push(shipStateData);
    });
    shipsStateDataCollection.set(indexPlayer, shipsStateData);
  });
}
