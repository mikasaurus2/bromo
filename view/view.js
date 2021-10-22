/*
 * Angular module is a collection of functions that are run when the application
 * is booted.
 *
 */

var app = angular.module('viewPage', ['pageslide-directive',
                                      'modalDialog-directive',
                                      'popoverDialog-directive']);


/* Create a controller here to set up a $scope that the view can access (inside the
 * DOM element). Now we can access this object in any child element of the div
 * where this controller is declared.
 *
 * This is the controller for the pagesliding functionality of the playlist
 * and search panel.
 */
app.controller('pageslideController', function($scope) {

  $scope.checked = false;

  $scope.toggle = function toggle() {
    $scope.checked = !$scope.checked;
  };

});


/* This is the controller for the playlist management functionality
 */
app.controller('playlistManagementController', function($scope, $http) {
  var svcUrl = 'http://localhost:3000';

  var plManageModel = {
    resultPanelInfo: { header: '', infoObj: {} },
    searchResultView: false,
    playlistResultView: false,

    playlists: [],
    selectedPlaylist: -1,
    playlistPlayitems: [],

    searchString: '',
    searchResults: [],
  };

  $scope.plManageModel = plManageModel;

  $scope.$watch('plManageModel.searchString', limitTextFactory(plManageModel, 'searchString', 150));

  //  NB: The http response object has these properties:
  //  data – {string|Object} – The response body transformed with the transform functions.
  //  status – {number} – HTTP status code of the response.
  //  headers – {function([headerName])} – Header getter function.
  //  config – {Object} – The configuration object that was used to generate the request.
  //  statusText – {string} – HTTP status text of the response.

  $scope.listPlaylists = function listPlaylists() {
    console.log('Listing playlists');

    $http({
      method: 'POST',
      url: svcUrl + '/api/listPlaylists'
    }).then(listPlaylistsSuccess, listPlaylistsFail);

    function listPlaylistsSuccess(response) {
      if (response.data) {
        if (response.status === 200) {
          console.log('List playlists successful!');
          plManageModel.playlists = response.data;
        }
      }
    }

    function listPlaylistsFail(response) {
      console.log('List playlists error: ' + response.status + ' ' + response.data);
      if (response.data.error) {
        // TODO: display this error somewhere?
      }
    }

  };

  $scope.setActivePlaylist = function setActivePlaylist(playlist) {
    if (!playlist) {
      return;
    }

    $http({
      method: 'POST',
      url: svcUrl + '/api/setActivePlaylist',
      data: {
        id: playlist._id
      }
    }).then(setActiveSuccess, setActiveFailed);

    function setActiveSuccess(response) {
      if (response.data) {
        if (response.status === 200) {
          console.log('Set active playlist successful!');

          // update our models
          plManageModel.playlists.forEach(function updateActivePlaylistModel(element) {
            if (element._id == playlist._id) {
              element.active = true;
            } else {
              element.active = false;
            }
          });
        } else {
          console.log('Set active playlist failed!');
        }
      }
    }

    function setActiveFailed(response) {
      console.log('Set active playlist error: ' + response.status + ' ' + response.data);
    }

  };

  $scope.addToPlaylistsModel = function addToPlaylistsModel(playlist) {
    // Assuming the RPC to add the playlist server side succeeded,
    // we can add the playlist name to our model.
    plManageModel.playlists.push(playlist);
  };

  $scope.removeFromPlaylistsModel = function removeFromPlaylistsModel(playlistId) {
    // filter out the playlist with the ID we just removed
    plManageModel.playlists = plManageModel.playlists.filter(function filterById(playlist) {
      if (playlist._id == playlistId) {
        return false;
      } else {
        return true;
      }
    });
  };

  $scope.playlistSelected = function playlistSelected($index) {
    // Assign our selectedPlaylist index, so that the one playlist
    // that was clicked will be hilighted.
    plManageModel.selectedPlaylist = $index;

    var playlist = plManageModel.playlists[$index];

    if (playlist) {
      // hide any other result views and show the playlist playitems
      showPlaylistView(playlist);

      // list the playlist's playitems in the result pain
    } else {
      console.log('Could not index into playlist array');
    }
  };

  $scope.addPlayitemToPlaylistSelected = function addPlayitemToPlaylistSelected($index, playitem) {
    // we're adding a playlist item to the playlist indicated by index
    var playlist = plManageModel.playlists[$index];

    if (playlist) {
      console.log('adding playitem [%s] to playlist [%s:%s]', playitem.title, playlist.name, playlist._id);

      $http({
        method: 'POST',
        url: svcUrl + '/api/addPlayitem',
        data: {
          itemId: playitem.itemId,
          title: playitem.title,
          thumbnail: playitem.thumbnail,
          embed: playitem.player.embedHtml,
          duration: playitem.duration.str,
          playlistId: playlist._id
        }
      }).then(addPlayitemSuccess, addPlayitemFail);
    } else {
      console.log('Could not index into playlist array');
    }

    function addPlayitemSuccess(response) {
      if (response.data) {
        if (response.status === 200) {
          console.log('Add playitem successful!');
          // add playitem to our playlist model
          addPlayitemToPlaylistModel(response.data.playlistId, response.data.playitem);
        } else {
          console.log('Add playitem failed!');
        }
      }

      function addPlayitemToPlaylistModel(playlistId, playitem) {
        // find the playlist we're adding to (by ID)
        var playlistModel = plManageModel.playlists.find(function(element) {
          if (element._id === playlistId) {
            return true;
          }
        });

        // add playitem
        if (playlistModel) {
          playlistModel.playitems.push(playitem);
        }

        // close the popover
        $scope.toggleAddToPlaylistModal();
      }
    }

    function addPlayitemFail(response) {
      console.log('Add playitem error: ' + response.status + ' ' + response.data);
    }
  };

  $scope.deletePlayitem = function deletePlayitem(playitem, playlist) {
    console.log('Deleting playitem [%s] to playlist [%s:%s]', playitem.title, playlist.name, playlist._id);
    var playlistModel;
    var playitemId;

    // we're deleting a playlist item from the playlist
    if (playlist && playitem) {
      playlistModel = playlist;
      playitemId = playitem._id;

      $http({
        method: 'POST',
        url: svcUrl + '/api/removePlayitem',
        data: {
          playlistId: playlist._id,
          id: playitem._id
        }
      }).then(deletePlayitemSuccess, deletePlayitemFail);
    } else {
      console.log('No playlist specified for deleting playitem');
    }

    function deletePlayitemSuccess(response) {
      if (response.data) {
        if (response.status === 200) {
          console.log('Delete playitem successful!');
          // delete playitem from our playlist model
          deletePlayitemFromPlaylistModel(playitemId, playlistModel);
        } else {
          console.log('Delete playitem failed!');
        }
      }

      function deletePlayitemFromPlaylistModel(playitemId, playlistModel) {
        // find the playitem in the playlist and remove it
        var playitemIndex = playlistModel.playitems.findIndex(function(element) {
          if (element._id === playitemId) {
            return true;
          }
        });

        if (playitemIndex != -1) {
          playlistModel.playitems.splice(playitemIndex, 1);
        }
      }
    }

    function deletePlayitemFail(response) {
      console.log('Delete playitem error: ' + response.status + ' ' + response.data);
    }
  };


  $scope.doSearch = function doSearch(keyEvent) {
    // if user hits enter (key 13); do the search
    if (keyEvent.which === 13) {
      console.log('Searching for: %s', plManageModel.searchString);

      $http({
        method: 'POST',
        url: svcUrl + '/api/searchYoutube',
        data: {
          searchString: plManageModel.searchString
        }
      }).then(searchSuccess, searchFail);
    }

    function searchSuccess(response) {
      if (response.data) {
        if (response.status === 200) {
          console.log('Search successful!');

          // lets iterate through and create a more presentable duration time string
          response.data.forEach(function(item) {
            if (!item.duration) {
              return;
            }
            var duration = item.duration;
            var h = duration.h;
            var m = duration.m;
            var s = duration.s;

            // trick to pad 0's in front of single digit numbers
            // don't pad hours
            // only pad minutes if we have hours
            if (h) {
              duration.m = ('00' + m).slice(-2);
            }
            // always pad seconds
            duration.s = ('00' + s).slice(-2);

            duration.str = composeString();

            function composeString() {
              var timeString = duration.h ? (duration.h + ':') : '';
              timeString = timeString + duration.m + ':' + duration.s;
              return timeString;
            }
          });

          // hide any other result views and show the search results
          showSearchView();

          // assign results to scope model
          plManageModel.searchResults = response.data;

        } else {
          console.log('Search failed!');
        }
      }
    }

    function searchFail(response) {
      console.log('Search error: ' + response.status + ' ' + response.data);
      if (response.data.error) {
        /* TODO: display this error somewhere
        var errMsg = response.data.error.msg;
        $scope.msgstr = viewErrors[errMsg] ? viewErrors[errMsg] : response.data.error.msgdesc;
        $('.authMsg').addClass('authErr');
        */
      }
    }
  };

  $scope.searchClicked = function searchClicked() {
    // the user clicked on the search bar
    showSearchView();
  };


  function showSearchView() {
    plManageModel.searchResultView = true;
    plManageModel.playlistResultView = false;
    plManageModel.resultPanelInfo.header = 'Search Results';
  }

  function showPlaylistView(playlist) {
    plManageModel.searchResultView = false;
    plManageModel.playlistResultView = true;
    plManageModel.resultPanelInfo.header = playlist.name;
    plManageModel.resultPanelInfo.infoObj = playlist;
    plManageModel.playlistPlayitems = playlist.playitems;
  }

  // Stuff that runs immediately
  // MIKETODO: We may want to show a loading image while these calls complete.

  // Call listPlaylists right away, so we can load up our playlist cache.
  // We don't want to call it every time they open the search panel as
  // that would unecessarily hit our server a lot. We're binding it
  // to $scope for now because we may want a refresh button later.
  $scope.listPlaylists();

});


