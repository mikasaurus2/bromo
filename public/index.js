/*
 * Angular module is a collection of functions that are run when the application
 * is booted.
 *
 */

var app = angular.module('userAuth', []);


/* Create a controller here to set up a $scope that the view can access (inside the
 * DOM element). Now we can access this object in any child element of the div
 * where this controller is declared.
 */
app.controller('userAuthController', function($scope, $http) {

  var svcUrl = 'http://localhost:3000';

  // create user with var originally, so other $scope functions
  // can have access to this object
  var user = {
    username : '',
    password : '',
  };

  function hiliteActive(tab) {
    var href = tab.attr('href');

    // remove 'active' class from current active anchor element
    $('.active').removeClass('active');
    // add 'active' class to the anchor element we just clicked on
    tab.addClass('active');
  };

  $scope.user = user;

  $scope.create = true;

  $scope.msgstr = 'Welcome!';

  $scope.createMode = function createMode() {
    $scope.create = true;
  }

  $scope.loginMode = function loginMode() {
    $scope.create = false;
  }

  $scope.loginUser = function loginUser() {
    console.log('Logging in the user [User: %s] [Pass: %s]', user.username, user.password);

    $http({
      method: 'POST',
      url: svcUrl + '/api/loginUser',
      data: {
        username: user.username,
        password: user.password
      }
    }).then(authSuccess, authFail);
  };

  $scope.createUser = function createUser() {
    console.log('Creating a user [User: %s] [Pass: %s]', user.username, user.password);

    $http({
      method: 'POST',
      url: svcUrl + '/api/createUser',
      data: {
        username: user.username,
        password: user.password
      }
    }).then(authSuccess, authFail);
  };

  $scope.$watch('user.username', limitTextFactory($scope.user, 'username'));
  $scope.$watch('user.password', limitTextFactory($scope.user, 'password'));

  // bind some DOM manipulation actions when clicking on register / login tabs
  $('#registerTab').on('click', 'a', function(e) {
    // reset any messages  and hilight the proper tab
    var $tab = $(this);
    // get the angular scope so we can change the message
    // from inside this JQuery event
    var scope = angular.element($('.authMsg')).scope();
    $('.authMsg').removeClass('authErr');
    scope.msgstr = 'Welcome!';
    // call $apply() so angular's digest cycle triggers and the
    // message updates
    scope.$apply();
    hiliteActive($tab);
  });

  $('#loginTab').on('click', 'a', function(e) {
    // reset any messages  and hilight the proper tab
    var $tab = $(this);
    // get the angular scope so we can change the message
    // from inside this JQuery event
    var scope = angular.element($('.authMsg')).scope();
    $('.authMsg').removeClass('authErr');
    scope.msgstr = 'Welcome back!';
    // call $apply() so angular's digest cycle triggers and the
    // message updates
    scope.$apply();
    hiliteActive($tab);
  });


  /*
  The response object has these properties:
  data – {string|Object} – The response body transformed with the transform functions.
  status – {number} – HTTP status code of the response.
  headers – {function([headerName])} – Header getter function.
  config – {Object} – The configuration object that was used to generate the request.
  statusText – {string} – HTTP status text of the response.
  */

  function authSuccess(response) {
    if (response.data) {
      if (response.status === 200) {
        console.log('Login successful!');
        // redirect to our main view page
        window.location.replace('/view.html');
      } else {
        console.log('Login failed!');
      }
    }
  }

  function authFail(response) {
    console.log('Login error: ' + response.status + ' ' + response.data);
    if (response.data.error) {
      var errMsg = response.data.error.msg;
      $scope.msgstr = viewErrors[errMsg] ? viewErrors[errMsg] : response.data.error.msgdesc;
      $('.authMsg').addClass('authErr');
    }
  }

  function limitTextFactory(scope, field) {
    // Here, we get the scope object and the field we want to access in it.
    // Since this is a factory function, we save the parameter scope into
    // a local variable so the returned function can have access to it
    // via closure. The field parameter lets us use this function more
    // generically.
    var curScope = scope;
    return  function (newVal, oldVal) {
      var limit = 20;
      if (newVal.length > limit) {
        curScope[field] = oldVal;
      } else {
        curScope[field] = newVal;
      }
    }
  }

});











