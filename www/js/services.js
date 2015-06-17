angular.module('mychat.services', ['firebase'])
  .factory("Auth", ["$firebaseAuth", "$rootScope",
  function ($firebaseAuth, $rootScope) {
    var ref = new Firebase(firebaseUrl);
    return $firebaseAuth(ref);
}])

.factory('Zones', function() {
  return {
    zonesObj : {
      1 : [ 39199, 44239, 47979 ], //zone 1 beacons major
      2 : [ 49839, 17343 ],        //zone 2 beacons major
      3 : [ 38523, 5356, 11828 ],  //zone 3 beacons major the unlock is 11828
      4 : [ 48980, 8986 ],         //zone 4 beacons major
      5 : [ 27715, 20669 ]         //zone 5 beacons major
    },
    scan : function(userRef) {

      var self = this;

      console.log('userRef',userRef);

      var zone = 0,
          count = 0,
          sample = [],
          sampleRate = 5,
          zeroCount = 0,
          zeroRate = 15;

      // Start scanning.
      estimote.beacons.startEstimoteBeaconsDiscoveryForRegion(
        {
          'identifier': 'MyRegion',
          'uuid': 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
        }, // Empty region matches all beacons.
        //onScan
        function(beaconInfo) {

          $('.debug').html(beaconInfo);

          // Start recording that the person left
          if (beaconInfo.beacons.length <= 1) { zeroCount++; };

          // if I dont see any beacons for the selected rate then check the user out of the space
          if (beaconInfo.beacons.length <= 1 && zeroCount >= zeroRate) {

            // The person has left the building
            userRef.child('zone').set(0);
            userRef.child('lastSeen').set(Date.now());
            userRef.child('unlocked').set(false);
            zeroCount = 0;

            //stop scanning
            // self.stopScan();
            // alert('You left mod so we checked you out, come back soon!');

          };

          // Sort beacons by signal strength.
          beaconInfo.beacons.sort(function(beacon1, beacon2) {
            return beacon1.rssi > beacon2.rssi; });

          // Closest Beacon
          var closestMajor = beaconInfo.beacons[0].major;

          if ( count+1 <= sampleRate ) {

            // Add the zone to the zone sample we are taking
            for (var key in self.zonesObj) {
              if (self.zonesObj.hasOwnProperty(key)) {
                for (var i = self.zonesObj[key].length - 1; i >= 0; i--) {
                  if (closestMajor === self.zonesObj[key][i]) {
                    console.log('match', key);
                    sample.push(key);
                    count++;
                  }; 
                };
              }
            }

          } else {

            // get the most occuring zone and set the zone
            var zone = utils.mode(sample);

            if (typeof zone === 'number' && beaconInfo.beacons.length > 1) {
              // Set the Zone for that user
              userRef.child('zone').set(zone);
              count = 0;
              zeroCount = 0;
              sample = [];
            };

          }
        },
        //onError
        function(errorMessage){
          console.log(errorMessage);
        });
    },

    stopScan : function() {
      console.log('calling stopscan');
      estimote.beacons.stopEstimoteBeaconDiscovery({
        'identifier': 'MyRegion',
        'uuid': 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
      },
      function() { // success
        console.log('Successfully Stopped stopEstimoteBeaconDiscovery');
      });

    }
  }
})

.factory('Unlock', function() {

  return {
    onRange : function(beaconInfo) {

      //  If we can get beacons show the locked screen
      if (!beaconInfo) { return 'notInRange'; }

      // Closest Beacon
      var closest = beaconInfo.beacons[0];
      return closest.major === 11828 && closest.proximity === 1;
    
    },

    onError : function(errorMessage) {
      console.log('Range error: ' + errorMessage);
    },
    unlockAnimation : function(callback) {

      // listen for animation callback
      $('.three').one('webkitAnimationEnd', callback);

      $('.loader').removeClass('animate');
      var el     = $('.loader'),  
        newone = el.clone(true);     
      el.before(newone);
      $(".loader:last").remove();
      $(document.body).find('.loader').addClass('animate');

    },
    stopRangingBeacons : function() {
      console.log('stopped ranging');
      estimote.beacons.stopRangingBeaconsInRegion({
        'identifier': 'UnlockRegion',
        'uuid': '98F54863-C26C-F60F-C380-44B12D451FD7'
      });
    }
  }
})

/**
 * Simple Service which returns Rooms collection as Array from Salesforce & binds to the Scope in Controller
 */
.factory('Users', function ($firebase) {
  // Might use a resource here that returns a JSON array
  var ref = new Firebase(firebaseUrl);
  var users = $firebase(ref.child('users')).$asArray();

  return {
    all: function () {
      return users;
    },
    get: function(userId) {
      console.log(userId);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
          return users[i];
        }
      }
      return null;
    }
  }
})

.factory('MapZones', function ($firebase) {
  return {
    getZones: function(users) {
      var zones = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[] };
      for (var key in users) {
        if (users.hasOwnProperty(key)) {
          zones[users[key].zone].push(users[key]);
        }
      }
      return zones;
    }
  }
});
