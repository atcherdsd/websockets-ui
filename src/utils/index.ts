import { Types } from "../types/enums";
import { Position, RequestDataTypes } from "../types/interfacesIn";
import { ResponseDataPropTypes } from "../types/interfacesOut";

export const parseRawData = (rawData: string): RequestDataTypes | null => {
  try {
    const {data: dataProp, ...withoutDataProp } = JSON.parse(rawData)
    const data = dataProp === '' ? dataProp : JSON.parse(dataProp);
    return { data, ...withoutDataProp} as RequestDataTypes;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const getFormattedData = (
  type: Types, 
  data: ResponseDataPropTypes
): string => {
  
  return JSON.stringify({
    type,
    data: JSON.stringify(data),
    id: 0,
  });
};

export const getRandomCoordinates = (): Position => {
  return {
    x: Math.floor(Math.random() * 10),
    y: Math.floor(Math.random() * 10),
  }
};
