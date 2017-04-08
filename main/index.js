/* eslint no-alert: 0 */

'use strict';

//
// Here is how to define your module
// has dependent on mobile-angular-ui
//
var app = angular.module('MobileAngularUiExamples', [
  'ngRoute',
  'mobile-angular-ui',

  // touch/drag feature: this is from 'mobile-angular-ui.gestures.js'.
  // This is intended to provide a flexible, integrated and and
  // easy to use alternative to other 3rd party libs like hammer.js, with the
  // final pourpose to integrate gestures into default ui interactions like
  // opening sidebars, turning switches on/off ..
  'mobile-angular-ui.gestures'
]);

app.run(function($transform) {
  window.$transform = $transform;
});

//
// You can configure ngRoute as always, but to take advantage of SharedState location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch: false'
// in order to avoid unwanted routing.
//
app.config(function($routeProvider) {
  $routeProvider.when('/', {templateUrl: 'home.html', reloadOnSearch: false});
  $routeProvider.when('/scroll', {templateUrl: 'scroll.html', reloadOnSearch: false});
  $routeProvider.when('/toggle', {templateUrl: 'toggle.html', reloadOnSearch: false});
  $routeProvider.when('/tabs', {templateUrl: 'tabs.html', reloadOnSearch: false});
  $routeProvider.when('/accordion', {templateUrl: 'accordion.html', reloadOnSearch: false});
  $routeProvider.when('/overlay', {templateUrl: 'overlay.html', reloadOnSearch: false});
  $routeProvider.when('/forms', {templateUrl: 'forms.html', reloadOnSearch: false});
  $routeProvider.when('/dropdown', {templateUrl: 'dropdown.html', reloadOnSearch: false});
  $routeProvider.when('/touch', {templateUrl: 'touch.html', reloadOnSearch: false});
  $routeProvider.when('/swipe', {templateUrl: 'swipe.html', reloadOnSearch: false});
  $routeProvider.when('/drag', {templateUrl: 'drag.html', reloadOnSearch: false});
  $routeProvider.when('/drag2', {templateUrl: 'drag2.html', reloadOnSearch: false});
  $routeProvider.when('/carousel', {templateUrl: 'carousel.html', reloadOnSearch: false});
  //配置模块页面
  $routeProvider.when('/travelrecord', {templateUrl: 'mainpage/travelrecord.html', reloadOnSearch: false});
  $routeProvider.when('/destinationinfo', {templateUrl: 'mainpage/destinationinfo.html', reloadOnSearch: false});
  $routeProvider.when('/missionlist', {templateUrl: 'mainpage/missionlist.html', reloadOnSearch: false});
  $routeProvider.when('/visitorlist', {templateUrl: 'mainpage/visitorlist.html', reloadOnSearch: false});
  $routeProvider.when('/weatherdetail', {templateUrl: 'mainpage/weatherdetail.html', reloadOnSearch: false});
});

//
// `$touch example`
//

app.directive('toucharea', ['$touch', function($touch) {
  // Runs during compile
  return {
    restrict: 'C',
    link: function($scope, elem) {
      $scope.touch = null;
      $touch.bind(elem, {
        start: function(touch) {
          $scope.containerRect = elem[0].getBoundingClientRect();
          $scope.touch = touch;
          $scope.$apply();
        },

        cancel: function(touch) {
          $scope.touch = touch;
          $scope.$apply();
        },

        move: function(touch) {
          $scope.touch = touch;
          $scope.$apply();
        },

        end: function(touch) {
          $scope.touch = touch;
          $scope.$apply();
        }
      });
    }
  };
}]);

//
// `$drag` example: drag to dismiss
//
app.directive('dragToDismiss', function($drag, $parse, $timeout) {
  return {
    restrict: 'A',
    compile: function(elem, attrs) {
      var dismissFn = $parse(attrs.dragToDismiss);
      return function(scope, elem) {
        var dismiss = false;

        $drag.bind(elem, {
          transform: $drag.TRANSLATE_RIGHT,
          move: function(drag) {
            if (drag.distanceX >= drag.rect.width / 4) {
              dismiss = true;
              elem.addClass('dismiss');
            } else {
              dismiss = false;
              elem.removeClass('dismiss');
            }
          },
          cancel: function() {
            elem.removeClass('dismiss');
          },
          end: function(drag) {
            if (dismiss) {
              elem.addClass('dismitted');
              $timeout(function() {
                scope.$apply(function() {
                  dismissFn(scope);
                });
              }, 300);
            } else {
              drag.reset();
            }
          }
        });
      };
    }
  };
});

//
// Another `$drag` usage example: this is how you could create
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function() {
  return {
    restrict: 'C',
    scope: {},
    controller: function() {
      this.itemCount = 0;
      this.activeItem = null;

      this.addItem = function() {
        var newId = this.itemCount++;
        this.activeItem = this.itemCount === 1 ? newId : this.activeItem;
        return newId;
      };

      this.next = function() {
        this.activeItem = this.activeItem || 0;
        this.activeItem = this.activeItem === this.itemCount - 1 ? 0 : this.activeItem + 1;
      };

      this.prev = function() {
        this.activeItem = this.activeItem || 0;
        this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
      };
    }
  };
});

