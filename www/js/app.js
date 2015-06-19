// MyChat App - Ionic & Firebase Demo
var firebaseUrl = "https://intense-torch-5728.firebaseio.com/";

function onDeviceReady() {
    angular.bootstrap(document, ["mychat"]);
}
//console.log("binding device ready");
// Registering onDeviceReady callback with deviceready event
document.addEventListener("deviceready", onDeviceReady, false);

// 'mychat.services' is found in services.js
// 'mychat.controllers' is found in controllers.js
angular.module('mychat', [ 
  'ionic', 
  'ngCordova', 
  'firebase', 
  'angularMoment', 
  'mychat.controllers', 
  'mychat.services', 
  'ionic.service.core', 
  'ionic.service.deploy' 
])

.run(function ($ionicPlatform, $rootScope, $location, Auth, $ionicLoading, $cordovaStatusbar) {

  $ionicPlatform.ready(function () {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    setTimeout(function() {
      if (window.StatusBar) {
        $cordovaStatusbar.show();
        $cordovaStatusbar.overlaysWebView(false);
        $cordovaStatusbar.styleHex('#000');
      }
    }, 300);

    // Request permission from user to access location info.
    // This is needed on iOS 8.
    estimote.beacons.requestAlwaysAuthorization();

    // To Resolve Bug
    ionic.Platform.fullScreen();

    $rootScope.firebaseUrl = firebaseUrl;
    $rootScope.displayName = null;
    $rootScope.userRef = null;
    
    // Reference to firebase
    var ref = new Firebase(firebaseUrl);

    Auth.$onAuth(function (authData) {
      if (authData) {
          console.log("Logged in as:", authData.uid);

          $rootScope.userRef = new Firebase($rootScope.firebaseUrl + 'users/' + authData.uid);
          ref.child("users").child(authData.uid).once('value', function (snapshot) {
              var val = snapshot.val();
              $rootScope.currUser = val;
              $rootScope.displayName = val;
              $rootScope.unlocked = val.unlocked;
          });

      } else {
          console.log("Logged out");
          $ionicLoading.hide();
          $location.path('/login');
      }
    });

    $rootScope.logout = function () {
        console.log("Logging out from the app");
        $ionicLoading.show({
            template: 'Logging Out...'
        });
        Auth.$unauth();
    }


    $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireAuth promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
            $location.path("/login");
        }
    });
  });
})

.config(function ($ionicAppProvider, $stateProvider, $urlRouterProvider) {
  console.log("setting config");

  // // Identify app
  // $ionicAppProvider.identify({
  //   // The App ID for the server
  //   app_id: '8b97bb79',
  //   // The API key all services will use for this app
  //   api_key: 'c07f534bc74a0d6103a8c1f59ca24d20121ecdb06a79cdf7'
  //   // Your GCM sender ID/project number (Uncomment if using GCM)
  //   //gcm_id: 'YOUR_GCM_ID'
  // });

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // State to represent Login View
  .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
      controller: 'LoginCtrl',
      resolve: {
        // controller will not be loaded until $waitForAuth resolves
        // Auth refers to our $firebaseAuth wrapper in the example above
        "currentAuth": ["Auth",
          function (Auth) {
              // $waitForAuth returns a promise so the resolve waits for it to complete
              return Auth.$waitForAuth();
        }]
      }
  })

  .state('unlock', {
      url: '/unlock',
      abstract: true,
      cache: false,
      templateUrl: "templates/tab-unlock.html",
      controller: 'UnlockCtrl'
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html",
    resolve: {
      // controller will not be loaded until $requireAuth resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "currentAuth": ["Auth",
          function (Auth) {
            // $requireAuth returns a promise so the resolve waits for it to complete
            // If the promise is rejected, it will throw a $stateChangeError (see above)
            return Auth.$requireAuth();
          }]
    }
  })

  .state('tab.map', {
    url: '/map',
    views: {
      'tab-map': {
        templateUrl: 'templates/tab-map.html',
        controller: 'MapCtrl'
      }
    }
  })

  // .state('tab.users', {
  //   url: '/users',
  //   views: {
  //     'tab-users': {
  //       templateUrl: 'templates/tab-users.html',
  //       controller: 'UsersCtrl'
  //     }
  //   }
  // })

  .state('tab.user-detail', {
    url: '/map/:userId',
    views: {
      'tab-map': {
        templateUrl: 'templates/user-detail.html',
        controller: 'UserDetailCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});