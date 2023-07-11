import WebSocket from "ws";
import { Position, Ships } from "./interfacesIn";
import { AttackStatus, StateOfShipDeck, StateOfWholeShip } from "./enums";

export interface IUserRegisterData {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export type User = {
  name: string;
  index: number;
}
export interface IUserData extends User {
  password: string;
}

export interface IAuthSocket extends WebSocket, User {}

export type WinnerData = {
  name: string;
  wins: number;
}
export type UpdateWinnersData = WinnerData[]

export interface ICreateGameData {
  idGame: number;
  idPlayer: number;
}

export interface Room {
  roomId: number;
  roomUsers: User[];
}
export type UpdateRoomData = Room[]

export interface IStartGameData {
  ships: Ships;
  currentPlayerIndex: number;
}

export interface IAttackData {
  position: Position;
  currentPlayer: number;
  status: AttackStatus;
}

export interface ITurnData {
  currentPlayer: number;
}

export interface IFinishData {
  winPlayer: number;
}

export type ResponseDataPropTypes = 
| IUserRegisterData
| UpdateWinnersData
| UpdateRoomData
| ICreateGameData
| IStartGameData
| IAttackData
| ITurnData
| IFinishData


export interface IDeckState extends Position {
  shipDeckState: StateOfShipDeck;
}
export interface IShipStateData {
  shipState: StateOfWholeShip;
  deckState: IDeckState[];
}
