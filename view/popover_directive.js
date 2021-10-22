
var app = angular.module('popoverDialog-directive', []);



/**
 * A directive allows us to create html elements with specific functionality. This,
 * in turn, lets us create active html modules that can be re-used in many places.
 * This directive provides a popover, which is a small window popup around the location
 * where an action was taken.
 */
app.directive('popoverDialog', function() {

  // a directive must return an object with parameters we specify
  return {
    // Restrict tells us where we can use our directive (html element, attribute, class, comment, etc)
    // Only use as element for now.
    restrict: 'E',

    // By specifying a scope here, we are giving the directive its own sandboxed scope.
    // We can also choose to inherit from the parent scope
    scope: {
      // This sets up 2-way binding between the variable given to the show attribute
      // and the show variable in our scope.
      show: '=',
      top: '=',
      left: '='
    },

    // We want to replace the html directive with the template specified below.
    replace: true,

    // We want to insert custom content inside this directive
    transclude: true,

    // Link is a function that allows us to utilize the scope we've created
    // for this directive. attrs is an object that contains all the attribute
    // values used with the directive (like width and height).
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width) {
        scope.dialogStyle.width = attrs.width;
      }
      if (attrs.height) {
        scope.dialogStyle.height = attrs.height;
      }

      scope.$watch('top', function(newVal, oldVal, scope) {
        element.css('top', scope.top + 'px');
      });

      scope.$watch('left', function(newVal, oldVal, scope) {
        element.css('left', scope.left + 'px');
      });

      scope.hidePopover = function() {
        scope.show = false;
      };
    },

    template:
     '<div class="ng-popover" ng-show="show" ng-mouseleave="hidePopover()">' +
     '  <div class="ng-popover-dialog" ng-style="dialogStyle">' +
     '    <!-- ng-transclude indicates where the custom content will go -->' +
     '    <div class="ng-popover-dialog-content" ng-transclude></div>' +
     '  </div>' +
     '</div>'
  };

});