app.directive('carouselItem', function($drag) {
  return {
    restrict: 'C',
    require: '^carousel',
    scope: {},
    transclude: true,
    template: '<div class="item"><div ng-transclude></div></div>',
    link: function(scope, elem, attrs, carousel) {
      scope.carousel = carousel;
      var id = carousel.addItem();

      var zIndex = function() {
        var res = 0;
        if (id === carousel.activeItem) {
          res = 2000;
        } else if (carousel.activeItem < id) {
          res = 2000 - (id - carousel.activeItem);
        } else {
          res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
        }
        return res;
      };

      scope.$watch(function() {
        return carousel.activeItem;
      }, function() {
        elem[0].style.zIndex = zIndex();
      });

      $drag.bind(elem, {
        //
        // This is an example of custom transform function
        //
        transform: function(element, transform, touch) {
          //
          // use translate both as basis for the new transform:
          //
          var t = $drag.TRANSLATE_BOTH(element, transform, touch);

          //
          // Add rotation:
          //
          var Dx = touch.distanceX;
          var t0 = touch.startTransform;
          var sign = Dx < 0 ? -1 : 1;
          var angle = sign * Math.min((Math.abs(Dx) / 700) * 30, 30);

          t.rotateZ = angle + (Math.round(t0.rotateZ));

          return t;
        },
        move: function(drag) {
          if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
            elem.addClass('dismiss');
          } else {
            elem.removeClass('dismiss');
          }
        },
        cancel: function() {
          elem.removeClass('dismiss');
        },
        end: function(drag) {
          elem.removeClass('dismiss');
          if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
            scope.$apply(function() {
              carousel.next();
            });
          }
          drag.reset();
        }
      });
    }
  };
});

app.directive('dragMe', ['$drag', function($drag) {
  return {
    controller: function($scope, $element) {
      $drag.bind($element,
        {
          //
          // Here you can see how to limit movement
          // to an element
          //
          transform: $drag.TRANSLATE_INSIDE($element.parent()),
          end: function(drag) {
            // go back to initial position
            drag.reset();
          }
        },
        { // release touch when movement is outside bounduaries
          sensitiveArea: $element.parent()
        }
      );
    }
  };
}]);

//
// 使用一个控制器控制所有的作用域，待后续改正为模块形式
//
app.controller('MainController', function($rootScope, $scope , $http) {

  $scope.swiped = function(direction) {
    alert('Swiped ' + direction);
  };

  // User agent displayed in home page
  $scope.userAgent = navigator.userAgent;

  // Needed for the loading screen
  $rootScope.$on('$routeChangeStart', function() {
    $rootScope.loading = true;
  });

  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.loading = false;
  });

  // Fake text i used here and there.
  $scope.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. ' +
    'Vel explicabo, aliquid eaque soluta nihil eligendi adipisci error, illum ' +
    'corrupti nam fuga omnis quod quaerat mollitia expedita impedit dolores ipsam. Obcaecati.';

  //
  // 'Scroll' screen
  //
  var scrollItems = [];

  for (var i = 1; i <= 100; i++) {
    scrollItems.push('Item ' + i);
  }

  $scope.scrollItems = scrollItems;

  var homePageItems = [
            {icon : 'briefcase', message : '我的行程记录', nodeid : '0' , href : '#/travelrecord'},
            {icon : 'location', message :'目的地信息' , nodeid : '1', href : '#/destinationinfo'},
            //{icon : 'information' , message : '关于杭州' , nodeid : '2', href : '#/tabs'},
            {icon : 'pricetags' ,message : '我的访客', nodeid : '3', href : '#/visitorlist'} ,
            {icon :'calendar' ,message : '我的日程安排' , nodeid : '4', href : '#/missionlist'} ,
            {icon : 'pricetags' ,message : '我的相册', nodeid : '5', href : '#/carousel'}]

  $scope.homePageItems= homePageItems ;

  $scope.bottomReached = function() {
    alert('Congrats you scrolled to the end of the list!');
  };

  //
  // 右边栏
  //
  $scope.chatUsers = [
    {name: 'Carlos  Flowers', online: true},
    {name: 'Byron Taylor', online: false},
    {name: 'Jana  Terry', online: true},
    {name: 'Darryl  Stone', online: false},
    {name: 'Fannie  Carlson', online: true},
    {name: 'Holly Nguyen', online: false},
    {name: 'Bill  Chavez', online: true}
  ];

  //
  // 'Forms' screen
  //
  $scope.rememberMe = true;
  $scope.email = 'me@example.com';

  $scope.login = function() {
    alert('You submitted the login form');
  };

  //
  // 'Drag' screen
  //
  $scope.notices = [];

  for (var j = 0; j < 10; j++) {
    $scope.notices.push({icon: 'envelope', message: 'Notice ' + (j + 1)});
  }

  $scope.deleteNotice = function(notice) {
    var index = $scope.notices.indexOf(notice);
    if (index > -1) {
      $scope.notices.splice(index, 1);
    }
  };

  /***
   * my function
   */
   $scope.testaaa = function(msg , id){
    switch(parseInt(id)){
      case 0 : console.log("0:",msg) ;
          break ;
      case 1 : console.log("1",msg) ;
          break ;
      case 2 : console.log("2",msg) ;
          break ;
      case 3 : console.log("3",msg) ;
          break ;
      case 4 : console.log("4",msg) ;
          break ;
    }
    //return false ;
   }

 /***
  *获取当前地区天气数据
  */
  !(function(){
    $http({
      method: 'JSONP',
      url: 'http://weather.gtimg.cn/city/01013401.js?ref=qqnews',
      headers:{
          'Content-Type' : 'application/json;charset=UTF-8'
      }
    }).then(function successCallback(response) {
        // 请求成功执行代码
      }, function errorCallback(response) {
        //请求失败时的执行代码块
        console.log("this is weatherDetail ...") ;
    });
  })() ;

 /***
  *具体业务环境需要修改url中具体的js文本,现在拿杭州做测试
  */
  $scope.weatherDetail = function(){
    location = "#/weatherdetail" ;
    console.log("this is location test ...") ;
  }
});
