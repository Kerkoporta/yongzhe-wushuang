'use strict';
/* ================= 📅 每日挑战：每天一条特殊规则，杀 30 只怪赢 8💎，一天领一次 ================= */
let challengeMode = null, chKills = 0;
const DAILY_RULES = [
  { id: 'swift', icon: '💨', name: '怪物全都疾电', tip: '今天所有怪跑得像闪电！' },
  { id: 'tough', icon: '🛡️', name: '怪物皮糙肉厚', tip: '今天所有怪血量翻倍！' },
  { id: 'crit', icon: '🍀', name: '勇者暴击日', tip: '今天你的每一刀都×3！' },
];
function todayDaily() { const d = new Date(); return { rule: DAILY_RULES[Math.floor(d.getTime() / 86400000) % 3], date: d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() }; }
function dailyDone() { try { return localStorage.getItem('yzw_daily') === todayDaily().date; } catch (e) { return false; } }
function startDaily() {
  if (dailyDone()) { setBanner('📅 今天的挑战奖励已经领过啦，明天再来！'); beep(300, 200, 0.12, 'square', 0.1); return; }
  const t = todayDaily();
  reset(); closeHome(); challengeMode = t.rule.id; chKills = 0;
  setBanner('📅 每日挑战·' + t.rule.icon + t.rule.name + '：' + t.rule.tip + '杀 30 只怪赢 8💎！');
  beep(600, 1000, 0.2, 'sine', 0.14);
}
function dailyOnKill() {   // killZombie 里调：挑战计数+结算
  if (!challengeMode) return;
  chKills++;
  if (chKills >= 30) {
    challengeMode = null;
    player.diamonds = (player.diamonds || 0) + 8; updateGold();
    try { localStorage.setItem('yzw_daily', todayDaily().date); } catch (e) {}
    setBanner('📅 挑战完成！+8💎 钻石到手，明天再来！'); beep(700, 1400, 0.4, 'sine', 0.18);
    saveGame();
  }
}
