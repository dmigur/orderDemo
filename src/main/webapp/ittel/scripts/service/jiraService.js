/**
 * Created by dmitrigu on 28.06.18.
 */
ittelApp.factory('jiraService', function ($resource, $http, $q) {

    console.log("jiraService.js");

    var service = {};

    var urls = {
        authenticate: "api/jira/auth",
        createTicket: "api/jira/create"
    };

    service.authenticate = function (data) {
        var defer = $q.defer();
        var url = urls.authenticate;

        var response = $http({
            method: "post",
            url: url,
            data: {
                username: data.username,
                password: data.password
            },
            cache: false
        });

        response.success(function (responce) {
            defer.resolve(responce);
        }).error(function (responce) {
            defer.reject(responce);
        });

        return defer.promise;
    };

    service.createTicket = function (data) {

        var url = urls.createTicket;
        var defer = $q.defer();
        var response = $http({
            method: "post",
            url: url,
            data: {
                fields:{
                    project:   {
                        key: data.key
                    },
                    summary: data.summary,
                    description: data.description,
                    issuetype:  {
                        name: data.name
                    },
                    priority:  {
                        name: data.priority
                    }

                },
                managers: data.managers
            },
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
