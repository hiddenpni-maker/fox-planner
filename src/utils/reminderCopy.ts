import type { LanguageCode, ReminderItem, ReminderTone } from '../types/planner';

/** Builds cute, friendly, personality-driven reminder titles and messages. */
export function buildPlayfulReminderCopy(
  reminder: Pick<ReminderItem, 'title' | 'details' | 'tone'>,
  lang: LanguageCode
): { title: string; body: string } {
  const customDetail = reminder.details?.trim();
  const tone: ReminderTone = reminder.tone;

  if (lang === 'fa') {
    if (tone === 'playful') {
      return {
        title: `🦊 تق‌تق! روباه ساعت رو چک کرد: ${reminder.title}`,
        body: customDetail
          ? `${customDetail} — یه قهوه بردار و بریم انجامش بدیم ✨`
          : 'فقط کافیه همین الان ۵ دقیقه اولش رو شروع کنی؛ روباه هوات رو داره 🐾',
      };
    }
    if (tone === 'motivating') {
      return {
        title: `🔥 وقت درخشیدنه: ${reminder.title}`,
        body: customDetail || 'هر دقیقه‌ی امروز آینده‌ت رو می‌سازه. بزن بریم با تمرکز کامل!',
      };
    }
    return {
      title: `🌿 یادآوری آرام: ${reminder.title}`,
      body: customDetail || 'یک نفس عمیق بکش و با آرامش سراغ برنامه‌ت برو 🦊',
    };
  }

  if (tone === 'playful') {
    return {
      title: `🦊 Knock-knock! Fox clock check: ${reminder.title}`,
      body: customDetail || 'Just do the first 5 minutes—your Fox buddy is cheering for you!',
    };
  }
  if (tone === 'motivating') {
    return {
      title: `🔥 Focus Time: ${reminder.title}`,
      body: customDetail || 'Small focused blocks stack into unstoppable progress. Let’s go!',
    };
  }
  return {
    title: `🌿 Gentle Reminder: ${reminder.title}`,
    body: customDetail || 'Take one calm breath and glide smoothly into your plan.',
  };
}
