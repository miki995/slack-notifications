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
  runApp() {
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

  async getUsers(data: IGeneral) {
    const users: IUser[] = await this.appService.getUsers();
    const usersLength = users.length - 1;
    const userIndex = users.findIndex(user => user.active);
    const user = users[userIndex];
    const nextUserIndex = (userIndex === usersLength) ? 0 : userIndex + 1;
    const nextUser = users[nextUserIndex];

    this.sendMessages(data, user);
    this.updateUsers(user, nextUser);
  }

  async sendMessages(data: IGeneral, user: IUser) {

    await this.appService.sendMessageToSlack(data, user, true);
    await this.appService.sendMessageToSlack(data, user);
  }

  async updateUsers(user: IUser, nextUser: IUser) {
    await this.appService.updateDoc(user, false);
    await this.appService.updateDoc(nextUser, true);
  }
}
