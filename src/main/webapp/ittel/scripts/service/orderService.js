ittelApp.factory('orderService', function ($resource, $http, $q) {

    console.log("orderService.js");

    var service = {};

    var urls = {
        getItemRecords: "api/items",
    };


    service.getItems = function () {
        console.log("getitems..,");
        var url = urls.getItemRecords;
        var defer = $q.defer();

        var response = $http({
            method: "get",
            url: url,
            cache: false
        });

        response.success(function (responce) {
            defer.resolve(responce);
        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };

 return service;
});