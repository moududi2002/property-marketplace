// 📍 /packages/shared-types/src/notification.ts

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";

export type NotificationType =
  | "PROPERTY_SUBMITTED"
  | "PROPERTY_UNDER_REVIEW"
  | "PROPERTY_APPROVED"
  | "PROPERTY_REJECTED"
  | "PROPERTY_CHANGES_REQUESTED"
  | "PROPERTY_PUBLISHED"
  | "PROPERTY_EDITED_BY_ADMIN"
  | "NEW_INQUIRY_RECEIVED"
  | "NEW_PROPERTY_SUBMITTED"
  | "NEW_USER_REGISTERED"
  | "ACCOUNT_SUSPENDED";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationUnreadCount {
  count: number;
}