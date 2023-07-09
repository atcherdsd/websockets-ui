import WebSocket from "ws";
import { IAuthSocket, IUserData, IUserRegisterData } from "../types/interfacesOut";

const users: IUserData[] = [];

export const authenticateUser = (
  name: string, 
  password: string, 
  socket: WebSocket
): IUserRegisterData => {
  
  const registeredUser = users.find((user) => user.name === name);

  if (registeredUser) {
    if (registeredUser.password === password) {
      
      (socket as IAuthSocket).name = registeredUser.name;
      (socket as IAuthSocket).index = registeredUser.index;

      return {
        name: registeredUser.name,
        index: registeredUser.index,
        error: false,
        errorText: ''
      };
    } else {
      return {
        name: registeredUser.name,
        index: registeredUser.index,
        error: true,
        errorText: 'Password is incorrect'
      };
    }
  } else {
    const newUser = {} as IUserData;
    newUser.name = name;
    newUser.password = password;
    users.push(newUser);
    newUser.index = users.length - 1;

    (socket as IAuthSocket).name = newUser.name;
    (socket as IAuthSocket).index = newUser.index;
    return {
      name: newUser.name,
      index: newUser.index,
      error: false,
      errorText: ''
    };
  }
};
