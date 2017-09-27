'use strict';
/* global angular */

angular.module('carbonkey').config(function($stateProvider, $urlRouterProvider) {
  
  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "views/side-menu.html",
      controller : "AppController"
    })
    .state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "views/home.html",
          controller : "CarbonKeyController"
        }
      }
    })
    .state('app.scanner', {
      url: "/scanner",
      views: {
        'menuContent' :{
          templateUrl: "views/scanner.html",
          controller : "ScannerController"
        }
      }
    })
    .state('app.backup', {
      url: "/backup",
      views: {
        'menuContent' :{
          templateUrl: "views/backup.html",
          controller : "BackupController"
        }
      }
    })
    .state('app.restore', {
      url: "/restore",
      views: {
        'menuContent' :{
          templateUrl: "views/restore.html",
          controller : "RestoreController"
        }
      }
    })
    .state('app.privacy', {
      url: "/privacy",
      views: {
        'menuContent' :{
          templateUrl: "views/privacy.html",
          controller : "RestoreController"
        }
      }
    })

  $urlRouterProvider.otherwise('app/home')

  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'views/home.html'
  })
})