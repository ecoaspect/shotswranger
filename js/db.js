// Database schema and CRUD operations
const db = new Dexie('ShotWrangerDB');

db.version(1).stores({
  sessions: '++id, date, isComplete',
  shots:    '++id, sessionId, hole, timestamp, club',
});

const DB = {
  async createSession(courseName) {
    return db.sessions.add({
      date:       new Date().toISOString(),
      courseName: courseName || '',
      isComplete: false,
    });
  },

  async completeSession(id) {
    return db.sessions.update(id, { isComplete: true });
  },

  async saveShot(shot) {
    return db.shots.add(shot);
  },

  async deleteShot(id) {
    return db.shots.delete(id);
  },

  async getSessions() {
    return db.sessions.orderBy('date').reverse().toArray();
  },

  async getShotsForSession(sessionId) {
    return db.shots.where('sessionId').equals(sessionId).toArray();
  },

  async exportSession(sessionId) {
    const session = await db.sessions.get(sessionId);
    const shots   = await DB.getShotsForSession(sessionId);
    return { session, shots };
  },
};
