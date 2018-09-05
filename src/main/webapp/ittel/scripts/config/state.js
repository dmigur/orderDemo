'use strict';

ittelApp.config(function (constants, $stateProvider, $urlRouterProvider) {

	var availableState = constants.availableState;
	$stateProvider
		.state(availableState.workspace.name, {
			url: availableState.workspace.url,
			views: {
				'': {
					templateUrl: 'views/workspace/ittellimus.html',
					controller: 'mainController'
				},
				'header@workspace': {
					templateUrl: 'views/components/header.html',
					controller: 'headerController'
				}
			}
		});
	$urlRouterProvider.otherwise(availableState.workspace.url);
});