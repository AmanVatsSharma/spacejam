import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class PushService {
  private expo: Expo;
  private readonly logger = new Logger(PushService.name);

  constructor() {
    this.expo = new Expo();
  }

  async sendPushNotification(deviceToken: string, title: string, body: string, data?: any) {
    if (!Expo.isExpoPushToken(deviceToken)) {
      this.logger.error(`Push token ${deviceToken} is not a valid Expo push token`);
      return;
    }

    const messages: ExpoPushMessage[] = [{
      to: deviceToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    try {
      const ticketChunk = await this.expo.sendPushNotificationsAsync(messages);
      this.logger.log(`Push notification sent successfully: ${JSON.stringify(ticketChunk)}`);
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error}`);
    }
  }
}
