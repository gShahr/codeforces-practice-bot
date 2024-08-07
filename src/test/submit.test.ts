import login from '../login';
import { getTutorialPageAxios } from '../submit';
import * as assert from 'assert';

suite('Get Tutorial Test Suite', () => {
    let URL = "https://codeforces.com/blog/entry/128716";
    let contestId = 1957;
    test('Get Tutorial 1957', () => {
        console.log('Starting test for contestId:', contestId);
        getTutorialPageAxios(contestId).then(href => {
            console.log('Received href:', href);
            if (href === undefined) {
                throw new Error('href is undefined');
            }
            const tutorialURL = `https://codeforces.com${href}`;
            console.log(`Expected URL: ${URL}`);
            console.log(`Actual URL: ${tutorialURL}`);
            assert.equal(URL, tutorialURL);
        }).catch(error => {
            console.error('Error during test execution:', error);
        });
    });
});