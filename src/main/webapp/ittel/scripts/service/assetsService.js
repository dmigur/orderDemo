ittelApp.factory('assetsService', function ($resource, $http, $q) {

    console.log("assetsService.js");

    var service = {};

    var urls = {
        getItemRecords: "api/items",
        getTypeRecords: "api/types",
        getTypeItems: "api/items",
        createTypeRecord: "api/createtype",
        createItemRecord: "api/createitem",
        getSettings: "api/settings",
        deleteItemRecord: "api/deleteitem",
        deleteTypeRecord: "api/deletetype",
        updateTypeRecord: "api/updatetype",
        updateItemRecord: "api/updateitem",
        getAuthUser: "api/authuser"
    };

    service.getTypes= function () {
        var url = urls.getTypeRecords;
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

    service.getTypeItems = function (id) {
        var url = urls.getTypeItems + "/"+ id;
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

    service.getItems = function () {
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

    service.getSettings = function () {
        var url = urls.getSettings;
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


    service.createItem = function (dt) {

        var url = urls.createItemRecord;
        //console.log("dns= " + dbsData)

        var defer = $q.defer();
        var dnsData = dt;
        //dnsData.name = punycode.ToASCII(dnsData.name);

        var response = $http({
            url: url,
            cache: false,
            method: "post",
            data: dnsData
        });

        response.success(function (responce) {
            defer.resolve(responce);
        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };


    service.createType = function (dt) {

        var url = urls.createTypeRecord;
        //console.log("dns= " + dbsData)
        var defer = $q.defer();
        var data = dt;
        //dnsData.name = punycode.ToASCII(dnsData.name);

        var response = $http({
            url: url,
            cache: false,
            method: "post",
            data: data
        });

        response.success(function (responce) {
            defer.resolve(responce);
        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };



    service.deleteItem = function (record) {
        var url = urls.deleteItemRecord;
        console.log("dns= " + record)

        var defer = $q.defer();
        var response = $http({
            url: url,
            cache: false,
            method: "post",
            data: {
                id: record.storageId,
                name: record.name
            }
        });

        response.success(function (responce) {
            defer.resolve(responce);
        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };

    service.deleteType = function (record) {
        var url = urls.deleteTypeRecord;
        console.log("type= " + record)

        var defer = $q.defer();
        var response = $http({
            url: url,
            cache: false,
            method: "post",
            data: {
                id: record.storageId,
                name: record.name
            }
        });

        response.success(function (responce) {
            defer.resolve(responce);
        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };

    service.updateType = function (record) {
        var url = urls.updateTypeRecord;
        console.log("update type " + record)

        var defer = $q.defer();
        var response = $http({
            url: url,
            cache: false,
            method: "post",
            data: record
        });

        response.success(function (responce) {
            defer.resolve(responce);

        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };

    service.updateItem = function (record) {
        var url = urls.updateItemRecord;
        console.log("update item " + record)

        var defer = $q.defer();
        var response = $http({
            url: url,
            cache: false,
            method: "post",
            data: record
        });

        response.success(function (responce) {
            defer.resolve(responce);

        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };

    service.updateAll = function () {
        var url = urls.updateAll;
        console.log("updating all " )

        var defer = $q.defer();
        var response = $http({
            url: url,
            cache: false,
            method: "get"
        });

        response.success(function (responce) {
            defer.resolve(responce);
        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };

    service.getAuthUser = function () {
        var url = urls.getAuthUser;
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