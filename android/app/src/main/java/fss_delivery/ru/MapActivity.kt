// package fss_delivery.ru

// import android.util.Log
// import android.os.Bundle
// import android.widget.Button
// import android.widget.Toast
// import androidx.appcompat.app.AppCompatActivity
// import androidx.core.content.ContextCompat
// import com.yandex.mapkit.MapKitFactory
// import com.yandex.mapkit.RequestPoint
// import com.yandex.mapkit.RequestPointType
// import com.yandex.mapkit.directions.DirectionsFactory
// import com.yandex.mapkit.directions.driving.DrivingOptions
// import com.yandex.mapkit.directions.driving.DrivingRoute
// import com.yandex.mapkit.directions.driving.DrivingRouter
// import com.yandex.mapkit.directions.driving.DrivingRouterType
// import com.yandex.mapkit.directions.driving.DrivingSession
// import com.yandex.mapkit.directions.driving.VehicleOptions
// import com.yandex.mapkit.geometry.Point
// import com.yandex.mapkit.map.CameraPosition
// import com.yandex.mapkit.map.IconStyle
// import com.yandex.mapkit.map.MapObjectCollection
// import com.yandex.mapkit.map.PolylineMapObject
// import com.yandex.mapkit.mapview.MapView
// import com.yandex.runtime.Error
// import com.yandex.runtime.image.ImageProvider
// import com.yandex.runtime.network.NetworkError
// import com.yandex.mapkit.navigation.automotive.Navigation
// import com.yandex.mapkit.navigation.automotive.NavigationFactory
// import com.yandex.mapkit.navigation.automotive.Guidance
// import com.yandex.mapkit.navigation.automotive.GuidanceListener
// import com.yandex.mapkit.navigation.automotive.RouteChangeReason


// class MapActivity : AppCompatActivity() {

//     private lateinit var mapView: MapView
//     private lateinit var closeButton: Button
//     private lateinit var drivingRouter: DrivingRouter
//     private var drivingSession: DrivingSession? = null
//     private lateinit var placemarksCollection: MapObjectCollection
//     private lateinit var routesCollection: MapObjectCollection

//     private var routePoints = DEFAULT_POINTS
//         set(value) {
//             field = value
//             onRoutePointsUpdated()
//         }

//     private var routes = emptyList<DrivingRoute>()
//         set(value) {
//             field = value
//             onRoutesUpdated()
//         }

//     private val drivingRouteListener = object : DrivingSession.DrivingRouteListener {
//         override fun onDrivingRoutes(drivingRoutes: MutableList<DrivingRoute>) {
//             routes = drivingRoutes
//         }

//         override fun onDrivingRoutesError(error: Error) {
//             when (error) {
//                 is NetworkError -> showToast("Routes request error due network issues")
//                 else -> showToast("Routes request unknown error")
//             }
//         }
//     }

    

//     override fun onCreate(savedInstanceState: Bundle?) {
//         super.onCreate(savedInstanceState)
//         setContentView(R.layout.activity_map)

//         mapView = findViewById(R.id.map_view)
//         closeButton = findViewById(R.id.close_button)

//         val map = mapView.mapWindow.map
//         placemarksCollection = map.mapObjects.addCollection()
//         routesCollection = map.mapObjects.addCollection()
//         drivingRouter = DirectionsFactory.getInstance().createDrivingRouter(DrivingRouterType.COMBINED)

//         // Включение ночного режима
//         map.setNightModeEnabled(true)

//         map.move(
//             CameraPosition(
//                 Point(25.190614, 55.265616),
//                 13.0f,
//                 0.0f,
//                 0.0f
//             )
//         )

//         closeButton.setOnClickListener {
//             finish()
//         }

//         routePoints = DEFAULT_POINTS

//     }

//     override fun onStart() {
//         super.onStart()
//         MapKitFactory.getInstance().onStart()
//         mapView.onStart()
//     }

//     override fun onStop() {
//         mapView.onStop()
//         MapKitFactory.getInstance().onStop()
//         super.onStop()
//     }

//     override fun onDestroy() {
//         android.util.Log.d("MapActivity", "onDestroy вызван")
//         super.onDestroy()
//     }

//     private fun onRoutePointsUpdated() {
//         placemarksCollection.clear()

//         if (routePoints.isEmpty()) {
//             drivingSession?.cancel()
//             routes = emptyList()
//             return
//         }

//         // Make sure you have a drawable resource named "ic_marker" or similar in res/drawable
//         val imageProvider = ImageProvider.fromResource(this, android.R.drawable.ic_menu_myplaces)
//         routePoints.forEach {
//             placemarksCollection.addPlacemark().apply {
//                 geometry = it
//                 setIcon(imageProvider, IconStyle().apply {
//                     scale = 0.5f
//                     zIndex = 20f
//                 })
//             }
//         }

//         if (routePoints.size < 2) return

//         val requestPoints = buildList {
//             add(RequestPoint(routePoints.first(), RequestPointType.WAYPOINT, null, null, null))
//             addAll(
//                 routePoints.subList(1, routePoints.size - 1)
//                     .map { RequestPoint(it, RequestPointType.VIAPOINT, null, null, null) })
//             add(RequestPoint(routePoints.last(), RequestPointType.WAYPOINT, null, null, null))
//         }

//         val drivingOptions = DrivingOptions()
//         val vehicleOptions = VehicleOptions()

//         drivingSession = drivingRouter.requestRoutes(
//             requestPoints,
//             drivingOptions,
//             vehicleOptions,
//             drivingRouteListener
//         )
//     }

//     private fun onRoutesUpdated() {
//         routesCollection.clear()
//         if (routes.isEmpty()) return

//         routes.forEachIndexed { index, route ->
//             routesCollection.addPolyline(route.geometry).apply {
//                 if (index == 0) styleMainRoute() else styleAlternativeRoute()
//             }
//         }
//     }

//     private fun PolylineMapObject.styleMainRoute() {
//         zIndex = 10f
//         setStrokeColor(ContextCompat.getColor(this@MapActivity, android.R.color.holo_blue_dark))
//         strokeWidth = 5f
//         outlineColor = ContextCompat.getColor(this@MapActivity, android.R.color.black)
//         outlineWidth = 3f
//     }

//     private fun PolylineMapObject.styleAlternativeRoute() {
//         zIndex = 5f
//         setStrokeColor(ContextCompat.getColor(this@MapActivity, android.R.color.holo_blue_light))
//         strokeWidth = 4f
//         outlineColor = ContextCompat.getColor(this@MapActivity, android.R.color.black)
//         outlineWidth = 2f
//     }

//     // Added showToast function
//     private fun showToast(message: String) {
//         Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
//     }

//     companion object {
//         private val DEFAULT_POINTS = listOf(
//             Point(25.190614, 55.265616),
//             Point(25.187532, 55.275413),
//             Point(25.189279, 55.282246),
//             Point(25.196605, 55.280940)
//         )
//     }
// }