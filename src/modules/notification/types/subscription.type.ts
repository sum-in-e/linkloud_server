export interface SubscriptionInfoType {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}
