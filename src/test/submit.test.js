"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var submit_1 = require("../submit");
var assert = require("assert");
suite('Get Tutorial Test Suite', function () {
    // vscode.window.showInformationMessage('Start all tests.');
    var URL = "https://codeforces.com/blog/entry/128716";
    var contestId = 1957;
    test('Get Tutorial 1957', function () {
        assert.equal(URL, (0, submit_1.displayTutorialPage)(contestId));
    });
});
