/**
 * PollingService — lightweight real-time updates via periodic API polling.
 * Usage:
 *   const stop = PollingService.start('dashboard-stats', 30000, async () => { ... update UI ... });
 *   stop(); // call to cancel
 */
export const PollingService = {
    _jobs: new Map(),

    /**
     * @param {string}   id        - unique job identifier
     * @param {number}   interval  - ms between polls (min 10000)
     * @param {Function} callback  - async fn to call each tick
     * @returns {Function} stop function
     */
    start(id, interval, callback) {
        this.stop(id); // cancel existing job with same id
        const ms      = Math.max(interval, 10_000);
        const tick    = async () => { try { await callback(); } catch (e) { console.warn(`[Poll:${id}]`, e.message); } };
        const handle  = setInterval(tick, ms);
        this._jobs.set(id, handle);
        return () => this.stop(id);
    },

    stop(id) {
        if (this._jobs.has(id)) {
            clearInterval(this._jobs.get(id));
            this._jobs.delete(id);
        }
    },

    stopAll() {
        this._jobs.forEach((_, id) => this.stop(id));
    },
};
