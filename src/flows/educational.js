// src/flows/educational.js — محتوای آموزشی غنی + تست‌های تخصصی
const { InlineKeyboard } = require("grammy");

// ═══════════════════════════════════════════════════
// کارت‌های آموزشی با محتوای کامل
// ═══════════════════════════════════════════════════
const EDUCATION_CARDS = [
  {
    id: "card1",
    emoji: "🧠",
    title: "آمادگی ذهنی و انگیزشی",
    summary: "پایه موفقیت در کاندیداتوری، انگیزه درست و ذهنیت قوی است.",
    content:
      "🧠 *آمادگی ذهنی — اولین قدم حیاتی*\n\n" +
      "کاندیداتوری یک مسیر پرچالش است که نیاز به آمادگی عمیق ذهنی دارد. " +
      "بسیاری از کاندیداها با انگیزه شروع می‌کنند اما در میانه راه از پا درمی‌آیند. " +
      "دلیل اصلی این شکست‌ها نه کمبود بودجه، بلکه ضعف بنیان ذهنی است.\n\n" +
      "📌 *چرا انگیزه مهم‌ترین عامل است؟*\n" +
      "انگیزه واقعی شما باید فراتر از منافع شخصی باشد. وقتی انگیزه‌ات «خدمت به مردم» است، " +
      "در روزهای سخت هم دوام می‌آوری. اما اگر انگیزه‌ات «مقام و قدرت» باشد، " +
      "اولین فشار رسانه‌ای تو را از پا درمی‌آورد.\n\n" +
      "🔑 *سه سوال کلیدی که باید پاسخ دهی:*\n" +
      "۱. چرا می‌خواهم کاندیدا شوم؟\n" +
      "۲. اگر ببازم، آیا پشیمان نمی‌شوم؟\n" +
      "۳. آیا خانواده‌ام از این تصمیم حمایت می‌کنند؟\n\n" +
      "💡 *نکته طلایی:* قبل از ثبت‌نام، یک پاراگراف بنویسید: «چرا باید من انتخاب شوم؟» " +
      "اگر نتوانستید ۵ دلیل محکم بنویسید، هنوز آماده نیستید.",
    keyPoints: [
      "✅ انگیزه خود را روی کاغذ بنویسید",
      "✅ با خانواده مشورت کنید",
      "✅ هزینه‌ها و فرصت‌های از دست رفته را محاسبه کنید",
      "✅ آمادگی روحی برای انتقاد شدید را داشته باشید",
      "✅ یک منتور سیاسی پیدا کنید",
    ],
    commonMistakes: [
      "❌ کاندیداتوری صرفاً برای محبوبیت",
      "❌ تصمیم هیجانی بدون مشورت",
      "❌ نادیده گرفتن فشارهای روحی",
      "❌ عدم آگاهی از قوانین انتخاباتی",
    ],
    practicalExercises: [
      "📝 تمرین ۱: یک پاراگراف بنویسید: «چرا من باید کاندیدا شوم؟»",
      "📝 تمرین ۲: لیست ۵ چالشی که ممکن است با آن مواجه شوید",
      "📝 تمرین ۳: نظر ۳ نفر از نزدیکان درباره کاندیداتوریتان",
    ],
    proTips: [
      "💎 هر روز صبح انگیزه‌تان را مرور کنید",
      "💎 روزانه ۱۵ دقیقه مدیتیشن برای آرامش ذهنی",
      "💎 یک دفترچه یادداشت سیاسی داشته باشید",
    ],
    relatedCards: ["card2", "card3"],
  },
  {
    id: "card2",
    emoji: "🗺️",
    title: "شناخت حوزه انتخابیه",
    summary: "قبل از کاندیداتوری، حوزه خود را مثل کف دست بشناسید.",
    content:
      "🗺️ *شناخت حوزه — بدون این نمی‌توانی برد!*\n\n" +
      "حوزه انتخابیه میدان نبرد شماست. کاندیداهایی که حوزه را نمی‌شناسند مثل سربازی هستند " +
      "که بدون نقشه وارد میدان جنگ می‌شوند. شما باید قبل از هر حرفی، " +
      "بدانید مردم این منطقه چه می‌خواهند، چه دردهایی دارند و به چه کسی اعتماد می‌کنند.\n\n" +
      "📊 *داده‌هایی که باید بدانید:*\n" +
      "• جمعیت و ترکیب سنی/قومی/مذهبی\n" +
      "• مشکلات اصلی: اقتصادی، فرهنگی، عمرانی\n" +
      "• رقبای احتمالی و سابقه‌شان\n" +
      "• نتایج انتخابات دوره‌های قبل\n" +
      "• گروه‌های تأثیرگذار محلی\n\n" +
      "🏘️ *چطور حوزه را بشناسیم؟*\n" +
      "درب‌به‌درب رفتن یکی از بهترین روش‌هاست. با مردم عادی، کسبه، معلمان و " +
      "فعالان محلی صحبت کنید. آن‌ها بهتر از هر آمارنامه‌ای واقعیت را به شما نشان می‌دهند.\n\n" +
      "📅 *زمان‌بندی:* حداقل ۶ ماه قبل از انتخابات باید این شناخت را شروع کنید.",
    keyPoints: [
      "✅ نقشه جمعیت‌شناسی تهیه کنید",
      "✅ با فعالان محلی ارتباط بگیرید",
      "✅ آمار رأی دوره‌های قبل را بررسی کنید",
      "✅ حداقل ۳ ماه قبل حضور میدانی داشته باشید",
    ],
    commonMistakes: [
      "❌ تکیه صرف بر محبوبیت شخصی",
      "❌ نادیده گرفتن ساختارهای قدرت محلی",
      "❌ کپی‌برداری از برنامه حوزه‌های دیگر",
    ],
    practicalExercises: [
      "📝 تمرین ۱: جدول جمعیت‌شناسی حوزه را تهیه کنید",
      "📝 تمرین ۲: لیست ۱۰ مشکل اصلی حوزه از زبان مردم",
      "📝 تمرین ۳: شناسایی ۵ فرد کلیدی محلی و ارتباط با آن‌ها",
    ],
    proTips: [
      "💎 از داده‌های رسمی سازمان آمار استفاده کنید",
      "💎 با مردم عادی صحبت کنید، نه فقط نخبگان",
      "💎 هر ماه یک میز خدمت محلی برگزار کنید",
    ],
    relatedCards: ["card3", "card4"],
  },
  {
    id: "card3",
    emoji: "📢",
    title: "تبلیغات و رسانه هوشمند",
    summary: "تبلیغات هدفمند می‌تواند تفاوت میان برد و باخت را رقم بزند.",
    content:
      "📢 *تبلیغات هوشمند — پول بیشتر مساوی برد نیست!*\n\n" +
      "یکی از بزرگ‌ترین اشتباهات کاندیداها این است که فکر می‌کنند بیشتر پول خرج کردن " +
      "یعنی بیشتر رأی آوردن. اما واقعیت این است که تبلیغات هدفمند با بودجه کم " +
      "از تبلیغات گسترده بی‌هدف بسیار موثرتر است.\n\n" +
      "🎯 *فرمول تبلیغات موثر:*\n" +
      "پیام درست + مخاطب درست + زمان درست = نتیجه درست\n\n" +
      "📱 *کانال‌های اصلی (به ترتیب اولویت):*\n" +
      "۱. درب‌به‌درب (بالاترین ROI)\n" +
      "۲. گروه‌ها و کانال‌های تلگرام محلی\n" +
      "۳. اینستاگرام با محتوای ویدیویی کوتاه\n" +
      "۴. بنرهای محلی در نقاط پرتردد\n" +
      "۵. رادیو و تلویزیون محلی\n\n" +
      "⚡ *آمار جالب:* تبلیغات درب‌به‌درب ۵ برابر موثرتر از پوستر است! " +
      "چون یک گفتگوی شخصی می‌تواند یک انسان را از شک به حمایت تبدیل کند.",
    keyPoints: [
      "✅ یک شعار ساده و به‌یادماندنی داشته باشید",
      "✅ محتوای ویدیویی ۳۰-۶۰ ثانیه‌ای تولید کنید",
      "✅ پیامتان را برای هر قشر شخصی‌سازی کنید",
      "✅ از داوطلبان محلی برای توزیع استفاده کنید",
    ],
    commonMistakes: [
      "❌ تبلیغات یکسان برای همه اقشار",
      "❌ شروع تبلیغات در هفته آخر",
      "❌ نادیده گرفتن فضای مجازی",
    ],
    practicalExercises: [
      "📝 تمرین ۱: شعار ۵ کلمه‌ای برای خود بنویسید",
      "📝 تمرین ۲: ۳ پیام مختلف برای سه قشر مختلف طراحی کنید",
      "📝 تمرین ۳: یک ویدیوی ۶۰ ثانیه‌ای معرفی خود ضبط کنید",
    ],
    proTips: [
      "💎 از طراحان محلی استفاده کنید (هزینه کمتر + حمایت محلی)",
      "💎 تبلیغات شفاهی قدرتمندترین روش است",
      "💎 هر پست اینستاگرام باید یک دعوت به اقدام داشته باشد",
    ],
    relatedCards: ["card4", "card5"],
  },
  {
    id: "card4",
    emoji: "💰",
    title: "مدیریت مالی کمپین",
    summary: "بودجه محدود نیست، مدیریت ضعیف مشکل است!",
    content:
      "💰 *مدیریت مالی — هر تومان باید بازگشت داشته باشد*\n\n" +
      "مدیریت مالی کمپین یکی از مهم‌ترین مهارت‌هایی است که اکثر کاندیداها از آن غافلند. " +
      "۷۰٪ کاندیداها به دلیل مدیریت ضعیف بودجه، در هفته آخر دچار بحران مالی می‌شوند " +
      "و کمپین‌شان را نیمه‌کاره رها می‌کنند.\n\n" +
      "📊 *توزیع بهینه بودجه:*\n" +
      "• تبلیغات: ۴۰-۵۰٪\n" +
      "• تیم ستادی: ۲۰-۳۰٪\n" +
      "• لجستیک: ۱۰-۱۵٪\n" +
      "• اضطراری: ۱۰٪ (هیچ‌وقت دست نزنید!)\n\n" +
      "💡 *اصل طلایی:* همیشه ۱۰٪ بودجه اضطراری داشته باشید. " +
      "ممکن است در ۳ روز آخر یک فرصت طلایی پیش بیاید که بدون پول نتوانید از آن استفاده کنید.\n\n" +
      "📱 *ابزارهای رایگان:* از اکسل یا Google Sheets برای ثبت تمام هزینه‌ها استفاده کنید. " +
      "حتی خرید یک قلم را ثبت کنید.",
    keyPoints: [
      "✅ بودجه کل را از ابتدا مشخص کنید",
      "✅ تمام هزینه‌ها را ثبت کنید",
      "✅ از کمک‌های داوطلبان استفاده کنید",
      "✅ اسپانسرهای محلی جذب کنید (شفاف و قانونی)",
    ],
    commonMistakes: [
      "❌ هزینه‌کردن بی‌حساب در روزهای اول",
      "❌ نداشتن سیستم حسابداری",
      "❌ وابستگی به یک منبع مالی",
    ],
    practicalExercises: [
      "📝 تمرین ۱: جدول بودجه ماهانه تهیه کنید",
      "📝 تمرین ۲: لیست ۱۰ منبع درآمد ممکن",
      "📝 تمرین ۳: محاسبه هزینه هر رأی",
    ],
    proTips: [
      "💎 هر هفته جلسه بررسی مالی داشته باشید",
      "💎 تبلیغات رایگان را جدی بگیرید",
      "💎 قبل از هر هزینه بزرگ مشورت کنید",
    ],
    relatedCards: ["card3", "card6"],
  },
  {
    id: "card5",
    emoji: "⚖️",
    title: "قوانین و مقررات انتخابات",
    summary: "نقض قوانین می‌تواند شما را از رقابت حذف کند!",
    content:
      "⚖️ *قوانین انتخابات — قبل از قدم اول بدانید*\n\n" +
      "در انتخابات اخیر، ۱۵٪ از کاندیداها به دلیل نقض قوانین ـ گاهی به‌خاطر یک اشتباه کوچک ـ " +
      "رد صلاحیت شدند. این یعنی ماه‌ها زحمت و هزینه بر باد رفت. " +
      "شناخت قوانین انتخاباتی یک ضرورت، نه یک انتخاب است.\n\n" +
      "📋 *نکات کلیدی قانونی:*\n" +
      "• شرایط احراز (سن، تحصیلات، سوابق)\n" +
      "• سقف هزینه‌های تبلیغاتی\n" +
      "• ممنوعیت‌ها (رشوه، تقلب، تبلیغات زودهنگام)\n" +
      "• مهلت‌های ثبت‌نام و اعتراض\n" +
      "• نحوه شمارش آرا و اعتراض به نتایج\n\n" +
      "👨‍⚖️ *توصیه مهم:* یک مشاور حقوقی آشنا به قوانین انتخاباتی داشته باشید. " +
      "هزینه این مشاوره در مقابل ریسک رد صلاحیت بسیار ناچیز است.",
    keyPoints: [
      "✅ آیین‌نامه انتخابات را کامل بخوانید",
      "✅ یک مشاور حقوقی داشته باشید",
      "✅ تمام اسناد را مکتوب نگه دارید",
      "✅ از تخلفات رقبا مستندسازی کنید",
    ],
    commonMistakes: [
      "❌ ثبت‌نام در آخرین لحظه",
      "❌ نادیده گرفتن جزئیات آیین‌نامه",
      "❌ استفاده از روش‌های غیرقانونی",
    ],
    practicalExercises: [
      "📝 تمرین ۱: خلاصه ۱ صفحه‌ای از آیین‌نامه بنویسید",
      "📝 تمرین ۲: چک‌لیست شرایط احراز تهیه کنید",
      "📝 تمرین ۳: سناریوی اعتراض به تخلف را بنویسید",
    ],
    proTips: [
      "💎 در جلسات هیئت اجرایی حضور فعال داشته باشید",
      "💎 نماینده خود را در شعب اخذ رأی قرار دهید",
      "💎 از ویدیو برای مستندسازی استفاده کنید",
    ],
    relatedCards: ["card6", "card7"],
  },
  {
    id: "card6",
    emoji: "🤝",
    title: "ائتلاف‌سازی و مذاکره",
    summary: "سیاست هنر ممکن‌هاست؛ ائتلاف درست می‌تواند معجزه کند.",
    content:
      "🤝 *ائتلاف — قدرت چندبرابر با هزینه کمتر*\n\n" +
      "آمار نشان می‌دهد کاندیداهایی که ائتلاف قوی دارند، ۶۰٪ شانس بیشتری برای برد دارند. " +
      "ائتلاف یعنی من قوی می‌شوم بدون اینکه هزینه اضافی کنم.\n\n" +
      "🔗 *انواع ائتلاف‌های موثر:*\n" +
      "• با فعالان محلی (بیشترین تأثیر)\n" +
      "• با جریانات سیاسی همسو\n" +
      "• با تشکل‌های صنفی\n" +
      "• با رسانه‌های محلی\n\n" +
      "⚡ *اصل طلایی ائتلاف:* منافع مشترک + اعتماد متقابل\n\n" +
      "در هر مذاکره ائتلاف، باید به این سوال پاسخ دهید: " +
      "«چرا طرف مقابل باید با من ائتلاف کند؟» اگر جواب قانع‌کننده ندارید، " +
      "او هم با شما ائتلاف نمی‌کند. همیشه یک پیشنهاد win-win ارائه دهید.",
    keyPoints: [
      "✅ لیست متحدین بالقوه تهیه کنید",
      "✅ پیشنهادهای win-win ارائه دهید",
      "✅ قراردادها را مکتوب کنید",
      "✅ در ائتلاف‌ها منعطف ولی اصولی باشید",
    ],
    commonMistakes: [
      "❌ ائتلاف با افراد بی‌اعتماد",
      "❌ قراردادهای شفاهی بدون سند",
      "❌ انتظار یک‌طرفه از متحدان",
    ],
    practicalExercises: [
      "📝 تمرین ۱: لیست ۱۰ متحد بالقوه + منافع مشترک",
      "📝 تمرین ۲: پیش‌نویس یک قرارداد ائتلاف",
      "📝 تمرین ۳: نقش خود در ائتلاف را مشخص کنید",
    ],
    proTips: [
      "💎 همیشه طرف دوم باید احساس برد کند",
      "💎 ائتلاف‌های کوچک و متراکم بهترند",
      "💎 یک میانجی محلی برای مذاکرات داشته باشید",
    ],
    relatedCards: ["card5", "card8"],
  },
  {
    id: "card7",
    emoji: "📊",
    title: "داده‌محوری و نظرسنجی",
    summary: "تصمیم‌گیری بر اساس احساس، نسخه شکست است!",
    content:
      "📊 *داده‌محوری — کمپین برنده = کمپین Data-driven*\n\n" +
      "کمپین‌های موفق جهانی یک وجه مشترک دارند: همه آن‌ها بر اساس داده تصمیم می‌گیرند. " +
      "شما هم نیازی به سیستم‌های پیچیده ندارید. همین Google Forms رایگان کافی است.\n\n" +
      "📈 *داده‌های کلیدی که باید داشته باشید:*\n" +
      "• نظرسنجی‌های محلی (هر ۲ هفته یکبار)\n" +
      "• آمار آرای دوره‌های قبل\n" +
      "• بازخورد میدانی تیم\n" +
      "• روند تغییر افکار عمومی\n\n" +
      "🎯 *نکته مهم:* نظرسنجی‌های کوچک و مکرر بهتر از یک نظرسنجی بزرگ است. " +
      "هر هفته ۲۰ سوال بپرسید و روند را دنبال کنید. " +
      "اگر یک هفته روند رو به پایین بود، فوری استراتژی را تغییر دهید.\n\n" +
      "⚠️ *هشدار:* ۸۰٪ کاندیداها که شکست خوردند، گفتند «فکر می‌کردیم خوبیم!» " +
      "نظرسنجی‌ها واقعیت را نشان می‌دهند.",
    keyPoints: [
      "✅ نظرسنجی‌های منظم انجام دهید",
      "✅ روند تغییرات را رصد کنید",
      "✅ بر اساس داده بودجه تخصیص دهید",
      "✅ از ابزارهای رایگان استفاده کنید",
    ],
    commonMistakes: [
      "❌ نظرسنجی‌های سوگیرانه",
      "❌ نادیده گرفتن داده‌های میدانی",
      "❌ وابستگی به احساس شخصی",
    ],
    practicalExercises: [
      "📝 تمرین ۱: یک پرسشنامه ۱۰ سوالی طراحی کنید",
      "📝 تمرین ۲: نمودار روند محبوبیت خود را رسم کنید",
      "📝 تمرین ۳: ۵ شاخص کلیدی (KPI) برای کمپین تعریف کنید",
    ],
    proTips: [
      "💎 از Google Forms رایگان استفاده کنید",
      "💎 تیم میدانی را به ثبت دقیق بازخوردها عادت دهید",
      "💎 هفتگی جلسه بررسی داده داشته باشید",
    ],
    relatedCards: ["card2", "card4"],
  },
  {
    id: "card8",
    emoji: "🎤",
    title: "سخنرانی و حضور عمومی",
    summary: "مردم به کسی رأی می‌دهند که او را باور کنند.",
    content:
      "🎤 *سخنرانی موثر — اعتمادسازی در ۳ دقیقه*\n\n" +
      "یک سخنرانی ۳ دقیقه‌ای خوب می‌تواند هزار رأی بیاورد. یک سخنرانی بد می‌تواند " +
      "هزار رأی ببرد. مهارت سخنرانی قابل یادگیری است، نه یک استعداد ذاتی.\n\n" +
      "📊 *فرمول علمی سخنرانی:*\n" +
      "• زبان بدن: ۵۵٪ تأثیر\n" +
      "• لحن صدا: ۳۸٪ تأثیر\n" +
      "• محتوای کلامی: فقط ۷٪ تأثیر!\n\n" +
      "این آمار یعنی «چطور» حرف می‌زنید مهم‌تر از «چه» حرف می‌زنید است.\n\n" +
      "🗣️ *اصول سخنرانی موثر:*\n" +
      "۱. ساده، صادقانه و قابل‌فهم\n" +
      "۲. داستان‌محور (نه آمار خشک)\n" +
      "۳. تماس چشمی با مخاطبان\n" +
      "۴. زبان بدن مطمئن\n" +
      "۵. پاسخ به سوالات بدون طفره\n\n" +
      "💡 *رمز موفقیت:* قبل از هر سخنرانی، ۳ داستان واقعی از مردم منطقه آماده کنید. " +
      "داستان‌های واقعی قلب‌ها را می‌لرزانند.",
    keyPoints: [
      "✅ قبل از سخنرانی تمرین کنید",
      "✅ از داستان‌های واقعی استفاده کنید",
      "✅ لحن صدا را متنوع کنید",
      "✅ به زبان مخاطب حرف بزنید",
    ],
    commonMistakes: [
      "❌ حفظ‌کردن متن و بی‌روح خواندن",
      "❌ استفاده از اصطلاحات پیچیده",
      "❌ نگاه به زمین یا کاغذ",
      "❌ طولانی شدن بیش از حد",
    ],
    practicalExercises: [
      "📝 تمرین ۱: یک سخنرانی ۳ دقیقه‌ای ضبط کنید و نقد کنید",
      "📝 تمرین ۲: ۳ داستان شخصی مرتبط با کمپین بنویسید",
      "📝 تمرین ۳: با دوستان مناظره تمرینی برگزار کنید",
    ],
    proTips: [
      "💎 قبل از سخنرانی، نفس‌های عمیق بکشید",
      "💎 از ویدیوهای TED Talks الگو بگیرید",
      "💎 در جمعات کوچک ۵-۱۰ نفره تمرین کنید",
    ],
    relatedCards: ["card3", "card6"],
  },
];

