describe('Timepicker directive', function() {
	var $scope, $compile;

	beforeEach(module('dnTimepicker'));

	beforeEach(inject(function(_$rootScope_, _$compile_) {
        $scope = _$rootScope_;
        $compile = _$compile_;
    }));

	describe('helper function test', function() {
		it('should convert string to minutes', inject(function(dnTimepickerHelpers) {
			var str1 = '1h',
				str2 = '30m',
				str3 = '30';

			expect(dnTimepickerHelpers.stringToMinutes(str1)).toBe(60);
			expect(dnTimepickerHelpers.stringToMinutes(str2)).toBe(30);
			expect(dnTimepickerHelpers.stringToMinutes(str3)).toBe(30);
		}));

		it('should build a list of selectable time', inject(function($dateParser, dnTimepickerHelpers) {
			var minTime = $dateParser('12:00', 'HH:mm');
			var maxTime = $dateParser('13:00', 'HH:mm');

			var timeList = dnTimepickerHelpers.buildOptionList(minTime, maxTime, 15);

			expect(timeList.length).toBe(5);
			expect(timeList[0].getHours()).toBe(12);
			expect(timeList[0].getMinutes()).toBe(0);
			expect(timeList[1].getHours()).toBe(12);
			expect(timeList[1].getMinutes()).toBe(15);
			expect(timeList[2].getHours()).toBe(12);
			expect(timeList[2].getMinutes()).toBe(30);
			expect(timeList[3].getHours()).toBe(12);
			expect(timeList[3].getMinutes()).toBe(45);
			expect(timeList[4].getHours()).toBe(13);
			expect(timeList[4].getMinutes()).toBe(0);
		}));

		it('should return closest index', inject(function($dateParser, dnTimepickerHelpers) {
			var minTime = $dateParser('12:00', 'HH:mm');
			var maxTime = $dateParser('13:00', 'HH:mm');

			var timeList = dnTimepickerHelpers.buildOptionList(minTime, maxTime, 15);

			var testTime1 = $dateParser('12:36', 'HH:mm'),
				testTime2 = $dateParser('12:01', 'HH:mm'),
				testTime3 = $dateParser('12:59', 'HH:mm');

			expect(dnTimepickerHelpers.getClosestIndex(testTime1, timeList)).toBe(2);
			expect(dnTimepickerHelpers.getClosestIndex(testTime2, timeList)).toBe(0);
			expect(dnTimepickerHelpers.getClosestIndex(testTime3, timeList)).toBe(4);
		}));
	});

	describe('UI function test', function() {
		var inputEl, changeInputValueTo;

        function assignElements(wrapElement) {
            inputEl = wrapElement.find('input');
        }

		beforeEach(inject(function($sniffer) {
			$scope.models = {
				time: new Date(),
				format: 'HH:mm',
				minTime: '09:00',
				maxTime: '21:00',
				step: '15'
			};

			var wrapElement = $compile(angular.element('<div><input type="text" dn-timepicker="{{models.format}}" ng-model="models.time" min-time="{{models.minTime}}" max-time="{{models.maxTime}}" step="{{models.step}}"></div>'))($scope);
            $scope.$digest();

            assignElements(wrapElement);

            changeInputValueTo = function (el, value) {
                el.val(value);
                el.trigger($sniffer.hasEvent('input') ? 'input' : 'change');
                $scope.$digest();
            };
	    }));

		it('should have a list of selectable time', function() {
			var list = inputEl.next();

			expect(list.hasClass('dn-timepicker-popup')).toBe(true);
			expect(list.children().length > 0).toBe(true);
		});

		it('should update the list of selectable time', function() {
			var list = inputEl.next();

			$scope.models.minTime = '07:00';
			$scope.models.maxTime = '19:00';
			$scope.models.step = '30';
			$scope.$apply();

			expect(list.find('li:first-child a').text()).toBe('07:00');
			expect(list.find('li:nth-child(2) a').text()).toBe('07:30');
			expect(list.find('li:last-child a').text()).toBe('19:00');
		});

		it('should be able to parse manually entered time', function() {
			changeInputValueTo(inputEl, '12:50');

			expect($scope.models.time.getHours()).toEqual(12);
			expect($scope.models.time.getMinutes()).toEqual(50);

            // not a time string
            changeInputValueTo(inputEl, 'not a time string');

            expect($scope.models.time).toBeUndefined();

            // incorrect format
            changeInputValueTo(inputEl, '1:45 pm');

            expect($scope.models.time).toBeUndefined();

            // invalid time
            changeInputValueTo(inputEl, '25:69');

            expect($scope.models.time).toBeUndefined();
		});

		it('should only update the time properties of the model - manual', function() {
			$scope.$apply(function() {
				$scope.models.time = new Date(2012, 11, 15, 13, 30, 0);
			});

			changeInputValueTo(inputEl, '12:50');

			expect($scope.models.time.getFullYear()).toEqual(2012);
			expect($scope.models.time.getMonth()).toEqual(11);
			expect($scope.models.time.getDate()).toEqual(15);
			expect($scope.models.time.getHours()).toEqual(12);
			expect($scope.models.time.getMinutes()).toEqual(50);
		});

		it('should only update the time properties of the model - dropdown', function() {
			$scope.$apply(function() {
				$scope.models.time = new Date(2012, 11, 15, 13, 30, 0);
			});
			
			inputEl.next().find('li:first-child a').trigger('mousedown');

			expect($scope.models.time.getFullYear()).toEqual(2012);
			expect($scope.models.time.getMonth()).toEqual(11);
			expect($scope.models.time.getDate()).toEqual(15);
			expect($scope.models.time.getHours()).toEqual(9);
			expect($scope.models.time.getMinutes()).toEqual(0);
		});
        
        it('should update the view when model is manually changed', function() {
            var ngModelController = inputEl.controller('ngModel');
            
            $scope.$apply(function() {
				$scope.models.time = new Date(2012, 11, 15, 13, 30, 0);
			});
            
            expect(inputEl.val()).toEqual('13:30');
            
            $scope.$apply(function() {
				$scope.models.time = '20:45';
			});
            
            expect(inputEl.val()).toEqual('20:45');
            
            $scope.$apply(function() {
				$scope.models.time = undefined;
			});
            
            expect(inputEl.val()).toEqual('');
        });

		it('should select the next item when DOWN key is pressed', function() {
			var list = inputEl.next();

			$scope.$apply(function() {
				$scope.models.time = new Date(2012, 11, 15, 13, 30, 0);
				$scope.models.minTime = '13:00';
				$scope.models.maxTime = '14:00';
				$scope.models.step = '30';
			});
            
			inputEl.triggerHandler('focus');
          
			// Initial state
			expect(list.find('li.active a').text()).toBe('13:30');

			// Keypress DOWN
			var e = $.Event('keypress');
			e.which = 40;
			inputEl.trigger(e);

			// Final state
			expect(list.find('li.active a').text()).toBe('14:00');
		});

		it('should select the previous item when UP key is pressed', function() {
			var list = inputEl.next();

			$scope.$apply(function() {
				$scope.models.time = new Date(2012, 11, 15, 13, 30, 0);
				$scope.models.minTime = '13:00';
				$scope.models.maxTime = '14:00';
				$scope.models.step = '30';
			});

			inputEl.triggerHandler('focus');

			// Initial state
			expect(list.find('li.active a').text()).toBe('13:30');

			// Keypress UP
			var e = $.Event('keypress');
			e.which = 38;
			inputEl.trigger(e);

			// Final state
			expect(list.find('li.active a').text()).toBe('13:00');
		});
	});
});