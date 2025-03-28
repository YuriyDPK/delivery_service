package com.aaa

import android.graphics.Bitmap
import android.util.Base64
import com.facebook.react.bridge.*
import com.google.zxing.BarcodeFormat
import com.google.zxing.MultiFormatWriter
import com.google.zxing.common.BitMatrix
import java.io.ByteArrayOutputStream

class DataMatrixModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "DataMatrixGenerator"
  }

  @ReactMethod
  fun generateBase64(data: String, promise: Promise) {
    try {
      val width = 300
      val height = 300
      val bitMatrix: BitMatrix = MultiFormatWriter().encode(
        data,
        BarcodeFormat.DATA_MATRIX,
        width,
        height
      )

      val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
      for (x in 0 until width) {
        for (y in 0 until height) {
          bmp.setPixel(x, y, if (bitMatrix.get(x, y)) -0x1000000 else -0x1)
        }
      }

      val outputStream = ByteArrayOutputStream()
      bmp.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      val byteArray = outputStream.toByteArray()
      val base64 = Base64.encodeToString(byteArray, Base64.NO_WRAP)

      promise.resolve("data:image/png;base64,$base64")
    } catch (e: Exception) {
      promise.reject("DATAMATRIX_ERROR", "Ошибка генерации DataMatrix", e)
    }
  }
}
