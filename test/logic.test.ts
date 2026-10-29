import { describe, expect, it } from 'vitest';
import { countVotes, fireLevel, leaderboard, sortCommunity, streakForViewer, viewerStats, type Attendance } from '../src/core/logic.js';
const s = (id:string, day:string, viewers:string[]):Attendance => ({streamId:id, startedAt:day, viewerIds:viewers});
describe('attendance streaks', () => {
 it('counts a first stream', () => expect(streakForViewer([s('1','2026-01-01',['v'])],'v')).toBe(1));
 it('resets after a missed stream', () => expect(streakForViewer([s('3','2026-01-03',['v']),s('2','2026-01-02',[]),s('1','2026-01-01',['v'])],'v')).toBe(1));
 it('counts separate streams on the same day', () => expect(streakForViewer([s('2','2026-01-01T20:00',['v']),s('1','2026-01-01T10:00',['v'])],'v')).toBe(2));
 it('counts a viewer once per stream even with many messages', () => expect(streakForViewer([s('1','2026-01-01',['v'])],'v')).toBe(1));
 it('preserves best streak after a missed session and sorts out-of-order input',()=>expect(viewerStats([{streamId:'3',startedAt:'2026-03-03',messages:0},{streamId:'1',startedAt:'2026-03-01',messages:4},{streamId:'2',startedAt:'2026-03-02',messages:2}])).toMatchObject({currentStreak:0,bestStreak:2,totalStreamsAttended:2,totalMessages:6}));
});
describe('fire and voting',()=>{
 it('rises with activity and gradually decays over five minutes',()=>{const m=[{at:1000,viewerId:'a'},{at:2000,viewerId:'b'}];expect(fireLevel(m,2000)).toBeGreaterThan(fireLevel(m,151000));expect(fireLevel(m,301000)).toBe(0)});
 it('caps one viewer so message spam cannot dominate fire intensity',()=>{const spam=Array.from({length:1000},(_,i)=>({at:i,viewerId:'a'}));const capped=Array.from({length:5},(_,i)=>({at:i+995,viewerId:'a'}));expect(fireLevel(spam,1000)).toBe(fireLevel(capped,1000))});
 it('returns the top five and breaks ties by login deterministically',()=>expect(leaderboard([{viewerId:'z',login:'zulu',streak:8},{viewerId:'b',login:'bravo',streak:8},{viewerId:'a',login:'alpha',streak:9},{viewerId:'c',login:'charlie',streak:7},{viewerId:'d',login:'delta',streak:6},{viewerId:'e',login:'echo',streak:5}]).map(x=>x.login)).toEqual(['alpha','bravo','zulu','charlie','delta']));
 it('sorts community standings by each supported metric',()=>{const rows=[{viewerId:'a',login:'alpha',currentStreak:2,bestStreak:4,totalAttendance:9,totalMessages:12},{viewerId:'b',login:'bravo',currentStreak:3,bestStreak:3,totalAttendance:5,totalMessages:30}];expect(sortCommunity(rows,'currentStreak')[0]!.viewerId).toBe('b');expect(sortCommunity(rows,'bestStreak')[0]!.viewerId).toBe('a');expect(sortCommunity(rows,'totalAttendance')[0]!.viewerId).toBe('a');expect(sortCommunity(rows,'totalMessages')[0]!.viewerId).toBe('b')});
 it('keeps the first vote per viewer and computes percentages',()=>expect(countVotes([{viewerId:'a',option:'A'},{viewerId:'a',option:'B'},{viewerId:'b',option:'C'}])).toMatchObject({total:2,counts:{A:1,B:0,C:1}}));
});