// ═══════════════════════════════════════════════════
// تست‌های تخصصی
// ═══════════════════════════════════════════════════
const ASSESSMENT_TESTS = [
  {
    id: "test_swot",
    emoji: "🔍",
    title: "تست SWOT شخصی",
    description: "تحلیل نقاط قوت، ضعف، فرصت و تهدید کمپین شما",
    questions: [
      {
        q: "مهم‌ترین نقطه قوت خود را انتخاب کنید:",
        options: [
          { label: "🤝 شبکه اجتماعی قوی", value: "network", score: 25 },
          { label: "🎓 تحصیلات بالا", value: "education", score: 20 },
          { label: "💰 توانایی مالی", value: "financial", score: 20 },
          { label: "🎤 سخنرانی قوی", value: "speech", score: 20 },
          { label: "⏳ تجربه زیاد", value: "experience", score: 25 },
        ],
      },
      {
        q: "بزرگ‌ترین تهدید کمپین شما چیست؟",
        options: [
          { label: "⚔️ رقیب قوی", value: "competitor", score: 10 },
          { label: "💸 کمبود بودجه", value: "budget", score: 15 },
          { label: "📰 فضای رسانه‌ای نامناسب", value: "media", score: 20 },
          { label: "⏰ کمبود وقت", value: "time", score: 15 },
          { label: "👥 ضعف تیم", value: "team", score: 10 },
        ],
      },
      {
        q: "بزرگ‌ترین فرصت پیش روی شما کدام است؟",
        options: [
          { label: "🗳️ مشارکت پایین مردم", value: "low_turnout", score: 20 },
          { label: "😤 نارضایتی از رقبا", value: "rival_weakness", score: 25 },
          { label: "📍 موقعیت جغرافیایی خوب", value: "location", score: 15 },
          { label: "📱 فضای مجازی فعال", value: "social_media", score: 20 },
          { label: "🔄 تغییر خواهی مردم", value: "change_desire", score: 25 },
        ],
      },
    ],
  },
  {
    id: "test_readiness",
    emoji: "✅",
    title: "تست آمادگی کمپین",
    description: "بررسی سطح آمادگی شما برای شروع کمپین رسمی",
    questions: [
      {
        q: "آیا تیم ستادی خود را تشکیل داده‌اید؟",
        options: [
          { label: "✅ بله، تیم کامل دارم", value: "full", score: 30 },
          { label: "🔄 نیمه‌تشکیل شده", value: "partial", score: 15 },
          { label: "❌ خیر، هنوز نه", value: "no", score: 0 },
        ],
      },
      {
        q: "آیا برنامه کمپین مکتوب دارید؟",
        options: [
          { label: "✅ بله، کامل", value: "full", score: 30 },
          { label: "📝 در حال نوشتن", value: "partial", score: 15 },
          { label: "❌ خیر", value: "no", score: 0 },
        ],
      },
      {
        q: "آیا شبکه محلی شما آماده فعالیت است؟",
        options: [
          { label: "✅ بله، فعال", value: "active", score: 40 },
          { label: "🔄 نیمه‌فعال", value: "partial", score: 20 },
          { label: "❌ خیر", value: "no", score: 0 },
        ],
      },
    ],
  },
  {
    id: "test_crisis",
    emoji: "🚨",
    title: "تست مدیریت بحران",
    description: "بسنجید چقدر آماده مواجهه با بحران‌های کمپین هستید",
    questions: [
      {
        q: "اگر رقیب درباره شما شایعه‌ای پخش کند، واکنش شما چیست؟",
        options: [
          { label: "📢 فوری واکنش رسانه‌ای", value: "media", score: 25 },
          { label: "⚖️ اقدام حقوقی", value: "legal", score: 20 },
          { label: "🤝 توضیح با شواهد", value: "evidence", score: 30 },
          { label: "🤫 سکوت", value: "silence", score: 5 },
        ],
      },
      {
        q: "اگر یکی از اعضای کلیدی تیم انصراف دهد چه می‌کنید؟",
        options: [
          { label: "✅ جایگزین آماده دارم", value: "ready", score: 30 },
          { label: "🔍 سریع جایگزین پیدا می‌کنم", value: "search", score: 20 },
          { label: "😰 مشکل جدی ایجاد می‌شود", value: "problem", score: 5 },
        ],
      },
      {
        q: "آیا برنامه واکنش به بحران دارید؟",
        options: [
          { label: "✅ بله، مکتوب", value: "yes_written", score: 40 },
          { label: "🧠 در ذهنم هست", value: "mental", score: 20 },
          { label: "❌ خیر", value: "no", score: 0 },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════
// توابع آموزشی
// ═══════════════════════════════════════════════════
async function handleShowEducationList(ctx) {
  let text = `📚 *آموزش جامع کاندیداتوری*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `🎯 با بیش از *۵۰ صفحه محتوای تخصصی*\n`;
  text += `از آمادگی ذهنی تا روز رأی‌گیری!\n\n`;
  text += `📖 *کارت‌های آموزشی موجود:*\n\n`;

  EDUCATION_CARDS.forEach((card) => {
    text += `${card.emoji} *${card.title}*\n`;
    text += `└ ${card.summary}\n\n`;
  });

  const kb = new InlineKeyboard();
  EDUCATION_CARDS.forEach((card) => {
    kb.text(`${card.emoji} ${card.title}`, `edu_card:${card.id}`).row();
  });
  kb.text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function handleShowEducationCard(ctx) {
  const cardId = ctx.callbackQuery.data.split(":")[1];
  const card = EDUCATION_CARDS.find((c) => c.id === cardId);

  if (!card) {
    await ctx.answerCallbackQuery("کارت پیدا نشد");
    return;
  }

  let text = `${card.emoji} *${card.title}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📌 *خلاصه:*\n${card.summary}\n\n`;
  text += `_برای مطالعه کامل، یکی از بخش‌ها را انتخاب کنید:_`;

  const kb = new InlineKeyboard()
    .text("📖 محتوای کامل", `edu_view:${cardId}:content`)
    .row()
    .text("🔑 نکات کلیدی", `edu_view:${cardId}:keyPoints`)
    .text("⚠️ اشتباهات رایج", `edu_view:${cardId}:commonMistakes`)
    .row()
    .text("📝 تمرینات عملی", `edu_view:${cardId}:practicalExercises`)
    .text("💎 نکات حرفه‌ای", `edu_view:${cardId}:proTips`)
    .row()
    .text("🔗 کارت‌های مرتبط", `edu_related:${cardId}`)
    .row()
    .text("« بازگشت به لیست", "show_education")
    .text("🏠 منوی اصلی", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

async function handleEducationView(ctx) {
  const parts = ctx.callbackQuery.data.split(":");
  const cardId = parts[1];
  const view = parts[2];
  const card = EDUCATION_CARDS.find((c) => c.id === cardId);

  if (!card) {
    await ctx.answerCallbackQuery("کارت پیدا نشد");
    return;
  }

  let text = `${card.emoji} *${card.title}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (view === "content") {
    text += `📖 *محتوای کامل:*\n\n${card.content}`;
  } else if (view === "keyPoints") {
    text += `🔑 *نکات کلیدی:*\n\n`;
    card.keyPoints.forEach((p) => (text += `${p}\n`));
  } else if (view === "commonMistakes") {
    text += `⚠️ *اشتباهات رایج:*\n\n`;
    card.commonMistakes.forEach((m) => (text += `${m}\n`));
  } else if (view === "practicalExercises") {
    text += `📝 *تمرینات عملی:*\n\n`;
    card.practicalExercises.forEach((e) => (text += `${e}\n\n`));
  } else if (view === "proTips") {
    text += `💎 *نکات حرفه‌ای (Pro Tips):*\n\n`;
    card.proTips.forEach((t) => (text += `${t}\n\n`));
  }

  const kb = new InlineKeyboard()
    .text(`« بازگشت به کارت`, `edu_card:${cardId}`)
    .row()
    .text("🏠 منوی اصلی", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

async function handleRelatedCards(ctx) {
  const cardId = ctx.callbackQuery.data.split(":")[1];
  const card = EDUCATION_CARDS.find((c) => c.id === cardId);

  if (!card || !card.relatedCards || card.relatedCards.length === 0) {
    await ctx.answerCallbackQuery("کارت مرتبطی وجود ندارد");
    return;
  }

  let text = `🔗 *کارت‌های مرتبط با: ${card.title}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const kb = new InlineKeyboard();
  card.relatedCards.forEach((relId) => {
    const relCard = EDUCATION_CARDS.find((c) => c.id === relId);
    if (relCard) {
      text += `${relCard.emoji} *${relCard.title}*\n${relCard.summary}\n\n`;
      kb.text(`${relCard.emoji} ${relCard.title}`, `edu_card:${relId}`).row();
    }
  });

  kb.text(`« بازگشت`, `edu_card:${cardId}`).row().text("🏠 منوی اصلی", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
  await ctx.answerCallbackQuery();
}

// ═══════════════════════════════════════════════════
// توابع تست‌های تخصصی
// ═══════════════════════════════════════════════════
async function handleShowAssessments(ctx) {
  let text = `🧪 *تست‌های تخصصی کاندیداتوری*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `با این تست‌ها نقاط قوت و ضعف کمپین خود را بشناسید:\n\n`;

  ASSESSMENT_TESTS.forEach((test) => {
    text += `${test.emoji} *${test.title}*\n`;
    text += `└ ${test.description}\n\n`;
  });

  const kb = new InlineKeyboard();
  ASSESSMENT_TESTS.forEach((test) => {
    kb.text(`${test.emoji} ${test.title}`, `assess_start:${test.id}`).row();
  });
  kb.text("🏠 منوی اصلی", "menu");

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
    } catch {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function handleStartAssessmentTest(ctx) {
  const testId = ctx.callbackQuery.data.split(":")[1];
  const test = ASSESSMENT_TESTS.find((t) => t.id === testId);

  if (!test) {
    await ctx.answerCallbackQuery("تست پیدا نشد");
    return;
  }

  ctx.session.currentTest = testId;
  ctx.session.testStep = 0;
  ctx.session.testAnswers = {};

  await askTestQuestion(ctx, test, 0);
  await ctx.answerCallbackQuery();
}

async function askTestQuestion(ctx, test, stepIndex) {
  const q = test.questions[stepIndex];
  const progress = Math.round(((stepIndex + 1) / test.questions.length) * 100);
  const filled = Math.round((progress / 100) * 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);

  let text = `${test.emoji} *${test.title}*\n`;
  text += `${bar} سوال ${stepIndex + 1} از ${test.questions.length}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `*${q.q}*\n\n`;

  const kb = new InlineKeyboard();
  q.options.forEach((opt) => {
    kb.text(opt.label, `assess_answer:${test.id}:${stepIndex}:${opt.value}:${opt.score}`).row();
  });
  kb.text("🏠 منوی اصلی", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

async function handleAssessmentAnswer(ctx) {
  const parts = ctx.callbackQuery.data.split(":");
  const testId = parts[1];
  const stepIndex = parseInt(parts[2]);
  const value = parts[3];
  const score = parseInt(parts[4]);

  const test = ASSESSMENT_TESTS.find((t) => t.id === testId);
  if (!test) return;

  if (!ctx.session.testAnswers) ctx.session.testAnswers = {};
  ctx.session.testAnswers[stepIndex] = { value, score };

  const nextStep = stepIndex + 1;

  if (nextStep >= test.questions.length) {
    // نمایش نتیجه تست
    await showTestResult(ctx, test);
  } else {
    ctx.session.testStep = nextStep;
    await askTestQuestion(ctx, test, nextStep);
  }

  await ctx.answerCallbackQuery();
}

async function showTestResult(ctx, test) {
  let totalScore = 0;
  const maxScore = test.questions.reduce((sum, q) => {
    const maxOption = Math.max(...q.options.map((o) => o.score));
    return sum + maxOption;
  }, 0);

  Object.values(ctx.session.testAnswers || {}).forEach((a) => {
    totalScore += a.score || 0;
  });

  const percentage = Math.round((totalScore / maxScore) * 100);
  const filled = Math.round((percentage / 100) * 15);
  const bar = "█".repeat(filled) + "░".repeat(15 - filled);

  let statusEmoji = percentage >= 75 ? "🟢" : percentage >= 50 ? "🟡" : "🔴";
  let statusText =
    percentage >= 75 ? "عالی" : percentage >= 50 ? "متوسط — نیاز به تقویت" : "ضعیف — نیاز به بازنگری";

  let text = `${test.emoji} *نتیجه تست: ${test.title}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `${bar} ${percentage}%\n`;
  text += `${statusEmoji} وضعیت: *${statusText}*\n\n`;

  if (percentage >= 75) {
    text += `✅ شما در این حوزه آمادگی خوبی دارید.\n`;
    text += `💡 برای حفظ این سطح، به مطالعه ادامه دهید.`;
  } else if (percentage >= 50) {
    text += `⚠️ نیاز به تقویت در برخی حوزه‌ها دارید.\n`;
    text += `💡 کارت‌های آموزشی مرتبط را مطالعه کنید.`;
  } else {
    text += `🚨 این حوزه نیاز به توجه فوری دارد.\n`;
    text += `💡 با مشاور تخصصی مشورت کنید.`;
  }

  text += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // ریست
  ctx.session.currentTest = null;
  ctx.session.testStep = 0;
  ctx.session.testAnswers = {};

  const kb = new InlineKeyboard()
    .text("🧪 تست دیگری", "show_assessments")
    .row()
    .text("📚 بخش آموزش", "show_education")
    .row()
    .text("🏠 منوی اصلی", "menu");

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
  }
}

module.exports = {
  handleShowEducationList,
  handleShowEducationCard,
  handleEducationView,
  handleRelatedCards,
  handleShowAssessments,
  handleStartAssessmentTest,
  handleAssessmentAnswer,
};
