import { IGeneral } from "./general.model";
import { IUser } from "./user.model";

export interface IData {
  data: IGeneral;
  users: IUser[];
}
