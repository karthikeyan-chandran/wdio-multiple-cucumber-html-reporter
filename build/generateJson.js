'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.generateJson = generateJson;

var _fsExtra = require('fs-extra');

var _path = require('path');

/**
 * Generate the JSON file with all the Cucumber data in it
 *
 * @param {string}  folder the location where the JSON file needs to be saved
 * @param {object}  data the JSON data
 */
function generateJson(folder, data) {
    var jsonFolder = (0, _path.resolve)(process.cwd(), folder);
    (0, _fsExtra.ensureDirSync)(jsonFolder);
    var jsonFile = (0, _path.resolve)(jsonFolder, 's' + new Date().getTime() + '.json');
    var json = [];

    Object.entries(data).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            key = _ref2[0],
            val = _ref2[1];

        Object.entries(val._elements).forEach(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2),
                key1 = _ref4[0],
                val1 = _ref4[1];

            val.elements.push(val1);
        });
        // Delete temporary data
        delete val._elements;
        delete val._screenshots;
        json.push(val);
    });

    (0, _fsExtra.outputJsonSync)(jsonFile, json);
}