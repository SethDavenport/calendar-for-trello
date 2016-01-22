'use strict';

module.exports = {

  build: {
    sass: {
      enabled: false
    },
    less: {
      enabled: true
    },
    blessed: {
      enabled: false
    },
    jshint: {
      runInDev: true,
      runInDist: true
    },
    bower: {
      runInDev: true,
      runInDist: true
    },
    spec: {
      runInDev: false,
      runInDist: false
    },
    e2e: {
      runInDev: false,
      runInDist: false
    }
  },

  app: {
    angular_module: {
      regular: 'trelloCal',
      withMocks: 'trelloCal.mock',
      templates: 'trelloCal.templates',
      translations: 'trelloCal.translations'
    }
  },

  vendor: {
    files: {
      js: [
          'jquery/dist/jquery.js',
          'jquery-ui/jquery-ui.js',
          'angular/angular.js',
          'angular-sanitize/angular-sanitize.js',
          'angular-ui-router/release/angular-ui-router.js',
          'angular-animate/angular-animate.js',
          'angular-aria/angular-aria.js',
          'angular-material/angular-material.js',
          'angular-webstorage/angular-webstorage.js',
          'moment/moment.js',
          'moment/locales/en-gb.js',
          'jquery-ui-touch-punch/jquery.ui.touch-punch.js',
          'angular-material-icons/angular-material-icons.js',
          'angular-local-storage/dist/angular-local-storage.js',
          'lodash/lodash.js',
          'ngprogress/build/ngProgress.js',
          'array-tools/dist/array-tools.js',
          'w11k.angular-seo-header/angular-seo-header.js',
          'angular-toastr/dist/angular-toastr.tpls.min.js',

          //Error-Logging:
          'raven-js/dist/raven.js',
          'angular-raven/angular-raven.js',
          //Analytics:

          'angulartics/src/angulartics.js',
          'angulartics/src/angulartics-ga.js',
          'angular-websocket/angular-websocket.js'


      ],
      js_mock: [],
      js_spec: [],
      js_e2e: [],
      css: [
          'angular-material/angular-material.css',
          'ngprogress/ngProgress.css',
          'angular-ui-notification/src/angular-ui-notification.less',
          'angular-toastr/dist/angular-toastr.min.css'
      ],
        assets: [
            'angular-ui-notification/src/angular-ui-notification.html'
        ]

    }
  }

};