/*
 * This is the controller for creating a playlist.
 */
app.controller('createPlaylistController', function($scope, $http) {
  var svcUrl = 'http://localhost:3000';

  $scope.msgstr = '';
  $scope.playlistName = '';
  $scope.$watch('playlistName', limitTextFactory($scope, 'playlistName', 25));

  $scope.addPlaylist = function addPlaylist(playlistName) {
    $http({
      method: 'POST',
      url: svcUrl + '/api/addPlaylist',
      data: {
        name: playlistName
      }
    }).then(addPlaylistSuccess, addPlaylistFailed);

    function addPlaylistSuccess(response) {
      if (response.data) {
        if (response.status === 200) {
          console.log('Add playlist successful!');

          // call back to parent scope so we can update our playlists model
          // with the newly added playlist
          $scope.addToPlaylistsModel(response.data);

          // call back to parent to close modal popup
          $scope.msgstr = '';
          $scope.playlistName = '';
          $scope.toggleCreatePlaylistModal();
        } else {
          console.log('Add playlist failed!');
        }
      }
    }

    function addPlaylistFailed(response) {
      console.log('Add playlist error: ' + response.status + ' ' + response.data);
      if (response.data.error) {
        var errMsg = response.data.error.msg;
        if (errMsg === 'errLimitReached') {
          $scope.msgstr = viewErrors['errMaxPlaylists'];
        } else if (errMsg === 'errDupEntity') {
          $scope.msgstr = viewErrors['errDupPlaylists'];
        } else {
          $scope.msgstr = viewErrors[errMsg] ? viewErrors[errMsg] : response.data.error.msgdesc;
        }
        $('.modalMsg').addClass('modalErr');
      }
    }
  };

  $scope.cancelCreation = function cancelCreation() {
    // user is canceling creation; clear msg string and hide the modal
    $scope.msgstr = '';
    $scope.playlistName = '';
    $scope.toggleCreatePlaylistModal();
  };

});


