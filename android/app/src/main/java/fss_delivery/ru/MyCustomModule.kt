package fss_delivery.ru

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MyCustomModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MyCustomModule"

    @ReactMethod
    fun processMapUrl(url: String, promise: Promise) {
        try {
            // Пример: разбиваем строку по запятой (можете изменить логику)
            val resultArray = url.split("/")
            // Создаём WritableArray для передачи в JS
            val writableArray = Arguments.createArray()
            for (item in resultArray) {
                writableArray.pushString(item)
            }
            promise.resolve(writableArray)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }
}
