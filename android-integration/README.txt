فتح APK المثبت من داخل WebView — V27.2

المشروع الحالي Web. لذلك أضف هذا الجسر إلى مشروع Android Studio الذي يغلف الموقع حتى يكون فتح التطبيق المثبت مضمونًا داخل WebView.

1) انسخ TajAppBridge.kt إلى مشروع Android Studio وعدل package في أعلى الملف إذا لزم.

2) بعد إنشاء webView في MainActivity أضف:

webView.settings.javaScriptEnabled = true
webView.addJavascriptInterface(TajAppBridge(this), "AndroidApp")

3) الكود داخل game-store.js سيستدعي تلقائيًا:
AndroidApp.launchPackage("com.company.game")

4) من لوحة المطور في تاج الملوك اكتب Package Name الصحيح لكل APK.
مثال:
com.rockstargames.gtasa

مهم: APK يجب أن يكون مثبتًا على الجهاز. تنزيل الملف فقط لا يكفي لتشغيله.
