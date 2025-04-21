// package fss_delivery.ru

// import com.facebook.react.uimanager.SimpleViewManager
// import com.facebook.react.uimanager.ThemedReactContext
// import com.yandex.mapkit.mapview.MapView
// import com.yandex.mapkit.MapKitFactory

// class YandexMapViewManager : SimpleViewManager<MapView>() {
//     override fun getName(): String {
//         return "YandexMapView"
//     }
    
//     override fun createViewInstance(reactContext: ThemedReactContext): MapView {
//         val mapView = MapView(reactContext)
//         mapView.mapWindow.map.apply {
//             isRotateGesturesEnabled = true
//             isZoomGesturesEnabled = true
//             isTiltGesturesEnabled = true
//         }
//         mapView.onStart() // Согласно документации, нужно явно запускать
//         return mapView
//     }
    
//     override fun onDropViewInstance(view: MapView) {
//         view.onStop() // Согласно документации, нужно явно останавливать
//         super.onDropViewInstance(view)
//     }
// }