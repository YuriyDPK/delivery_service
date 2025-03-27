package com.aaa

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class MapModule(private val reactContext: ReactApplicationContext) 
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        // Это имя модуля, под которым он будет виден в JS
        return "MapModule"
    }

    @ReactMethod
    fun openMapActivity(promise: Promise) {
    val activity: Activity? = currentActivity
    try {
        if (activity != null && activity !is MapActivity) {
            val intent = Intent(activity, MapActivity::class.java)
            activity.startActivity(intent)
            promise.resolve("Карта открыта")
        } else {
            promise.reject("MAP_ERROR", "Карта уже открыта или активность недоступна")
        }
    } catch (e: Exception) {
        promise.reject("MAP_ERROR", e.message)
    }
}
}
