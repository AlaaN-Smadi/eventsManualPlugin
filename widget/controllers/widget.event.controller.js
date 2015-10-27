'use strict';

(function (angular, buildfire) {
  angular.module('eventsManualPluginWidget')
    .controller('WidgetEventCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$routeParams', '$sce', '$rootScope', 'Buildfire', '$location',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $routeParams, $sce, $rootScope, Buildfire, $location) {

        var WidgetEvent = this;
        WidgetEvent.data = {};
        WidgetEvent.event = {};
        var currentListLayout = null;

        //create new instance of buildfire carousel viewer
        WidgetEvent.view = null;

        var _searchObj = $location.search();

        if ($routeParams.id && !_searchObj.stopSwitch) {
          buildfire.messaging.sendMessageToControl({
            id: $routeParams.id,
            type: 'OpenItem'
          });
        }

        WidgetEvent.getUTCZone=function(){
          //return moment(new Date()).utc().format("Z");
          return moment(new Date()).format("Z")
        };

        WidgetEvent.partOfTime= function(format,paramTime){
          return moment(new Date(paramTime)).format(format);
        };

        WidgetEvent.convertToZone=function(result){
          WidgetEvent.completeDateStart = moment(new Date(result.data.startDate))
              .add(WidgetEvent.partOfTime('HH',result.data.startTime),'hour')
              .add(WidgetEvent.partOfTime('mm',result.data.startTime),'minute')
              .add(WidgetEvent.partOfTime('ss',result.data.startTime),'second');
          WidgetEvent.completeDateEnd = moment(new Date(result.data.endDate))
              .add(WidgetEvent.partOfTime('HH',result.data.endTime),'hour')
              .add(WidgetEvent.partOfTime('mm',result.data.endTime),'minute')
              .add(WidgetEvent.partOfTime('ss',result.data.endTime),'second');
          result.data.startDate=moment(WidgetEvent.completeDateStart)
              .utcOffset(result.data.timeDisplay=='SELECTED'&&result.data.timezone["value"]?result.data.timezone["value"]:WidgetEvent.getUTCZone()).format('MMM D, YYYY');
          result.data.startTime=moment(WidgetEvent.completeDateStart)
              .utcOffset(result.data.timeDisplay=='SELECTED'&&result.data.timezone["value"]?result.data.timezone["value"]:WidgetEvent.getUTCZone()).format('hh:mm A');
          result.data.endDate=moment(WidgetEvent.completeDateEnd)
              .utcOffset(result.data.timeDisplay=='SELECTED'&&result.data.timezone["value"]?result.data.timezone["value"]:WidgetEvent.getUTCZone()).format('MMM D, YYYY');
          result.data.endTime=moment(WidgetEvent.completeDateEnd)
              .utcOffset(result.data.timeDisplay=='SELECTED'&&result.data.timezone["value"]?result.data.timezone["value"]:WidgetEvent.getUTCZone()).format('hh:mm A');
          result.data.upadtedTtimeZone=moment(WidgetEvent.completeDateEnd)
              .utcOffset(result.data.timeDisplay=='SELECTED'&&result.data.timezone["value"]?result.data.timezone["value"]:WidgetEvent.getUTCZone()).format('Z');

        }
        var getEventDetails = function (url) {
          var success = function (result) {
                WidgetEvent.convertToZone(result);

              WidgetEvent.event = result;
            }
            , error = function (err) {
              console.error('Error In Fetching Event', err);
            };
          if ($routeParams.id)
            DataStore.getById($routeParams.id, TAG_NAMES.EVENTS_MANUAL).then(success, error);
        };

        /*declare the device width heights*/
        WidgetEvent.deviceHeight = window.innerHeight;
        WidgetEvent.deviceWidth = window.innerWidth;

        /*initialize the device width heights*/
        var initDeviceSize = function(callback) {
          WidgetEvent.deviceHeight = window.innerHeight;
          WidgetEvent.deviceWidth = window.innerWidth;
          if (callback) {
            if (WidgetEvent.deviceWidth == 0 || WidgetEvent.deviceHeight == 0) {
              setTimeout(function () {
                initDeviceSize(callback);
              }, 500);
            } else {
              callback();
              if (!$scope.$$phase && !$scope.$root.$$phase) {
                $scope.$apply();
              }
            }
          }
        };

        /*crop image on the basis of width heights*/
        WidgetEvent.cropImage = function (url, settings) {
          var options = {};
          if (!url) {
            return "";
          }
          else {
            if (settings.height) {
              options.height = settings.height;
            }
            if (settings.width) {
              options.width = settings.width;
            }
            return Buildfire.imageLib.cropImage(url, options);
          }
        };

        WidgetEvent.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        WidgetEvent.executeActionItem = function (actionItem) {
          buildfire.actionItems.execute(actionItem, function () {

          });
        };

        //Check is description is empty or not
        WidgetEvent.showDescription = function (description) {
          return !(description == '<p><br data-mce-bogus="1"></p>');
        };

        WidgetEvent.addEventsToCalendar = function (event) {
          /*Add to calendar event will add here*/
          alert(">>>>>>>>>>>>>>>>>>>>>>>>>>>");
          alert("inCal:"+buildfire.device.calendar);
          if(buildfire.device && buildfire.device.calendar) {
            buildfire.device.calendar.addEvent(
              {
                title: event.data.title
                , location: event.data.address.location
                , notes: event.data.description
                , startDate: new Date(event.data.startDate)
                , endDate: new Date(event.data.endDate)
                , options: {
                firstReminderMinutes: 120
                , secondReminderMinutes: 5
                , recurrence: event.data.repeat.repeatType
                , recurrenceEndDate: event.data.repeat.repeatType?new Date(event.data.repeat.endOn): new Date(2025, 6, 1, 0, 0, 0, 0, 0)
              }
              }
              ,
              function (err, result) {
                alert("Done");
                if (err)
                  alert("******************"+err);
                else
                  alert('worked ' + JSON.stringify(result));
              }
            );
          }
          console.log(">>>>>>>>",event);
        };

        /*update data on change event*/
        var onUpdateCallback = function (event) {
          setTimeout(function () {
            $scope.$digest();
            if (event && event.tag) {
              switch (event.tag) {
                case TAG_NAMES.EVENTS_MANUAL_INFO:
                  WidgetEvent.data = event.data;
                  if (!WidgetEvent.data.design)
                    WidgetEvent.data.design = {};
                  if (!WidgetEvent.data.design.itemDetailsLayout) {
                    WidgetEvent.data.design.itemDetailsLayout = LAYOUTS.itemDetailsLayout[0].name;
                  }
                  currentListLayout = WidgetEvent.data.design.itemDetailsLayout;

                  break;
                case TAG_NAMES.EVENTS_MANUAL:
                  if (event.data)
                    WidgetEvent.convertToZone(event);
                  WidgetEvent.event.data = event.data;
                  if (WidgetEvent.view) {
                    console.log("_____________________________");
                    WidgetEvent.view.loadItems(WidgetEvent.event.data.carouselImages, null, WidgetEvent.data.design.itemDetailsLayout=='Event_Item_1'?"WideScreen":"Square");
                  }
                  break;
              }
              $scope.$digest();
            }
          }, 0);
        };

        /*
         * Fetch user's data from datastore
         */
        var init = function () {
          var success = function (result) {
              WidgetEvent.data = result.data;
              if (!WidgetEvent.data.design)
                WidgetEvent.data.design = {};
              if (!WidgetEvent.data.design.itemDetailsLayout) {
                WidgetEvent.data.design.itemDetailsLayout = LAYOUTS.itemDetailsLayout[0].name;
              }
              getEventDetails();
            }
            , error = function (err) {
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.EVENTS_MANUAL_INFO).then(success, error);
        };

        init();

        DataStore.onUpdate().then(null, null, onUpdateCallback);

        $scope.$on("$destroy", function () {
          DataStore.clearListener();
        });

        $rootScope.$on("Carousel:LOADED", function () {
          WidgetEvent.view = null;
           if (!WidgetEvent.view) {
            WidgetEvent.view = new buildfire.components.carousel.view("#carousel", [],WidgetEvent.data.design.itemDetailsLayout=='Event_Item_1'?"WideScreen":"Square");
          }
          if (WidgetEvent.event.data && WidgetEvent.event.data.carouselImages) {
            WidgetEvent.view.loadItems(WidgetEvent.event.data.carouselImages, null, WidgetEvent.data.design.itemDetailsLayout=='Event_Item_1'?"WideScreen":"Square");
          } else {
            WidgetEvent.view.loadItems([]);
          }
        });

        WidgetEvent.onAddressClick = function (long,lat) {
          if (buildfire.context.device && buildfire.context.device.platform == 'ios')
            window.open("maps://maps.google.com/maps?daddr=" + lat + "," + long);
          else
            window.open("http://maps.google.com/maps?daddr=" + lat + "," + long);
        }

      }]);
})(window.angular, window.buildfire);