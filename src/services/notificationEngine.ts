import { SystemMessage } from '../types/arise';

/**
 * Builds a System Message based on the provided type and contextual data.
 */
export function buildSystemMessage(
  type: SystemMessage['type'],
  data: Record<string, string | number>
): SystemMessage {
  const id = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  let title = 'System notification';
  let body = '';
  let duration_ms = 3000;
  let xpBadge: number | undefined = undefined;

  switch (type) {
    case 'quest_complete':
      title = 'QUEST CLEARED';
      body = `Quest cleared. [${data.questTitle}]. +${data.xp} XP awarded. Streak: ${data.streak} days.`;
      xpBadge = Number(data.xp);
      break;

    case 'rankup':
      title = 'RANK ADVANCEMENT';
      body = `Hunter. Rank advancement confirmed. [${data.fromRank}] → [${data.toRank}]. The System acknowledges your growth. New protocols unlocked.`;
      duration_ms = 5000;
      break;

    case 'warning':
      title = 'SYSTEM WARNING';
      body = `Warning: ${data.reason}. ${data.consequence}. Take corrective action.`;
      duration_ms = 4000;
      break;

    case 'coach':
      title = 'SYSTEM PROTOCOL';
      body = String(data.llmMessage); // Provided from buildCoachPrompt logic
      duration_ms = 5000;
      break;

    case 'achievement':
      title = 'ACHIEVEMENT UNLOCKED';
      body = `[${data.achievementName}] unlocked. Hunter classification updated.`;
      break;

    case 'info':
    default:
      title = 'SYSTEM MESSAGE';
      body = String(data.message || 'Status updated.');
      break;
  }

  return {
    id,
    type,
    title,
    body,
    xpBadge,
    duration_ms,
  };
}
