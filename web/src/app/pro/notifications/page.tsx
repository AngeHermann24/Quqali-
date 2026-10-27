import type { Metadata } from "next";
import { NotificationsPro } from "@/components/pro/notifications-pro";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default function NotificationsPage() {
  return <NotificationsPro />;
}
