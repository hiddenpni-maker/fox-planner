import type { WellnessGuide } from '../types/planner';

export interface DailyHealthHabit {
  id: string;
  icon: string;
  titleFa: string;
  titleEn: string;
  detailFa: string;
  detailEn: string;
}

export const DAILY_HEALTH_HABITS: DailyHealthHabit[] = [
  {
    id: 'water',
    icon: 'water-outline',
    titleFa: 'هیدراتاسیون منظم (۴ لیوان آب در زمان مطالعه)',
    titleEn: 'Stay hydrated (4 glasses across study blocks)',
    detailFa: 'حتی کم‌آبی خفیف ۱ تا ۲ درصدی، سرعت پردازش و تمرکز را پایین می‌آورد.',
    detailEn: 'Even mild 1–2% dehydration measurably reduces working memory and attention.',
  },
  {
    id: 'eye20',
    icon: 'eye-outline',
    titleFa: 'قانون ۲۰-۲۰-۲۰ برای محافظت از چشم',
    titleEn: '20-20-20 Eye Protection Rule',
    detailFa: 'هر ۲۰ دقیقه، حداقل ۲۰ ثانیه به نقطه‌ای در فاصله ۶ متری (۲۰ فوت) نگاه کن.',
    detailEn: 'Every 20 minutes, look at something 20 feet away for at least 20 seconds.',
  },
  {
    id: 'posture',
    icon: 'body-outline',
    titleFa: 'کشش گردن و شانه + تنظیم ارتفاع مانیتور',
    titleEn: 'Neck & shoulder stretch + screen at eye height',
    detailFa: 'لبه بالایی صفحه در راستای چشم باشد تا فشار گردن و خستگی شانه کم شود.',
    detailEn: 'Keep screen top at eye level and decompress neck/shoulders during breaks.',
  },
  {
    id: 'activeRecall',
    icon: 'bulb-outline',
    titleFa: 'بستن جزوه و بازیابی فعال (Active Recall)',
    titleEn: 'Closed-book Active Recall session',
    detailFa: 'به‌جای روخوانی چندباره، ۱۰ دقیقه نکات را از حفظ بنویس یا توضیح بده.',
    detailEn: 'Spend 10 minutes writing or speaking key ideas from memory instead of rereading.',
  },
  {
    id: 'sunlight',
    icon: 'sunny-outline',
    titleFa: 'نور طبیعی و فاصله با گوشی قبل خواب',
    titleEn: 'Daylight exposure & screen dim before sleep',
    detailFa: 'حافظه بلندمدت درس‌ها در خواب عمیق تثبیت می‌شود؛ نیم ساعت آخر بدون صفحه بمان.',
    detailEn: 'Memory consolidation happens in deep sleep; dim screens 30 min before bed.',
  },
];

