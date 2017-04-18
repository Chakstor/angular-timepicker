import * as angular from 'angular';
import 'angular-dateParser';
import 'angular-ui-bootstrap';
import { dnTimepickerHelpers } from './helpers';
import { dnTimepickerPopup } from './popup-directive';
import { dnTimepickerDirective } from './directive';

angular.module('dnTimepicker', [ 'ui.bootstrap.position', 'dateParser' ])
    .factory('dnTimepickerHelpers', dnTimepickerHelpers)
    .directive('dnTimepickerPopup', dnTimepickerPopup.factory())
    .directive('dnTimepicker', dnTimepickerDirective.factory());