import { ShipTypes, Types } from "./enums";

export interface IRequestData {
  type: Types,
  data: string,
  id: 0,
}

export interface IID {
  id: 0;
}
export type Position = {
  x: number;
  y: number;
}

export type AuthDataPropIn = {
  name: string;
  password: string;
}
export interface IAuthDataIn extends IID {
  type: Types.Reg;
  data: AuthDataPropIn;
}

export interface ICreateRoomData extends IID {
  type: Types.CreateRoom;
  data: '';
}

export type AddUserDataProp = {
  indexRoom: number;
}
export interface IAddUserToRoomData extends IID {
  type: Types.AddUserToRoom;
  data: AddUserDataProp;
}

export type Ships = [{
  position: Position;
  direction: boolean;
  length: number;
  type: ShipTypes;
}]
export type AddShipsDataProp = {
  gameId: number;
  ships: Ships;
  indexPlayer: number;
}
export interface IAddShipsData extends IID {
  type: Types.AddShips;
  data: AddShipsDataProp;
}

export type AttackDataProp = {
  gameId: number;
  x: number;
  y: number;
  indexPlayer: number;
}
export interface IAttackData extends IID {
  type: Types.Attack;
  data: AttackDataProp;
}

export type RandomAttackDataProp = {
  gameId: number;
  indexPlayer: number;
}
export interface IRandomAttackData extends IID {
  type: Types.RandomAttack;
  data: RandomAttackDataProp;
}

export type RequestDataTypes =
| IAuthDataIn
| ICreateRoomData
| IAddUserToRoomData
| IAddShipsData
| IAttackData
| IRandomAttackData;
