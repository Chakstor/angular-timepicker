import * as angular from 'angular';

export class dnTimepickerPopup implements angular.IDirective {
    public restrict = 'A';
    public replace = true;
    public transclude = false;
    public template = `<ul class="dn-timepicker-popup dropdown-menu" ng-style="{display: timepicker.isOpen && \'block\' || \'none\', top: position.top+\'px\', left: position.left+\'px\'}"><li ng-repeat="time in timepicker.optionList()" ng-class="{active: isActive($index) }" ng-mouseenter="setActive($index)"><a ng-click="select(time)">{{time | date:timepicker.timeFormat}}</a></li></ul>`;

    public static factory(): angular.IDirectiveFactory {
        let directive: angular.IDirectiveFactory = () => new dnTimepickerPopup();
        return directive;
    }

    public link(scope: angular.IScope, element: any, attrs: angular.IAttributes) {
        scope.timepicker.element = element;
        element.find('a').bind('click', function (event) {
            event.preventDefault();
        });
    }
}