'use strict';
/* global angular */
angular.module('carbonkey.services').value('isDevice',  (document.location.protocol == "file:"));
