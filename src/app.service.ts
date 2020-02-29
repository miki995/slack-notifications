import { HttpService, Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
import { Observable } from "rxjs";
import { IData } from "./models/data.model";
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

  async getData(): Promise<IData> {
    // As an admin, the app has access to read and write all data, regardless of Security Rules
    return {
      data: (await this.infoRef.get()).data(),
      users: (await this.usersRef.orderBy("name").get()).docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  };

  async updateDoc(user: IUser, active: boolean) {
    const funFact = !active ? user.funFact + 1 : user.funFact;
    await this.usersRef.doc(user.id).update({ active, funFact });
  }

  sendMessageToSlack(data: IGeneral, user: IUser, global?: boolean): Observable<any> {

    const url = global ? data.slackWebHookUrl : user.slackWebHookUrl;
    const text = global ? `Danasnji sretni dobitnik je ${user.name}  ${user.surname}: ${data.message}. Jubilej broj: ${user.funFact}, cestitamo.` : `Vi ste danas srecni dobitnik, bacili ste smece: ${user.funFact} puta, cestitamo, samo tako nastavite :D .`;
    const slackObject = { text };
    const body = `payload=${JSON.stringify(slackObject)}`;

    return this.httpService.post(url, body, this.options);
  }
}
