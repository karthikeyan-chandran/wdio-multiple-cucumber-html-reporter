'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _fsExtra = require('fs-extra');

var _generateJson = require('./generateJson');

var _multipleCucumberHtmlReporter = require('multiple-cucumber-html-reporter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FEATURE = 'Feature';
var SCENARIO = 'Scenario';
var NOT_KNOWN = 'not known';
var isTestFailed = false;

var MultipleCucumberHtmlReporter = function (_events$EventEmitter) {
    _inherits(MultipleCucumberHtmlReporter, _events$EventEmitter);

    function MultipleCucumberHtmlReporter(baseReporter, config) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        _classCallCheck(this, MultipleCucumberHtmlReporter);

        var _this = _possibleConstructorReturn(this, (MultipleCucumberHtmlReporter.__proto__ || Object.getPrototypeOf(MultipleCucumberHtmlReporter)).call(this));

        if (!options.htmlReporter) {
            throw new Error('Options need to be provided.');
        }

        if (!options.htmlReporter.jsonFolder) {
            throw new Error('A path which holds the JSON files should be provided.');
        }

        if (!options.htmlReporter.reportFolder) {
            throw new Error('An output path for the reports should be defined, no path was provided.');
        }

        _this.options = options.htmlReporter;
        // this.baseReporter = baseReporter;
        _this.instanceData = {};
        _this.results = {};
        _this.scenarioName = null;

        // this.on('hook:start', ::this.hookStart);
        // this.on('hook:end', ::this.hookEnd);

        _this.on('start', _this.onStart.bind(_this));

        // Test framework events
        _this.on('suite:start', _this.suiteStart.bind(_this));
        _this.on('suite:end', _this.suiteEnd.bind(_this));
        _this.on('test:start', _this.testStart.bind(_this));
        _this.on('test:pass', _this.testPass.bind(_this));
        _this.on('test:fail', _this.testFail.bind(_this));
        _this.on('test:pending', _this.testPending.bind(_this));

        // Runner events (webdriver)
        // this.on('start', ::this.start);
        // this.on('runner:command', ::this.runnerCommand);
        _this.on('runner:end', _this.runnerEndCommand.bind(_this));
        _this.on('runner:after', _this.runnerAfterCommand.bind(_this));
        _this.on('runner:result', _this.runnerResult.bind(_this));
        _this.on('end', _this.onEnd.bind(_this));
        return _this;
    }

    _createClass(MultipleCucumberHtmlReporter, [{
        key: 'onStart',
        value: function onStart() {
            if (this.options.removeFolders) {
                (0, _fsExtra.removeSync)(this.options.jsonFolder);
                (0, _fsExtra.removeSync)(this.options.reportFolder);
            }
        }
    }, {
        key: 'runnerEndCommand',
        value: function runnerEndCommand() {
            console.log("Runner End");
        }
    }, {
        key: 'runnerAfterCommand',
        value: function runnerAfterCommand() {
            console.log("Runner After");
        }
        // hookStart(payload) {}
        // hookEnd(payload) {}

    }, {
        key: 'suiteStart',
        value: function suiteStart(suite) {
            var cid = suite.cid;
            if (!this.results[cid]) {
                this.results[cid] = this.getFeatureDataObject(suite);
            }
            this.scenarioName = suite.title;
        }
    }, {
        key: 'suiteEnd',
        value: function suiteEnd(suite) {
            // Attach an Afterhook if there are embeddings
            this.addAfterStep(suite);
        }
    }, {
        key: 'testStart',
        value: function testStart(test) {
            if (!this.results[test.cid]._elements[test.parent]) {
                this.results[test.cid]._elements[test.parent] = this.getScenarioDataObject(test);
            }
        }
    }, {
        key: 'testPass',
        value: function testPass(test) {
            this.results[test.cid]._elements[test.parent].steps.push(this.getStepDataObject(test, 'passed'));
        }
    }, {
        key: 'testFail',
        value: function testFail(test) {
            this.results[test.cid]._elements[test.parent].steps.push(this.getStepDataObject(test, 'failed'));
            isTestFailed = true;
        }
    }, {
        key: 'testPending',
        value: function testPending(test) {
            this.results[test.cid]._elements[test.parent].steps.push(this.getStepDataObject(test, 'pending'));
        }

        /**
         * Runner
         */
        // runnerCommand(command) {}

    }, {
        key: 'runnerResult',
        value: function runnerResult(result) {
            // Save browserdata so it can be used later
            var cid = result.cid;
            if (!this.instanceData[cid]) {
                this.instanceData[cid] = this.determineMetadata(result);
            }

            // attach the screenshot to the report
            this.attachScreenshot(result);
        }
    }, {
        key: 'onEnd',
        value: function onEnd(payload) {
            var jsonFolder = this.options.jsonFolder;

            // Generate the jsons
            (0, _generateJson.generateJson)(jsonFolder, this.results);

            if (this.options.customData.data.length >= 1) {
                console.log('Dara', this.options.customData.data[4]);
                //this.options.customData.data[4].value=(new Date()).toLocaleString();
                this.options.customData.data.push({ label: 'Execution End Time', value: new Date().toLocaleString() });
                console.log('Dara', this.options.customData.data);
            }
            // generate the report
            (0, _multipleCucumberHtmlReporter.generate)(_extends({
                // Required
                jsonDir: jsonFolder,
                reportPath: this.options.reportFolder
            }, this.options.customData ? { customData: this.options.customData } : {}, this.options.customStyle ? { customStyle: this.options.customStyle } : {}, {
                disableLog: this.options.disableLog || false,
                displayDuration: this.options.displayDuration || false,
                durationInMS: this.options.durationInMS || false,
                openReportInBrowser: this.options.openReportInBrowser || false
            }, this.options.overrideStyle ? { overrideStyle: this.options.overrideStyle } : {}, this.options.pageFooter ? { pageFooter: this.options.pageFooter } : {}, this.options.pageTitle ? { pageTitle: this.options.pageTitle } : {}, this.options.reportName ? { reportName: this.options.reportName } : {}, {
                saveCollectedJSON: this.options.saveCollectedJSON || false
            }));
        }

        /**
         * All functions
         */

        /**
         * Get the feature data object
         *
         * @param {object} featureData
         *
         * @returns {
         *  {
         *      keyword: string,
         *      line: number,
         *      name: string,
         *      tags: string,
         *      uri: string,
         *      _elements: {object},
         *      elements: Array,
         *      id: string,
         *      _screenshots: Array
         *  }
         * }
         */

    }, {
        key: 'getFeatureDataObject',
        value: function getFeatureDataObject(featureData) {
            return _extends({
                keyword: FEATURE,
                description: this.escapeHTML(featureData.description),
                line: parseInt(featureData.uid.substring(featureData.title.length, featureData.uid.length)),
                name: this.escapeHTML(featureData.title),
                tags: featureData.tags,
                uri: featureData.specs[0],
                _elements: {}, // Temporary. All data will be copied to the `elements` when done
                elements: [],
                id: featureData.title.replace(/ /g, '-').toLowerCase(),
                _screenshots: [] }, this.instanceData[featureData.cid]);
        }

        /**
         * Get the scenario data object
         *
         * @param {object} scenarioData This is the testdata of the current scenario
         *
         * @returns {
         *  {
         *      keyword: string,
         *      line: number,
         *      name: string,
         *      tags: string,
         *      id: string,
         *      steps: Array
         *  }
         * }
         */

    }, {
        key: 'getScenarioDataObject',
        value: function getScenarioDataObject(scenarioData) {
            return {
                keyword: SCENARIO,
                description: this.escapeHTML(scenarioData.description),
                line: parseInt(scenarioData.parent.substring(this.scenarioName.length, scenarioData.parent.length)),
                name: this.escapeHTML(this.scenarioName),
                tags: scenarioData.tags,
                id: this.results[scenarioData.cid].id + ';' + this.scenarioName.replace(/ /g, '-').toLowerCase(),
                steps: []
            };
        }

        /**
         * Get the step data object
         *
         * @param {object} stepData This is the testdata of the step
         * @param status
         * @returns {{arguments: Array, keyword: string, name: *, result: {status: *, duration: *}, line: number, match: {location: string}}}
         */

    }, {
        key: 'getStepDataObject',
        value: function getStepDataObject(stepData, status) {
            var stepResult = _extends({
                arguments: stepData.argument || [],
                // keyword: ' ',
                keyword: stepData.keyword || ' ',
                name: this.escapeHTML(stepData.title),
                result: _extends({
                    status: status,
                    duration: stepData.duration * 1000000
                }, this.addFailedMessage(stepData, status)),
                line: parseInt(stepData.uid.substring(stepData.title.length, stepData.uid.length))
            }, this.defineEmbeddings(stepData.cid), {
                match: {
                    location: 'can not be determined with webdriver.io'
                }
            });

            // Empty the _screenshots because there is no data anymore, test has finished
            this.results[stepData.cid]._screenshots = [];

            return stepResult;
        }

        /**
         * Add the after step, if there is data, to the steps in the suites report
         *
         * @param {object} currentScenario the suite we are currently running
         */

    }, {
        key: 'addAfterStep',
        value: function addAfterStep(currentScenario) {
            if (this.results[currentScenario.cid]._screenshots.length > 0 && this.results[currentScenario.cid]._elements[currentScenario.uid] && this.results[currentScenario.cid]._elements[currentScenario.uid].steps) {
                // Add an After step if there are screenshots and there is a steps array defined on the scenario.
                // Defaulted most of the values because they are not available in webdriverio
                this.results[currentScenario.cid]._elements[currentScenario.uid].steps.push(_extends({
                    arguments: [],
                    keyword: 'After',
                    result: {
                        status: 'passed',
                        duration: 0
                    },
                    hidden: true
                }, this.defineEmbeddings(currentScenario.cid), {
                    match: {
                        location: 'can not be determined with webdriver.io'
                    }
                }));
            }

            // Empty the _screenshots because there is no data anymore, test has finished
            this.results[currentScenario.cid]._screenshots = [];
        }

        /**
         * Define the embeddings
         *
         * @param {string} cid The current instance id
         *
         * @returns {{
         *      embeddings: *
         *  } || {}
         * }
         */

    }, {
        key: 'defineEmbeddings',
        value: function defineEmbeddings(cid) {
            return _extends({}, this.results[cid]._screenshots.length > 0 ? { embeddings: [].concat(_toConsumableArray(this.results[cid]._screenshots)) } : {});
        }

        /**
         * Add a failed message
         *
         * @param {object}  testObject
         * @param {string}  status
         *
         * @return {object}
         */

    }, {
        key: 'addFailedMessage',
        value: function addFailedMessage(testObject, status) {
            if (status === 'failed') {
                return {
                    error_message: testObject.err.stack
                };
            }

            return {};
        }

        /**
         * Determine the metadata that needs to be added
         *
         * @TODO: Need to look at the implementation, is not that nice
         *
         * @param {object} data instance data
         *
         * @returns {
         *  {
         *      metadata: {
         *          browser: {
         *              name: string,
         *              version: string
         *          },
         *          device: string,
         *          platform: {
         *              name: string,
         *              version: string
         *          }
         *      }
         *  }
         * }
         */

    }, {
        key: 'determineMetadata',
        value: function determineMetadata(data) {
            var metadata = data.requestData.desiredCapabilities.metadata;
            var currentBrowserName = data.body.value.browserName;
            var currentBrowserVersion = data.body.value.version || data.body.value.browserVersion;
            var browser = {
                name: metadata && metadata.browser && metadata.browser.name ? metadata.browser.name : currentBrowserName,
                version: metadata && metadata.browser && metadata.browser.version ? metadata.browser.version : currentBrowserVersion
            };
            var device = metadata && metadata.device ? metadata.device : NOT_KNOWN;
            var platform = {
                name: metadata && metadata.platform && metadata.platform.name ? metadata.platform.name : NOT_KNOWN,
                version: metadata && metadata.platform && metadata.platform.version ? metadata.platform.version : NOT_KNOWN
            };

            return {
                metadata: {
                    browser: browser,
                    device: device,
                    platform: platform
                }
            };
        }

        /**
         * Attach a screenshot to the suites report object
         *
         * @param {object} data Instance data
         */

    }, {
        key: 'attachScreenshot',
        value: function attachScreenshot(data) {
            if (data.requestOptions.uri.path.match(/\/session\/[^/]*\/screenshot/) && data.body.value) {
                this.results[data.cid]._screenshots.push({
                    data: data.body.value,
                    mime_type: 'image/png'
                });
            }
        }

        /**
         * Escape html in strings
         *
         * @param   {string}  string
         * @return  {string}
         */

    }, {
        key: 'escapeHTML',
        value: function escapeHTML(string) {
            return !string ? string : string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;');
        }
    }]);

    return MultipleCucumberHtmlReporter;
}(_events2.default.EventEmitter);

MultipleCucumberHtmlReporter.reporterName = 'multiple-cucumber-html-reporter';
exports.default = MultipleCucumberHtmlReporter;
module.exports = exports['default'];