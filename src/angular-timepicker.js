/*!
 * angular-timepicker 1.0.10
 * https://github.com/Geta/angular-timepicker
 * Copyright 2016, Geta AS
 * Contributors: Dzulqarnain Nasir <dzul@geta.no>
 * Licensed under: MIT (http://www.opensource.org/licenses/MIT)
 */

/*global angular*/
(function(angular) {
    "use strict";
    angular.module("dnTimepicker", [ "ui.bootstrap.position", "dateParser" ]).factory("dnTimepickerHelpers", function() {
        return {
            stringToMinutes: function(str) {
                if (!str) {
                    return null;
                }
                var t = str.match(/(\d+)(h?)/);
                return t[1] ? t[1] * (t[2] ? 60 : 1) : null;
            },
            buildOptionList: function(minTime, maxTime, step) {
                var result = [], i = angular.copy(minTime);
                while (i <= maxTime) {
                    result.push(new Date(i));
                    i.setMinutes(i.getMinutes() + step);
                }
                return result;
            },
            getClosestIndex: function(value, from) {
                if (!angular.isDate(value)) {
                    return -1;
                }
                var closest = null, index = -1, _value = value.getHours() * 60 + value.getMinutes();
                for (var i = 0; i < from.length; i++) {
                    var current = from[i], _current = current.getHours() * 60 + current.getMinutes();
                    if (closest === null || Math.abs(_current - _value) < Math.abs(closest - _value)) {
                        closest = _current;
                        index = i;
                    }
                }
                return index;
            }
        };
    }).directive("dnTimepicker", [ "$compile", "$parse", "$uibPosition", "$document", "dateFilter", "$dateParser", "dnTimepickerHelpers", "$log","$timeout", function($compile, $parse, $position, $document, dateFilter, $dateParser, dnTimepickerHelpers, $log, $timeout) {
        return {
            restrict: "A",
            require: "ngModel",
            scope: {
                ngModel: "=",
                'onSelect' : '='
            },
            link: function(scope, element, attrs, ctrl) {
                //autoselect all text when user clicks on the textbox
                var focused = false;
                element.on('click', function () {
                  var self = this;
                  if (!focused) {
                    focused = true;
                    $timeout(function() {
                      self.setSelectionRange(0, self.value.length);
                    }, 0);
                  }
                }).on('blur', function() {
                  focused = false;
                });
                // Local variables
                var current = null, list = [], updateList = true;
                // Model
                scope.timepicker = {
                    element: null,
                    timeFormat: "H:mm",
                    minTime: $dateParser("0:00", "H:mm"),
                    maxTime: $dateParser("23:30", "H:mm"),
                    step: 30,
                    isOpen: false,
                    activeIdx: -1,
                    optionList: function() {
                        if (updateList) {
                            list = dnTimepickerHelpers.buildOptionList(scope.timepicker.minTime, scope.timepicker.maxTime, scope.timepicker.step);
                            updateList = false;
                        }
                        return list;
                    }
                };
                function getUpdatedDate(date) {
                    if (!current) {
                        current = angular.isDate(scope.ngModel) ? scope.ngModel : new Date();
                    }
                    current.setHours(date.getHours());
                    current.setMinutes(date.getMinutes());
                    current.setSeconds(date.getSeconds());
                    scope.onSelect(date);
                    setCurrentValue(current);
                    return current; //{"hours":date.getHours(),"minutes":date.getMinutes()}
                }
                function setCurrentValue(value) {
                    if (!angular.isDate(value)) {
                        value = $dateParser(scope.ngModel, scope.timepicker.timeFormat);
                        if (isNaN(value)) {
                            $log.warn("Failed to parse model.");
                        }
                    }
                    current = value;
                }
                // Init attribute observers
                attrs.$observe("dnTimepicker", function(value) {
                    if (value) {
                        scope.timepicker.timeFormat = value;
                    }
                    ctrl.$render();
                });
                attrs.$observe("minTime", function(value) {
                    if (!value) return;
                    scope.timepicker.minTime = $dateParser(value, scope.timepicker.timeFormat);
                    updateList = true;
                });
                attrs.$observe("maxTime", function(value) {
                    if (!value) return;
                    scope.timepicker.maxTime = $dateParser(value, scope.timepicker.timeFormat);
                    updateList = true;
                });
                attrs.$observe("step", function(value) {
                    if (!value) return;
                    var step = dnTimepickerHelpers.stringToMinutes(value);
                    if (step) scope.timepicker.step = step;
                    updateList = true;
                });
                scope.$watch("ngModel", function(value) {
                    setCurrentValue(value);
                    ctrl.$render();
                });
                // Set up renderer and parser
                ctrl.$render = function() {
                    element.val(angular.isDate(current) ? dateFilter(current, scope.timepicker.timeFormat) : ctrl.$viewValue ? ctrl.$viewValue : "");
                };
                // Parses manually entered time
                ctrl.$parsers.unshift(function(viewValue) {
                    scope.viewValue = viewValue;
                    var date = angular.isDate(viewValue) ? viewValue : $dateParser(viewValue, scope.timepicker.timeFormat);
                    if (isNaN(date)) {
                        ctrl.$setValidity("time", false);
                        return undefined;
                    }
                    ctrl.$setValidity("time", true);
                    return getUpdatedDate(date);
                });
                // Set up methods
                // Select action handler
                scope.select = function(time) {
                    if (!angular.isDate(time)) {
                        return;
                    }
                    ctrl.$setViewValue(getUpdatedDate(time));
                    ctrl.$render();
                };
                // Checks for current active item
                scope.isActive = function(index) {
                    return index === scope.timepicker.activeIdx;
                };
                // Sets the current active item
                scope.setActive = function(index) {
                    //scope.timepicker.activeIdx = index;
                };
                // Sets the timepicker scrollbar so that selected item is visible
                scope.scrollToSelected = function() {
                    if (scope.timepicker.element && scope.timepicker.activeIdx > -1) {
                        var target = scope.timepicker.element[0].querySelector(".active");
                        target.parentNode.scrollTop = target.offsetTop - 50;
                    }
                };
                // Opens the timepicker
                scope.openPopup = function() {
                    // Set position
                    scope.position = $position.position(element);
                    scope.position.top = scope.position.top + element.prop("offsetHeight");
                    // Open list
                    scope.timepicker.isOpen = true;
                    // Set active item
                    //scope.timepicker.activeIdx = dnTimepickerHelpers.getClosestIndex(scope.ngModel, scope.timepicker.optionList());
                    // Trigger digest
                    scope.$digest();
                    // Scroll to selected
                    scope.scrollToSelected();
                };
                // Closes the timepicker
                scope.closePopup = function() {
                    if (scope.timepicker.isOpen) {
                        scope.timepicker.isOpen = false;
                        scope.$apply();
                        element[0].blur();
                    }
                };
                // Append timepicker dropdown
                element.after($compile(angular.element("<div dn-timepicker-popup></div>"))(scope));
                // Set up the element
                element.bind("focus", function() {
                    scope.openPopup();
                }).bind("blur", function() {
                    if(scope.viewValue && !angular.isDate($dateParser(scope.viewValue, scope.timepicker.timeFormat))){
                      if(isNaN(scope.viewValue)){
                        scope.select(scope.timepicker.optionList()[0])
                      }else{
                        if (angular.isDate(scope.viewValue)){
                          scope.select(scope.viewValue);
                        }else {
                          scope.select(convertToHHMM(scope.viewValue));
                        }
                      }
                    }
                    setTimeout(function(){
                      scope.closePopup();
                    },100)
                    //scope.closePopup();
                }).bind("keypress keyup", function(e) {
                    if (e.which === 38 && scope.timepicker.activeIdx > 0) {
                        // UP
                        scope.timepicker.activeIdx--;
                        scope.scrollToSelected();
                    } else if (e.which === 40 && scope.timepicker.activeIdx < scope.timepicker.optionList().length - 1) {
                        // DOWN
                        scope.timepicker.activeIdx++;
                        scope.scrollToSelected();
                    } else if (e.which === 13 && scope.timepicker.activeIdx > -1) {
                        // ENTER
                        scope.select(scope.timepicker.optionList()[scope.timepicker.activeIdx]);
                        scope.closePopup();
                    } else if(e.which === 13){
                      if(scope.viewValue && !angular.isDate($dateParser(scope.viewValue, scope.timepicker.timeFormat))){
                        if(!isNaN(scope.viewValue)){
                          if (angular.isDate(scope.viewValue)){
                            scope.select(scope.viewValue);
                          }else {
                            scope.select(convertToHHMM(scope.viewValue));
                          }
                          scope.closePopup();
                        }
                      }
                    }
                    scope.$digest();
                });

                function convertToHHMM(info) {
                  var hrs = parseInt(Number(info));
                  var min = Math.round((Number(info)-hrs) * 60);
                  var myDate = new Date();
                  myDate.setHours(hrs);
                  myDate.setMinutes(min);
                  return myDate;
                }

                // Close popup when clicked anywhere else in document
                $document.bind("click", function(event) {
                    if (scope.timepicker.isOpen && event.target !== element[0]) {
                        scope.closePopup();
                    }
                });
                // Set initial value
                setCurrentValue(scope.ngModel);
            }
        };
    } ]).directive("dnTimepickerPopup", function() {
        return {
            restrict: "A",
            replace: true,
            transclude: false,
            template: '<ul class="dn-timepicker-popup dropdown-menu" ng-style="{display: timepicker.isOpen && \'block\' || \'none\', top: position.top+\'px\', left: position.left+\'px\'}"><li ng-repeat="time in timepicker.optionList()" ng-class="{active: isActive($index) }" ng-mouseenter="setActive($index)"><a ng-click="select(time)">{{time | date:timepicker.timeFormat}}</a></li></ul>',
            link: function(scope, element, attrs) {
                scope.timepicker.element = element;
                element.find("a").bind("click", function(event) {
                    event.preventDefault();
                });
            }
        };
    });
})(angular);
