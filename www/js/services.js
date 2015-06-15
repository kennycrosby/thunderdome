angular.module('mychat.services', ['firebase'])
  .factory("Auth", ["$firebaseAuth", "$rootScope",
  function ($firebaseAuth, $rootScope) {
    var ref = new Firebase(firebaseUrl);
    return $firebaseAuth(ref);
}])

.factory('Zones', function() {

  return {
    scan : function(userRef) {

      var zone = 0,
          count = 0,
          sample = [],
          sampleRate = 7;

      // Start scanning.
      estimote.beacons.startEstimoteBeaconsDiscoveryForRegion(
        {}, // Empty region matches all beacons.
        //onScan
        function(beaconInfo) {

          // Sort beacons by signal strength.
          beaconInfo.beacons.sort(function(beacon1, beacon2) {
            return beacon1.rssi > beacon2.rssi; });

          // Closest Beacon
          var closestMajor = beaconInfo.beacons[0].major;

          console.log('count', count);
          console.log('sample', sample);

          if (count <= sampleRate) {
            count++;
            // Zone 1 : 39199, 44239
            // Zone 2 : 48980
            // Zone 3 : 38523, 5356
            switch (closestMajor) {
              case 44239:
              case 39199:
                sample.push(1);
                break;
              case 48980:
                sample.push(2);
                break;
              case 38523:
              case 5356:
                sample.push(3);
                break;
            }
          } else {
            var zone = mode(sample);

            console.log('zone', zone);
            console.log('zonetype', typeof zone);

            if (typeof zone === 'number') {
              // Set the Zone for that user
              userRef.child('zone').set(zone);
            };

            count = 0;
            sample = [];
          }
          
          //userRef.child('lastSeen').set(Date.now());

        },
        //onError
        function(errorMessage){
          console.log(errorMessage);
        });
    }
  }

})

.factory('Chats', function ($firebase) {

  var selectedRoomId = 0;

  var ref = new Firebase(firebaseUrl);
  var chats;

  return {
      all: function () {
        return chats;
      },
      remove: function (chat) {
        chats.$remove(chat).then(function (ref) {
          ref.key() === chat.$id; // true item has been removed
        });
      },
      get: function (chatId) {
        for (var i = 0; i < chats.length; i++) {
          if (chats[i].id === parseInt(chatId)) {
            return chats[i];
          }
        }
        return null;
      },
      selectRoom: function (roomId) {
        console.log("selecting the room with id: " + roomId);
        selectedRoomId = roomId;
        if (!isNaN(roomId)) {
            chats = $firebase(ref.child('rooms').child(selectedRoomId).child('chats')).$asArray();
        }
      },
      send: function (from, message) {
        console.log("sending message from :" + from.displayName + " & message is " + message);
        if (from && message) {
            var chatMessage = {
                from: from.displayName,
                message: message,
                createdAt: Firebase.ServerValue.TIMESTAMP
            };
            chats.$add(chatMessage).then(function (data) {
                console.log("message added");
            });
        }
      }
  }
})

.factory('Unlock', function() {

  return {
    onRange : function(beaconInfo) {

      //  If we can get beacons show the locked screen
      if (!beaconInfo) { return 'notInRange'; }

      // Sort beacons by distance.
      beaconInfo.beacons.sort(function(beacon1, beacon2) {
        return beacon1.distance > beacon2.distance; });

      // Closest Beacon
      var closest = beaconInfo.beacons[0];
      return closest.major === 11828 && closest.proximity === 1;
    
    },

    onError : function(errorMessage) {
      console.log('Range error: ' + errorMessage);
    },
    unlockAnimation : function(callback) {

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
      estimote.beacons.stopRangingBeaconsInRegion({});
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


function mode(array)
{
    if(array.length == 0)
      return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
      var el = array[i];
      if(modeMap[el] == null)
        modeMap[el] = 1;
      else
        modeMap[el]++;  
      if(modeMap[el] > maxCount)
      {
        maxEl = el;
        maxCount = modeMap[el];
      }
    }
    return maxEl;
}
