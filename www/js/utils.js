var utils = utils || {

  userID : 0,

  beaconColorStyles : [
    'style-color-unknown style-color-unknown-text',
    'style-color-mint style-color-mint-text',
    'style-color-ice style-color-ice-text',
    'style-color-blueberry-dark style-color-blueberry-dark-text',
    'style-color-white style-color-white-text',
    'style-color-transparent style-color-transparent-text'],

  proximityNames : [
      'unknown',
      'immediate',
      'near',
      'far'],

  formatDistance : function(meters) {
    if (!meters) { return 'Unknown'; }

    if (meters > 1) {
      return meters.toFixed(3) + ' m';
    } else {
      return (meters * 100).toFixed(3) + ' cm';
    }

  },

  formatProximity : function(proximity) {
    
    if (!proximity) { return 'Unknown'; }

    // Eliminate bad values (just in case).
    proximity = Math.max(0, proximity);
    proximity = Math.min(3, proximity);

    // Return name for proximity.
    return utils.proximityNames[proximity];

  },

  beaconColorStyle : function(color) {
    if (!color) {
      color = 0;
    }

    // Eliminate bad values (just in case).
    color = Math.max(0, color);
    color = Math.min(5, color);

    // Return style class for color.
    return utils.beaconColorStyles[color];
  },

  stopRangingBeacons : function() {
    
    console.log('stopped ranging');
    estimote.beacons.stopRangingBeaconsInRegion({});
  },

  createBeaconHTML : function(beacon) {
    var colorClasses = utils.beaconColorStyle(beacon.color);
    var htm = '<div class="item ' + colorClasses + '">'
      + '<table><tr><td>Major</td><td>' + beacon.major
      + '</td></tr><tr><td>Minor</td><td>' + beacon.minor
      + '</td></tr><tr><td>RSSI</td><td>' + beacon.rssi
    if (beacon.proximity)
    {
      htm += '</td></tr><tr><td>Proximity</td><td>'
        + utils.formatProximity(beacon.proximity)
    }
    if (beacon.distance)
    {
      htm += '</td></tr><tr><td>Distance</td><td>'
        + utils.formatDistance(beacon.distance)
    }
    htm += '</td></tr></table></div>';
    return htm;
  }


};



