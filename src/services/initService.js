'use strict';
angular.module('trelloCal').factory('initService', /*ngInject*/  function ($q, ngProgress, webStorage, $http, $mdDialog, $rootScope, $window, baseUrl, AppKey, $websocket) {


        /**
         *Init variables
         */

        var key = AppKey;
        var token = webStorage.get('trello_token');
        var login, me, data, colors;
        login = $q.defer();

        var colorizeCards = true;
        var observer = false;
        var autorefresh = true;
        var version = '0.1.41';


    ////////////////////////////////////////////////////////
    var dataStream = $websocket('wss://api.trello.com/1/sessions/socket?token=' + token + '&key=' + key);
    dataStream.onMessage(function (message) {
        if (message.data === "") {
            dataStream.send("");
        }
        else {
            if (JSON.parse(message.data).notify !== undefined) {

                if (JSON.parse(message.data).notify.typeName === "Card") {
                    console.log("Card " + JSON.parse(message.data).notify.deltas[0].id + " changed!");
                }
                if (JSON.parse(message.data).notify.typeName === "List") {
                    console.log("List " + JSON.parse(message.data).notify.deltas[0].id + " changed!");
                }
                if (JSON.parse(message.data).notify.typeName === "Board") {
                    console.log("Board " + JSON.parse(message.data).notify.deltas[0].id + " changed!");
                }

            }

        }

    });
    dataStream.onOpenCallbacks = [];
    dataStream.send(JSON.stringify({"type": "ping", "reqid": 0}));
    dataStream.send(JSON.stringify({
        "type": "subscribe",
        "modelType": "Board",
        "idModel": "5630a65dd04e4ec9152d4231",
        "tags": ["clientActions", "updates"],
        "invitationTokens": [],
        "reqid": 2
    }));
    dataStream.send(JSON.stringify({
        "type": "subscribe",
        "modelType": "Member",
        "idModel": "55e5649901ff4ffe8236142a",
        "tags": ["messages", "updates"],
        "invitationTokens": [],
        "reqid": 1
    }));

    ////////////////////////////////////////////////////////


    /**
         *firstInit pulls the userinformation and board colors
         * fields: fullName, id  fields: color,id,...
         * */
        var firstInit = function () {
            ngProgress.start();
            var deferred = $q.defer();
            token = webStorage.get('trello_token');
            var TrelloCalendarStorage = webStorage.get('TrelloCalendarStorage');
            var cache = webStorage.get('TrelloCalendarStorage');
            me = $http.get('https://api.trello.com/1/members/me?fields=fullName&key=' + key + '&token=' + token);
            colors = $http.get('https://api.trello.com/1/members/me/boardBackgrounds?key=' + key + '&token=' + token);
            $q.all([me, colors]).then(function (responses) {

                TrelloCalendarStorage.me = responses[0].data;
                TrelloCalendarStorage.colors = {};
                for (var x in responses[1].data) {
                    if (responses[1].data[x].type === 'default') {
                        TrelloCalendarStorage.colors[responses[1].data[x].id] = responses[1].data[x];
                    }
                }

                if (cache.me) {
                    if (cache.me.observer === undefined) {
                        TrelloCalendarStorage.me.observer = observer;
                    }
                    else {
                        TrelloCalendarStorage.me.observer = cache.me.observer;
                    }
                    if (cache.me.colorizeCards === undefined) {
                        TrelloCalendarStorage.me.boardColors = colorizeCards;
                    }
                    else {
                        TrelloCalendarStorage.me.colorizeCards = cache.me.colorizeCards;
                    }
                    if (cache.me.version === undefined) {
                        TrelloCalendarStorage.me.version = version;
                    }
                    else {
                        TrelloCalendarStorage.me.version = cache.me.version;
                    }
                    if (cache.me.autorefresh === undefined) {
                        TrelloCalendarStorage.me.autorefresh = autorefresh;
                        console.log('refresh init ');

                    }
                    else {
                        TrelloCalendarStorage.me.autorefresh = cache.me.autorefresh;

                    }
                }
                else {
                    TrelloCalendarStorage.me.observer = observer;
                    TrelloCalendarStorage.me.colorizeCards = colorizeCards;
                    TrelloCalendarStorage.me.version = version;
                    TrelloCalendarStorage.me.autorefresh = autorefresh;
                }

                if (!TrelloCalendarStorage.boards) {
                    TrelloCalendarStorage.boards = {};
                }
                if (!TrelloCalendarStorage.cards) {
                    TrelloCalendarStorage.cards = {};
                }
                if (!TrelloCalendarStorage.cards.all) {
                    TrelloCalendarStorage.cards.all = {};
                }
                if (!TrelloCalendarStorage.cards.my) {
                    TrelloCalendarStorage.cards.my = {};
                }
                TrelloCalendarStorage.cards = {
                    'all': TrelloCalendarStorage.cards.all,
                    'my': TrelloCalendarStorage.cards.my
                };
                webStorage.set('TrelloCalendarStorage', TrelloCalendarStorage);
                ngProgress.complete();
                deferred.resolve('init');

            }, function () {
                deferred.reject('init error');
            });
            return deferred.promise;
        };
        /**
         *pullBoards pulls open Boards from Trello
         *fields: name, shortUrl, id, prefs {background,backgroundColor,...}
         * */
        var pullBoards = function () {
            var deferred = $q.defer();
            var TrelloCalendarStorage = webStorage.get('TrelloCalendarStorage');
            var temp = webStorage.get('TrelloCalendarStorage');

            $http.get('https://api.trello.com/1/members/me/boards/?fields=name,shortUrl,prefs,dateLastActivity&filter=open&key=' + key + '&token=' + token)
                .then(function (responses) {

                    _.forEach(responses.data, function (board) {
                        if (TrelloCalendarStorage.boards[board.id]) {
                            TrelloCalendarStorage.boards[board.id].name = board.name;
                            TrelloCalendarStorage.boards[board.id].shortUrl = board.shortUrl;
                            TrelloCalendarStorage.boards[board.id].id = board.id;
                            TrelloCalendarStorage.boards[board.id].prefs = board.prefs;
                            TrelloCalendarStorage.boards[board.id].prefs.background = temp.boards[board.id].prefs.background;
                            TrelloCalendarStorage.boards[board.id].prefs.backgroundColor = temp.boards[board.id].prefs.backgroundColor;
                            if (TrelloCalendarStorage.boards[board.id].dateLastActivity === undefined) {
                                TrelloCalendarStorage.boards[board.id].dateLastActivity = board.dateLastActivity;
                                TrelloCalendarStorage.boards[board.id].oldVersion = true;

                            }
                            else {
                                if (TrelloCalendarStorage.boards[board.id].dateLastActivity < board.dateLastActivity) {
                                    TrelloCalendarStorage.boards[board.id].dateLastActivity = board.dateLastActivity;
                                    TrelloCalendarStorage.boards[board.id].oldVersion = true;
                                    console.warn(board.name + " ist veraltet");
                                }
                                else {
                                    TrelloCalendarStorage.boards[board.id].oldVersion = false;

                                }
                            }
                            if (TrelloCalendarStorage.boards[board.id].enabled === undefined) {
                                TrelloCalendarStorage.boards[board.id].enabled = true;
                            }

                        }
                        else {
                            TrelloCalendarStorage.boards[board.id] = board;
                            TrelloCalendarStorage.boards[board.id].enabled = true;

                        }
                    });
                    webStorage.set('TrelloCalendarStorage', TrelloCalendarStorage);
                    deferred.resolve('boards');
                }, function () {
                    deferred.reject('boards error');
                });
            return deferred.promise;
        };
        /**
         *pullLists pulls open Lists from Trello
         *fields: id, name
         * */
        var pullLists = function () {
            var deferred = $q.defer();
            var TrelloCalendarStorage = webStorage.get('TrelloCalendarStorage');
            var listRequests = [];
            var alllists = [];

            _.forEach(TrelloCalendarStorage.boards, function (board) {
                if (board.oldVersion) {
                    listRequests.push($http.get('https://api.trello.com/1/boards/' + board.id + '/lists/?fields=name&filter=open&key=' + key + '&token=' + token));
                }
            });
            $q.all(listRequests).then(function (responses) {
                _.forEach(responses, function (lists) {
                    alllists = alllists.concat(lists.data);
                });
                TrelloCalendarStorage.lists = _.indexBy(alllists, 'id');
                webStorage.set('TrelloCalendarStorage', TrelloCalendarStorage);
                deferred.resolve('lists');
            }, function () {
                deferred.reject('lists error');

            });
            return deferred.promise;
        };
        /**
         *switches between pull my/all Cards
         */
        var pullCards = function () {
            var deferred = $q.defer();
            var TrelloCalendarStorage = webStorage.get('TrelloCalendarStorage');
            if (TrelloCalendarStorage.me.observer && TrelloCalendarStorage.me.observer === true) {
                pullAllCards().then(function () {
                    deferred.resolve();
                }, function (error) {
                    deferred.reject(error);
                });
            }
            else {
                pullMyCards().then(function () {
                    deferred.resolve();
                }, function (error) {
                    deferred.reject(error);
                });
            }

            return deferred.promise;
        };
        /**
         *pullMyCards pulls open Cards from Trello
         *if me/observer is false
         *fields: id, name,idList,dateLastActivity,shortUrl,due,idBoard
         * */
        var pullMyCards = function () {
            var deferred = $q.defer();
            var TrelloCalendarStorage = webStorage.get('TrelloCalendarStorage');
            $http.get('https://api.trello.com/1/members/me/cards/?fields=idList,name,dateLastActivity,shortUrl,due,idBoard&filter=open&key=' + key + '&token=' + token).then(function (responses) {
                var myCards = responses.data;
                for (var card in myCards) {
                    if (TrelloCalendarStorage.boards[myCards[card].idBoard]) {
                        myCards[card].boardName = (TrelloCalendarStorage.boards[myCards[card].idBoard]).name;
                        var dueDay = myCards[card].due;
                        myCards[card].dueDay = new Date(new Date(dueDay).setHours(0, 0, 0, 0)).toUTCString();
                        myCards[card].color = (TrelloCalendarStorage.boards[myCards[card].idBoard]).prefs.backgroundColor;
                        myCards[card].boardUrl = (TrelloCalendarStorage.boards[myCards[card].idBoard]).shortUrl;

                    }
                    if (TrelloCalendarStorage.lists[myCards[card].idList]) {
                        myCards[card].listName = (TrelloCalendarStorage.lists[myCards[card].idList]).name;
                    }

                }

                TrelloCalendarStorage.cards.my = _.indexBy(myCards, 'id');
                webStorage.set('TrelloCalendarStorage', TrelloCalendarStorage);
                deferred.resolve('myCards');
                login.resolve('myCards');

            }, function () {
                deferred.reject('myCards error');
            });

            return deferred.promise;

        };
        /**
         *pullAllCards pulls open Cards from Trello
         *if me/observer is true
         *fields: id, name,idList,dateLastActivity,shortUrl,due,idBoard
         * */
        var pullAllCards = function () {
            var deferred = $q.defer();
            var TrelloCalendarStorage = webStorage.get('TrelloCalendarStorage');
            var cardRequests = [];
            var allCards = [];
            _.forEach(TrelloCalendarStorage.boards, function (board) {
                if (board.oldVersion) {
                    cardRequests.push($http.get('https://api.trello.com/1/boards/' + board.id + '/cards/?fields=idList,name,dateLastActivity,shortUrl,due,idBoard&filter=open&key=' + key + '&token=' + token));
                }
            });
            $q.all(cardRequests).then(function (responses) {
                _.forEach(responses, function (lists) {
                    allCards = allCards.concat(lists.data);
                });

                for (var card in allCards) {

                    if (TrelloCalendarStorage.boards[allCards[card].idBoard]) {

                        allCards[card].boardName = (TrelloCalendarStorage.boards[allCards[card].idBoard]).name;
                        var dueDay = allCards[card].due;
                        allCards[card].dueDay = new Date(new Date(dueDay).setHours(0, 0, 0, 0)).toUTCString();
                        allCards[card].color = (TrelloCalendarStorage.boards[allCards[card].idBoard]).prefs.backgroundColor;
                        allCards[card].boardUrl = (TrelloCalendarStorage.boards[allCards[card].idBoard]).shortUrl;
                    }
                    if (TrelloCalendarStorage.lists[allCards[card].idList]) {
                        allCards[card].listName = (TrelloCalendarStorage.lists[allCards[card].idList]).name;
                    }
                }
                _.forEach(allCards, function (card) {
                    TrelloCalendarStorage.cards.all[card.id] = card;
                    console.log("update");
                });
                // TrelloCalendarStorage.cards.all = _.indexBy(allCards, 'id');
                webStorage.set('TrelloCalendarStorage', TrelloCalendarStorage);
                login.resolve('allCards');
                deferred.resolve('allCards');
            }, function () {
                deferred.reject('allCards error');
            });
            return deferred.promise;
        };
        /**
         * update() updates boards, lists, and cards
         */
        var update = function () {
            ngProgress.start();
            var deferred = $q.defer();
            pullBoards().then(function () {
                pullLists().then(function () {
                    pullCards().then(function () {
                        deferred.resolve('update');
                        ngProgress.complete();

                    }, function (error) {
                        ngProgress.complete();
                        deferred.reject(error);
                    });
                }, function (error) {
                    ngProgress.complete();
                    deferred.reject(error);
                });

            }, function (error) {
                ngProgress.complete();
                console.log(error);
                deferred.reject(error);
            }); //runs pullLists() and  pullCards();

            return deferred.promise;

        };
        var updateAll = function () {
            ngProgress.start();
            var deferred = $q.defer();

            pullBoards().then(function () {
                pullLists().then(function () {
                    $q.all([pullMyCards, pullAllCards]).then(function () {
                        ngProgress.complete();
                        deferred.resolve('update');
                    }, function (error) {
                        ngProgress.complete();
                        deferred.reject(error);
                    });
                }, function (error) {
                    ngProgress.complete();
                    deferred.reject(error);
                });

            }, function (error) {
                ngProgress.complete();
                console.log(error);
                deferred.reject(error);
            }); //runs pullLists() and  pullCards();

            return deferred.promise;
        };
        /**
         * refresh Card colors from changed Storage
         */
        var refreshColors = function () {
            var BoardId;
            var storage = webStorage.get('TrelloCalendarStorage');
            for (var x in storage.cards.my) {
                BoardId = storage.cards.my[x].idBoard;

                if (storage.boards[BoardId]) {
                    storage.cards.my[x].color = storage.boards[BoardId].prefs.backgroundColor;
                }

            }
            for (var y in storage.cards.all) {
                BoardId = storage.cards.all[y].idBoard;

                if (storage.boards[BoardId]) {
                    storage.cards.all[y].color = storage.boards[BoardId].prefs.backgroundColor;
                }
            }
            webStorage.set('TrelloCalendarStorage', storage);
        };

        return {
            init: function () {

                if (!webStorage.has('trello_token')) {
                    if ($rootScope.mobil) {
                        var redirect = baseUrl + '/app/token?do=settoken';
                        var ref = window.open('https://trello.com/1/authorize?response_type=token&scope=read,write&key=' + key + '&redirect_uri=' + redirect + '&callback_method=fragment&expiration=never&name=Calendar+for+Trello', '_blank', 'location=no', 'toolbar=no');
                        ref.addEventListener('loadstart', function (event) {
                            if (event.url.indexOf('/#token=') > -1) {
                                token = event.url.substring((event.url.indexOf('/#token=') + 8));
                                ref.close();
                                firstInit().then(function () {
                                    updateAll();
                                });
                            }
                        });
                    } else {
                        $window.location.href = 'https://trello.com/1/authorize?response_type=token&key=' + key + '&redirect_uri=' + encodeURI(baseUrl + '/app') + '%2Ftoken%3Fdo%3Dsettoken%26callback_method=fragment&scope=read%2Cwrite%2Caccount&expiration=never&name=Calendar+for+Trello';
                    }


                } else {
                    token = webStorage.get('trello_token');
                    if (!webStorage.has('TrelloCalendarStorage')) {
                        webStorage.set('TrelloCalendarStorage', {});
                        firstInit().then(function () {
                            firstInit().then(function () {
                                updateAll().then(function () {
                                    ngProgress.complete();
                                    login.resolve('not exist');
                                });
                            });
                        });
                    }
                    else {
                        updateAll().then(function () {
                        });
                        login.resolve('exists');

                    }
                }
                return login.promise;
            },

            refresh: function () {
                login = $q.defer();
                update().then(function () {

                    },
                    function () {
                        console.log('failed refresh');
                    });

                return login.promise;
            },

            remove: function () {
                data = null;
                webStorage.set('trello_token', null);
            },
            refreshColors: function () {
                refreshColors();
            },
            refreshAll: function () {
                login = $q.defer();
                updateAll().then(function () {
                    },
                    function () {
                        console.log('failed refreshAll');
                    });
                return login.promise;
            },

            updateDate: function () {
                $rootScope.$broadcast('refresh');
            }

        };
    }
)
;