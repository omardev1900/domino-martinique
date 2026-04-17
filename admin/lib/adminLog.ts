import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

export type LogAction =
  | 'ban'
  | 'unban'
  | 'reset_stats'
  | 'add_coins'
  | 'close_room'
  | 'cleanup_rooms'
  | 'save_config'
  | 'send_notification'
  | 'create_news'
  | 'edit_news'
  | 'delete_news'
  | 'toggle_news';

export type AdminLogEntry = {
  action: LogAction;
  adminEmail: string;
  targetUid?: string;
  targetName?: string;
  details?: string;
  timestamp: number;
};

export async function logAdminAction(
  action: LogAction,
  opts: { targetUid?: string; targetName?: string; details?: string } = {}
) {
  try {
    const adminEmail = auth.currentUser?.email ?? 'admin';
    const entry: AdminLogEntry = {
      action,
      adminEmail,
      timestamp: Date.now(),
      ...opts,
    };
    await addDoc(collection(db, 'admin_logs'), entry);
  } catch (err) {
    // Silently fail — logs are non-critical
    console.warn('[adminLog] Failed to write log:', err);
  }
}
