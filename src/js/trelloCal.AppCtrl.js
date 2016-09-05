'use strict';
angular.module('trelloCal').controller('AppCtrl', function ($scope, $rootScope, $http, $log, ngProgress, initService, $mdSidenav, webStorage) {

        window.Offline.options = {
            checks: {xhr: {url: '/'}},
            checkOnLoad: false,
            interceptRequests: false,
            reconnect: false,
            requests: true,
            game: false
        };


        window.addEventListener('offline', function () {
            window.Offline.on('down', function () {
                console.debug('Trello Calendar is offline now.');
                $scope.offline = true;
                $scope.toolbar = {'background-color': '#B04632'};
                $scope.$apply();

            });

        });
        window.addEventListener('online', function () {
            window.Offline.on('up', function () {
                console.debug('Trello Calendar is online now.');

                $scope.toolbar = {'background-color': '#42548E'};
                $scope.offline = false;
                $rootScope.$broadcast('updateChange');
                initService.refreshAll();

            });

        });


        function toggleRight() {
            $mdSidenav('right').toggle().then(function () {
                $scope.keepOpen = !$scope.keepOpen;
                if ($scope.keepOpen) {
                    angular.element('md-backdrop.md-sidenav-backdrop-custom').removeClass('disabled');
                }
                else {
                    angular.element('md-backdrop.md-sidenav-backdrop-custom').addClass('disabled');
                }
            });
        }

        if (webStorage.has('TrelloCalendarStorage')) {


            ngProgress.color('#CF513D');
            $rootScope.$on('$stateChangeSuccess', function () {
                ngProgress.complete();
            });
            $rootScope.$on('$stateChangeStart', function () {
                ngProgress.start();
            });

            $scope.keyHandler = function (e) {
                var event = window.event ? window.event : e;
                if (event.keyCode === 114) {
                    console.log('reload');
                    $rootScope.$broadcast('reload');
                }
            };

            $rootScope.$on('reload', function () {
                ngProgress.start();
                initService.refresh().then(function () {
                    ngProgress.complete();
                });
            });
            $scope.keepOpen = false;

            $scope.toggleRight = toggleRight;

            $scope.checkClosingForm = function () {
                if (true) {
                    toggleRight();
                }
            };
        }


        $scope.drop = function (item) {
            console.log('item: ', item.id);
            //console.log('item: ',);
            console.log(document.getElementById(item.id + '-12,0,0').parentNode.parentNode.id);
        };

    }
)
    .controller('welcomeCtrl', function (CalService, $scope, $mdDialog) {
        var today = {};
        today.year = new Date().getFullYear();
        today.month = new Date().getMonth();
        $scope.date = {
            iso: new Date(),
            monthName: moment.months()[today.month],
            month: today.month,
            year: today.year
        };

        /**top legende**/
        $scope.weekdays = [];
        for (var i = 0; i <= 6; i++) {
            var long = moment().weekday(i).format('dddd');
            var short = moment().weekday(i).format('dd');
            $scope.weekdays[i] = [short, long];
        }


        $scope.days = CalService.build(today).days;


        function showAdvanced(ev) {
            var useFullScreen = false;

            $mdDialog.show({
                    templateUrl: 'dialog1.tmpl.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    escapeToClose: false,
                    fullscreen: useFullScreen

                })
                .then(function (answer) {
                    $scope.status = 'You said the information was "' + answer + '".';
                }, function () {
                    $scope.status = 'You cancelled the dialog.';
                });


        }

        showAdvanced();
    });
