'use strict';

console.log("application.js");

var ittelApp = angular.module('ittelApp', ['ngRoute', 'ui.router', 'ngResource']);

ittelApp.config(['$httpProvider', function ($httpProvider, $locationProvider) {

    $httpProvider.defaults.timeout = 500000000;

}]);

ittelApp.config(['$locationProvider',

    function ($locationProvider) {

        $locationProvider.hashPrefix('!');

    }
]);

ittelApp.directive('escKey', function () {

    return function (scope, element, attrs) {

        element.bind('keydown keypress', function (event) {

            if (event.which === 27) { // 27 = esc key

                scope.$apply(function () {

                    scope.$eval(attrs.escKey);
                    document.body.style.cursor = "auto";

                });

                event.preventDefault();
            }
        });
    };
})
    .directive('date', ['$filter', '$timeout', function ($filter, $timeout) {
        return {
            restrict: 'A',
            require: '?^ngModel',
            link: function ($scope, $element, $attrs, ngModel) {
                var format = $attrs.dateFormat || 'short', // default date format
                    validityName = 'date'; // change the name to whatever you want to use to check errors

                // called by the directive to render the first time, and also on events when the value is changed
                var formatter = function () {
                    var date = ngModel.$modelValue ?
                        $filter('date')(ngModel.$modelValue, format) :
                        ngModel.$viewValue;

                    $element.val(date);
                };

                // parse the value when it is being set from the view to the model

                ngModel.$parsers.unshift(function (value) {
                    //  you may wish to use a more advanced date parsing module for better results
                    var date = new Date(value);

                    if (isNaN(date)) {
                        // invalid date, flag invalid and return undefined so we don't set the model value
                        ngModel.$setValidity(validityName, false);
                        return undefined;
                    }

                    // clear invalid flag
                    ngModel.$setValidity(validityName, true);

                    return date.getTime();
                });


                // used by ngModel to display to render the directive initially; we'll just reformat
                ngModel.$render = formatter;
                var handle;

                // trigger the formatter on paste
                /*
                 $element.on('paste cut', function () {
                 if (handle) $timeout.cancel(handle);
                 handle = $timeout(formatter, 0); // needs to break out of the current context to work
                 })
                 // you can axe this whole event if you don't like the reformat after a pause
                 $element.on('keydown', function () {
                 if (handle) $timeout.cancel(handle);
                 handle = $timeout(formatter, 750);
                 })
                 // trigger the formatter on blur
                 $element.on('blur change', formatter);
                 */
            }
        };
    }])

    .directive('wrapper', function () {
        return {
            restrict: 'C',
            link: function (scope, elm, attrs) {
                console.log("applying layout");

                elm.layout({
                    applyDefaultStyles: true
                });
            }
        };
    }).directive('convertToNumber', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (val) {
                return val != null ? parseInt(val, 10) : null;
            });
            ngModel.$formatters.push(function (val) {
                return val != null ? '' + val : null;
            });
        }
    };
}).directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    });
;


