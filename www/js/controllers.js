angular.module('mychat.controllers', [])

// Custom Filters
.filter('yesNo', function() {
  return function(input) {
    return input ? 'yes' : 'no';
  }
})

.controller('LoginCtrl', function ($scope, $ionicModal, $state, $firebaseAuth, $ionicLoading, $rootScope, Zones) {

    // Reference to firebase
    var ref = new Firebase($scope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    // Reference to the current user
    var userRef;

    $ionicModal.fromTemplateUrl('templates/signup.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $scope.createUser = function (user) {
      console.log("Create User Function called", user);
      if (user && user.email && user.password && user.displayname) {
        $ionicLoading.show({
            template: 'Signing Up...'
        });

        auth.$createUser({
          email: user.email,
          password: user.password
        }).then(function (userData) {
          alert("User created successfully!");
          ref.child("users").child(userData.uid).set({
              email: user.email,
              displayName: user.displayname,
              image : "defaultuser.jpg",
              zone : 0,
              id : utils.guid(),
              lastSeen: Date.now(),
              unlocked: false,
              locationCount: 0
          });
          $ionicLoading.hide();
          $scope.modal.hide();
        }).catch(function (error) {
          alert("Error: " + error);
          $ionicLoading.hide();
        });
      } else
        alert("Please fill all details");
    }

    $scope.signIn = function (user) {    

      if (user && user.email && user.pwdForLogin) {
        
        $ionicLoading.show({
          template: 'Signing In...'
        });

        auth.$authWithPassword({
            email: user.email,
            password: user.pwdForLogin
        }).then(function (authData) {

          // // update the last time they logged in
          $rootScope.userRef = new Firebase($scope.firebaseUrl + 'users/' + authData.uid);
          // //userRef.child('checkedIn').set(Date.now());

          // // START SCANNING AND SET THE ZONE FOR THIS USER
          // Zones.scan(userRef);

          ref.child("users").child(authData.uid).once('value', function (snapshot) {
              var val = snapshot.val();

              $scope.$apply(function () {
                $rootScope.displayName = val;
              });

              // Go to either the lock page or the users page
              if (val.unlocked) {
                $state.go('tab.map');  
              } else {
                $state.go('unlock');  
              }

              $ionicLoading.hide();
          });
          
          
        }).catch(function (error) {
            alert("Authentication failed:" + error.message);
            $ionicLoading.hide();
        });
      } else
          alert("Please enter email and password both");
    }

})

.controller('MapCtrl', function ($scope, MapZones, $state, Users) {
  
  $scope.zones = {};
  var usersRef = new Firebase($scope.firebaseUrl + 'users/');

  // Set the scope with the users ref
  usersRef.on('value', function(snap) {
      var users = snap.val();
      $scope.zones = MapZones.getZones(users);
  });

  // When something is changed update the scope
  usersRef.on('child_changed', function(snap) {
      var users = snap.val();
      usersRef.child(userId).on('value', function(snap) {
        $scope.zones = MapZones.getZones(users);
      });
  });
  
})

.controller('UnlockCtrl', function ($scope, Unlock, $state, $rootScope, $ionicModal, Zones) {

  $scope.user = $rootScope.currUser;

  $ionicModal.fromTemplateUrl('templates/welcome.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });

  $scope.continue = function() {
    $scope.modal.hide();
    $state.go('tab.users');
  }

  $scope.unlockit = function() {
    Unlock.unlockAnimation(function(){$scope.modal.show();});
  }

  // The Default data
  $scope.unlockData = {
    doorStatus : 'Door Locked',
    directions : 'Go to mod to unlock the door'
  };

  // Request permission from user to access location info.
  // This is needed on iOS 8.
  estimote.beacons.requestAlwaysAuthorization();
  // // RANGING FOR BEACONS
  estimote.beacons.startRangingBeaconsInRegion(
    {
      'identifier': 'UnlockRegion',
      'uuid': '98F54863-C26C-F60F-C380-44B12D451FD7'
    },
    function(beaconInfo) {

      //console.log('Ranging for beacons');

      var unlocked = Unlock.onRange(beaconInfo);
      console.log('Unlocked?: ', unlocked);

      if (unlocked === 'notInRange') {

        $scope.unlockData = {
          doorStatus : 'Door Locked',
          directions : 'Go to mod to unlock the door.'
        };
        $scope.$apply();

      } else if (unlocked) {

        // Stop Ranging for Beacons
        Unlock.stopRangingBeacons();

        // START SCANNING AND SET THE ZONE FOR THIS USER
        Zones.scan($rootScope.userRef);

        $scope.unlockData = {
          doorStatus : 'Unlocked',
          directions : 'You are checked into mod.'
        };

        // Unlock the user and set the time that they checked in
        $rootScope.userRef.child('unlocked').set(true);
        $rootScope.userRef.child('lastSeen').set(Date.now());

        // Set the location count
        $rootScope.userRef.child('locationCount').once('value', function(snap) {
          var locationcount = snap.val();
          ++locationcount;
          $rootScope.userRef.child('locationCount').set(locationcount);
          $scope.user.locationCount = locationcount;
          $scope.$apply();
        });

        Unlock.unlockAnimation(function(){$scope.modal.show();});

      } else {
        $scope.unlockData = {
          doorStatus : 'Door Locked',
          directions : 'Place your phone on the beacon to unlock.'
        };
        $scope.$apply();
        console.log('Beacons in range but not the door beacon.');
      }

    },
    Unlock.onError );
})

.controller('UsersCtrl', function ($scope, Users, $state) {
  //console.log("Users Controller initialized");
  $scope.users = Users.all();
})

.controller('UserDetailCtrl', function($scope, $stateParams, Users, Unlock) {
  $scope.user = Users.get($stateParams.userId);
});
