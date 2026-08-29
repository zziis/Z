# ZELZAL CHAT v1

منصة دردشة ورومات ثابتة (Static Frontend) تعمل على GitHub Pages وتستخدم Supabase للحسابات وقاعدة البيانات وRealtime.

## التشغيل

1. أنشئ مشروعًا في Supabase.
2. افتح SQL Editor والصق محتوى `supabase.sql` وشغّله.
3. من إعدادات API انسخ:
   - Project URL
   - Publishable key (أو anon key للمشاريع القديمة)
4. افتح `config.js` وضع القيم.
5. ارفع الملفات إلى GitHub.
6. فعّل GitHub Pages من Settings > Pages > Deploy from a branch > main > /(root).
7. افتح رابط الموقع.

مهم: لا تضع `service_role` key في `config.js`.

## ملاحظات

هذه النسخة الأولى تشمل:
- تسجيل/دخول بالبريد وكلمة المرور.
- ملفات مستخدمين.
- إنشاء رومات.
- رسائل نصية.
- تحديث الرسائل والرومات لحظيًا عبر Supabase Realtime.

لا تشمل بعد:
- مكالمات صوتية/فيديو.
- رفع الصور والملفات.
- لوحة إدارة متقدمة.
- نظام حظر/طرد.
- Presence حقيقي لعدد المتصلين.

للمرحلة الثانية يمكن إضافة هذه المزايا.
