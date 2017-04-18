import * as angular from 'angular';
import { IPositionService } from 'angular-ui-bootstrap';
import 'angular-dateParser';
import { dnTimepickerHelpers } from './helpers';
import './popup-directive';

export class dnTimepickerDirective implements angular.IDirective {
    public restrict = 'A';
    public require = 'ngModel';
    public scope = {
        ngModel: '=',
        onSelect: '='
    };

    constructor(private $compile: angular.ICompileService, private $parse: angular.IParseService, private $position: IPositionService,
        private $document: angular.IDocumentService, private dateFilter: angular.IFilterDate, private $dateParser: any,
        private dnTimepickerHelpers: dnTimepickerHelpers, private $log: angular.ILogService, private $timeout: angular.ITimeoutService) { }

    public static factory(): angular.IDirectiveFactory {
        let directive: angular.IDirectiveFactory = ($compile, $parse, $position, $document, dateFilter, $dateParser, dnTimepickerHelpers, $log, $timeout) => new dnTimepickerDirective($compile, $parse, $position, $document, dateFilter, $dateParser, dnTimepickerHelpers, $log, $timeout);
        directive.$inject = ['$compile', '$parse', '$uibPosition', '$document', 'dateFilter', '$dateParser', 'dnTimepickerHelpers', '$log', '$timeout'];
        return directive;
    }

    public link(scope: angular.IScope, element: any, attrs: angular.IAttributes, ctrl: angular.INgModelController) {
        //autoselect all text when user clicks on the textbox
        var focused = false;
        element.on('click', function () {
            var self = this;
            if (!focused) {
                focused = true;
                this.$timeout(function () {
                    self.setSelectionRange(0, self.value.length);
                }, 0);
            }
        }).on('blur', function () {
            focused = false;
        });
        // Local variables
        var current = null, list = [], updateList = true;
        // Model
        scope.timepicker = {
            element: null,
            timeFormat: 'H:mm',
            minTime: this.$dateParser('0:00', 'H:mm'),
            maxTime: this.$dateParser('23:30', 'H:mm'),
            step: 30,
            isOpen: false,
            activeIdx: -1,
            optionList: function () {
                if (updateList) {
                    list = this.dnTimepickerHelpers.buildOptionList(scope.timepicker.minTime, scope.timepicker.maxTime, scope.timepicker.step);
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
            return current; //{'hours':date.getHours(),'minutes':date.getMinutes()}
        }
        function setCurrentValue(value) {
            if (!angular.isDate(value)) {
                value = this.$dateParser(scope.ngModel, scope.timepicker.timeFormat);
                if (isNaN(value)) {
                    this.$log.warn('Failed to parse model.');
                }
            }
            current = value;
        }
        // Init attribute observers
        attrs.$observe('dnTimepicker', function (value) {
            if (value) {
                scope.timepicker.timeFormat = value;
            }
            ctrl.$render();
        });
        attrs.$observe('minTime', function (value) {
            if (!value) return;
            scope.timepicker.minTime = this.$dateParser(value, scope.timepicker.timeFormat);
            updateList = true;
        });
        attrs.$observe('maxTime', function (value) {
            if (!value) return;
            scope.timepicker.maxTime = this.$dateParser(value, scope.timepicker.timeFormat);
            updateList = true;
        });
        attrs.$observe('step', function (value) {
            if (!value) return;
            var step = this.dnTimepickerHelpers.stringToMinutes(value);
            if (step) scope.timepicker.step = step;
            updateList = true;
        });
        scope.$watch('ngModel', function (value) {
            setCurrentValue(value);
            ctrl.$render();
        });
        // Set up renderer and parser
        ctrl.$render = function () {
            element.val(angular.isDate(current) ? this.dateFilter(current, scope.timepicker.timeFormat) : ctrl.$viewValue ? ctrl.$viewValue : '');
        };
        // Parses manually entered time
        ctrl.$parsers.unshift(function (viewValue) {
            scope.viewValue = viewValue;
            var date = angular.isDate(viewValue) ? viewValue : this.$dateParser(viewValue, scope.timepicker.timeFormat);
            if (isNaN(date)) {
                ctrl.$setValidity('time', false);
                return undefined;
            }
            ctrl.$setValidity('time', true);
            return getUpdatedDate(date);
        });
        // Set up methods
        // Select action handler
        scope.select = function (time) {
            if (!angular.isDate(time)) {
                return;
            }
            ctrl.$setViewValue(getUpdatedDate(time));
            ctrl.$render();
        };
        // Checks for current active item
        scope.isActive = function (index) {
            return index === scope.timepicker.activeIdx;
        };
        // Sets the current active item
        scope.setActive = function (index) {
            //scope.timepicker.activeIdx = index;
        };
        // Sets the timepicker scrollbar so that selected item is visible
        scope.scrollToSelected = function () {
            if (scope.timepicker.element && scope.timepicker.activeIdx > -1) {
                var target = scope.timepicker.element[0].querySelector('.active');
                target.parentNode.scrollTop = target.offsetTop - 50;
            }
        };
        // Opens the timepicker
        scope.openPopup = function () {
            // Set position
            scope.position = this.$position.position(element);
            scope.position.top = scope.position.top + element.prop('offsetHeight');
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
        scope.closePopup = function () {
            if (scope.timepicker.isOpen) {
                scope.timepicker.isOpen = false;
                scope.$apply();
                element[0].blur();
            }
        };
        // Append timepicker dropdown
        element.after(this.$compile(angular.element('<div dn-timepicker-popup></div>'))(scope));
        // Set up the element
        element.bind('focus', function () {
            scope.openPopup();
        }).bind('blur', function () {
            if (scope.viewValue && !angular.isDate(this.$dateParser(scope.viewValue, scope.timepicker.timeFormat))) {
                if (isNaN(scope.viewValue)) {
                    scope.select(scope.timepicker.optionList()[0])
                } else {
                    if (angular.isDate(scope.viewValue)) {
                        scope.select(scope.viewValue);
                    } else {
                        scope.select(convertToHHMM(scope.viewValue));
                    }
                }
            }
            setTimeout(function () {
                scope.closePopup();
            }, 100)
            //scope.closePopup();
        }).bind('keypress keyup', function (e) {
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
            } else if (e.which === 13) {
                if (scope.viewValue && !angular.isDate(this.$dateParser(scope.viewValue, scope.timepicker.timeFormat))) {
                    if (!isNaN(scope.viewValue)) {
                        if (angular.isDate(scope.viewValue)) {
                            scope.select(scope.viewValue);
                        } else {
                            scope.select(convertToHHMM(scope.viewValue));
                        }
                        scope.closePopup();
                    }
                }
            }
            scope.$digest();
        });

        function convertToHHMM(info) {
            var hrs = Number(info);
            var min = Math.round((Number(info) - hrs) * 60);
            var myDate = new Date();
            myDate.setHours(hrs);
            myDate.setMinutes(min);
            return myDate;
        }

        // Close popup when clicked anywhere else in document
        this.$document.bind('click', function (event) {
            if (scope.timepicker.isOpen && event.target !== element[0]) {
                scope.closePopup();
            }
        });
        // Set initial value
        setCurrentValue(scope.ngModel);
    }
}