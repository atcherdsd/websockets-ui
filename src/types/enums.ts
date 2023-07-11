export enum Types {
  Reg = "reg",
  UpdateWinners = "update_winners",
  CreateRoom = "create_room",
  AddUserToRoom = "add_user_to_room",
  CreateGame = "create_game",
  UpdateRoom = "update_room",
  AddShips = "add_ships",
  StartGame = "start_game",
  Attack = "attack",
  RandomAttack = "randomAttack",
  Turn = "turn",
  Finish = "finish"
}

export enum ShipTypes {
  Small = "small",
  Medium = "medium",
  Large = "large",
  huge = "huge"
}

export enum AttackStatus {
  Miss = "miss",
  Killed = "killed",
  Shot = "shot"
}

export enum StateOfWholeShip {
  Unharmed = 'unharmed',
  Wounded = 'wounded',
  Destroyed = 'destroyed',
}
export enum StateOfShipDeck {
  Unharmed = 'unharmed',
  Destroyed = 'destroyed',
}
