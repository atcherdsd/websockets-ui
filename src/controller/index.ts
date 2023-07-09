import WebSocket from "ws";
import { Types } from "../types/enums";
import { IUserRegisterData } from "../types/interfacesOut";
import { authenticateUser } from "../users/authUser.service";
import { getFormattedData, parseRawData } from "../utils";

export const handleData = (socket: WebSocket, data: WebSocket.RawData) => {
  try {
    
    const stringifiedData = data.toString();
    console.log(`Received from the client: ${stringifiedData}`);

    const parsedData = parseRawData(stringifiedData);
    
    if (!parsedData) return null;

    const type = parsedData.type;

    switch (type) {
      case Types.Reg:
        const { data: { name, password } } = parsedData;

        const registerDataForResponse: IUserRegisterData = 
          authenticateUser(name, password, socket);
        const formattedResponseData: string = 
          getFormattedData(Types.Reg, registerDataForResponse);

        console.log(`Data regarding registration: ${formattedResponseData}`);
        socket.send(formattedResponseData);
        console.log(`New player '${registerDataForResponse.name}' is created!`);
        break;
      default:
        console.log('The requested action is not supported');
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
