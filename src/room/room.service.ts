import { AttackStatus, StateOfShipDeck, StateOfWholeShip, Types } from "../types/enums";
import { Position, Ships } from "../types/interfacesIn";
import { IAttackDataOut, IAuthSocket, ICreateGameData, IFinishData, IGameRoom, IShipStateData, IStartGameData, ITurnData, User } from "../types/interfacesOut";
import { getFormattedData, getRandomCoordinates } from "../utils";

const userSockets: IAuthSocket[] = [];
const roomUsers: User[] = [];
let rooms: IGameRoom[] = [];
let game = {} as ICreateGameData;

const shipsToSet = new Map<number, Ships>();
let currentPlayer: number;

const shipsStateDataCollection = new Map<number, IShipStateData[]>;

export const createRoom = (socket: IAuthSocket): IGameRoom | null => {
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
  const newRoom = {} as IGameRoom;
  
  newRoom.roomUsers = roomUsers;
  newRoom.roomId = roomUsers.length - 1;
  newRoom.game = game;

  rooms.push(newRoom);
  return newRoom;
};

function checkExistingRoom(id: number) {
  const foundedRoom = rooms.find(({ roomUsers }): User | undefined => {
    return roomUsers.find(elem => elem.index === id)
  });
  return foundedRoom || null;
}

export const getRoomsForUser = () => {
  const availableRooms = rooms.filter(({ roomUsers}) => roomUsers.length < 2);
  return availableRooms.map(({ roomId, roomUsers }) => ({ roomId, roomUsers}));
};

export const addUserToRoom = (
  socket: IAuthSocket, 
  indexRoom: number 
  ) => {
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
          x: direction ? x : x + i,
          y: direction ? y + i : y,
        })
      }
      shipsStateData.push(shipStateData);
    });
    shipsStateDataCollection.set(indexPlayer, shipsStateData);
  });
}

let isAttack = false;
let isFinishedGame = false;

export const handleAttack = (
  indexPlayer: number, 
  attackCoordinates: Position | null,
  gameId: number
): boolean | undefined => {
  const currentRoom = rooms.find(({ game }) => game.idGame === gameId);
  if (!currentRoom) {
    console.log('Info: Room does not exist');
    return;
  }

  if (isAttack || isFinishedGame) {
    console.log('Info: Attack is not possible');
    return false;
  }
  const currentPlayerIndex = currentPlayer;
  if (currentPlayerIndex !== indexPlayer) {
    console.log('Info: This player cannot attack now');
    return false;
  }

  isAttack = true;

  const anotherPlayerIndex = getAnotherPlayerIndex(indexPlayer);
  const dataForResponse: IAttackDataOut = 
    handleAttackProcess(indexPlayer, anotherPlayerIndex, attackCoordinates);

  isFinishedGame = checkGameFinish(anotherPlayerIndex);
  
  userSockets.forEach(socket => {
    const formattedAttackResponseData = 
      getFormattedData(Types.Attack, dataForResponse as IAttackDataOut);
    console.log(
      `Response for the game room about attack: ${formattedAttackResponseData}`
    );
    socket.send(formattedAttackResponseData);

    if (dataForResponse.status === AttackStatus.Miss) {
      currentPlayer = anotherPlayerIndex;
      const changeTurnData: ITurnData = { currentPlayer: anotherPlayerIndex };

      const formattedChangeTurnResponseData = 
        getFormattedData(Types.Turn, changeTurnData);
      console.log(
        `Response for the game room about change turn: ${formattedChangeTurnResponseData}`
      );
      socket.send(formattedChangeTurnResponseData);
    }

    if (isFinishedGame) {
      const finishData: IFinishData = { winPlayer: indexPlayer };

      const formattedFinishResponseData = 
        getFormattedData(Types.Finish, finishData as IFinishData);
      console.log(
        `Response for the game room about finish game: ${formattedFinishResponseData}`
      );
      socket.send(formattedFinishResponseData);
    }
  });
  isAttack = false; 

  if (isFinishedGame) {
    removeRoom(currentRoom.roomId);
  }
  return isFinishedGame;
}

function getAnotherPlayerIndex(currentIndexPlayer: number) {
  return roomUsers
    .find(({ index }) => index !== currentIndexPlayer)?.index as number;
}

function handleAttackProcess(
  currentPlayer: number, 
  anotherPlayerIndex: number, 
  coordinates: Position | null
){
  const position = coordinates || getRandomCoordinates();
  const status: AttackStatus = getAttackStatus(anotherPlayerIndex, position);

  return {
    position,
    currentPlayer,
    status
  };
}

function getAttackStatus(
  anotherPlayerIndex: number, 
  coordinates: Position
): AttackStatus {
  const alienShipsStateData = 
    shipsStateDataCollection.get(anotherPlayerIndex) as IShipStateData[];

  let currentStatus = AttackStatus.Miss;

  const updatedAlienShipsStateData = 
    alienShipsStateData.map(({ shipState, deckState }) => {
    let updatedAlienShipState = shipState;

    let updatedAlienDeckState = deckState.map(({ shipDeckState, x, y }) => {
      let updatedAlienDeckState = shipDeckState;

      if (coordinates.x === x && coordinates.y === y) {
        updatedAlienDeckState = StateOfShipDeck.Wounded;
        updatedAlienShipState = StateOfWholeShip.Wounded;
        currentStatus = AttackStatus.Shot;
      }
      return {
        shipDeckState: updatedAlienDeckState,
        x,
        y,
      };
    });
    if (
      updatedAlienDeckState.length > 0 
      && updatedAlienDeckState
        .every(({ shipDeckState }) => shipDeckState === StateOfShipDeck.Wounded)) {
          updatedAlienDeckState = [];
          updatedAlienShipState = StateOfWholeShip.Destroyed;
          currentStatus = AttackStatus.Killed;
    }
    return {
      shipState: updatedAlienShipState,
      deckState: updatedAlienDeckState,
    };
  });

  shipsStateDataCollection.set(anotherPlayerIndex, updatedAlienShipsStateData);
  return currentStatus;
}

function checkGameFinish(anotherPlayerIndex: number): boolean {
  const alienShipsStateData = 
    shipsStateDataCollection.get(anotherPlayerIndex) as IShipStateData[];
  return alienShipsStateData
    .every(({ shipState }) => shipState === StateOfWholeShip.Destroyed);
}
