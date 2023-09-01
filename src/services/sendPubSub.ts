import { PubSub } from '@google-cloud/pubsub';

const pubSub = new PubSub();

export default function (topic: string, data: any, customAttributes: any = {}): Promise<string> {
  return pubSub.topic(topic).publishJSON(data, customAttributes);
}