/*
 * This is the controller for deleting a playlist.
 */
app.controller('deletePlaylistController', function($scope, $http) {
  var svcUrl = 'http://localhost:3000';

  $scope.msgstr = '';
  $scope.bodystr = 'You\'re about to delete a playlist. This will remove all the entries you\'ve added.';

  $scope.deletePlaylist = function deletePlaylist() {
    var deleteId = $scope.deleteId;

    $http({
      method: 'POST',
      url: svcUrl + '/api/removePlaylist',
      data: {
        id: deleteId
      }
    }).then(deletePlaylistSuccess, deletePlaylistFailed);

    function deletePlaylistSuccess(response) {
      if (response.data) {
        if (response.status === 200) {
          console.log('Delete playlist successful!');
          // call back to parent scope so we can update our playlists model
          // by removing the deleted playlist
          $scope.removeFromPlaylistsModel(deleteId);

          // call back to parent to close modal popup
          $scope.msgstr = '';
          $scope.toggleDeletePlaylistModal();
        } else {
          console.log('Delete playlist failed!');
        }
      }
    }

    function deletePlaylistFailed(response) {
      console.log('Delete playlist error: ' + response.status + ' ' + response.data);
      if (response.data.error) {
        var errMsg = response.data.error.msg;
        if (errMsg === 'errServer') {
          $scope.msgstr = viewErrors['errServer'];
        } else if (errMsg === 'errNoUser') {
          $scope.msgstr = viewErrors['errServer'];
        } else if (errMsg === 'errNoEntity') {
          $scope.msgstr = viewErrors['errServer'];
        } else {
          $scope.msgstr = viewErrors[errMsg] ? viewErrors[errMsg] : response.data.error.msgdesc;
        }
        $('.modalMsg').addClass('modalErr');
      }
    }
  };

  $scope.cancelDeletion = function cancelDeletion() {
    // user is canceling deletion; clear msg string and hide the modal
    $scope.msgstr = '';
    $scope.toggleDeletePlaylistModal();
  };

});


