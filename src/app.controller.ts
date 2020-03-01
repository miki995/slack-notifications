import { Controller, Get } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { AppService } from "./app.service";
import { IGeneral } from "./models/general.model";
import { IUser } from "./models/user.model";

const CronJob = require("cron").CronJob;

@Controller()
export class AppController {

  constructor(
    private readonly appService: AppService,
    private readonly schedulerRegistry: SchedulerRegistry) {
  }

  @Get()
  getHello() {
    this.runNotifications();
  }

  runNotifications() {
    this.appService.getData().then((res: IGeneral) => {

        const data: IGeneral = res;
        const cronExpression = `${data.minute} ${data.hours.join(",")} * * ${data.days.join(",")}`;
        const job = new CronJob(cronExpression, () => this.getUsers(data));

        this.schedulerRegistry.addCronJob(`slack-notifications`, job);
        job.start();
      }
    );
  }

  getUsers(data: IGeneral) {
    this.appService.getUsers().then((res: IUser[]) => {

      const users: IUser[] = res;
      const usersLength = users.length - 1;
      const userIndex = users.findIndex(user => user.active);
      const user = users[userIndex];
      const nextUserIndex = (userIndex === usersLength) ? 0 : userIndex + 1;
      const nextUser = users[nextUserIndex];

      this.sendMessages(data, user, nextUser);
    });
  }

  sendMessages(data: IGeneral, user: IUser, nextUser: IUser) {
    this.appService.sendMessageToSlack(data, user, true).subscribe(res => res);
    this.appService.sendMessageToSlack(data, user).subscribe((res) => {

      if (!res) {
        return;
      }

      this.appService.updateDoc(user, false).then(res => res);
      this.appService.updateDoc(nextUser, true).then(res => res);
    });
  }
}
