"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
const pathNeeded = 'C:/Users/Gabriel_Shahrouzi/Documents/0-git-local-stuff/cs-projects/codeforces-practice-bot/codeforces-practice-bot/.env';
dotenv.config({ path: pathNeeded });
require('dotenv').config({ path: pathNeeded });
console.log(envPath);
console.log('CODEFORCES_USERNAME:', process.env.CODEFORCES_USERNAME);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codeforces-practice-bot" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const loginDisposable = vscode.commands.registerCommand('codeforces-practice-bot.login', async () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        const username = process.env.CODEFORCES_USERNAME;
        const password = process.env.CODEFORCES_PASSWORD;
        if (username && password) {
            try {
                const response = await axios_1.default.post('https://codeforces.com/enter', {
                    handleOrEmail: username,
                    password: password,
                    action: 'enter',
                    csrf_token: '' // You might need to handle CSRF token here
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                if (response.status === 200) {
                    vscode.window.showInformationMessage('Logged in successfully!');
                    const getProblemButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                    getProblemButton.text = '$(light-bulb) Get Codeforces Problem';
                    getProblemButton.command = 'codeforces-practice-bot.getProblem';
                    getProblemButton.show();
                    context.subscriptions.push(getProblemButton);
                }
                else {
                    vscode.window.showErrorMessage('Failed to log in. Please check your credentials.');
                }
            }
            catch (error) {
                vscode.window.showErrorMessage('An error occurred while logging in.');
                console.error(error);
            }
        }
        else {
            vscode.window.showErrorMessage('Username or password cannot be empty.');
        }
    });
    function getWebviewContent(problemContent, cssContent) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Codeforces Problem</title>
            <style>
                ${cssContent}
            </style>
            <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
            <script>
                window.MathJax = {
                    tex: {
                        inlineMath: [['$', '$'], ['\\(', '\\)']]
                    },
                    svg: {
                        fontCache: 'global'
                    }
                };
            </script>
        </head>
        <body>
            <div class="problem-statement">
                ${problemContent}
            </div>
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    MathJax.typesetPromise();
                });
            </script>
        </body>
        </html>`;
    }
    async function fetch1600RatedProblems() {
        try {
            const rating = 1600;
            const response = await axios_1.default.get('https://codeforces.com/api/problemset.problems?rating={rating}');
            if (response.data.status !== 'OK') {
                throw new Error('Failed to fetch problems');
            }
            const problems = response.data.result.problems;
            const filteredProblems = problems.filter((problem) => problem.rating === 1600);
            return filteredProblems;
        }
        catch (error) {
            console.error('Error fetching problems:', error);
            return [];
        }
    }
    async function fetchUserSolvedProblems(handle) {
        try {
            const response = await axios_1.default.get(`https://codeforces.com/api/user.status?handle=${handle}`);
            if (response.data.status !== 'OK') {
                throw new Error('Failed to fetch user status');
            }
            const solvedProblems = response.data.result
                .filter((submission) => submission.verdict === 'OK')
                .map((submission) => ({
                contestId: submission.problem.contestId,
                index: submission.problem.index
            }));
            return solvedProblems;
        }
        catch (error) {
            console.error('Error fetching user solved problems:', error);
            return [];
        }
    }
    async function getFiltered1600RatedProblems(handle) {
        const problems = await fetch1600RatedProblems();
        const solvedProblems = await fetchUserSolvedProblems(handle);
        const solvedProblemSet = new Set(solvedProblems.map((p) => `${p.contestId}-${p.index}`));
        const filteredProblems = problems.filter(problem => !solvedProblemSet.has(`${problem.contestId}-${problem.index}`));
        return filteredProblems;
    }
    const getProblemDisposable = vscode.commands.registerCommand('codeforces-practice-bot.getProblem', async () => {
        try {
            let username = process.env.CODEFORCES_USERNAME;
            if (username === undefined) {
                username = "gshahrouzi";
            }
            console.log(getFiltered1600RatedProblems(username));
            const response = await axios_1.default.get('https://codeforces.com/problemset?tags=1600-1600');
            const $ = cheerio.load(response.data);
            const firstProblemLink = $('a[href^="/problemset/problem/"]').first().attr('href');
            if (firstProblemLink) {
                const problemResponse = await axios_1.default.get(`https://codeforces.com${firstProblemLink}`);
                const problemPage = cheerio.load(problemResponse.data);
                let problemContent = problemPage('.problem-statement').html();
                if (problemContent) {
                    problemContent = problemContent.replace(/\$\$\$/g, '$$').replace(/\\\$/g, '$');
                    console.log(problemContent);
                    // Fetch the CSS from Codeforces
                    const cssResponse = await axios_1.default.get('https://codeforces.com/css/problem-statement.css');
                    const cssContent = cssResponse.data;
                    const panel = vscode.window.createWebviewPanel('codeforcesProblem', 'Codeforces Problem', vscode.ViewColumn.One, {
                        enableScripts: true
                    });
                    // Set the HTML content
                    panel.webview.html = getWebviewContent(problemContent, cssContent);
                }
                else {
                    vscode.window.showErrorMessage('Failed to extract problem content.');
                }
            }
            else {
                vscode.window.showErrorMessage('No problem links found.');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('An error occurred while fetching the problem.');
            console.error(error);
        }
    });
    context.subscriptions.push(loginDisposable);
    context.subscriptions.push(getProblemDisposable);
    const getProblemButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    getProblemButton.text = '$(cloud-download) Get Problem';
    getProblemButton.command = 'codeforces-practice-bot.getProblem';
    getProblemButton.tooltip = 'Fetch a random problem from Codeforces';
    getProblemButton.show();
    context.subscriptions.push(getProblemButton);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map