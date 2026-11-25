# راهنمای انتشار فایل‌های APK روی GitHub و دریافت آپدیت خودکار

این پروژه طوری آماده شده که بدون نیاز به نصب Android Studio یا Java روی سیستم خودتان، بتوانید از طریق **GitHub Actions** به‌طور خودکار فایل‌های APK را برای پردازنده‌های مختلف بسازید و در **GitHub Releases** منتشر کنید.

---

## ۱. تنظیم نام کاربری GitHub در پروژه (فقط یک‌بار)
1. یک مخزن (Repository) جدید روی GitHub مثلاً به نام `fox-planner` بسازید.
2. فایل `src/config/releaseConfig.ts` را باز کنید و `YOUR_GITHUB_USERNAME` را با نام کاربری GitHub خودتان جایگزین کنید:
   ```ts
   githubOwner: 'your-username',
   githubRepo: 'fox-planner',
   ```
3. (اختیاری) در فایل `version.json` هم آدرس‌ها را با نام کاربری خودتان به‌روزرسانی کنید.

---

## ۲. ساخت کلید امضای دائمی اندروید (برای اینکه آپدیت‌ها روی گوشی کاربر نصب شوند!)
در اندروید، اگر نسخه `1.0.0` را با یک امضا بسازید و نسخه `1.1.0` را با امضای دیگری بدهید، گوشی کاربر اجازه نصب آپدیت روی نسخه قبلی را نمی‌دهد!  
بنابراین برای انتشار واقعی، یک بار یک Keystore بسازید (یا در سیستمی که JDK دارد دستور زیر را بزنید):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore fox-planner-release.keystore -alias foxplanner -keyalg RSA -keysize 2048 -validity 10000
```

سپس در تنظیمات مخزن GitHub مسیر:
`Settings -> Secrets and variables -> Actions -> New repository secret`
این ۴ Secret را اضافه کنید:
- `ANDROID_KEYSTORE_BASE64`: خروجی Base64 فایل `fox-planner-release.keystore`
- `ANDROID_KEYSTORE_PASS`: رمز keystore
- `ANDROID_KEY_ALIAS`: همان `foxplanner`
- `ANDROID_KEY_PASS`: رمز alias

*(اگر فعلاً فقط برای تست سریع می‌خواهید بدون Secret پیش بروید، Workflow همچنان خروجی می‌گیرد و فایل‌ها را می‌سازد، اما برای انتشار عمومی و آپدیت‌پذیری روی گوشی مخاطبان حتماً Keystore ثابت اضافه کنید.)*

---

## ۳. ساخت و انتشار خودکار APK برای تمام پردازنده‌ها
فایل `.github/workflows/android-apk.yml` با پلاگین `plugins/withAbiSplits.js` چهار خروجی مجزا می‌سازد:
- `fox-planner-arm64-v8a.apk` (گوشی‌های اندرویدی جدید ۶۴بیتی — حجم کمتر)
- `fox-planner-armeabi-v7a.apk` (گوشی‌های ۳۲بیتی قدیمی‌تر)
- `fox-planner-x86_64.apk` (تبلت/شبیه‌سازهای x86_64)
- `fox-planner-universal.apk` (نسخه کامل همه‌کاره روی هر گوشی)

**روش انتشار نسخه جدید (مثلاً `v1.1.0`):**
1. شماره نسخه را در `app.json` (`version` و `android.versionCode`) و `src/config/releaseConfig.ts` (`appVersion` و `versionCode`) بالا ببرید.
2. کدها را به GitHub پوش کنید و یک تگ (Tag) بزنید (یا از تب **Actions -> Build Android APKs & Publish Release -> Run workflow** اجرا کنید):
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```
3. پس از چند دقیقه، در بخش **Releases** مخزن شما هر ۴ فایل APK + فایل `version.json` به‌صورت خودکار منتشر می‌شوند و نسخه قبلی فاکس پلنر روی گوشی کاربران با زدن دکمه یا هنگام باز شدن برنامه پیام **«نسخه جدید فاکس پلنر منتشر شد!»** را همراه دکمه‌های دانلود نمایش می‌دهد.