export const WELLNESS_GUIDES: WellnessGuide[] = [
  {
    id: 'deep-focus-protocol',
    category: 'focus',
    readTimeMin: 4,
    icon: 'flash-outline',
    accent: '#F97316',
    titleFa: 'پروتکل ۹۰ دقیقه‌ای تمرکز عمیق و شکستن تعلل',
    titleEn: '90-Minute Deep Focus & Friction Removal',
    summaryFa: 'مغز برای ورود به حالت تمرکز عمیق (Flow) به ۱۰ تا ۱۵ دقیقه بدون پرش نیاز دارد؛ هر نوتیفیکیشن این ریتم را صفر می‌کند.',
    summaryEn: 'The brain needs ~12 uninterrupted minutes to enter flow; one quick phone check fragments attention residue.',
    stepsFa: [
      'قانون ۵ دقیقه شروع: وقتی حوصله نداری، فقط متعهد شو ۵ دقیقه اول تسک را شروع کنی؛ مقاومت ذهنی بعد از شروع می‌ریزد.',
      'تک‌تاسکی واقعی: دقیقاً یک درس و یک هدف قابل اندازه‌گیری را به پومودورو وصل کن (مثلاً «۱۲ تست فصل ۳»).',
      'پارکینگ افکار مزاحم: وسط مطالعه یادت افتاد پیامی بدهی یا چیزی سرچ کنی؟ فقط در دکمه «+ حواس‌پرتی» یا یک خط نوت بنویس و بعد از زنگ سراغش برو.',
      'گوشی را بیرون از دسترس (حتی پشت سرت یا در اتاق دیگر روی Do Not Disturb) بگذار.',
    ],
    stepsEn: [
      '5-Minute Start Rule: When resistance hits, commit only to the first 5 minutes to bypass procrastination.',
      'Single-Target Binding: Link each Pomodoro to one concrete deliverable (e.g., "12 Chapter 3 problems").',
      'Thought Parking Lot: Jot down stray urges/ideas without switching apps, then handle them on break.',
      'Out-of-Sight Phone: Keep your phone out of visual reach on Do Not Disturb during focus blocks.',
    ],
    scienceNoteFa: 'پژوهش Attention Residue نشان می‌دهد حتی چک کردن ۱۵ ثانیه‌ای پیام‌رسان، تا ۲۰ دقیقه بخشی از حافظه کاری را درگیر نگه می‌دارد.',
    scienceNoteEn: 'Attention residue research shows even brief task switching leaves cognitive load lingering for minutes.',
  },
  {
    id: 'active-recall-feynman',
    category: 'study',
    readTimeMin: 5,
    icon: 'school-outline',
    accent: '#38BDF8',
    titleFa: 'یادگیری واقعی با بازیابی فعال و تکنیک فاینمن',
    titleEn: 'Active Recall + Feynman Technique Blueprint',
    summaryFa: 'روخوانیِ صرف فقط «توهم یادگیری» می‌سازد؛ مغز زمانی مسیر عصبی می‌سازد که مجبور شود مطلب را بدون نگاه کردن بیرون بکشد.',
    summaryEn: 'Passive rereading creates fluency illusions; durable neural pathways form when you actively retrieve concepts.',
    stepsFa: [
      'بعد از خواندن هر مبحث (یا پایان ۱ پومودورو)، کتاب را ببند و با زبان خودت خلاصه یا نمودارش را روی یک نوت بنویس.',
      'تست فاینمن: طوری توضیحش بده که انگار برای یک دوستِ سال‌پایین‌تر تعریف می‌کنی؛ هر جا گیر کردی، دقیقاً همان‌جا شکاف یادگیری است!',
      'مرور فاصله‌دار (۱-۳-۷-۱۴): همان مطلب را ۱ روز، ۳ روز، ۷ روز و ۱۴ روز بعد در پلنرت برای مرور کوتاه بگذار.',
      'از عکس تخته و ویدیوی کوتاه در نوت‌ها برای ثبت مثال‌های سخت استفاده کن، اما کنارش با تیتر مشخص کن چرا این مثال مهم بود.',
    ],
    stepsEn: [
      'Close the book after one Pomodoro and write key structures from memory before checking gaps.',
      'Feynman Check: Explain the topic simply as if teaching a beginner; stumbling points reveal weak understanding.',
      'Spaced Intervals (1-3-7-14 days): Schedule short review tasks in your planner rather than cramming once.',
      'Attach board photos or short explainers in Notes alongside a highlighted "Why it matters" takeaway.',
    ],
    scienceNoteFa: 'آزمایش‌های حافظه (Testing Effect) ثابت کرده بازیابی فعال تا ۲ برابر بیشتر از مرور مجددِ متن در حافظه ماندگار می‌شود.',
    scienceNoteEn: 'Testing Effect studies consistently show retrieval practice roughly doubles long-term retention over rereading.',
  },
  {
    id: 'smart-rest-ultradian',
    category: 'rest',
    readTimeMin: 4,
    icon: 'cafe-outline',
    accent: '#10B981',
    titleFa: 'تفاوت استراحت واقعی با استراحت تقلبی (اسکرول موبایل)',
    titleEn: 'True Neural Rest vs. Fake Rest (Doomscrolling)',
    summaryFa: 'وقتی در ۵ دقیقه استراحت پومودورو سراغ ریلز و اینستاگرام می‌روی، مغزت استراحت نمی‌کند بلکه با اطلاعات سریع بمباران می‌شود!',
    summaryEn: 'Scrolling feeds during breaks keeps dopamine and visual cortex overstimulated instead of resetting focus.',
    stepsFa: [
      'در استراحت کوتاه ۵ دقیقه‌ای: از صندلی بلند شو، چند جرعه آب بخور، به پنجره یا دوردست نگاه کن و شانه‌ها را حرکت بده.',
      'استراحت غیرخطی بدون صفحه نمایش: گوش دادن به صدای آرام یا تمرین تنفس ۴-۴-۴-۴ سیستم عصبی سمپاتیک را آرام می‌کند.',
      'قانون ۹۰/۲۰ (Ultradian Rhythm): بعد از ۲ تا ۳ پومودورو (حدود ۹۰ دقیقه)، یک استراحت واقعی ۱۵–۲۰ دقیقه‌ای بدون موبایل بده.',
      'چرت کوتاه علمی (NSDR / Power Nap): اگر بعدازظهر افت انرژی داشتی، ۱۵ تا ۲۰ دقیقه استراحت با چشم بسته هوشیاری را برمی‌گرداند.',
    ],
    stepsEn: [
      'During 5-min breaks: stand up, hydrate, look far away through a window, and roll your shoulders.',
      'Screen-Free Reset: Use 4-4-4-4 breathing or calm pacing instead of social media feeds.',
      'Respect Ultradian Cycles (~90 min): Take a genuine 15–20 minute offline break after 2–3 study blocks.',
      'Afternoon Dip Rescue: A 15–20 minute eye-closed power rest refreshes alertness without sleep inertia.',
    ],
    scienceNoteFa: 'مغز در لحظات استراحتِ بدون محرک (Offline Rest) با سرعت بالا اطلاعات تازه خوانده‌شده را بازپخش و تثبیت می‌کند.',
    scienceNoteEn: 'Wakeful screen-free rest triggers rapid neural replay, helping consolidate recently studied material.',
  },
  {
    id: 'eye-ergonomics-sleep',
    category: 'health',
    readTimeMin: 4,
    icon: 'fitness-outline',
    accent: '#A855F7',
    titleFa: 'ارگونومی، سلامت چشم، تغذیه مغز و خوابِ ضد فراموشی',
    titleEn: 'Eye Care, Posture, Fuel & Memory-Lock Sleep',
    summaryFa: 'بدن خسته و چشم خشک، بازدهی باهوش‌ترین مغز را هم نصف می‌کنند. مراقبت جسمی بخش جدایی‌ناپذیر درس خواندن حرفه‌ای است.',
    summaryEn: 'Physical strain and sleep debt cut cognitive performance sharply. Ergonomics and sleep are study multipliers.',
    stepsFa: [
      'چشم و نور: نور محیط را متعادل نگه دار (در تاریکی مطلق به صفحه خیره نشو) و قانون ۲۰-۲۰-۲۰ را رعایت کن.',
      'گردن و کمر: لپ‌تاپ یا کتاب را روی پایه قرار بده تا سرت بیش از حد به جلو خم نشود؛ هر ۴۵ دقیقه ۲ دقیقه راه برو.',
      'تغذیه پایدار: قبل مطالعه سنگین، قند مصنوعی و نوشابه انرژی‌زا نخور (افت قند ناگهانی می‌آورد)؛ ترکیب پروتئین، آجیل و آب پایدارتر است.',
      'خواب شبانه غیرقابل مذاکره: بیدار ماندن با قهوه در نیمه‌شب به‌جای خواب، بازسازی هیپوکامپ را مختل کرده و فردا تمرکزت را می‌سوزاند.',
    ],
    stepsEn: [
      'Balanced Lighting & 20-20-20: Never stare at bright screens in pitch dark; relax eye focus every 20 minutes.',
      'Ergonomic Lift: Elevate books/laptop so your neck stays neutral; walk 2 minutes every 45 minutes.',
      'Steady Brain Fuel: Avoid sugar spikes before deep study; pair water with nuts, fruit, or balanced protein.',
      'Protect Deep Sleep: All-nighters impair hippocampal memory encoding—7–8h sleep beats extra groggy hours.',
    ],
    scienceNoteFa: 'در مراحل خواب عمیق و REM، مغز آموخته‌های پراکنده را از حافظه کوتاه‌مدت به شبکه دانش بلندمدت منتقل می‌کند.',
    scienceNoteEn: 'Slow-wave and REM sleep transfer fragile short-term traces into stable cortical long-term knowledge.',
  },
];

export function getSmartBreakTip(phase: 'focus' | 'shortBreak' | 'longBreak', lang: 'fa' | 'en'): string {
  if (lang === 'fa') {
    if (phase === 'focus') {
      return 'گوشی را از جلوی چشمت کنار بگذار؛ فقط روی همین یک قدم از تسک تمرکز کن.';
    }
    if (phase === 'shortBreak') {
      return 'از صفحه فاصله بگیر! یک لیوان آب بخور، ۲۰ ثانیه به دوردست نگاه کن و شانه‌ها را کشش بده.';
    }
    return 'عالی پیش رفتی! الان وقت یک استراحت واقعی ۱۵–۲۰ دقیقه‌ای بدون اسکرول، قدم‌زدن سبک یا تنفس آرام است.';
  }
  if (phase === 'focus') {
    return 'Keep your phone out of sight and commit purely to this single study step.';
  }
  if (phase === 'shortBreak') {
    return 'Step away from screens! Sip water, practice 20-20-20 eye rest, and stretch your shoulders.';
  }
  return 'Strong streak! Enjoy a real 15–20 min screen-free recharge, walk, or breathing reset.';
}
