// package fss_delivery.ru

// import com.facebook.react.bridge.ReactApplicationContext
// import com.facebook.react.bridge.ReactContextBaseJavaModule
// import com.facebook.react.bridge.ReactMethod
// import com.facebook.react.bridge.ReadableMap
// import com.facebook.react.bridge.Promise
// import com.yandex.mapkit.MapKitFactory
// import com.yandex.mapkit.directions.DirectionsFactory
// import com.yandex.mapkit.directions.driving.DrivingOptions
// import com.yandex.mapkit.directions.driving.DrivingRoute
// import com.yandex.mapkit.directions.driving.DrivingRouter
// import com.yandex.mapkit.directions.driving.DrivingSession
// import com.yandex.mapkit.directions.driving.RequestPoint
// import com.yandex.mapkit.directions.driving.RequestPointType
// import com.yandex.mapkit.directions.driving.VehicleOptions
// import com.yandex.mapkit.geometry.Point
// import com.yandex.runtime.Error

// class YandexNavigationModule(private val reactContext: ReactApplicationContext) : 
//     ReactContextBaseJavaModule(reactContext), DrivingSession.DrivingRouteListener {
    
//     private var drivingRouter: DrivingRouter? = null
//     private var drivingSession: DrivingSession? = null
    
//     override fun getName(): String {
//         return "YandexNavigationModule"
//     }
    
//     override fun initialize() {
//         super.initialize()
//         drivingRouter = DirectionsFactory.getInstance().createDrivingRouter()
//     }
    
//     @ReactMethod
//     fun buildRoute(startPoint: ReadableMap, endPoint: ReadableMap, promise: Promise) {
//         try {
//             val start = Point(startPoint.getDouble("latitude"), startPoint.getDouble("longitude"))
//             val end = Point(endPoint.getDouble("latitude"), endPoint.getDouble("longitude"))
            
//             val points: MutableList<RequestPoint> = mutableListOf(
//                 RequestPoint(start, listOf(RequestPointType.WAYPOINT), null),
//                 RequestPoint(end, listOf(RequestPointType.WAYPOINT), null)
//             )
            
//             val drivingOptions = DrivingOptions()
//             val vehicleOptions = VehicleOptions()
            
//             drivingSession = drivingRouter?.requestRoutes(
//                 points,
//                 drivingOptions,
//                 vehicleOptions,
//                 this
//             )
//             promise.resolve(true)
//         } catch (e: Exception) {
//             promise.reject("ERROR", e.message)
//         }
//     }
    
//     override fun onDrivingRoutes(routes: MutableList<DrivingRoute>) {
//         // Минимальная реализация согласно документации
//     }
    
//     override fun onDrivingRoutesError(error: Error) {
//         // Минимальная реализация согласно документации
//     }
// }