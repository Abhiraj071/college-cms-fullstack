import { ApiService } from './ApiService.js';
import { auth } from './AuthService.js';

/**
 * NotificationService
 * Aggregates notifications from existing API data — no new backend model needed.
 * Notifications are derived: low-attendance alerts, recent notices, pending tasks.
 */
export class NotificationService {
    static _cache = null;
    static _lastFetch = 0;
    static _listeners = [];
    static CACHE_TTL = 60_000; // 1 minute

    static async getNotifications(force = false) {
        const now = Date.now();
        if (!force && this._cache && (now - this._lastFetch) < this.CACHE_TTL) {
            return this._cache;
        }

        const user = auth.getUser();
        if (!user) return [];

        const items = [];
        try {
            // 1. Recent notices (all roles)
            const notices = await ApiService.getNotices().catch(() => []);
            const recentNotices = notices
                .filter(n => {
                    const d = new Date(n.date || n.createdAt);
                    return (now - d.getTime()) < 7 * 24 * 60 * 60 * 1000; // last 7 days
                })
                .slice(0, 3);
            recentNotices.forEach(n => items.push({
                id:       `notice-${n._id}`,
                type:     'info',
                title:    n.title,
                message:  n.category || 'General',
                time:     n.date || n.createdAt,
                route:    'notices',
                icon:     '📢',
            }));

            // 2. Low attendance alerts (admin/teacher sees all; student sees own)
            if (user.role === 'admin' || user.role === 'teacher') {
                const summary = await ApiService.getAnalyticsSummary().catch(() => null);
                if (summary && summary.lowAttCount > 0) {
                    items.push({
                        id:      'low-att-admin',
                        type:    'warning',
                        title:   `${summary.lowAttCount} Students Below 75%`,
                        message: 'Attendance threshold alert',
                        time:    new Date().toISOString(),
                        route:   'analytics',
                        icon:    '⚠️',
                    });
                }
            } else if (user.role === 'student') {
                const students = await ApiService.getStudents(user.id).catch(() => []);
                const me = students.find(s => String(s.userId?._id || s.userId) === String(user.id));
                if (me) {
                    const pct = parseInt(me.attendancePercentage) || 0;
                    if (pct < 75) {
                        items.push({
                            id:      'low-att-self',
                            type:    'warning',
                            title:   `Your Attendance: ${me.attendancePercentage}`,
                            message: 'Below the 75% threshold',
                            time:    new Date().toISOString(),
                            route:   'attendance',
                            icon:    '📉',
                        });
                    }
                }
            }

            // 3. Pending assignments (teacher: ungraded; student: pending)
            if (user.role === 'teacher') {
                const assignments = await ApiService.getAssignments().catch(() => []);
                const ungraded = assignments.filter(a => a.submissions?.some(s => !s.grade));
                if (ungraded.length > 0) {
                    items.push({
                        id:      'pending-grades',
                        type:    'info',
                        title:   `${ungraded.length} Assignment${ungraded.length > 1 ? 's' : ''} Need Grading`,
                        message: 'Submissions awaiting feedback',
                        time:    new Date().toISOString(),
                        route:   'assignments',
                        icon:    '📝',
                    });
                }
            }
        } catch (e) {
            console.warn('NotificationService fetch error:', e.message);
        }

        // Sort by time descending
        items.sort((a, b) => new Date(b.time) - new Date(a.time));

        this._cache     = items;
        this._lastFetch = now;
        this._listeners.forEach(fn => fn(items));
        return items;
    }

    static onUpdate(fn) {
        this._listeners.push(fn);
        return () => { this._listeners = this._listeners.filter(l => l !== fn); };
    }

    static invalidate() {
        this._cache     = null;
        this._lastFetch = 0;
    }

    static timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1)   return 'just now';
        if (m < 60)  return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24)  return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    }
}
