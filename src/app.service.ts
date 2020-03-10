import { HttpService, Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
import { Observable } from "rxjs";
import { IUser } from "./models/user.model";
import { IGeneral } from "./models/general.model";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require("../tools/serviceAccountKey");

@Injectable()
export class AppService {

  private db;
  private infoRef;
  private usersRef;
  private options = {
    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
  };

  constructor(private readonly httpService: HttpService) {

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://slack-notifications-ngquad.firebaseio.com"
    });

    this.db = admin.firestore();
    this.infoRef = this.db.collection("general").doc("info");
    this.usersRef = this.db.collection("userbase");
  }

  async getData(): Promise<IGeneral> {
    // As an admin, the app has access to read and write all data, regardless of Security Rules
    return (await this.infoRef.get()).data();
  };

  async getUsers(): Promise<IUser[]> {
    return (await this.usersRef.orderBy("name").get()).docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  async updateDoc(user: IUser, active: boolean) {
    const funFact = !active ? user.funFact + 1 : user.funFact;
    await this.usersRef.doc(user.id).update({ active, funFact });
  }

  sendMessageToSlack(data: IGeneral, user: IUser, global?: boolean): Promise<any> {

    const url = global ? data.slackWebHookUrl : user.slackWebHookUrl;
    const text = global ? `<!channel> \n Today's lucky winner :trophy: is \n \n  :bouquet: *${user.name} ${user.surname}* :bouquet:. \n \n Assignement \n \n :put_litter_in_its_place: :  ${data.message}. \n \n   -------------------------------------------- \n  |     So far, :recycle: :      |  *${user.funFact}*  | :hourglass_flowing_sand: , :congratulations:        | \n   -------------------------------------------- \n` : `You are lucky winner today, you cleaned: ${user.funFact} times, congrats, keep it like that :D .`;
    const slackObject = { text };
    const body = `payload=${JSON.stringify(slackObject)}`;

    return this.httpService.post(url, body, this.options).toPromise();
  }
}