/*
 * This is the controller for the modal dialog box that pops up
 * when creating a new playlist.
 */
app.controller('modalPopupController', function($scope) {
  $scope.createPlaylistShown = { value: false };
  $scope.toggleCreatePlaylistModal = function toggleCreatePlaylistModal() {
    $scope.createPlaylistShown.value = !$scope.createPlaylistShown.value;
  };

  $scope.deletePlaylistShown = { value: false };
  $scope.toggleDeletePlaylistModal = function toggleDeletePlaylistModal(infoObj) {
    // We pass infoObj (playlist) when we toggle on, so we have a playlist ID to
    // use for deletion. When we toggle off, we don't pass an infoObj.
    if (infoObj) {
      $scope.deleteId = infoObj._id;
    } else {
      $scope.deleteId = '';
    }
    $scope.deletePlaylistShown.value = !$scope.deletePlaylistShown.value;
  };
});


/*
 * This is the controller for the popover dialog box that pops up
 * when adding a playitem to a playlist.
 */
app.controller('popoverController', function($scope) {
  $scope.addToPlaylistOptions = { show: false, x: 0, y: 0 };
  $scope.toggleAddToPlaylistModal = function toggleAddToPlaylistModal(event, playitem) {
    if (event) {
      // clientX and clientY are the pixel point on the viewport where the click
      // occurred. The offset is how far off we are from the element from
      // which the event occurred. We use the offset to align our popover's
      // top left corner with the clicked element's top left corner.
      $scope.addToPlaylistOptions.x = event.clientX - event.offsetX;
      $scope.addToPlaylistOptions.y = event.clientY - event.offsetY;
    }
    if (playitem) {
      // this is the playitem the user is trying to add
      $scope.playitem = playitem;
    }
    $scope.addToPlaylistOptions.show = !$scope.addToPlaylistOptions.show;
  };
});


function limitTextFactory(scope, field, length) {
  // Here, we get the scope object and the field we want to access in it.
  // Since this is a factory function, we save the parameter scope into
  // a local variable so the returned function can have access to it
  // via closure. The field parameter lets us use this function more
  // generically.
  var curScope = scope;
  return  function (newVal, oldVal) {
    var limit = length;
    if (!newVal) {
      return;
    }
    if (newVal.length > limit) {
      curScope[field] = oldVal;
    } else {
      curScope[field] = newVal;
    }
  }
}


