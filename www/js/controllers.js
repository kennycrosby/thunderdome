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
              id : guid(),
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

          // update the last time they logged in
          userRef = new Firebase($scope.firebaseUrl + 'users/' + authData.uid);
          userRef.child('lastSeen').set(Date.now());

          // SETTING THE ZONE
          Zones.scan(userRef);

          ref.child("users").child(authData.uid).once('value', function (snapshot) {
              var val = snapshot.val();
              console.log('val', val);
              // To Update AngularJS $scope either use $apply or $timeout
              $scope.$apply(function () {
                  $rootScope.displayName = val;

              });

              if (val.unlocked) {
                $state.go('tab.users');  
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

.controller('ChatCtrl', function ($scope, Chats, Users, $state) {
  //console.log("Chat Controller initialized");

  $scope.IM = {
    textMessage: ""
  };

  Chats.selectRoom(0);
  $scope.chats = Chats.all();

  $scope.sendMessage = function (msg) {
    Chats.send($scope.displayName, msg);
    $scope.IM.textMessage = "";
  }

  $scope.remove = function (chat) {
    Chats.remove(chat);
  }

})

.controller('MapCtrl', function ($scope, MapZones, $state, Users) {
  
  $scope.zones = {};

  var usersRef = new Firebase('https://intense-torch-5728.firebaseio.com/users/');

  usersRef.on('value', function(snap) {
      var users = snap.val();
      $scope.zones = MapZones.getZones(users);
  });

  usersRef.on('child_changed', function(snap) {
      var users = snap.val();
      usersRef.child(userId).on('value', function(snap) {
        $scope.zones = MapZones.getZones(users);
      });
  });
  
})

.controller('UnlockCtrl', function ($scope, Unlock, $state, $rootScope) {

  $scope.animate = function() {

    var el     = $('.loader'),  
        newone = el.clone(true);     
    el.before(newone);
    $(".loader:last").remove();
    $(document.body).find('.loader').addClass('animate');     

  }

  var counter = 0;

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
    {}, // Empty region matches all beacons.
    function(beaconInfo) {

      //console.log('Ranging for beacons');

      var unlocked = Unlock.onRange(beaconInfo);
      console.log('Unlocked?: ', unlocked);

      if (unlocked === 'notInRange') {

        $scope.unlockData = {
          doorStatus : 'Door Locked',
          directions : 'Go to mod to unlock the door.',
          image: 'locked.svg'
        };
        $scope.$apply();

      } else if (unlocked) {
        $scope.unlockData = {
          doorStatus : 'Unlocked',
          directions : 'The door has been unlocked go inside and make yourself a sandwich.',
          image: 'unlocked.svg'
        };
        $scope.$apply();

        // Stop Ranging for Beacons
        utils.stopRangingBeacons();

        $rootScope.userRef.child('unlocked').set(true);

        // Location count + 1
        //$rootScope.userRef.child('locationCount').set(true);

        Unlock.unlockAnimation();
        setTimeout(function() {
          $state.go('tab.users');
        }, 2000);

        console.log('Stopped Ranging for beacons');

      } else {
        $scope.unlockData = {
          doorStatus : 'Door Locked',
          directions : 'Place your phone on the beacon to unlock.',
          image: 'locked.svg'
        };
        $scope.$apply();

        console.log('Beacons in range but not the door beacon.');
      }

    },
    Unlock.onError );

})

.controller('UsersCtrl', function ($scope, Users, $state) {
  //console.log("Rooms Controller initialized");
  $scope.users = Users.all();

})

.controller('UserDetailCtrl', function($scope, $stateParams, Users, Unlock) {

  $scope.user = Users.get($stateParams.userId);

});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}