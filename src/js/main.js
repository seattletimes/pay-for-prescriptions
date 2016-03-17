// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("angular");

var app = angular.module("doctor-payments", []);

var titleCase = function(str) {
  var words = str.split(/\s/);
  var caps = words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  return caps.join(" ");
};

const SEARCH_LIMIT = 20;

var mobile = window.matchMedia ? window.matchMedia("(max-width: 480px)") : { matches: false };

var controller = function($scope, $filter) {

  var specialties = {};
  var all = window.doctors;
  all.forEach(function(row) {
    row.first = titleCase(row.first);
    row.last = titleCase(row.last);
    row.city = titleCase(row.city);
    row.flag = row.outlier == "Very high" ? 2 : row.outlier == "High" ? 1 : 0;
    specialties[row.specialty] = true;
  });
  var top5 = all.slice(0, 5);
  
  $scope.search = "";
  $scope.specialties = Object.keys(specialties);
  $scope.doctors = top5;

  var filterDocs = function() {
    var filtered = $scope.specialtyFilter ? all.filter(d => d.specialty == $scope.specialtyFilter) : all;
    if ($scope.search) {
      var matcher = new RegExp($scope.search.replace(/\\/g, "\\\\"), "i");
      $scope.doctors = filtered.filter(function(doc) {
        return matcher.test(doc.first) ||
          matcher.test(doc.last) ||
          (!mobile.matches ? matcher.test(doc.city) : false);
      });
    } else {
      $scope.doctors = filtered;
    }
  };

  var sortDocs = function(field, retainDirection) {
    if (!retainDirection) $scope.sortDown = field == $scope.sorted ? !$scope.sortDown : false;
    $scope.sorted = field;
    $scope.doctors.sort(function(a, b) {
      var swap = $scope.sortDown ? -1 : 1;
      if (a[field] > b[field]) return 1 * swap;
      if (b[field] > a[field]) return -1 * swap;
      return 0;
    });
  };

  var trimDocs = function() {
    $scope.overload = $scope.doctors.length > SEARCH_LIMIT;
    $scope.doctors = $scope.doctors.slice(0, SEARCH_LIMIT);
  }

  $scope.updateSearch = require("./lib/debounce")(function() {
    filterDocs();
    if ($scope.sorted) sortDocs($scope.sorted, true);
    trimDocs();
    $scope.$apply();
  });

  $scope.sorted = null;
  $scope.sortOn = function(field, retainDirection) {
    filterDocs();
    sortDocs(field, retainDirection);
    trimDocs();
  };

};

controller.$inject = ["$scope", "$filter"];

app.directive("sortField", function() {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      element.on("click", function() {
        scope.sortOn(attrs.sortField);
        scope.$apply();
      });

      scope.$watch(function() {
        element.toggleClass("sorted", scope.sorted == attrs.sortField);
        element.toggleClass("down", scope.sortDown);
      });
    }
  }
});

app.controller("TableController", controller);