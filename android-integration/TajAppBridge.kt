// Optional native bridge for the Android WebView wrapper.
// Change the package declaration to match your Android Studio project.

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface

class TajAppBridge(private val activity: Activity) {
    @JavascriptInterface
    fun launchPackage(packageName: String): Boolean {
        return try {
            val intent: Intent? = activity.packageManager.getLaunchIntentForPackage(packageName)
            if (intent == null) {
                false
            } else {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                activity.startActivity(intent)
                true
            }
        } catch (_: Exception) {
            false
        }
    }
}
