import * as angular from 'angular';

export interface dnTimepickerHelpers {
    stringToMinutes: (str: string) => number;
    buildOptionList: (minTime: Date, maxTime: Date, step: number) => Date[];
    getClosestIndex: (value: Date, from: Date[]) => number;
}

export class dnTimepickerHelpers implements angular.IServiceProvider {
    public $get = () => ({
        stringToMinutes: (str: string): number => {
            if (!str) {
                return null;
            }

            var t = str.match(/(\d+)(h?)/);

            return t[1] ? Number(t[1]) * (t[2] ? 60 : 1) : null;
        },
        buildOptionList: (minTime: Date, maxTime: Date, step: number): Date[] => {
            var result = [], i = angular.copy(minTime);

            while (i <= maxTime) {
                result.push(new Date(i));
                i.setMinutes(i.getMinutes() + step);
            }

            return result;
        },
        getClosestIndex: (value: Date, from: Date[]): number => {
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
    });
}