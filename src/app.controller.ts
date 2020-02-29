import { Controller, Get } from "@nestjs/common";

import { AppService } from "./app.service";
import { IData } from "./models/data.model";
import { IGeneral } from "./models/general.model";
import { IUser } from "./models/user.model";

@Controller()
export class AppController {

  constructor(private readonly appService: AppService) {
  }

  @Get()
  getHello() {
    this.appService.getData().then((res: IData) => {

        const data: IGeneral = res.data;
        const users: IUser[] = res.users;
        const usersLength = users.length - 1;
        const userIndex = users.findIndex(user => user.active);
        const user = users[userIndex];
        const nextUserIndex = (userIndex === usersLength) ? 0 : userIndex + 1;
        const nextUser = users[nextUserIndex];

        this.appService.sendMessageToSlack(data, user, true).subscribe(res => res);
        this.appService.sendMessageToSlack(data, user).subscribe((res) => {

          if (!res) {
            return;
          }

          this.appService.updateDoc(user, false).then(res => res);
          this.appService.updateDoc(nextUser, true).then(res => res);
        });
      }
    );
  }
}
