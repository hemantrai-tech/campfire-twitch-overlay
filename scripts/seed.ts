import 'dotenv/config';
import { db } from '../src/db/index.js';

const streamerId = 'campfire-demo';
const viewers = [
  { id: 'demo-viewer-1', login: 'ember', name: 'Ember' },
  { id: 'demo-viewer-2', login: 'maple', name: 'Maple' },
  { id: 'demo-viewer-3', login: 'moss', name: 'Moss' },
  { id: 'demo-viewer-4', login: 'cinder', name: 'Cinder' },
  { id: 'demo-viewer-5', login: 'sparrow', name: 'Sparrow' },
];
const now = Date.now();
const streams = [
  { id: 'demo-history-1', age: 3, status: 'offline' },
  { id: 'demo-history-2', age: 2, status: 'offline' },
  { id: 'demo-history-3', age: 1, status: 'offline' },
  { id: 'demo-live', age: 0, status: 'live' },
] as const;
// A few intentional gaps make the streak table and leaderboard look like real community activity.
const attendance: number[][] = [
  [18, 14, 22, 12],
  [11, 0, 15, 9],
  [0, 13, 10, 8],
  [7, 8, 0, 6],
  [5, 6, 7, 4],
];

db.transaction(() => {
  db.prepare("DELETE FROM poll_votes WHERE intermission_id IN (SELECT i.id FROM intermissions i JOIN streams s ON s.id=i.stream_id WHERE s.streamer_id=? AND s.id LIKE 'demo-%')").run(streamerId);
  db.prepare("DELETE FROM poll_options WHERE intermission_id IN (SELECT i.id FROM intermissions i JOIN streams s ON s.id=i.stream_id WHERE s.streamer_id=? AND s.id LIKE 'demo-%')").run(streamerId);
  db.prepare("DELETE FROM intermissions WHERE stream_id IN (SELECT id FROM streams WHERE streamer_id=? AND id LIKE 'demo-%')").run(streamerId);
  db.prepare("DELETE FROM votes WHERE stream_id IN (SELECT id FROM streams WHERE streamer_id=? AND id LIKE 'demo-%')").run(streamerId);
  db.prepare("DELETE FROM milestones WHERE stream_id IN (SELECT id FROM streams WHERE streamer_id=? AND id LIKE 'demo-%')").run(streamerId);
  db.prepare("DELETE FROM attendance WHERE stream_id IN (SELECT id FROM streams WHERE streamer_id=? AND id LIKE 'demo-%')").run(streamerId);
  db.prepare("DELETE FROM messages_count WHERE stream_id IN (SELECT id FROM streams WHERE streamer_id=? AND id LIKE 'demo-%')").run(streamerId);
  db.prepare("DELETE FROM chat_messages WHERE streamer_id=? AND stream_id LIKE 'demo-%'").run(streamerId);
  db.prepare("DELETE FROM streams WHERE streamer_id=? AND id LIKE 'demo-%'").run(streamerId);

  db.prepare("INSERT INTO streamers(id,login,display_name,access_token,refresh_token,expires_at,overlay_token,mode) VALUES(?,?,?,?,?,?,?,'demo') ON CONFLICT(id) DO UPDATE SET login=excluded.login,display_name=excluded.display_name,overlay_token=excluded.overlay_token,mode='demo'")
    .run(streamerId, 'campfire_demo', 'Campfire Demo', '', '', 0, 'demo-overlay');
  db.prepare("INSERT INTO overlays(streamer_id,token,settings) VALUES(?,?,'{\"position\":\"left\",\"showLeaderboard\":true}') ON CONFLICT(streamer_id) DO UPDATE SET token=excluded.token")
    .run(streamerId, 'demo-overlay');
  const addViewer = db.prepare('INSERT INTO viewers(id,login,display_name) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET login=excluded.login,display_name=excluded.display_name');
  for (const viewer of viewers) addViewer.run(viewer.id, viewer.login, viewer.name);

  const addStream = db.prepare('INSERT INTO streams(id,streamer_id,started_at,ended_at,status) VALUES(?,?,?,?,?)');
  const addAttendance = db.prepare('INSERT INTO attendance(stream_id,viewer_id,messages_count,milestones) VALUES(?,?,?,?)');
  const addCount = db.prepare('INSERT INTO messages_count(stream_id,viewer_id,count) VALUES(?,?,?)');
  const addMessage = db.prepare('INSERT INTO chat_messages(event_id,streamer_id,stream_id,viewer_id,created_at) VALUES(?,?,?,?,?)');
  for (let si = 0; si < streams.length; si++) {
    const stream = streams[si]!;
    const startedAt = new Date(now - stream.age * 24 * 60 * 60_000 - 45 * 60_000).toISOString();
    addStream.run(stream.id, streamerId, startedAt, stream.status === 'offline' ? new Date(now - stream.age * 24 * 60 * 60_000).toISOString() : null, stream.status);
    for (let vi = 0; vi < viewers.length; vi++) {
      const count = attendance[vi]![si]!;
      if (!count) continue;
      const viewer = viewers[vi]!;
      addAttendance.run(stream.id, viewer.id, count, '[]');
      addCount.run(stream.id, viewer.id, count);
      for (let mi = 0; mi < count; mi++) {
        const createdAt = stream.age === 0 ? now - mi * 11_000 : now - stream.age * 24 * 60 * 60_000 + mi * 60_000;
        addMessage.run(`seed-${stream.id}-${viewer.id}-${mi}`, streamerId, stream.id, viewer.id, createdAt);
      }
    }
  }
})();

console.log('Seeded Campfire with 4 streams, 5 sample viewers, chat activity, and a live demo.');
console.log('Open http://localhost:3000 after starting the server. OBS demo overlay: /overlay/demo-overlay');
