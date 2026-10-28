# نقشه مرحله بعد — Candidatory Intelligence UI/UX

تاریخ: 2026-10-28 | وضعیت: طرح پیشنهادی، بدون تغییر در Production

## مبنای واقعی
- Bot: Node.js + grammY + Appwrite؛ webhook تلگرام؛ ماژول‌های موجود: dashboard, onboarding, assessments, readiness, SWOT, rivals, promises, crisis, content generator, education, consultations, plans, admin.
- دو سطح تجربه: ربات موجود (حفظ کامل سازگاری) + Telegram Mini App برای داشبورد بصری.
- گزارش candidate-audit/PHASE1_AUDIT_REPORT.md پیش از آغاز توسعه مجدداً با کد جاری تطبیق شود؛ یافته‌های گزارش مربوط به snapshot قدیمی‌اند.

## راهبری تجربه
نوار پایین موبایل (۵ مقصد): خانه، ارزیابی، کمپین، دستیار AI، بیشتر.
سایدبار دسکتاپ: ۱۵ بخش. تمام صفحات فارسی RTL، قابل دسترس و واکنش‌گرا. ناوبری عمیق و Back حفظ شود.

## ماتریس ماژول‌ها
| تب | اجزای صفحه | آیکون Lucide | انیمیشن | اولویت |
|---|---|---|---|---|
| داشبورد | خلاصه سلامت، اقدامات، هشدارها، KPI | layout-dashboard | progress 400ms, count-up optional | P0 |
| پروفایل | اطلاعات، سوابق، مدارک، رضایت داده | user-round | step transition 180ms | P0 |
| ارزیابی | سوالات، امتیاز پنج‌بعدی، SWOT، تاریخچه | clipboard-check | progress 250ms | P0 |
| استراتژی | اهداف، KPI، اقدامات، مالکان، بازبینی | target | timeline reveal | P1 |
| رقبا | داده‌های عمومی و مستند، مقایسه، منابع | users | expand card | P1 |
| محتوا | پیش‌نویس‌ها، تقویم، تایید، آرشیو | megaphone | preview transition | P1 |
| برنامه‌ها | تقویم، وظایف، مهلت و یادآوری | calendar-days | date slide | P1 |
| بحران | ثبت رخداد، شواهد، مسئول، وضعیت | shield-alert | state transition | P1 |
| تعهدات | وعده‌ها، مستندات، درصد تحقق | list-checks | progress fill | P1 |
| تیم | نقش‌ها، دعوت، تخصیص وظایف | users-round | card reveal | P1 |
| گزارش‌ها | نمودارها، مقایسه دوره‌ای، export | chart-no-axes-combined | chart draw <=450ms | P2 |
| آموزش | فهرست درس، وضعیت، آزمون | graduation-cap | accordion | P2 |
| دستیار AI | سوال و جواب و تحلیل مبتنی بر داده | bot | streaming text with reduced-motion alternative | P1 |
| تنظیمات | حساب، زبان، اعلان، حریم خصوصی | settings | subtle tab transition | P0 |
| مدیریت | کاربران، اشتراک‌ها، ممیزی و دسترسی | shield-check | filter transition | P0 |

## ساختار صفحات
- Layout: header با نام کاندیدا، وضعیت داده، اعلان، منوی حساب؛ navigation responsive؛ breadcrumb؛ ناحیه محتوا؛ action dock.
- Dashboard: health score با فرمول شفاف، کارت اقدام فوری، نمودار روند، وضعیت وعده‌ها، رویدادهای پیش رو، هشدارهای معتبر.
- Assessment: wizard با ذخیره draft، resume، تایید مرحله، نتایج با تاریخ و نسخه فرمول. نمایش عدم قطعیت و منبع داده.
- Campaign: زیربخش‌های strategy/rivals/promises/team/crisis/content/calendar و اتصال هر اقدام به مسئول و تاریخ.
- Admin: role based access, audit trail, search/filter, export with authorization.

## موشن دیزاین
- 120-220ms برای hover, focus, accordion؛ 250-450ms برای نمودار/نوار پیشرفت؛ easing ملایم.
- احترام به prefers-reduced-motion، عدم تکیه بر حرکت برای انتقال اطلاعات، skeleton loading و toast شفاف.
- در خود پیام‌های تلگرام فقط پیام/کیبورد/ویرایش قابل اتکا؛ موشن واقعی در Mini App.

## معماری پیشنهادی
- UI جداگانه Mini App؛ Auth با اعتبارسنجی سروری initData تلگرام؛ عدم اعتماد به client.
- Backend contracts نسخه‌دار؛ adapter برای داده‌های Appwrite و مسیرهای bot فعلی؛ بدون تعویض یکجای دیتابیس.
- Cloudflare Pages/Workers فقط پس از بررسی استقرار فعلی و سازگاری؛ secrets از طریق secret bindings، نه repo.
- جلوگیری از ثبت داده حساس غیرضروری؛ RBAC در سمت سرور، encryption, logging redaction, backups, retention و حذف داده.
- حفاظت webhook secret، replay protection، rate limits پایدار، idempotency Telegram update.
- کمک AI باید قابل ردگیری، دارای تایید انسانی پیش از انتشار و منع ادعاهای بدون منبع باشد. هیچ بخش تبلیغات هدفمند بر پایه ویژگی‌های حساس طراحی نمی‌شود.

## ترتیب اجرا
P0 (اول): بررسی regression و مسائل امنیتی قبلی، تثبیت schema، تست login/webhook، قرارداد API، shell ناوبری، dashboard/profile/assessment/settings/admin.
P1 (دوم): strategy, rivals, commitments, team, content, crisis, calendar, AI assistant. همه با داده واقعی و مجوزهای دسترسی.
P2 (سوم): گزارش‌های پیشرفته، خروجی‌ها، آموزش، بهینه‌سازی عملکرد و motion polish.

## معیار پذیرش و تست
1. مسیرهای قبلی ربات حفظ و regression test شوند.
2. Mini App روی Telegram Android/iOS/Desktop، RTL و viewport کوچک تست شود.
3. هیچ score ساختگی در داده واقعی نمایش داده نشود؛ empty/loading/error states مشخص باشند.
4. دسترسی نقش‌ها در سرور، audit trail، خطاها، rate limit و webhook secret تست شوند.
5. تست accessibility (keyboard, focus, contrast, reduced motion)، performance و monitoring برقرار باشد.
6. staging جداگانه و review قبل از merge/deploy production؛ اسکرین‌شات قبل/بعد و گزارش تست الزامی.

## فایل‌های مرتبط
src/flows/dashboard.js
src/flows/assessments.js
src/flows/onboarding.js
src/flows/campaign/*
src/flows/content/generator.js
src/flows/admin.js
src/utils/db.js
src/main.js
candidate-audit/PHASE1_AUDIT_REPORT.md
